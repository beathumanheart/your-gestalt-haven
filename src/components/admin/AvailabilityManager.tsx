import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Rule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  isNew?: boolean;
}

const AvailabilityManager = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("availability_rules")
      .select("*")
      .order("day_of_week")
      .order("start_time");
    setRules((data || []).map(r => ({ ...r })));
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const addRule = () => {
    setRules([...rules, { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true, isNew: true }]);
  };

  const removeRule = async (index: number) => {
    const rule = rules[index];
    if (rule.id) {
      await supabase.from("availability_rules").delete().eq("id", rule.id);
    }
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    setRules(rules.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const rule of rules) {
      const data = {
        day_of_week: rule.day_of_week,
        start_time: rule.start_time,
        end_time: rule.end_time,
        is_active: rule.is_active,
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

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Weekly Availability</h2>
        <div className="flex gap-2">
          <button onClick={addRule} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
          <button onClick={saveAll} disabled={saving} className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-body text-muted-foreground">No availability rules set. Add some slots to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div key={rule.id || `new-${i}`} className="card-organic p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <select
                value={rule.day_of_week}
                onChange={(e) => updateRule(i, { day_of_week: Number(e.target.value) })}
                className="font-body text-sm bg-background border border-input rounded-md px-3 py-2 w-full sm:w-auto"
              >
                {DAYS.map((d, idx) => (
                  <option key={idx} value={idx}>{d}</option>
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
  );
};

export default AvailabilityManager;
