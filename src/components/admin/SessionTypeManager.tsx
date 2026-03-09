import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

interface SessionType {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  show_price: boolean;
  currency: string;
  is_active: boolean;
  sort_order: number;
  isNew?: boolean;
}

const SessionTypeManager = () => {
  const [types, setTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("session_types")
      .select("*")
      .order("sort_order");
    setTypes((data || []).map(t => ({ ...t, description: t.description || "", price: t.price, currency: t.currency || "USD" })));
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); }, []);

  const addType = () => {
    setTypes([...types, {
      name: "",
      description: "",
      duration_minutes: 50,
      price: null,
      currency: "USD",
      is_active: true,
      sort_order: types.length,
      isNew: true,
    }]);
  };

  const removeType = async (index: number) => {
    const t = types[index];
    if (t.id) {
      await supabase.from("session_types").update({ is_active: false }).eq("id", t.id);
    }
    setTypes(types.filter((_, i) => i !== index));
  };

  const updateType = (index: number, updates: Partial<SessionType>) => {
    setTypes(types.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const saveAll = async () => {
    setSaving(true);
    for (let i = 0; i < types.length; i++) {
      const t = types[i];
      const data = {
        name: t.name,
        description: t.description || null,
        duration_minutes: t.duration_minutes,
        price: t.price,
        currency: t.currency,
        is_active: t.is_active,
        sort_order: i,
      };
      if (t.id && !t.isNew) {
        await supabase.from("session_types").update(data).eq("id", t.id);
      } else {
        await supabase.from("session_types").insert(data);
      }
    }
    await fetchTypes();
    setSaving(false);
  };

  if (loading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Session Types</h2>
        <div className="flex gap-2">
          <button onClick={addType} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> Add Type
          </button>
          <button onClick={saveAll} disabled={saving} className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {types.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-body text-muted-foreground">No session types yet. Create one to allow bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((t, i) => (
            <div key={t.id || `new-${i}`} className="card-organic p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Name</label>
                    <Input
                      value={t.name}
                      onChange={(e) => updateType(i, { name: e.target.value })}
                      placeholder="e.g. Individual Session"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Duration (min)</label>
                      <Input
                        type="number"
                        value={t.duration_minutes}
                        onChange={(e) => updateType(i, { duration_minutes: Number(e.target.value) })}
                        min={15}
                        max={240}
                        className="text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Price</label>
                      <Input
                        type="number"
                        value={t.price ?? ""}
                        onChange={(e) => updateType(i, { price: e.target.value ? Number(e.target.value) : null })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Currency</label>
                      <select
                        value={t.currency}
                        onChange={(e) => updateType(i, { currency: e.target.value })}
                        className="font-body text-sm bg-background border border-input rounded-md px-2 py-2 w-full h-10"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="RUB">RUB</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <label className="flex items-center gap-1.5 font-body text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.is_active}
                      onChange={(e) => updateType(i, { is_active: e.target.checked })}
                      className="rounded"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => removeType(i)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pl-7">
                <label className="font-body text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={t.description}
                  onChange={(e) => updateType(i, { description: e.target.value })}
                  placeholder="Brief description of this session type..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-body resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionTypeManager;
