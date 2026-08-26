import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { listing_id, amount } = await req.json();
  if (!listing_id || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Missing listing_id or a valid amount." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("offers")
    .insert({ listing_id, buyer_id: user.id, amount: Number(amount) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
