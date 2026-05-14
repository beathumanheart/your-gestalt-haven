import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Copy, Check, LogOut, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useHiddenOffers,
  useOfferBookingCounts,
  useCreateOffer,
  useUpdateOffer,
} from "@/hooks/useHiddenOffers";
import { buildOfferSlug, isValidSlugStem } from "@/lib/offerSlug";
import type { HiddenOffer } from "@/hooks/useHiddenOffers";

const SITE_URL = window.location.origin;

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  slugStem: string;
  name: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  conditions_en: string;
  conditions_ru: string;
  notification_email: string;
  price_euros: string;
  duration_minutes: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  slugStem: "",
  name: "",
  title_en: "",
  title_ru: "",
  description_en: "",
  description_ru: "",
  conditions_en: "",
  conditions_ru: "",
  notification_email: "",
  price_euros: "0",
  duration_minutes: "60",
  is_active: true,
};

function offerToForm(offer: HiddenOffer): FormState {
  return {
    slugStem: offer.slug,
    name: offer.name,
    title_en: offer.title_en ?? "",
    title_ru: offer.title_ru ?? "",
    description_en: offer.description_en ?? "",
    description_ru: offer.description_ru ?? "",
    conditions_en: offer.conditions_en ?? "",
    conditions_ru: offer.conditions_ru ?? "",
    notification_email: offer.notification_email ?? "",
    price_euros: (offer.price_cents / 100).toFixed(2),
    duration_minutes: String(offer.duration_minutes),
    is_active: offer.is_active,
  };
}

function validateBilingual(form: FormState): string | null {
  const enFilled = [form.title_en, form.description_en, form.conditions_en].filter(Boolean).length;
  const ruFilled = [form.title_ru, form.description_ru, form.conditions_ru].filter(Boolean).length;
  if ((enFilled > 0 && enFilled < 3) || (ruFilled > 0 && ruFilled < 3)) {
    return "Each language must be either fully filled (title + description + conditions) or left entirely blank.";
  }
  if (enFilled < 3 && ruFilled < 3) {
    return "At least one language (EN or RU) must have all three fields filled.";
  }
  return null;
}

// ── Offer form ────────────────────────────────────────────────────────────────

interface OfferFormProps {
  editTarget: HiddenOffer | null;
  onClose: () => void;
}

