import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { keywords, category, price } = await req.json();
  if (!keywords?.trim()) {
    return NextResponse.json({ error: "Add a few keywords first." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI writer isn't configured on this server yet (missing ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `You are writing a marketplace listing. Category: ${category}. Price: $${price || "not given"}. Seller's rough notes: "${keywords}".
Return ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{"title": "short punchy listing title, under 60 chars", "description": "2-3 sentence honest, appealing description a buyer would want to read"}`,
          },
        ],
      }),
    });
    const data = await res.json();
    const raw = (data.content || []).map((b: { text?: string }) => b.text || "").join("").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't reach the AI writer right now." }, { status: 502 });
  }
}
