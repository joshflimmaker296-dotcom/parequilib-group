"use client";

import { useState } from "react";
import Link from "next/link";

type Match = { id: string; title: string; price: number };
type ChatItem = { who: "user" | "ai"; text: string; matches?: Match[] };

export default function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<ChatItem[]>([
    { who: "ai", text: "Tell me what you're looking for — budget, use case, anything — and I'll find matches from current listings." },
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setLog((l) => [...l, { who: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLog((l) => [...l, { who: "ai", text: data.reply, matches: data.matches }]);
    } catch (e: any) {
      setLog((l) => [...l, { who: "ai", text: e.message || "Couldn't reach the assistant right now." }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 btn btn-mint rounded-full w-12 h-12 flex items-center justify-center text-lg shadow-lg"
      >
        ✨
      </button>
      {open && (
        <div className="fixed top-0 right-0 h-full w-[380px] max-w-[92vw] bg-surface border-l border-border z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-[17px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint shadow-[0_0_8px_#7EE8C0]" /> Shopping assistant
            </h3>
            <button onClick={() => setOpen(false)} className="text-textdim text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {log.map((m, i) => (
              <div key={i}>
                <div
                  className={`max-w-[88%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                    m.who === "user" ? "bg-amber text-[#20140A] ml-auto" : "bg-surface2"
                  }`}
                >
                  {m.text}
                </div>
                {m.matches?.map((match) => (
                  <Link
                    key={match.id}
                    href={`/listing/${match.id}`}
                    className="block mt-2 border border-border rounded-lg p-2.5 hover:border-mint text-sm"
                  >
                    <div className="font-medium">{match.title}</div>
                    <div className="font-mono text-amber text-xs">{match.price === 0 ? "Free" : `$${match.price}`}</div>
                  </Link>
                ))}
              </div>
            ))}
            {loading && <div className="text-textdim text-sm">Thinking...</div>}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. cheap desk for a small apartment"
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button onClick={send} className="btn btn-mint btn-sm">Send</button>
          </div>
        </div>
      )}
    </>
  );
}
