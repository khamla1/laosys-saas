"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";

export const dynamic = "force-dynamic";

export default function MfaVerifyPage() {
  const sessionResult = useSession();
  const { data: session, update, status } = sessionResult || { data: null, update: async () => {}, status: "loading" };
  const router = useRouter();
  
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect client side transition: if session loads and user is already mfaVerified, send to dashboard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user && !(session.user as any).mfaEnabled) {
      router.push("/dashboard");
    } else if (session?.user && (session.user as any).mfaVerified) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || isNaN(Number(code))) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          token: code
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Verification failed. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Trigger NextAuth dynamic token update to set mfaVerified: true
        await update({ mfaVerified: true });
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Invalid verification code");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Loading secure environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />

      {/* Decorative Top Accent Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header Icons & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] mb-6 animate-pulse">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 tracking-tight mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-zinc-500">
            Please enter the 6-digit code from your authenticator app.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full pl-11 h-14 bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-700 text-center text-xl font-bold tracking-widest rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all shadow-inner"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Verifying..." : "Verify Code"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-zinc-800/50">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 hover:-translate-x-0.5 duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cancel and Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
