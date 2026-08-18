import { useEffect, useMemo, useRef, useState } from "react";
import { format, addMinutes, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, User, Mail } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { BookingData, ConfirmedBooking } from "./BookingWidget";
import { getUserTimezone, formatTimezone } from "./DateTimeSelector";
import { trackBookingCompleted, trackEmailFailed, trackBookingFailed, type BookingError } from "@/hooks/useBookingAnalytics";
import { Checkbox } from "@/components/ui/checkbox";
import TermsBlock from "./TermsBlock";
import type { Language } from "@/contexts/LanguageContext";
import { TERMS_VERSION } from "@/content/offerAgreement";

interface Props {
  /** The sticky action bar submits this form by id, so the primary action can
   *  live outside the form element while still being a real submit button. */
  formId: string;
  booking: BookingData;
  t: BookingContent;
  language: Language;
  onBooked: (result: ConfirmedBooking) => void;
  onChange: (fields: Partial<BookingData>) => void;
  onSubmittingChange: (submitting: boolean) => void;
}

const BookingForm = ({ formId, booking, t, language, onBooked, onChange, onSubmittingChange }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const termsRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [errorId, setErrorId] = useState<string | null>(null);
  const timezone = useMemo(() => getUserTimezone(), []);

  useEffect(() => { onSubmittingChange(submitting); }, [submitting, onSubmittingChange]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!booking.clientName?.trim()) errs.clientName = t.errorNameRequired;
    if (!booking.clientEmail?.trim()) errs.clientEmail = t.errorEmailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.clientEmail.trim()))
      errs.clientEmail = t.errorEmailInvalid;
    // Belt and braces: the bar's button is disabled without consent, but a
    // submit can still arrive via Enter in a text field.
    if (!booking.termsAccepted) errs.terms = t.termsRequiredError;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGeneralError("");
    setErrorId(null);

    try {
      const dateStr = format(booking.date, "yyyy-MM-dd");
      const localStart = parse(`${dateStr} ${booking.timeSlot}`, "yyyy-MM-dd HH:mm", new Date());
      const localEnd = addMinutes(localStart, booking.durationMinutes);
      const startTime = localStart.toISOString();
      const endTime = localEnd.toISOString();

      const isOfferBooking = !!booking.hiddenOfferId;
      const { data: result, error } = await supabase.functions.invoke("process-booking", {
        body: {
          ...(isOfferBooking
            ? { hiddenOfferId: booking.hiddenOfferId }
            : { sessionTypeId: booking.sessionTypeId }),
          clientName: booking.clientName.trim(),
          clientEmail: booking.clientEmail.trim().toLowerCase(),
          clientEmail2: booking.clientEmail2?.trim().toLowerCase() || null,
          startTime,
          endTime,
          notes: booking.notes?.trim() || null,
          timezone,
          // The server records its own timestamp; this only says which text
          // was on screen when the box was ticked.
          termsAccepted: booking.termsAccepted === true,
          termsVersion: TERMS_VERSION,
          // Used only to pick the language of links in the confirmation email.
          language,
        },
      });

      if (error) throw error;

      const bookingDate = format(booking.date, "yyyy-MM-dd");
      trackBookingCompleted({
        service_name: booking.sessionTypeName,
        booking_date: bookingDate,
        booking_time: booking.timeSlot,
        is_new_client: true,
        offer_slug: booking.offerSlug,
      });
      if (result?.emailSent === false) {
        trackEmailFailed({
          service_name: booking.sessionTypeName,
          booking_date: bookingDate,
          booking_time: booking.timeSlot,
        });
      }
      onBooked({
        ...result?.booking,
        // client_email comes from local state — the server no longer echoes it back.
        client_email: booking.clientEmail.trim().toLowerCase(),
        google_meet_link: result?.meetLink || null,
        sessionTypeName: booking.sessionTypeName,
        durationMinutes: booking.durationMinutes,
        emailSent: result?.emailSent ?? true,
      });
    } catch (err: unknown) {
      const newErrorId = crypto.randomUUID();
      let httpStatus: number | undefined;
      let edgeRequestId: string | undefined;
      let analyticsCode: BookingError["error_code"] = "UNKNOWN";
      let userMessage = t.errorGeneral;

      if (err && typeof err === "object" && "name" in err) {
        const named = err as { name: string; message?: string; context?: { status?: number } };

        if (named.name === "FunctionsFetchError") {
          analyticsCode = "NETWORK";
          userMessage = t.errorNetwork;
        } else if (named.name === "FunctionsHttpError") {
          httpStatus = named.context?.status;
          try {
            const body = JSON.parse(named.message ?? "");
            if (body?.error?.code) {
              analyticsCode = body.error.code as BookingError["error_code"];
              edgeRequestId = body.error.requestId;
              userMessage = httpStatus && httpStatus < 500
                ? (body.error.message ?? t.errorGeneral)
                : t.errorServer;
            } else {
              analyticsCode = httpStatus && httpStatus < 500 ? "VALIDATION_FAILED" : "INTERNAL";
              userMessage = httpStatus && httpStatus < 500 ? t.errorGeneral : t.errorServer;
            }
          } catch {
            analyticsCode = httpStatus && httpStatus < 500 ? "VALIDATION_FAILED" : "INTERNAL";
            userMessage = httpStatus && httpStatus < 500 ? t.errorGeneral : t.errorServer;
          }
        }
      }

      trackBookingFailed({
        error_id: newErrorId,
        error_code: analyticsCode,
        http_status: httpStatus,
        funnel_step: "booking_details",
        request_id: edgeRequestId,
      });

      setErrorId(newErrorId);
      setGeneralError(userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-body">
          <User className="w-4 h-4 text-primary shrink-0" />
          <span className="text-foreground font-medium">{booking.sessionTypeName}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-body text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {format(booking.date, "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {booking.timeSlot} · {booking.durationMinutes} min
            <span className="text-muted-foreground/70 text-xs">{formatTimezone(timezone)}</span>
          </span>
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.yourName}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={booking.clientName || ""}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder={t.namePlaceholder}
              className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
              maxLength={100}
              data-ph-no-capture
            />
          </div>
          {errors.clientName && <p className="text-destructive text-xs mt-1">{errors.clientName}</p>}
        </div>

        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.yourEmail}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={booking.clientEmail || ""}
              onChange={(e) => onChange({ clientEmail: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
              maxLength={255}
              data-ph-no-capture
            />
          </div>
          {errors.clientEmail && <p className="text-destructive text-xs mt-1">{errors.clientEmail}</p>}
        </div>

        {booking.showSecondEmail && (
          <div>
            <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">
              {t.yourEmail2} <span className="text-muted-foreground font-normal">({t.optional})</span>
            </label>
            <p className="font-body text-xs text-muted-foreground mb-1.5">{t.email2Hint}</p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={booking.clientEmail2 || ""}
                onChange={(e) => onChange({ clientEmail2: e.target.value })}
                placeholder={t.emailPlaceholder}
                className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
                maxLength={255}
                data-ph-no-capture
              />
            </div>
          </div>
        )}

        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.notesLabel} <span className="text-muted-foreground font-normal">({t.optional})</span></label>
          <textarea
            value={booking.notes || ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder={t.notesPlaceholder}
            maxLength={1000}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-body resize-none"
          />
        </div>

        {generalError && (
          <div className="space-y-1" data-testid="booking-error">
            <p className="text-destructive text-sm font-body">{generalError}</p>
            {errorId && (
              <p className="text-muted-foreground text-xs font-body" data-testid="booking-error-ref">ref: {errorId}</p>
            )}
          </div>
        )}

        <TermsBlock t={t} language={language} />

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              ref={termsRef}
              id="terms-accepted"
              checked={booking.termsAccepted === true}
              onCheckedChange={(checked) => {
                onChange({ termsAccepted: checked === true });
                if (checked === true) {
                  setErrors((prev) => {
                    const { terms, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5"
            />
            <label htmlFor="terms-accepted" className="font-body text-sm text-foreground leading-snug">
              {t.termsCheckboxLabel}{" "}
              <TermsBlock.Link t={t} language={language} onClosed={() => termsRef.current?.focus()} />
            </label>
          </div>
          {errors.terms && (
            <p id="terms-error" className="text-destructive text-xs" data-testid="terms-error">
              {errors.terms}
            </p>
          )}
        </div>

      </form>
    </div>
  );
};

export default BookingForm;
