import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! You can now sign in.");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
      }
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
          <h1 className="font-display text-2xl font-light text-foreground">Admin Portal</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {mode === "login" ? "Sign in to manage your practice" : "Create your admin account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                minLength={6}
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm font-body">{error}</p>}
          {success && <p className="text-primary text-sm font-body">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2"
          >
            {mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                {loading ? "Signing in..." : "Sign In"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account..." : "Create Account"}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6 font-body">
          {mode === "login" ? (
            <>
              Need an account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="text-primary hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-primary hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
