import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Calendar, Clock, List, Settings } from "lucide-react";
import AvailabilityManager from "@/components/admin/AvailabilityManager";
import SessionTypeManager from "@/components/admin/SessionTypeManager";
import BookingsList from "@/components/admin/BookingsList";
import type { Session } from "@supabase/supabase-js";

type Tab = "bookings" | "availability" | "sessions";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("bookings");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [session]);

  if (!session) {
    navigate("/admin/login");
    return null;
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-body text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-organic p-8 text-center max-w-md">
          <h2 className="font-display text-xl text-foreground mb-2">Access Denied</h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Your account doesn't have admin privileges.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-primary text-sm hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "bookings", label: "Bookings", icon: List },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "sessions", label: "Session Types", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg font-medium text-foreground">Admin Dashboard</h1>
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

      {/* Tab navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-body text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {activeTab === "bookings" && <BookingsList />}
        {activeTab === "availability" && <AvailabilityManager />}
        {activeTab === "sessions" && <SessionTypeManager />}
      </div>
    </div>
  );
};

export default AdminDashboard;
