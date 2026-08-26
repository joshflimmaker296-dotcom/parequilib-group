"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-semibold mb-2">Check your email</h1>
          <p className="text-textdim text-sm">
            We sent a confirmation link to <b className="text-text">{email}</b>. Click it, then come back and sign in.
          </p>
          <Link href="/login" className="btn btn-amber inline-block mt-6">Go to sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-textdim text-sm mb-6">Join Parequilib Group to start buying and selling.</p>

        <form onSubmit={signUp} className="space-y-4">
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-amber w-full">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-textdim mt-5">
          Already have an account? <Link href="/login" className="text-amber cursor-pointer">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
