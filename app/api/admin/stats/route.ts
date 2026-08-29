import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, title, price, category")
    .eq("status", "active")
    .limit(100);

  const listings = (listingsData ?? []) as { id: string; title: string; price: number; category: string }[];

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Shopping assistant isn't configured on this server yet (missing ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  const listingsBrief = listings.map((l) => `${l.id} | ${l.title} | $${l.price} | ${l.category}`).join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `You are a marketplace shopping assistant. Here are current listings (id | title | price | category):
${listingsBrief}

Buyer said: "${message}"

Reply with ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{"reply": "one short conversational sentence responding to the buyer", "matches": ["id1", "id2"]}
"matches" should be an array of 0-3 listing ids (as strings, exactly as given above) that best fit what they said. If nothing fits well, return an empty array.`,
          },
        ],
      }),
    });
    const data = await res.json();
    const raw = (data.content || []).map((b: { text?: string }) => b.text || "").join("").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const matchedListings = listings.filter((l) => (parsed.matches || []).includes(l.id));
    return NextResponse.json({ reply: parsed.reply, matches: matchedListings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't reach the assistant right now." }, { status: 502 });
  }
}
