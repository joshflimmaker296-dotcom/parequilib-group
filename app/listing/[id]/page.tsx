"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  seller_id: string;
  status: string;
};
type Message = { id: string; sender_id: string; body: string; created_at: string };

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [offerAmt, setOfferAmt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const supabase = createClient();

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data: l } = await supabase.from("listings").select("*").eq("id", id).single();
    setListing(l);

    const { data: m } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", id)
      .order("created_at", { ascending: true });
    setMessages((m as Message[]) || []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`listing-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `listing_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendMessage() {
    if (!msgText.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: id, body: msgText }),
    });
    if (res.ok) setMsgText("");
    else setError((await res.json()).error);
  }

  async function sendOffer() {
    if (!offerAmt) return;
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: id, amount: offerAmt }),
    });
    if (res.ok) {
      setOfferAmt("");
      alert("Offer sent to the seller.");
    } else setError((await res.json()).error);
  }

  async function buyNow() {
    setBuying(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: id }),
    });
    const data = await res.json();
    setBuying(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    window.location.href = data.url;
  }

  if (!listing) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-10 text-textdim">Loading...</main>
      </>
    );
  }

  const isSeller = userId === listing.seller_id;
  const purchased = searchParams.get("purchased") === "1";

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-8">
        {purchased && (
          <div className="bg-mint/10 border border-mint text-mint text-sm rounded-lg px-4 py-3 mb-5">
            Payment confirmed — the seller has been notified.
          </div>
        )}
        <div
          className="h-56 rounded-xl mb-4 bg-cover bg-center bg-surface2"
          style={listing.image_url ? { backgroundImage: `url(${listing.image_url})` } : {}}
        />
        <h1 className="font-display text-2xl font-semibold mb-1">{listing.title}</h1>
        <div className="font-mono text-amber text-lg mb-1">{listing.price === 0 ? "Free" : `$${listing.price}`}</div>
        <div className="text-textdim text-sm mb-4">{listing.category} · {listing.status === "sold" ? "Sold" : "Active"}</div>
        <p className="text-sm text-text/90 mb-6">{listing.description}</p>

        {!isSeller && listing.status === "active" && listing.price > 0 && (
          <button onClick={buyNow} disabled={buying} className="btn btn-amber w-full mb-6">
            {buying ? "Redirecting to checkout..." : `Buy now — $${listing.price}`}
          </button>
        )}

        {!isSeller && (
          <>
            <div className="border border-border rounded-lg bg-surface p-3 mb-4 max-h-64 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <div className="text-textdim text-sm">No messages yet — say hi to the seller.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
                      m.sender_id === userId ? "bg-amber text-[#20140A] ml-auto" : "bg-surface2"
                    }`}
                  >
                    {m.body}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Offer $"
                type="number"
                value={offerAmt}
                onChange={(e) => setOfferAmt(e.target.value)}
              />
              <button onClick={sendOffer} className="btn btn-ghost btn-sm">Make offer</button>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Message the seller..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} className="btn btn-amber btn-sm">Send</button>
            </div>
          </>
        )}
        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}
      </main>
    </>
  );
}
