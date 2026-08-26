import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listing_id, buyer_id, seller_id, platform_fee } = session.metadata || {};

    if (listing_id && buyer_id && seller_id) {
      const supabase = createServiceClient();

      await supabase.from("orders").insert({
        listing_id,
        buyer_id,
        seller_id,
        amount: (session.amount_total || 0) / 100,
        platform_fee: Number(platform_fee || 0),
        stripe_session_id: session.id,
        status: "paid",
      });

      await supabase.from("listings").update({ status: "sold" }).eq("id", listing_id);
    }
  }

  // Track when a seller finishes Connect onboarding
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.details_submitted && account.charges_enabled) {
      const supabase = createServiceClient();
      await supabase
        .from("profiles")
        .update({ stripe_onboarded: true })
        .eq("stripe_account_id", account.id);
    }
  }

  return NextResponse.json({ received: true });
}
