import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { listing_id, body } = await req.json();
  if (!listing_id || !body?.trim()) {
    return NextResponse.json({ error: "Missing listing_id or body." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ listing_id, sender_id: user.id, body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
