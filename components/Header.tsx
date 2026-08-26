"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = { name: string; avatar_url: string | null; role: string };

export default function Header({ activeSearch, onSearch }: { activeSearch?: string; onSearch?: (q: string) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url, role")
        .eq("id", user.id)
        .single();
      setProfile(data as Profile);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3 bg-bg/90 backdrop-blur border-b border-border">
      <Link href="/browse" className="font-display font-bold text-xl">
        Parequilib <span className="text-amber">Group</span>
      </Link>
      {onSearch && (
        <div className="flex-1 max-w-md flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
          <input
            className="bg-transparent border-none outline-none text-sm w-full text-text placeholder:text-textdim"
            placeholder="Search listings..."
            value={activeSearch}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      <div className="flex-1" />
      <Link href="/sell" className="btn btn-amber btn-sm">Sell</Link>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-xs font-bold text-amber overflow-hidden"
          style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})`, backgroundSize: "cover" } : {}}
        >
          {!profile?.avatar_url && (profile?.name?.charAt(0).toUpperCase() || "?")}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-11 bg-surface border border-border rounded-lg min-w-[170px] overflow-hidden shadow-xl text-sm">
            <Link href="/profile" className="block px-3.5 py-2.5 hover:bg-surface2" onClick={() => setMenuOpen(false)}>
              Edit profile
            </Link>
            {profile?.role === "admin" && (
              <Link href="/admin" className="block px-3.5 py-2.5 hover:bg-surface2" onClick={() => setMenuOpen(false)}>
                Admin panel
              </Link>
            )}
            <div className="px-3.5 py-2.5 hover:bg-surface2 cursor-pointer" onClick={logout}>
              Log out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
