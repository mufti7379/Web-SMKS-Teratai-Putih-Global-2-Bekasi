import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Send, X } from "lucide-react";

type Turn = { role: "user" | "assistant"; content: string };

// Mirrors ChatTurn in backend/routers/assistant.py: longer turns are rejected with a 422.
const maxTurnLength = 2000;
const unavailableReply = "Maaf, asisten sedang tidak tersedia. Silakan coba lagi nanti.";

/** Material Symbols "support_agent" (Rounded, Apache 2.0, github.com/google/material-design-icons) for the launcher. */
function SupportAgentIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M480-120q-17 0-28.5-11.5T440-160q0-17 11.5-28.5T480-200h280v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v204q0 17-11.5 28.5T160-240q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H480ZM360-400q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z" />
    </svg>
  );
}

/** Lilu's face beside the panel title and each of her replies. Decorative: her name is in the text. */
function LiluAvatar({ className }: { className: string }) {
  return <img src="/lilu-avatar.png" alt="" aria-hidden="true" className={`shrink-0 rounded-full bg-white object-cover ${className}`} />;
}

const urlPattern = /https?:\/\/[^\s<>"]+/g;

/** Drops sentence punctuation the URL match swallowed, e.g. "(https://wa.me/62…)." keeps only the link. */
function trimUrl(url: string) {
  let end = url.length;
  while (end > 0) {
    const char = url[end - 1];
    // A ")" belongs to the URL only when it closes one opened inside it (Wikipedia-style links).
    if (".,;:!?'".includes(char) || (char === ")" && !url.slice(0, end).includes("("))) end--;
    else break;
  }
  return url.slice(0, end);
}

/** Lilu replies in plain text; the WhatsApp link and search sources in it become clickable. */
function LinkifiedText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(urlPattern)) {
    const url = trimUrl(match[0]);
    parts.push(text.slice(last, match.index), <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-[#0f4c81] underline underline-offset-2 hover:text-[#092c4c]">{url}</a>);
    last = match.index + url.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

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
        <SupportAgentIcon className="size-7" />
      </button>
    );
  }

  // z-40 sits under the home page's popups (z-50) and the gallery lightbox (z-[60]).
  return (
    <section aria-label="Asisten virtual" className="fixed bottom-4 right-4 z-40 flex h-[min(520px,calc(100dvh_-_2rem))] w-[min(380px,calc(100vw_-_2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" data-testid="chat-assistant-panel">
      <header className="flex items-center justify-between bg-[#092c4c] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <LiluAvatar className="size-10 ring-2 ring-white/20" />
          <div>
            <p className="text-sm font-bold">Lilu</p>
            <p className="text-xs text-white/70">SMK Teratai Putih Global 2</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup asisten virtual" className="rounded-full p-1.5 transition-colors hover:bg-white/10" data-testid="chat-assistant-close">
          <X className="size-4" />
        </button>
      </header>
      <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-slate-600">Jangan tulis data pribadi (nama lengkap, NIK, no. HP) di sini.</p>
      {/* data-lenis-prevent: the home page's smooth scroll would otherwise swallow the wheel here. */}
      <div ref={messagesRef} data-lenis-prevent className="flex-1 space-y-2 overflow-y-auto p-4 text-sm" data-testid="chat-assistant-messages">
        <div className="flex items-start gap-2">
          <LiluAvatar className="size-8 ring-1 ring-slate-200" />
          <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-slate-800">Halo, selamat datang! Saya Lilu sebagai asisten virtual SMK Teratai Putih Global 2 Bekasi yang siap membantu Bapak/Ibu dan calon siswa mencari informasi tambahan seputar jurusan, fasilitas, agenda, maupun pendaftaran SPMB. Silakan tuliskan pertanyaan Anda.</p>
        </div>
        {turns.map((turn, index) => turn.role === "user"
          ? <p key={index} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#0f4c81] px-3 py-2 text-white">{turn.content}</p>
          : (
            <div key={index} className="flex items-start gap-2">
              <LiluAvatar className="size-8 ring-1 ring-slate-200" />
              <p className="w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-slate-800">{turn.content.trim() ? <LinkifiedText text={turn.content.trim()} /> : "…"}</p>
            </div>
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
