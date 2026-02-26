import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="card-organic p-8 md:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-light text-foreground">
            {forgotMode ? "Reset Password" : "Admin Portal"}
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {forgotMode
              ? "Enter your email to receive a reset link"
              : "Sign in to manage your practice"}
          </p>
        </div>

        {forgotMode ? (
          resetSent ? (
            <div className="text-center space-y-4">
              <p className="font-body text-sm text-primary">
                Password reset link sent! Check your email inbox.
              </p>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="font-body text-sm text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm font-body">{error}</p>}

              <button type="submit" disabled={loading} className="w-full btn-primary text-sm py-3">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(""); }}
                className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-sm text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground mb-1.5 block">Password</label>
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

            {error && <p className="text-destructive text-sm font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setForgotMode(true); setError(""); }}
                className="font-body text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
