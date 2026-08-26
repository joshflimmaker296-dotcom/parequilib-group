"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace(params.get("next") || "/browse");
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-1">Welcome back</h1>
        <p className="text-textdim text-sm mb-6">Sign in to buy, sell, and message on Parequilib Group.</p>

        <button onClick={signInWithGoogle} className="btn btn-ghost w-full mb-4">
          Continue with Google
        </button>
        <div className="flex items-center gap-3 text-xs text-textdim mb-4">
          <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-amber w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-textdim mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-amber cursor-pointer">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
