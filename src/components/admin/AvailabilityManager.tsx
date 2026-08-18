import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { availabilityEN, availabilityEN as t } from "@/content/availability";
import type { DateOverride } from "@/lib/availability";
import type { Json } from "@/integrations/supabase/types";
import ScheduleCalendar from "./ScheduleCalendar";

// ─── Types ───────────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Rule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  buffer_minutes: number;
  isNew?: boolean;
}

interface ConflictBooking {
  id: string;
  start_time: string;
  client_email: string;
}

type HorizonUnit = "days" | "weeks" | "months";
type NoticeUnit = "hours" | "days";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysToDisplay(days: number): { value: number; unit: HorizonUnit } {
  if (days % 30 === 0) return { value: days / 30, unit: "months" };
  if (days % 7 === 0) return { value: days / 7, unit: "weeks" };
  return { value: days, unit: "days" };
}

function displayToDays(value: number, unit: HorizonUnit): number {
  if (unit === "months") return value * 30;
  if (unit === "weeks") return value * 7;
  return value;
}

function hoursToDisplay(hours: number): { value: number; unit: NoticeUnit } {
  if (hours % 24 === 0) return { value: hours / 24, unit: "days" };
  return { value: hours, unit: "hours" };
}

function displayToHours(value: number, unit: NoticeUnit): number {
  return unit === "days" ? value * 24 : value;
}

