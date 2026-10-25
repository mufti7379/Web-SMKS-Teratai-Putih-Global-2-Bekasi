import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { announcementKind, flipbookUrl } from "@/lib/announcements";
import { whatsappUrl } from "@/lib/contact";
import { optimizeImageUrl } from "@/lib/images";
import type { CMSItem } from "@/lib/cms";
import { cn } from "@/lib/utils";

type AnnouncementsProps = {
  /** Published announcements, in display order (see sortAnnouncements). */
  items: CMSItem[];
  /** This section's number in the home page's kicker sequence. */
  number: number;
  activeId: string | null;
  onSelect: (id: string) => void;
};

const buttonClass = "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-extrabold transition-all hover:-translate-y-0.5";

function ButtonArrow() {
  return <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />;
}

/** The flipbook, full card width; its cover image stands in until Heyzine has loaded. */
function FlipbookFrame({ src, cover, title }: { src: string; cover: string | null; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-[60vh] min-h-[340px] border-t border-white/10 bg-[#061e34] sm:h-[75vh] lg:max-h-[760px]" data-testid="announcement-flipbook">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          {cover && <img src={cover} alt="" aria-hidden="true" className="max-h-[70%] max-w-full rounded-lg object-contain opacity-50" />}
          <span className="text-xs font-bold text-slate-300">Memuat flipbook…</span>
        </div>
      )}
      <iframe src={src} title={`Flipbook: ${title}`} loading="lazy" allow="clipboard-write; fullscreen" allowFullScreen onLoad={() => setLoaded(true)} className={cn("absolute inset-0 h-full w-full border-0 transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")} data-testid="announcement-flipbook-frame" />
    </div>
  );
}

/**
 * The home page's Pengumuman card: every published announcement, one at a time behind a row
 * of tabs when there are several. Each shows its own picture, text and buttons — the SPMB
 * registration buttons only on SPMB announcements, plus "Lihat selengkapnya" when it has a link.
 * A Heyzine flipbook link is embedded under the text instead, so it's read without leaving the page.
 * Otherwise, on large screens the picture sits whole (never cropped) in a fixed frame over a
 * blurred copy of itself, so switching between a portrait poster and a wide banner doesn't
 * resize the card.
 */
export function Announcements({ items, number, activeId, onSelect }: AnnouncementsProps) {
  const reduceMotion = useReducedMotion();
  const active = items.find((item) => item.id === activeId) ?? items[0];
  const tabbed = items.length > 1;
  const isSpmb = announcementKind(active) === "spmb";
  const image = optimizeImageUrl(active.image_url, 1200);
  const flipbook = flipbookUrl(active.link);
  const buttonLink = flipbook ? null : active.link;
  const linkIsExternal = Boolean(buttonLink && /^https?:\/\//i.test(buttonLink));
  const imageHref = buttonLink ?? active.image_url?.trim();

  const heading = (
    <>
      <p className="section-kicker text-emerald-300">{String(number).padStart(2, "0")} · Pengumuman</p>
      {active.badge && <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-amber-400/15 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-amber-300"><Sparkles size={14} /> {active.badge}</span>}
      <h2 className="mt-5 font-heading text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="announcement-title">{active.title}</h2>
    </>
  );
  const description = (className: string) => active.description && <p className={cn("whitespace-pre-line text-sm leading-relaxed text-slate-300", className)} data-testid="announcement-description">{active.description}</p>;
  const buttons = (isSpmb || buttonLink) && (
    <div className="mt-6 flex flex-wrap gap-3">
      {isSpmb && (
        <>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={cn(buttonClass, "bg-amber-500 text-[#092c4c] hover:bg-amber-400")} data-testid="spmb-banner-cta-button">Daftar sekarang <ButtonArrow /></a>
          <a href="https://angket.smk-terataiputih2.sch.id" target="_blank" rel="noreferrer" className={cn(buttonClass, "bg-emerald-500 text-white hover:bg-emerald-400")} data-testid="spmb-banner-angket-button">Isi angket <ButtonArrow /></a>
        </>
      )}
      {buttonLink && <a href={buttonLink} target={linkIsExternal ? "_blank" : undefined} rel={linkIsExternal ? "noreferrer" : undefined} className={cn(buttonClass, isSpmb ? "border border-white/25 text-white hover:bg-white/10" : "bg-amber-500 text-[#092c4c] hover:bg-amber-400")} data-testid="announcement-link-button">Lihat selengkapnya <ButtonArrow /></a>}
    </div>
  );

  return (
    <Reveal className="overflow-hidden rounded-[1.75rem] bg-[#092c4c] text-white shadow-2xl" data-testid="announcement-card">
      {tabbed && (
        <div role="tablist" aria-label="Pilih pengumuman" className="flex gap-2 overflow-x-auto border-b border-white/10 px-5 py-4 [scrollbar-width:none] sm:px-7" data-testid="announcement-tabs">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`announcement-tab-${item.id}`}
              aria-selected={item.id === active.id}
              aria-controls="announcement-panel"
              onClick={() => onSelect(item.id)}
              className={cn("max-w-[15rem] shrink-0 truncate rounded-full px-4 py-2 text-xs font-bold transition-colors", item.id === active.id ? "bg-amber-400 text-[#092c4c]" : "bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white")}
              data-testid={`announcement-tab-${index + 1}`}
            >
              {item.badge || item.title}
            </button>
          ))}
        </div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active.id}
          id="announcement-panel"
          role={tabbed ? "tabpanel" : undefined}
          aria-labelledby={tabbed ? `announcement-tab-${active.id}` : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className={flipbook ? undefined : "grid lg:grid-cols-2"}
          data-testid="announcement-panel"
        >
          {flipbook ? (
            <>
              <div className="grid gap-x-12 p-7 sm:p-10 lg:grid-cols-[.9fr_1.1fr]">
                <div>{heading}{buttons}</div>
                {description("mt-4 lg:mt-0 lg:self-end")}
              </div>
              <FlipbookFrame src={flipbook} cover={image} title={active.title} />
            </>
          ) : (
            <>
              {image && imageHref ? (
                <a href={imageHref} target={buttonLink && !linkIsExternal ? undefined : "_blank"} rel="noreferrer" aria-label={buttonLink ? `Buka pengumuman ${active.title}` : `Lihat gambar ${active.title} ukuran penuh`} className="relative flex items-center justify-center overflow-hidden bg-[#061e34] lg:min-h-[460px]" data-testid="announcement-image-link">
                  <img src={image} alt="" aria-hidden="true" className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-40 blur-2xl lg:block" />
                  <img src={image} alt={active.title} className="relative h-auto max-h-[75vh] w-full object-contain lg:absolute lg:inset-0 lg:h-full lg:max-h-none lg:p-6" data-testid="announcement-image" />
                </a>
              ) : <div className="min-h-[220px] bg-gradient-to-br from-[#0f4c81] to-[#092c4c]" />}
              <div className="flex flex-col justify-center p-7 sm:p-10">
                {heading}
                {description("mt-2")}
                {buttons}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Reveal>
  );
}