const OfferForm = ({ editTarget, onClose }: OfferFormProps) => {
  const [form, setForm] = useState<FormState>(editTarget ? offerToForm(editTarget) : EMPTY_FORM);
  const [slugPreview, setSlugPreview] = useState("");
  const [stemError, setStemError] = useState("");
  const [saveError, setSaveError] = useState("");
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const isEdit = editTarget !== null;

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleStemChange = (stem: string) => {
    set("slugStem", stem);
    setStemError("");
    if (stem && !isValidSlugStem(stem)) {
      setStemError("Only lowercase letters, digits, and hyphens. Must start and end with a letter or digit.");
    }
  };

  useEffect(() => {
    if (!isEdit && form.slugStem && isValidSlugStem(form.slugStem)) {
      setSlugPreview(buildOfferSlug(form.slugStem));
    } else {
      setSlugPreview("");
    }
  }, [form.slugStem, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");

    const langError = validateBilingual(form);
    if (langError) { setSaveError(langError); return; }

    const priceCents = Math.round(parseFloat(form.price_euros || "0") * 100);
    const duration = parseInt(form.duration_minutes, 10) || 60;

    const bilingualFields = {
      title_en: form.title_en.trim() || null,
      title_ru: form.title_ru.trim() || null,
      description_en: form.description_en.trim() || null,
      description_ru: form.description_ru.trim() || null,
      conditions_en: form.conditions_en.trim() || null,
      conditions_ru: form.conditions_ru.trim() || null,
    };

    if (isEdit) {
      try {
        await updateOffer.mutateAsync({
          id: editTarget.id,
          name: form.name.trim(),
          ...bilingualFields,
          notification_email: form.notification_email.trim() || null,
          price_cents: priceCents,
          duration_minutes: duration,
          is_active: form.is_active,
        });
        toast.success("Offer updated.");
        onClose();
      } catch (err) {
        setSaveError("Failed to update offer. Please try again.");
      }
    } else {
      if (!isValidSlugStem(form.slugStem)) { setStemError("Invalid slug stem."); return; }
      const slug = buildOfferSlug(form.slugStem);
      try {
        await createOffer.mutateAsync({
          slug,
          name: form.name.trim(),
          ...bilingualFields,
          notification_email: form.notification_email.trim() || null,
          price_cents: priceCents,
          duration_minutes: duration,
          is_active: form.is_active,
        });
        toast.success(`Offer created: ${slug}`);
        onClose();
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || "";
        if (msg.includes("duplicate") || msg.includes("unique")) {
          setSaveError("Slug collision — try a different stem and create again.");
        } else {
          setSaveError("Failed to create offer. Please try again.");
        }
      }
    }
  };

  const pending = createOffer.isPending || updateOffer.isPending;

  const textareaClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y";

  return (
    <div className="card-organic p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-light text-foreground">
          {isEdit ? "Edit offer" : "New offer"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Slug */}
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">
            Slug {isEdit ? "(read-only)" : "stem"}
          </label>
          {isEdit ? (
            <p className="font-body text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              {editTarget.slug}
            </p>
          ) : (
            <>
              <Input
                value={form.slugStem}
                onChange={(e) => handleStemChange(e.target.value.toLowerCase())}
                placeholder="grief-may-2026"
                className="font-body text-sm"
              />
              {stemError && <p className="text-destructive text-xs mt-1">{stemError}</p>}
              {slugPreview && (
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Full slug: <strong>{slugPreview}</strong>
                  <span className="ml-1">(suffix auto-generated on save)</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Internal name */}
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">
            Internal name
          </label>
          <Input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Grief support — May 2026"
            className="font-body text-sm"
          />
        </div>

        {/* Bilingual content — two columns */}
        <div>
          <p className="font-body text-sm font-medium text-foreground mb-3">
            Content{" "}
            <span className="font-normal text-muted-foreground text-xs">
              — fill one or both languages; each must be complete (title + description + conditions) or fully blank
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["en", "ru"] as const).map((lang) => (
              <div key={lang} className="space-y-3 rounded-xl border border-border/60 p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "en" ? "English" : "Русский"}
                </p>

                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">
                    Page title (h1)
                  </label>
                  <Input
                    value={form[`title_${lang}`]}
                    onChange={(e) => set(`title_${lang}`, e.target.value)}
                    placeholder={lang === "en" ? "Free session for grief support" : "Бесплатная сессия"}
                    className="font-body text-sm"
                  />
                </div>

                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">
                    Description <span className="italic">(Markdown)</span>
                  </label>
                  <textarea
                    value={form[`description_${lang}`]}
                    onChange={(e) => set(`description_${lang}`, e.target.value)}
                    rows={4}
                    className={textareaClass}
                    placeholder={lang === "en" ? "Describe the offer…" : "Опишите предложение…"}
                  />
                </div>

                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">
                    Conditions <span className="italic">(Markdown — client must accept)</span>
                  </label>
                  <textarea
                    value={form[`conditions_${lang}`]}
                    onChange={(e) => set(`conditions_${lang}`, e.target.value)}
                    rows={4}
                    className={textareaClass}
                    placeholder={lang === "en" ? "Terms for this offer…" : "Условия предложения…"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row: price + duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Price (€)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price_euros}
              onChange={(e) => set("price_euros", e.target.value)}
              className="font-body text-sm"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Duration (min)</label>
            <Input
              type="number"
              min="15"
              step="15"
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
              className="font-body text-sm"
            />
          </div>
        </div>

        {/* Notification email */}
        <div>
          <label className="font-body text-sm font-medium text-foreground block mb-1">
            Notification email{" "}
            <span className="font-normal text-muted-foreground">(optional — defaults to sender address)</span>
          </label>
          <Input
            type="email"
            value={form.notification_email}
            onChange={(e) => set("notification_email", e.target.value)}
            placeholder="be@humanheart.life"
            className="font-body text-sm"
          />
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="font-body text-sm text-foreground">Active (visible to clients)</span>
        </label>

        {saveError && (
          <p className="font-body text-sm text-destructive">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="btn-primary text-sm py-2 px-6 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Slug copy cell ────────────────────────────────────────────────────────────

const SlugCell = ({ slug }: { slug: string }) => {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}/en/book/offer/${slug}`;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title={url}
      className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-foreground transition-colors group"
    >
      <span className="truncate max-w-[160px]">{slug}</span>
      {copied ? (
        <Check className="w-3 h-3 text-primary shrink-0" />
      ) : (
        <Copy className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};

// ── Language badges ───────────────────────────────────────────────────────────

const LangBadges = ({ offer }: { offer: HiddenOffer }) => {
  const hasEn = !!(offer.title_en && offer.description_en && offer.conditions_en);
  const hasRu = !!(offer.title_ru && offer.description_ru && offer.conditions_ru);
  return (
    <div className="flex gap-1">
      {hasEn && (
        <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
          EN
        </span>
      )}
      {hasRu && (
        <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent uppercase tracking-wide">
          RU
        </span>
      )}
    </div>
  );
};

// ── Active toggle cell ────────────────────────────────────────────────────────

const ActiveToggle = ({ offer }: { offer: HiddenOffer }) => {
  const update = useUpdateOffer();
  return (
    <button
      onClick={() => update.mutate({ id: offer.id, is_active: !offer.is_active })}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        offer.is_active ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          offer.is_active ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminOffers = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [editTarget, setEditTarget] = useState<HiddenOffer | null>(null);
  const [showForm, setShowForm] = useState(false);

  const adminEmail = import.meta.env.VITE_PUBLIC_ADMIN_EMAIL as string | undefined;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.email !== adminEmail) {
        navigate("/", { replace: true });
      } else {
        setAuthorized(true);
      }
    });
  }, [adminEmail, navigate]);

  const { data: offers = [], isLoading } = useHiddenOffers();
  const { data: bookingCounts = {} } = useOfferBookingCounts();

  const handleEdit = (offer: HiddenOffer) => {
    setEditTarget(offer);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNew = () => {
    setEditTarget(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-body text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const formatPrice = (cents: number) =>
    cents === 0
      ? "Free"
      : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
          cents / 100
        );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h1 className="font-display text-lg font-medium text-foreground">Hidden Offers</h1>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate("/admin/login"))}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Form */}
        {showForm && <OfferForm editTarget={editTarget} onClose={closeForm} />}

        {/* List header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-light text-foreground">
            All offers{" "}
            <span className="text-muted-foreground text-sm font-body">({offers.length})</span>
          </h2>
          {!showForm && (
            <button onClick={handleNew} className="flex items-center gap-2 btn-primary text-sm py-2 px-4">
              <Plus className="w-4 h-4" />
              New offer
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-12 text-center">
            No offers yet. Create one above.
          </p>
        ) : (
          <div className="card-organic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body text-xs">Name</TableHead>
                  <TableHead className="font-body text-xs">Slug (click to copy URL)</TableHead>
                  <TableHead className="font-body text-xs">Price</TableHead>
                  <TableHead className="font-body text-xs">Languages</TableHead>
                  <TableHead className="font-body text-xs">Active</TableHead>
                  <TableHead className="font-body text-xs text-right">Bookings</TableHead>
                  <TableHead className="font-body text-xs text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} className={offer.is_active ? "" : "opacity-50"}>
                    <TableCell className="font-body text-sm text-foreground">{offer.name}</TableCell>
                    <TableCell><SlugCell slug={offer.slug} /></TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {formatPrice(offer.price_cents)}
                    </TableCell>
                    <TableCell><LangBadges offer={offer} /></TableCell>
                    <TableCell><ActiveToggle offer={offer} /></TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground text-right">
                      {bookingCounts[offer.id] ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleEdit(offer)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;
