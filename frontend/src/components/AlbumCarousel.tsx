import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Expand, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type CarouselPhoto = { key: string; title: string; image: string | null; isVideo: boolean };

type AlbumCarouselProps = {
  photos: CarouselPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Open the current photo full screen. */
  onOpen: () => void;
};

// Signed distance from the current photo along a loop, so the last photo sits just left of the first.
function loopOffset(position: number, index: number, count: number) {
  let offset = position - index;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;
  return offset;
}

// Card width; the stage height is 3/4 of it (cards are 4:3 — school photos are landscape).
// Sized with SPREAD so the two outer cards still peek in at the edges of a desktop page.
const CARD = "w-[min(72vw,520px)]";
const STAGE_HEIGHT = "h-[calc(min(72vw,520px)*0.75)]";
/** How far each step out sits from the centre, as a share of the card width. */
const SPREAD = 62;
// Full-bleed strip that clips the cards at the page edges and fades them out there, with
// vertical room for the front card's shadow.
const STRIP = "-mx-5 overflow-hidden py-12 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] lg:-mx-8";

/** Loading placeholder in the carousel's shape: a front card with one on each side. */
export function AlbumCarouselSkeleton() {
  return (
    <div className={STRIP} data-testid="album-carousel-loading">
      <div className={`relative mx-auto ${STAGE_HEIGHT}`}>
        {[-1, 1, 0].map((offset) => (
          <Skeleton key={offset} className={`absolute inset-x-0 top-0 mx-auto aspect-[4/3] ${CARD} rounded-3xl ${offset === 0 ? "z-10 bg-slate-300/80" : ""}`} style={{ transform: `translateX(${offset * SPREAD}%) scale(${offset === 0 ? 1 : 0.82})` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Coverflow carousel: the current photo large in front, two on each side shrinking and tucked
 * behind it. Arrows, a click on a side photo, a horizontal swipe or the keyboard (handled by the
 * page) move it; it loops. A click on the front photo or the expand button opens it full screen.
 */
export function AlbumCarousel({ photos, index, onIndexChange, onOpen }: AlbumCarouselProps) {
  const reduceMotion = useReducedMotion();
  const count = photos.length;
  const go = (delta: number) => onIndexChange((index + delta + count) % count);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  // A swipe ends with a click on whatever card was under the finger — ignore that one.
  const swallowClick = useRef(false);

  return (
    <section aria-roledescription="carousel" aria-label="Foto album" data-testid="album-carousel">
      <div className={STRIP}>
        <div
          className={`relative mx-auto ${STAGE_HEIGHT} touch-pan-y select-none`}
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
          {photos.map((photo, position) => {
            const offset = loopOffset(position, index, count);
            const distance = Math.abs(offset);
            const onStage = distance <= 2;
            return (
              <motion.button
                key={photo.key}
                type="button"
                tabIndex={onStage ? 0 : -1}
                aria-hidden={!onStage}
                aria-label={offset === 0 ? `Perbesar ${photo.title}` : `Tampilkan ${photo.title}`}
                onClick={() => {
                  if (swallowClick.current) { swallowClick.current = false; return; }
                  if (offset === 0) onOpen();
                  else onIndexChange(position);
                }}
                initial={false}
                animate={{ x: `${offset * SPREAD}%`, scale: 1 - distance * 0.18, opacity: onStage ? 1 : 0 }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
                style={{ zIndex: 10 - distance, pointerEvents: onStage ? "auto" : "none" }}
                className={`absolute inset-x-0 top-0 mx-auto block aspect-[4/3] ${CARD} overflow-hidden rounded-3xl bg-slate-200 ${offset === 0 ? "cursor-zoom-in shadow-[0_18px_36px_-14px_rgba(15,23,42,.45)]" : "cursor-pointer shadow-[0_10px_24px_-12px_rgba(15,23,42,.35)]"}`}
                data-testid={`album-carousel-item-${position + 1}`}
                data-offset={offset}
              >
                {/* Only photos on or next to the stage load their image. */}
                {distance <= 3 && photo.image
                  ? <img src={photo.image} alt={photo.title} draggable={false} className="h-full w-full object-cover" />
                  : <span className="block h-full w-full bg-gradient-to-br from-[#0f4c81] to-[#092c4c]" />}
                {/* Side photos sit a little back in the shade. */}
                {offset !== 0 && <span className={`absolute inset-0 ${distance === 1 ? "bg-[#061e34]/15" : "bg-[#061e34]/30"}`} />}
                {photo.isVideo && <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#0f4c81] shadow"><Play size={14} fill="currentColor" /></span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => go(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-[#0f4c81] hover:text-[#0f4c81]" aria-label="Foto sebelumnya" data-testid="album-carousel-prev"><ArrowLeft size={16} /></button>
          <span className="min-w-16 text-center text-sm font-bold tabular-nums text-slate-500" aria-live="polite" data-testid="album-carousel-counter">{index + 1} / {count}</span>
          <button type="button" onClick={() => go(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-[#0f4c81] hover:text-[#0f4c81]" aria-label="Foto berikutnya" data-testid="album-carousel-next"><ArrowRight size={16} /></button>
        </div>
        <button type="button" onClick={onOpen} className="justify-self-end rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0f4c81]" aria-label="Lihat layar penuh" title="Lihat layar penuh" data-testid="album-carousel-expand"><Expand size={22} /></button>
      </div>
    </section>
  );
}
