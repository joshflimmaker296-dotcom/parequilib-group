import { createClient } from "@/lib/supabase/server";
import { stripe, PLATFORM_FEE_RATE } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { listing_id } = await req.json();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, price, seller_id, status")
    .eq("id", listing_id)
    .single();

  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "This listing is no longer available." }, { status: 400 });
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
  }
  if (listing.price <= 0) {
    return NextResponse.json({ error: "This listing is free — no checkout needed." }, { status: 400 });
  }

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", listing.seller_id)
    .single();

  if (!sellerProfile?.stripe_onboarded || !sellerProfile.stripe_account_id) {
    return NextResponse.json(
      { error: "This seller hasn't finished setting up payouts yet." },
      { status: 400 }
    );
  }

  const amountCents = Math.round(Number(listing.price) * 100);
  const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: listing.title },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: sellerProfile.stripe_account_id },
    },
    metadata: {
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      platform_fee: String(feeCents / 100),
    },
    success_url: `${origin}/listing/${listing.id}?purchased=1`,
    cancel_url: `${origin}/listing/${listing.id}`,
  });

  return NextResponse.json({ url: session.url });
}
