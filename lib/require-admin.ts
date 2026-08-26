import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the current request is from a signed-in admin.
 * Returns the user id on success, or null (caller should 403) on failure.
 * This is a real server-side check against the `profiles.role` column —
 * there is no client-side password gate anywhere in this app.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user.id;
}
