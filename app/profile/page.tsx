"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

type Profile = { name: string; avatar_url: string | null; stripe_onboarded: boolean };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url, stripe_onboarded")
        .eq("id", user.id)
        .single();
      setProfile(data as Profile);
      setName((data as Profile)?.name || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ name }).eq("id", user.id);
    setSaving(false);
  }

  async function connectStripe() {
    setConnecting(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    setConnecting(false);
    if (data.url) window.location.href = data.url;
  }

  if (!profile) return null;

  return (
    <>
      <Header />
      <main className="max-w-sm mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-semibold mb-6">Edit profile</h1>
        <div className="field mb-4">
          <label className="block text-xs text-textdim mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button onClick={save} disabled={saving} className="btn btn-amber w-full mb-8">
          {saving ? "Saving..." : "Save"}
        </button>

        <div className="border-t border-border pt-6">
          <h2 className="font-semibold text-sm mb-1">Seller payouts</h2>
          <p className="text-textdim text-xs mb-3">
            Connect a bank account via Stripe to receive payouts when your listings sell.
          </p>
          {profile.stripe_onboarded ? (
            <div className="text-mint text-sm">✓ Payouts connected</div>
          ) : (
            <button onClick={connectStripe} disabled={connecting} className="btn btn-mint w-full">
              {connecting ? "Redirecting..." : "Connect payouts with Stripe"}
            </button>
          )}
        </div>
      </main>
    </>
  );
}
