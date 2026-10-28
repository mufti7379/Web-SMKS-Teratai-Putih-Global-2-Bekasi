import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type Turn = { role: "user" | "assistant"; content: string };

// Mirrors ChatTurn in backend/routers/assistant.py: longer turns are rejected with a 422.
const maxTurnLength = 2000;
const unavailableReply = "Maaf, asisten sedang tidak tersedia. Silakan coba lagi nanti.";

/**
 * Floating visitor chat, answered by /api/assistant/chat (DeepSeek, grounded in published CMS
 * content). The backend is stateless and streams plain text, so the conversation lives here.
 */
export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Keep the newest text in view while an answer streams in.
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [turns, open]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const history: Turn[] = [...turns, { role: "user", content: text }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      // An odd count keeps the window starting on a user turn, which the backend requires.
      const messages = history.slice(-19).map((turn) => ({ ...turn, content: turn.content.slice(0, maxTurnLength) }));
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok || !res.body) throw new Error(`chat failed with ${res.status}`);
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let received = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        received = true;
        setTurns((current) => [...current.slice(0, -1), { role: "assistant", content: current[current.length - 1].content + value }]);
      }
      // An empty turn would fail validation on every later message, so it never stays empty.
      if (!received) throw new Error("empty reply");
    } catch {
      setTurns((current) => [...current.slice(0, -1), { role: "assistant", content: unavailableReply }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="Buka asisten virtual" className="fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#0f4c81] text-white shadow-lg shadow-blue-900/25 transition-colors hover:bg-[#092c4c]" data-testid="chat-assistant-open">
        <MessageCircle className="size-6" />
      </button>
    );
  }

  // z-40 sits under the home page's popups (z-50) and the gallery lightbox (z-[60]).
  return (
    <section aria-label="Asisten virtual" className="fixed bottom-4 right-4 z-40 flex h-[min(520px,calc(100dvh_-_2rem))] w-[min(380px,calc(100vw_-_2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" data-testid="chat-assistant-panel">
      <header className="flex items-center justify-between bg-[#092c4c] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-bold">Asisten Virtual</p>
          <p className="text-xs text-white/70">SMK Teratai Putih Global 2</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup asisten virtual" className="rounded-full p-1.5 transition-colors hover:bg-white/10" data-testid="chat-assistant-close">
          <X className="size-4" />
        </button>
      </header>
      <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-slate-600">Jangan tulis data pribadi (nama lengkap, NIK, no. HP) di sini.</p>
      {/* data-lenis-prevent: the home page's smooth scroll would otherwise swallow the wheel here. */}
      <div ref={messagesRef} data-lenis-prevent className="flex-1 space-y-2 overflow-y-auto p-4 text-sm" data-testid="chat-assistant-messages">
        <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-slate-800">Halo! Ada yang bisa saya bantu? Tanyakan soal jurusan, fasilitas, agenda, atau pendaftaran (PPDB).</p>
        {turns.map((turn, index) => (
          <p key={index} className={`w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${turn.role === "user" ? "ml-auto rounded-tr-sm bg-[#0f4c81] text-white" : "rounded-tl-sm bg-slate-100 text-slate-800"}`}>
            {turn.content.trim() || "…"}
          </p>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
        {/* text-base on phones: iOS zooms the page into any focused input under 16px. */}
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={maxTurnLength} placeholder="Tulis pertanyaan…" aria-label="Pertanyaan" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base outline-none transition-colors focus:border-[#0f4c81] sm:text-sm" data-testid="chat-assistant-input" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Kirim" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0f4c81] text-white transition-colors hover:bg-[#092c4c] disabled:opacity-50" data-testid="chat-assistant-send">
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
