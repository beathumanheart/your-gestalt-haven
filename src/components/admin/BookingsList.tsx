import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { CalendarDays, Mail, User, XCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const BookingsList = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, session_types(name, duration_minutes)")
      .order("start_time", { ascending: true })
      .limit(100);
    
    // Sort: confirmed first, then by start_time (upcoming first)
    const sorted = (data || []).sort((a, b) => {
      const statusOrder: Record<string, number> = { confirmed: 0, completed: 1, cancelled: 2 };
      const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
    
    setBookings(sorted);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    if (status === "cancelled") {
      // Route through edge function to send cancellation emails
      try {
        const { data: result, error } = await supabase.functions.invoke("process-booking", {
          body: { action: "cancel", bookingId: id, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        });
        if (error) throw error;
        if (!result?.success) throw new Error(result?.error || "Cancel failed");
        toast.success("Booking cancelled and notification sent");
      } catch (err) {
        console.error("Admin cancel error:", err);
        toast.error("Failed to cancel booking");
      }
    } else {
      await supabase.from("bookings").update({ status }).eq("id", id);
    }
    fetchBookings();
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-body text-muted-foreground">No bookings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const start = parseISO(b.start_time);
        const statusColors: Record<string, string> = {
          confirmed: "bg-primary/10 text-primary",
          cancelled: "bg-destructive/10 text-destructive",
          completed: "bg-muted text-muted-foreground",
        };
        return (
          <div key={b.id} className="card-organic p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-body ${statusColors[b.status] || ""}`}>
                    {b.status}
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    {b.session_types?.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 font-body text-sm">
                  <span className="flex items-center gap-1 text-foreground">
                    <User className="w-3.5 h-3.5" />
                    {b.client_name}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {b.client_email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-body text-sm">
                  <div className="text-foreground font-medium">{format(start, "MMM d, yyyy")}</div>
                  <div className="text-muted-foreground">{format(start, "HH:mm")} · {b.session_types?.duration_minutes}min</div>
                </div>

                {b.status === "confirmed" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(b.id, "completed")}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Mark completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(b.id, "cancelled")}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {b.notes && (
              <p className="font-body text-xs text-muted-foreground mt-2 border-t border-border pt-2">{b.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookingsList;
