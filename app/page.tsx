import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Landing() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/browse");

  return (
    <main className="max-w-5xl mx-auto px-6 py-24">
      <div className="border-b border-border pb-10 mb-10">
        <h1 className="font-display text-5xl font-semibold max-w-xl leading-tight mb-4">
          Parequilib <span className="text-amber">Group</span>
        </h1>
        <p className="text-textdim text-base max-w-md">
          A real marketplace. Real accounts, a real database, and real payouts —
          sellers get paid directly to their bank, Parequilib Group takes a 10% fee.
        </p>
        <div className="flex gap-3 mt-8">
          <Link href="/signup" className="btn btn-amber">Create an account</Link>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-textdim">
        <div>
          <div className="text-mint font-semibold mb-1">Real auth</div>
          Email/password and Google sign-in, backed by Supabase Auth.
        </div>
        <div>
          <div className="text-mint font-semibold mb-1">Real payments</div>
          Stripe Connect handles payouts and splits the platform fee automatically.
        </div>
        <div>
          <div className="text-mint font-semibold mb-1">AI-assisted listings</div>
          Optional AI writer for titles/descriptions, and an AI shopping assistant.
        </div>
      </div>
    </main>
  );
}
