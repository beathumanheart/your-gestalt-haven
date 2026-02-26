import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Lock, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/admin/login"), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery && !window.location.hash.includes("type=recovery")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-organic p-8 md:p-10 w-full max-w-md text-center">
          <KeyRound className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-xl font-light text-foreground mb-2">Invalid Link</h1>
          <p className="font-body text-sm text-muted-foreground mb-4">
            This password reset link is invalid or has expired.
          </p>
          <a href="/admin/login" className="text-primary text-sm hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="card-organic p-8 md:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-light text-foreground">Set New Password</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">Enter your new password below</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="font-body text-sm text-primary">Password updated! Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="font-body text-sm text-foreground mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm py-3"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminResetPassword;
