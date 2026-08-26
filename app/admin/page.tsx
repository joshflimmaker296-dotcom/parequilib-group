"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

type Stats = {
  activeListings: number;
  registeredUsers: number;
  listedValue: number;
  realizedVolume: number;
  realizedRevenue: number;
  messagesSent: number;
  offersMade: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setStats(data);
    })();
  }, []);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-2xl font-semibold">Admin panel</h1>
          <Link href="/browse" className="btn btn-ghost">← Back to marketplace</Link>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <StatCard v={stats.activeListings} l="Active listings" />
              <StatCard v={stats.registeredUsers} l="Registered users" />
              <StatCard v={`$${stats.listedValue.toLocaleString()}`} l="Total listed value" />
              <StatCard v={`$${stats.realizedVolume.toLocaleString()}`} l="Paid order volume" />
              <StatCard v={`$${stats.realizedRevenue.toFixed(2)}`} l="Platform revenue (10% fee, realized)" />
              <StatCard v={stats.messagesSent} l="Messages sent" />
              <StatCard v={stats.offersMade} l="Offers made" />
            </div>
            <p className="text-textdim text-xs">
              Platform revenue is the sum of the 10% fee actually collected on completed Stripe
              payments — not an estimate off listed prices.
            </p>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="font-display text-2xl font-semibold">{v}</div>
      <div className="text-textdim text-xs mt-1">{l}</div>
    </div>
  );
}
