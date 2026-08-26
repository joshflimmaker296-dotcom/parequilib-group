"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import ShoppingAssistant from "@/components/ShoppingAssistant";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string | null;
  ai_generated: boolean;
  status: string;
};

const CATS = ["All", "Furniture", "Electronics", "Clothing", "Books", "Other"];

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, category, image_url, ai_generated, status")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = listings.filter(
    (l) =>
      (cat === "All" || l.category === cat) &&
      (l.title.toLowerCase().includes(q.toLowerCase()) || l.category.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <Header activeSearch={q} onSearch={setQ} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full border text-sm ${
                cat === c ? "border-amber text-amber" : "border-border text-textdim"
              } bg-surface`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-textdim py-16">Loading listings...</div>
        ) : filtered.length === 0 ? (
          <div className="text-textdim py-16">
            No listings yet.{" "}
            <Link href="/sell" className="text-amber">
              Be the first to list something.
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((l) => (
              <Link key={l.id} href={`/listing/${l.id}`} className="card block">
                <div
                  className="h-36 relative bg-gradient-to-br from-surface2 to-surface bg-cover bg-center"
                  style={l.image_url ? { backgroundImage: `url(${l.image_url})` } : {}}
                >
                  {l.ai_generated && (
                    <div className="absolute top-2 left-2 bg-mint/15 border border-mint text-mint text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      ✨ AI-written
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="text-sm font-semibold leading-tight mb-1">{l.title}</div>
                  <div className="font-mono text-amber text-sm">{l.price === 0 ? "Free" : `$${l.price}`}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <ShoppingAssistant />
    </>
  );
}
