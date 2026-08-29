import { requireAdmin } from "@/lib/require-admin";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const supabase = createServiceClient();

  const [
    { count: listingCount },
    { count: userCount },
    { data: listingsData },
    { data: ordersData },
    { count: msgCount },
    { count: offerCount },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("price").eq("status", "active"),
    supabase.from("orders").select("amount, platform_fee").eq("status", "paid"),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("offers").select("*", { count: "exact", head: true }),
  ]);

  const listings = (listingsData ?? []) as { price: number }[];
  const orders = (ordersData ?? []) as { amount: number; platform_fee: number }[];

  const listedValue = listings.reduce((sum, l) => sum + Number(l.price), 0);
  const realizedRevenue = orders.reduce((sum, o) => sum + Number(o.platform_fee), 0);
  const realizedVolume = orders.reduce((sum, o) => sum + Number(o.amount), 0);

  return NextResponse.json({
    activeListings: listingCount || 0,
    registeredUsers: userCount || 0,
    listedValue,
    realizedVolume,
    realizedRevenue,
    messagesSent: msgCount || 0,
    offersMade: offerCount || 0,
  });
}
