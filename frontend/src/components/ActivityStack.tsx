import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Expand, ExternalLink, Images, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export type ActivityItem = {
  key: string;
  title: string;
  description: string;
  /** Still for the card and thumbnail. */
  image: string | null;
  /** Bigger still for "Lihat lebih besar". */
  fullImage: string | null;
  video: { type: "youtube" | "drive" | "file"; src: string } | null;
  link: string | null;
  /** Set when the card stands for a whole album: its page, and its photo count once known. */
  album: { href: string; count: number | null } | null;
};

const kindLabel = (item: ActivityItem) => (item.album ? "Album foto" : item.video ? "Video kegiatan" : "Foto kegiatan");

type ActivityStackProps = {
  items: ActivityItem[];
  onPlay: (item: ActivityItem) => void;
  onZoom: (item: ActivityItem) => void;
};

/** How many cards show behind the front one. */
const BEHIND = 3;

// Where a card `depth` places behind the front one sits: alternately left and right, tilted,
// a little lower and smaller — so the pile zigzags.
function pose(depth: number) {
  if (depth === 0) return { x: "0%", y: "0%", rotate: 0, scale: 1 };
  const side = depth % 2 === 1 ? -1 : 1;
  return { x: `${side * (4 + depth * 3)}%`, y: `${depth * 2.5}%`, rotate: side * (3 + depth * 1.5), scale: 1 - depth * 0.05 };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Loading placeholder in the stack's shape: a tilted pile on the left, text lines on the right. */
export function ActivityStackSkeleton() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16" data-testid="activity-stack-loading">
      <div className="py-6">
        <div className="relative mx-auto aspect-[4/3] w-[84%]">
          {[2, 1, 0].map((depth) => {
            const { x, y, rotate, scale } = pose(depth);
            return <Skeleton key={depth} className={`absolute inset-0 rounded-3xl ring-4 ring-white ${depth === 0 ? "bg-slate-300/80" : ""}`} style={{ transform: `translate(${x}, ${y}) rotate(${rotate}deg) scale(${scale})`, zIndex: 10 - depth }} />;
          })}
        </div>
      </div>
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-6 h-2.5 w-28" />
        <Skeleton className="mt-3 h-8 w-3/4" />
        <Skeleton className="mt-5 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-7 h-11 w-44 rounded-full" />
      </div>
    </div>
  );
}

/**
 * The home page's activity gallery as a zigzag pile of photo cards — albums and single
 * activities — with a detail panel beside it. Clicking the front card brings up the next one, clicking a card peeking out from behind
 * jumps to it, a horizontal swipe works too, and it loops. On first scroll into view the pile slides
 * in from the left and the detail panel from the right.
 */
export function ActivityStack({ items, onPlay, onZoom }: ActivityStackProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const count = items.length;
  const position = Math.min(index, count - 1);
  const current = items[position];
  const go = (delta: number) => setIndex((value) => (value + delta + count) % count);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  // A swipe ends with a click on whatever card was under the finger — ignore that one.
  const swallowClick = useRef(false);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16" data-testid="activity-stack">
      <motion.div className="py-6" initial={reduceMotion ? false : { opacity: 0, x: -80 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ type: "spring", stiffness: 200, damping: 24 }}>
        <div
          className="relative mx-auto aspect-[4/3] w-[84%] touch-pan-y select-none"
          onPointerDown={(event) => { swipe.current = { x: event.clientX, moved: false }; }}
          onPointerMove={(event) => { if (swipe.current && Math.abs(event.clientX - swipe.current.x) > 10) swipe.current.moved = true; }}
          onPointerUp={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start?.moved) return;
            swallowClick.current = true;
            const distance = event.clientX - start.x;
            if (Math.abs(distance) > 40) go(distance < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipe.current = null; }}
        >
          {items.map((item, cardPosition) => {
            const depth = (cardPosition - position + count) % count;
            const shown = depth <= BEHIND;
            return (
              <motion.button
                key={item.key}
                type="button"
                tabIndex={shown ? 0 : -1}
                aria-hidden={!shown}
                aria-label={depth === 0 ? (count > 1 ? `${item.title} — tampilkan momen berikutnya` : item.title) : `Tampilkan ${item.title}`}
                onClick={() => {
                  if (swallowClick.current) { swallowClick.current = false; return; }
                  if (depth === 0) go(1);
                  else setIndex(cardPosition);
                }}
                initial={false}
                animate={{ ...pose(Math.min(depth, BEHIND)), opacity: shown ? 1 : 0 }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 28 }}
                style={{ zIndex: 20 - depth, pointerEvents: shown ? "auto" : "none" }}
                className={`absolute inset-0 overflow-hidden rounded-3xl bg-slate-200 shadow-[0_18px_40px_-18px_rgba(15,23,42,.45)] ring-4 ring-white ${count > 1 ? "cursor-pointer" : "cursor-default"}`}
                data-testid={`activity-card-${cardPosition + 1}`}
                data-depth={depth}
              >
                {/* Cards deep in the pile skip their image until they come near the front. */}
                {depth <= BEHIND + 1 && item.image
                  ? <img src={item.image} alt={item.title} draggable={false} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0f4c81] to-[#092c4c]">{item.album && <Images size={56} className="text-white/20" />}</span>}
                {item.album && <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#061e34]/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm"><Images size={12} /> Album{item.album.count ? ` · ${item.album.count} foto` : ""}</span>}
                {item.video && <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0f4c81] shadow"><Play size={16} fill="currentColor" /></span>}
              </motion.button>
            );
          })}
        </div>
        {count > 1 && <p className="mt-8 text-center text-xs text-slate-400">Klik kartu untuk melihat momen berikutnya</p>}
      </motion.div>

      <motion.div data-testid="activity-detail" initial={reduceMotion ? false : { opacity: 0, x: 80 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}>
        <p className="font-heading text-sm font-bold tabular-nums text-slate-400" aria-live="polite"><span className="text-4xl font-extrabold text-[#0a3358]" data-testid="activity-detail-counter">{pad(position + 1)}</span> / {pad(count)}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-600">{kindLabel(current)}</p>
            <h3 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-[#0a3358] sm:text-3xl" data-testid="activity-detail-title">{current.title}</h3>
            {current.description && <p className="mt-4 text-sm leading-relaxed text-slate-600" data-testid="activity-detail-description">{current.description}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              {current.album
                ? <Link to={current.album.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0f4c81] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#0a3358]" data-testid="activity-detail-album">Buka album <ArrowUpRight size={15} /></Link>
                : current.video
                ? <button type="button" onClick={() => onPlay(current)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0f4c81] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#0a3358]" data-testid="activity-detail-play"><Play size={15} fill="currentColor" /> Putar video</button>
                : current.fullImage && <button type="button" onClick={() => onZoom(current)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0f4c81] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#0a3358]" data-testid="activity-detail-zoom"><Expand size={15} /> Lihat lebih besar</button>}
              {current.link && <a href={current.link} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs font-extrabold text-[#0f4c81] transition-colors hover:text-emerald-600" data-testid="activity-detail-link">Buka tautan <ExternalLink size={14} /></a>}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
