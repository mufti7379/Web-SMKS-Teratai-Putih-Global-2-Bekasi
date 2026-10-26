import type { MouseEventHandler } from "react";
import { ArrowRight, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { optimizeImageUrl } from "@/lib/images";
import { formatNewsDate } from "@/lib/news";
import type { CMSItem } from "@/lib/cms";

type NewsCardProps = {
  item: CMSItem;
  /** The article's URL — newsPath(item, allNews), which needs the whole list to keep slugs unique. */
  to: string;
  /** h3 under a section heading (home page), h2 directly under the page title (news index). */
  headingAs?: "h2" | "h3";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "data-testid"?: string;
};

/**
 * News teaser card used everywhere news is listed: photo + category, title, excerpt,
 * "Lihat Berita". Deliberately static — no hover motion, only colour/shadow feedback on
 * hover. The home page's news section wraps it in a scroll-linked StaggerRise.
 */
export function NewsCard({ item, to, headingAs: Heading = "h3", onClick, "data-testid": testId }: NewsCardProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group flex h-full flex-col rounded-2xl bg-white p-3 shadow-[0_10px_40px_-18px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 transition-shadow hover:shadow-[0_18px_50px_-18px_rgba(15,23,42,.35)]"
      data-testid={testId}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-[#0f4c81] to-[#092c4c]">
        {item.image_url
          ? <img src={optimizeImageUrl(item.image_url, 600) ?? item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
          : <span className="flex h-full items-center justify-center text-white/25"><Newspaper size={44} /></span>}
        {item.badge && <span className="absolute left-3 top-3 rounded-full bg-[#061e34]/75 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm" data-testid="news-card-category">{item.badge}</span>}
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatNewsDate(item.date)}</span>
        <Heading className="mt-1.5 line-clamp-2 font-heading text-lg font-extrabold leading-snug text-slate-900">{item.title}</Heading>
        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-500">{item.description}</p>
        {/* A span, not a button: the whole card is already the link. */}
        <span className="mt-auto pt-5"><span className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0a2540] text-sm font-bold text-white transition-colors group-hover:bg-[#0f4c81]">Lihat Berita <ArrowRight size={16} /></span></span>
      </div>
    </Link>
  );
}