function formatOverrideDate(start: string, end: string): string {
  if (start === end) return format(parseISO(start), "EEE, MMM d, yyyy");
  return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AvailabilityManager = () => {
  // Weekly rules state
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [horizonValue, setHorizonValue] = useState(6);
  const [horizonUnit, setHorizonUnit] = useState<HorizonUnit>("months");
  const [noticeValue, setNoticeValue] = useState(24);
  const [noticeUnit, setNoticeUnit] = useState<NoticeUnit>("hours");
  const [savingHorizon, setSavingHorizon] = useState(false);
  const [savedHorizon, setSavedHorizon] = useState(false);
  const [horizonError, setHorizonError] = useState<string | null>(null);
  const [savingNotice, setSavingNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Date overrides state
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    type: "closed" as "closed" | "open",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [conflictBookings, setConflictBookings] = useState<ConflictBooking[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<null | typeof addForm>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchRules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("availability_rules")
      .select("*")
      .order("day_of_week")
      .order("start_time");
    setRules((data || []).map((r) => ({ ...r })));
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["booking_horizon_days", "booking_min_lead_time_minutes"]);

    if (data) {
      const map = new Map(data.map((s) => [s.key, s.value as number]));
      const horizonDays = map.get("booking_horizon_days") ?? 180;
      // stored in minutes; convert to hours for display
      const noticeHrs = Math.round((map.get("booking_min_lead_time_minutes") ?? 1200) / 60);
      const h = daysToDisplay(horizonDays);
      setHorizonValue(h.value);
      setHorizonUnit(h.unit);
      const n = hoursToDisplay(noticeHrs);
      setNoticeValue(n.value);
      setNoticeUnit(n.unit);
    }
    setSettingsLoaded(true);
  };

  const fetchOverrides = async () => {
    setLoadingOverrides(true);
    const { data } = await supabase
      .from("availability_overrides")
      .select("*")
      .is("deleted_at", null)
      .order("override_date", { ascending: true });
    setOverrides(
      (data || []).map((o) => ({
        ...o,
        deleted_at: o.deleted_at ?? null,
        buffer_minutes: o.buffer_minutes ?? 0,
        end_date: o.end_date ?? o.override_date,
      })) as DateOverride[]
    );
    setLoadingOverrides(false);
  };

  useEffect(() => {
    fetchRules();
    fetchSettings();
    fetchOverrides();
  }, []);

  // ── Weekly rules handlers ─────────────────────────────────────────────────

  const addRule = () => {
    setRules([
      ...rules,
      { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true, buffer_minutes: 0, isNew: true },
    ]);
  };

  const removeRule = async (index: number) => {
    const rule = rules[index];
    if (rule.id) {
      await supabase.from("availability_rules").delete().eq("id", rule.id);
    }
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    setRules(rules.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const rule of rules) {
      const data = {
        day_of_week: rule.day_of_week,
        start_time: rule.start_time,
        end_time: rule.end_time,
        is_active: rule.is_active,
        buffer_minutes: rule.buffer_minutes,
      };
      if (rule.id && !rule.isNew) {
        await supabase.from("availability_rules").update(data).eq("id", rule.id);
      } else {
        await supabase.from("availability_rules").insert(data);
      }
    }
    await fetchRules();
    setSaving(false);
  };

  // ── Settings handlers ─────────────────────────────────────────────────────

  const saveSetting = async (
    key: string,
    newValue: number,
    setIsSaving: (b: boolean) => void,
    setIsSaved: (b: boolean) => void,
    setError: (s: string | null) => void
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      // Read current value for audit trail
      const { data: current } = await supabase
        .from("settings")
        .select("value, updated_by_audit")
        .eq("key", key)
        .single();

      const oldAudit: Json[] = Array.isArray(current?.updated_by_audit)
        ? (current.updated_by_audit as Json[])
        : [];
      const newAudit: Json[] = [
        ...oldAudit,
        { timestamp: new Date().toISOString(), old_value: current?.value, source: "admin_ui" },
      ];

      const { error } = await supabase.from("settings").upsert({
        key,
        value: newValue,
        updated_by_audit: newAudit,
      });

      if (error) throw error;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setError(t.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHorizon = () => {
    const days = displayToDays(horizonValue, horizonUnit);
    saveSetting("booking_horizon_days", days, setSavingHorizon, setSavedHorizon, setHorizonError);
  };

  const handleSaveNotice = () => {
    const hours = displayToHours(noticeValue, noticeUnit);
    // stored as minutes in the DB
    saveSetting("booking_min_lead_time_minutes", hours * 60, setSavingNotice, setSavedNotice, setNoticeError);
  };

  // ── Date overrides handlers ───────────────────────────────────────────────

  const resetAddForm = () => {
    setAddForm({ type: "closed", startDate: "", endDate: "", startTime: "", endTime: "", note: "" });
    setAddErrors({});
    setOverlapWarning(null);
  };

  const validateAddForm = (): boolean => {
    const errors: Record<string, string> = {};
    const today = format(new Date(), "yyyy-MM-dd");

    if (!addForm.startDate) {
      errors.startDate = t.errPastDate;
    } else if (addForm.startDate < today) {
      errors.startDate = t.errPastDate;
    }

    if (!addForm.endDate) {
      errors.endDate = t.errEndBeforeStart;
    } else if (addForm.endDate < addForm.startDate) {
      errors.endDate = t.errEndBeforeStart;
    }

    if (addForm.type === "open") {
      if (!addForm.startTime || !addForm.endTime) {
        errors.times = t.errMissingTimes;
      } else if (addForm.endTime <= addForm.startTime) {
        errors.times = t.errEndTimeBeforeStart;
      }
    }

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkOverlap = () => {
    if (addForm.type !== "closed") return;
    const existing = overrides.find(
      (o) =>
        !o.is_available &&
        o.override_date <= addForm.endDate &&
        o.end_date >= addForm.startDate
    );
    if (existing) {
      setOverlapWarning(t.warnOverlapBody);
    } else {
      setOverlapWarning(null);
    }
  };

  const handleSaveOverride = async () => {
    if (!validateAddForm()) return;

    if (addForm.type === "closed") {
      // Check for conflicting confirmed bookings
      setAddSaving(true);
      const { data: conflicts } = await supabase
        .from("bookings")
        .select("id, start_time, client_email")
        .gte("start_time", `${addForm.startDate}T00:00:00.000Z`)
        .lte("start_time", `${addForm.endDate}T23:59:59.999Z`)
        .eq("status", "confirmed");

      setAddSaving(false);

      if (conflicts && conflicts.length > 0) {
        setConflictBookings(conflicts as ConflictBooking[]);
        setPendingOverride({ ...addForm });
        setShowConflictDialog(true);
        return;
      }
    }

    await commitOverride(addForm);
  };

  const commitOverride = async (form: typeof addForm) => {
    setAddSaving(true);
    const { error } = await supabase.from("availability_overrides").insert({
      override_date: form.startDate,
      end_date: form.endDate,
      is_available: form.type === "open",
      start_time: form.type === "open" ? form.startTime : null,
      end_time: form.type === "open" ? form.endTime : null,
      reason: form.note || null,
    });

    setAddSaving(false);
    if (!error) {
      setShowAddDialog(false);
      resetAddForm();
      fetchOverrides();
    }
  };

  const handleConflictContinue = async () => {
    setShowConflictDialog(false);
    if (pendingOverride) {
      await commitOverride(pendingOverride);
      setPendingOverride(null);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    await supabase
      .from("availability_overrides")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    fetchOverrides();
  };

  const handleQuickAddOverride = (startStr: string, endStr: string) => {
    resetAddForm();
    setAddForm((f) => ({ ...f, startDate: startStr, endDate: endStr }));
    setShowAddDialog(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, "yyyy-MM-dd");

  const activeOverrides = overrides.filter((o) => o.end_date >= todayStr);
  const pastOverrides = overrides.filter((o) => o.end_date < todayStr);

  return (
    <div className="space-y-10">
      {/* ── Booking Rules ── */}
      <div className="space-y-4">
        <h2 className="font-display text-xl text-foreground">{t.bookingRules}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Booking Horizon Card */}
          <div className="card-organic p-5 space-y-4">
            <Label className="font-body text-sm text-muted-foreground">{t.horizonLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={settingsLoaded ? horizonValue : ""}
                onChange={(e) => setHorizonValue(Number(e.target.value))}
                className="w-20 text-sm"
                disabled={!settingsLoaded}
              />
              <select
                value={horizonUnit}
                onChange={(e) => setHorizonUnit(e.target.value as HorizonUnit)}
                className="font-body text-sm bg-background border border-input rounded-md px-3 py-2"
                disabled={!settingsLoaded}
              >
                <option value="days">{t.horizonUnit_days}</option>
                <option value="weeks">{t.horizonUnit_weeks}</option>
                <option value="months">{t.horizonUnit_months}</option>
              </select>
            </div>
            {horizonError && (
              <p className="text-xs text-destructive font-body">{horizonError}</p>
            )}
            <button
              onClick={handleSaveHorizon}
              disabled={savingHorizon || !settingsLoaded}
              className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
            >
              <Save className="w-3.5 h-3.5" />
              {savingHorizon ? t.saving : savedHorizon ? t.saved : "Save"}
            </button>
          </div>

          {/* Minimum Notice Card */}
          <div className="card-organic p-5 space-y-4">
            <Label className="font-body text-sm text-muted-foreground">{t.noticeLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={168}
                value={settingsLoaded ? noticeValue : ""}
                onChange={(e) => setNoticeValue(Number(e.target.value))}
                className="w-20 text-sm"
                disabled={!settingsLoaded}
              />
              <select
                value={noticeUnit}
                onChange={(e) => setNoticeUnit(e.target.value as NoticeUnit)}
                className="font-body text-sm bg-background border border-input rounded-md px-3 py-2"
                disabled={!settingsLoaded}
              >
                <option value="hours">{t.noticeUnit_hours}</option>
                <option value="days">{t.noticeUnit_days}</option>
              </select>
            </div>
            {noticeError && (
              <p className="text-xs text-destructive font-body">{noticeError}</p>
            )}
            <button
              onClick={handleSaveNotice}
              disabled={savingNotice || !settingsLoaded}
              className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
            >
              <Save className="w-3.5 h-3.5" />
              {savingNotice ? t.saving : savedNotice ? t.saved : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Weekly Availability ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Weekly Availability</h2>
          <div className="flex gap-2">
            <button
              onClick={addRule}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-muted-foreground">
              No availability rules set. Add some slots to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div
                key={rule.id || `new-${i}`}
                className="card-organic p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <select
                  value={rule.day_of_week}
                  onChange={(e) => updateRule(i, { day_of_week: Number(e.target.value) })}
                  className="font-body text-sm bg-background border border-input rounded-md px-3 py-2 w-full sm:w-auto"
                >
                  {DAYS.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) => updateRule(i, { start_time: e.target.value })}
                    className="w-full sm:w-32 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) => updateRule(i, { end_time: e.target.value })}
                    className="w-full sm:w-32 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={rule.buffer_minutes}
                    onChange={(e) => updateRule(i, { buffer_minutes: Number(e.target.value) })}
                    className="w-20 text-sm"
                  />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">min buffer</span>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <label className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.is_active}
                      onChange={(e) => updateRule(i, { is_active: e.target.checked })}
                      className="rounded"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => removeRule(i)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Date Overrides ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-foreground">{t.dateOverrides}</h2>
            <p className="font-body text-sm text-muted-foreground mt-0.5">{t.dateOverridesSubtitle}</p>
          </div>
          <button
            onClick={() => { resetAddForm(); setShowAddDialog(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors whitespace-nowrap"
          >
            {t.addOverride}
          </button>
        </div>

        {loadingOverrides ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : overrides.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-body text-muted-foreground text-sm">No date overrides set.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeOverrides.map((o) => (
              <OverrideRow key={o.id} override={o} onDelete={handleDeleteOverride} muted={false} />
            ))}
            {pastOverrides.length > 0 && (
              <>
                <p className="font-body text-xs text-muted-foreground pt-2 pb-1 uppercase tracking-wider">Past</p>
                {pastOverrides.map((o) => (
                  <OverrideRow key={o.id} override={o} onDelete={handleDeleteOverride} muted />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Add Override Dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); resetAddForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{t.addOverride.replace("+ ", "")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Override type */}
            <div className="space-y-2">
              <Label className="font-body text-sm">{t.overrideType}</Label>
              <RadioGroup
                value={addForm.type}
                onValueChange={(v) => {
                  setAddForm({ ...addForm, type: v as "closed" | "open" });
                  setOverlapWarning(null);
                  setAddErrors({});
                }}
                className="flex flex-col gap-2"
              >
                <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                  <RadioGroupItem value="closed" id="type-closed" />
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                    {t.badgeClosed}
                  </span>
                  {t.overrideClosedLabel}
                </label>
                <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                  <RadioGroupItem value="open" id="type-open" />
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/40">
                    {t.badgeOpen}
                  </span>
                  {t.overrideOpenLabel}
                </label>
              </RadioGroup>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">{t.startDate}</Label>
                <Input
                  type="date"
                  min={todayStr}
                  value={addForm.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddForm((f) => ({
                      ...f,
                      startDate: v,
                      endDate: f.endDate && f.endDate >= v ? f.endDate : v,
                    }));
                    setAddErrors((err) => ({ ...err, startDate: "" }));
                  }}
                  onBlur={checkOverlap}
                  className="text-sm"
                />
                {addErrors.startDate && (
                  <p className="text-xs text-destructive">{addErrors.startDate}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">{t.endDate}</Label>
                <Input
                  type="date"
                  min={addForm.startDate || todayStr}
                  value={addForm.endDate}
                  onChange={(e) => {
                    setAddForm((f) => ({ ...f, endDate: e.target.value }));
                    setAddErrors((err) => ({ ...err, endDate: "" }));
                  }}
                  onBlur={checkOverlap}
                  className="text-sm"
                />
                {addErrors.endDate && (
                  <p className="text-xs text-destructive">{addErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Times (open only) */}
            {addForm.type === "open" && (
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">{t.startTime}</Label>
                    <Input
                      type="time"
                      value={addForm.startTime}
                      onChange={(e) => setAddForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">{t.endTime}</Label>
                    <Input
                      type="time"
                      value={addForm.endTime}
                      onChange={(e) => setAddForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                {addErrors.times && (
                  <p className="text-xs text-destructive">{addErrors.times}</p>
                )}
              </div>
            )}

            {/* Note */}
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">{t.noteLabel}</Label>
              <Input
                type="text"
                maxLength={100}
                value={addForm.note}
                onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Summer vacation"
                className="text-sm"
              />
            </div>

            {/* Overlap warning */}
            {overlapWarning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-body">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {overlapWarning}
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => { setShowAddDialog(false); resetAddForm(); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveOverride}
              disabled={addSaving}
              className="btn-primary text-sm py-2 px-5"
            >
              {addSaving ? t.saving : t.save}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule Preview Calendar ── */}
      {!loading && !loadingOverrides && settingsLoaded && (
        <ScheduleCalendar
          rules={rules}
          overrides={overrides}
          horizonDays={displayToDays(horizonValue, horizonUnit)}
          onAddOverride={handleQuickAddOverride}
        />
      )}

      {/* ── Conflict Dialog ── */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t.conflictTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="font-body text-sm text-muted-foreground">
              <strong className="text-foreground">{conflictBookings.length}</strong>{" "}
              {t.conflictBody}
            </p>
            <ul className="space-y-1">
              {conflictBookings.map((b) => (
                <li key={b.id} className="font-body text-xs text-muted-foreground">
                  · {format(parseISO(b.start_time), "EEE, MMM d · HH:mm")} — {b.client_email}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowConflictDialog(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors"
            >
              {t.conflictCancel}
            </button>
            <button
              onClick={handleConflictContinue}
              disabled={addSaving}
              className="btn-primary text-sm py-2 px-5"
            >
              {addSaving ? t.saving : t.conflictContinue}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Override row sub-component ───────────────────────────────────────────────

function OverrideRow({
  override,
  onDelete,
  muted,
}: {
  override: DateOverride;
  onDelete: (id: string) => void;
  muted: boolean;
}) {
  const isClosed = !override.is_available;
  const dateLabel = formatOverrideDate(override.override_date, override.end_date);
  const timeLabel =
    !isClosed && override.start_time && override.end_time
      ? ` · ${override.start_time.slice(0, 5)} – ${override.end_time.slice(0, 5)}`
      : "";

  return (
    <div
      className={`card-organic p-3 flex items-center gap-3 ${muted ? "opacity-50" : ""}`}
    >
      <span
        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
          isClosed
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/15 text-primary border border-primary/40"
        }`}
      >
        {isClosed ? availabilityEN.badgeClosed : availabilityEN.badgeOpen}
      </span>
      <span className="font-body text-sm flex-1 min-w-0">
        {dateLabel}
        {timeLabel}
      </span>
      {override.reason && (
        <span className="font-body text-xs text-muted-foreground truncate max-w-[120px]">
          {override.reason}
        </span>
      )}
      <button
        onClick={() => onDelete(override.id)}
        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default AvailabilityManager;
