"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

const CATS = ["Furniture", "Electronics", "Clothing", "Books", "Other"];
const FEE_RATE = 0.1;

export default function SellPage() {
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("Furniture");
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const priceNum = Number(price) || 0;
  const fee = priceNum * FEE_RATE;

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function generate() {
    if (!keywords.trim()) {
      setError("Add a few keywords first.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, category, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTitle(data.title);
      setDescription(data.description);
      setAiUsed(true);
    } catch (e: any) {
      setError(e.message || "Couldn't reach the AI writer right now.");
    }
    setGenerating(false);
  }

  async function postListing(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let image_url: string | null = null;
    if (imageFile) {
      const path = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("listing-images").upload(path, imageFile);
      if (upErr) {
        setError("Image upload failed: " + upErr.message);
        setPosting(false);
        return;
      }
      const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }

    const finalTitle = title.trim() || keywords.trim();
    const { data: inserted, error: insErr } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        title: finalTitle,
        description: description.trim(),
        price: priceNum,
        category,
        image_url,
        ai_generated: aiUsed,
      })
      .select("id")
      .single();

    setPosting(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    router.push(`/listing/${inserted.id}`);
  }

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-semibold mb-1">Sell something</h1>
        <p className="text-textdim text-sm mb-6">List an item. Parequilib Group takes a 10% fee when it sells.</p>

        <form onSubmit={postListing} className="space-y-4">
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Photo</label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-textdim relative overflow-hidden min-h-[80px]">
              {imagePreview ? (
                <img src={imagePreview} className="w-full max-h-36 object-cover rounded" />
              ) : (
                <span>Tap to upload a photo</span>
              )}
              <input type="file" accept="image/*" onChange={onImagePick} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="block text-xs text-textdim mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="block text-xs text-textdim mb-1.5">Price ($)</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-xs text-textdim">
            {priceNum > 0 ? (
              <>
                Listing price <b className="text-text">${priceNum.toFixed(2)}</b> → Parequilib Group fee (10%):{" "}
                <b className="text-text">${fee.toFixed(2)}</b> →{" "}
                <span className="text-mint">you take home ${(priceNum - fee).toFixed(2)}</span>
              </>
            ) : (
              "Enter a price to see what you'll take home after the 10% Parequilib Group fee."
            )}
          </div>

          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Rough notes / keywords</label>
            <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. oak coffee table, minor scratch, moving sale" />
          </div>

          <button type="button" onClick={generate} disabled={generating} className="text-mint border border-mint rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {generating ? "Writing..." : "✨ Write it for me"}
          </button>

          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Listing title" />
          </div>
          <div className="field">
            <label className="block text-xs text-textdim mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item" />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button type="submit" disabled={posting} className="btn btn-amber w-full">
            {posting ? "Posting..." : "Post listing"}
          </button>
        </form>
      </main>
    </>
  );
}
