import React, { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "../utils/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [isLogin, setIsLogin]         = useState(true);
  const [formData, setFormData]       = useState({ name: "", email: "", password: "" });
  const [error, setError]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!formData.email || !formData.password)
      return setError("Email and password are required.");
    if (!isLogin && !formData.name)
      return setError("Name is required.");
    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters.");

    setIsLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(apiUrl(endpoint), {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // send/receive HTTP-only cookie
        body: JSON.stringify(
          isLogin
            ? { email: formData.email, password: formData.password }
            : { name: formData.name, email: formData.email, password: formData.password }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Persist user + token in localStorage for App.tsx session rehydration
      localStorage.setItem("cognispace_user", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("auth_token", data.token);

      onLoginSuccess(data.user);
    } catch {
      setError("Cannot reach backend server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col selection:bg-indigo-500/25" style={{ background: "#060813" }}>

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[300px] bg-[radial-gradient(ellipse,rgba(6,182,212,0.1)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 h-14 flex items-center justify-between border-b backdrop-blur-xl" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(6,8,19,0.85)" }}>
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center font-black text-white text-[10px] shadow-[0_2px_8px_rgba(99,102,241,0.5)]">C</div>
          <span className="text-sm font-bold tracking-tight text-slate-100">CogniSpace</span>
        </div>
      </header>

      {/* Auth card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] p-8 rounded-2xl shadow-2xl border backdrop-blur-xl space-y-6" style={{ background: "rgba(14,20,46,0.85)", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 24px 64px -12px rgba(0,0,0,0.85)" }}>

          {/* Title */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-black tracking-[-0.04em] text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              {isLogin
                ? "Log in to your CogniSpace workspace."
                : "Get started with your free workspace."}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-950/40 text-[12px] text-red-300 flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Name (register only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Karthik Uppari"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-[13px] border rounded-xl text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none"
                  style={{ background: "#0e1020", borderColor: "rgba(255,255,255,0.08)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 text-[13px] border rounded-xl text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none"
                style={{ background: "#0e1020", borderColor: "rgba(255,255,255,0.08)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? "••••••••" : "Min. 6 characters"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-11 text-[13px] border rounded-xl text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none"
                  style={{ background: "#0e1020", borderColor: "rgba(255,255,255,0.08)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl shadow-[0_4px_24px_-4px_rgba(59,130,246,0.5)] hover:shadow-[0_6px_32px_-4px_rgba(59,130,246,0.65)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[11px] text-slate-500 font-mono">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Demo access — instant login */}
          <button
            type="button"
            onClick={() =>
              onLoginSuccess({
                id:    "usr-demo",
                name:  "Demo User",
                email: "demo@cognispace.io",
              })
            }
            className="w-full py-3 border text-[13px] font-semibold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            Continue with demo access
          </button>

          {/* Toggle mode */}
          <p className="text-[12px] text-slate-400 text-center">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={switchMode}
              className="ml-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
            >
              {isLogin ? "Sign up free" : "Log in"}
            </button>
          </p>

          {/* Security badge */}
          <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            HTTP-only cookie · bcrypt · JWT 7d
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
