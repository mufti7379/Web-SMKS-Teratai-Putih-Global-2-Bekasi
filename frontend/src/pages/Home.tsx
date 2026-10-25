import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Code2,
  GraduationCap,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  Play,
  Quote,
  TrendingUp,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AcademicCalendar, AcademicCalendarSkeleton } from "@/components/AcademicCalendar";
import { NewsCard } from "@/components/NewsCard";
import { SiteFooter } from "@/components/SiteFooter";
import { BannerSkeleton, FacilitySkeletons, MajorsSkeleton, NewsCardSkeletons, PartnerSkeletons } from "@/components/HomeSkeletons";
import { ActivityStack, ActivityStackSkeleton } from "@/components/ActivityStack";
import { Announcements } from "@/components/Announcements";
import type { ActivityItem } from "@/components/ActivityStack";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, ClipReveal } from "@/components/motion/Reveal";
import { Typewriter } from "@/components/motion/Typewriter";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { apiGet, apiPost } from "@/lib/api";
import { announcementKind, sortAnnouncements } from "@/lib/announcements";
import { optimizeImageUrl, buildDriveSrcSet } from "@/lib/images";
import { albumDriveFolders, albumOf, albumPhotosQuery, galleryMedia, galleryQuery, galleryStill, isInAlbum, isSinglePhoto, listAlbums } from "@/lib/gallery";
import { newsPath, newsQuery, sortNewsNewestFirst } from "@/lib/news";
import { takePreloadedHero } from "@/lib/preload";
import type { CMSItem, Lead } from "@/lib/cms";
import { toast } from "sonner";

type Major = {
  code: string;
  name: string;
  badge: string;
  tagline: string;
  skills: string[];
  careers: string[];
  image: string | null;
  icon: typeof Code2;
};

const navItems = [
  ["Beranda", "#beranda"], ["Profil", "#profil"], ["Jurusan", "#jurusan"], ["Fasilitas", "#fasilitas"], ["Agenda", "#berita"], ["Berita", "#berita-terkini"], ["Galeri", "#galeri"], ["Kontak", "#kontak"],
] as const;

// Shown when a section's CMS content has loaded but is empty (or failed to load).
const emptyStateClass = "col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400";

const majorIcons: Record<string, typeof Code2> = { RPL: Code2, DKV: Palette, BD: TrendingUp, MP: BriefcaseBusiness, AKL: Calculator };
const homeNewsLimit = 6;
// Hero heading, typed in turn on a loop. Module-level so its identity never changes.
const heroPhrases = ["SMK Teratai Putih Global 2", "Sekolah berbasis Islami dan Teknologi"] as const;

export default function Home() {
  const lenisRef = useLenisScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const [selectedMajorCode, setSelectedMajorCode] = useState("RPL");
  const [isPpdbOpen, setIsPpdbOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [galleryVideo, setGalleryVideo] = useState<{ type: "youtube" | "drive" | "file"; src: string; title: string } | null>(null);
  const [facilityLightbox, setFacilityLightbox] = useState<{ image: string; title: string; desc: string } | null>(null);
  const bannerContent = useQuery({ queryKey: ["public-content", "banner"], queryFn: () => apiGet<CMSItem[]>("/content/banner"), retry: false });
  const announcements = sortAnnouncements(bannerContent.data);
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  useEffect(() => {
    const anyModalOpen = isPpdbOpen || isVideoOpen || Boolean(galleryVideo) || Boolean(facilityLightbox);
    if (!anyModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isPpdbOpen) setIsPpdbOpen(false);
      if (isVideoOpen) setIsVideoOpen(false);
      if (galleryVideo) setGalleryVideo(null);
      if (facilityLightbox) setFacilityLightbox(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPpdbOpen, isVideoOpen, galleryVideo, facilityLightbox]);
  const heroContent = useQuery({ queryKey: ["public-content", "hero"], queryFn: async () => (await takePreloadedHero()) ?? apiGet<CMSItem[]>("/content/hero"), retry: false });
  const profileContent = useQuery({ queryKey: ["public-content", "profile"], queryFn: () => apiGet<CMSItem[]>("/content/profile"), retry: false });
  const facilityContent = useQuery({ queryKey: ["public-content", "facility"], queryFn: () => apiGet<CMSItem[]>("/content/facility"), retry: false });
  const majorContent = useQuery({ queryKey: ["public-content", "major"], queryFn: () => apiGet<CMSItem[]>("/content/major"), retry: false });
  const galleryContent = useQuery(galleryQuery);
  const agendaContent = useQuery({ queryKey: ["public-content", "agenda"], queryFn: () => apiGet<CMSItem[]>("/content/agenda"), retry: false });
  const newsContent = useQuery(newsQuery);
  const partnerContent = useQuery({ queryKey: ["public-content", "partner"], queryFn: () => apiGet<CMSItem[]>("/content/partner"), retry: false });
  const displayPartners = (partnerContent.data ?? []).filter((item) => item.image_url);
  // Kerja Sama and SPMB only render when they have content (and as skeletons while it is
  // still loading), so number the later kickers to match.
  const showPartners = partnerContent.isPending || displayPartners.length > 0;
  const showBanner = bannerContent.isPending || announcements.length > 0;
  const spmbNumber = showPartners ? 8 : 7;
  const contactNumber = spmbNumber + (showBanner ? 1 : 0);
  const displayMajors: Major[] = (majorContent.data ?? []).map((item) => ({ code: item.code ?? "PROG", name: item.title, badge: item.badge ?? "Program Keahlian", tagline: item.description, skills: item.skills, careers: item.careers, image: optimizeImageUrl(item.image_url, 700), icon: majorIcons[item.code ?? ""] ?? GraduationCap }));
  const selectedMajor = displayMajors.find((major) => major.code === selectedMajorCode) ?? displayMajors[0] ?? null;
  const galleryItems = galleryContent.data ?? [];
  const stillOf = (url: string, width: number) => galleryStill(galleryMedia(url), width);
  // The activity stack: gallery items not filed under an album (those live on /galeri/<slug>).
  const activityItems: ActivityItem[] = galleryItems.filter((item) => !albumOf(item)).map((item) => {
    const media = item.image_url ? galleryMedia(item.image_url) : null;
    // Drive files play in Drive's preview here (this grid has always used them for videos);
    // folder entries never get here — they always belong to an album.
    const video = media?.kind === "youtube" ? { type: media.kind, src: media.id } : media?.kind === "drive" ? { type: media.kind, src: media.player } : media?.kind === "file" ? { type: media.kind, src: media.src } : null;
    return {
      key: item.id,
      title: item.title,
      description: item.description,
      image: item.image_url ? stillOf(item.image_url, 900) : null,
      fullImage: item.image_url ? stillOf(item.image_url, 1600) : null,
      video,
      link: item.link,
      album: null,
    };
  });
  // Albums lead the stack (featured ones show even before their first photo exists). Count and
  // cover include the album's Drive folders, which come first on the album page too.
  const albumList = listAlbums(galleryItems);
  const albumDrivePhotos = useQueries({ queries: albumList.map((album) => albumPhotosQuery(album.slug, albumDriveFolders(album.slug, galleryItems).length > 0)) });
  const albumItems: ActivityItem[] = albumList.map((album, index) => {
    const drive = albumDrivePhotos[index];
    const driveFiles = drive?.data ?? [];
    const photos = galleryItems.filter((item) => isSinglePhoto(item) && isInAlbum(item, album.slug));
    const cover = driveFiles[0] ? optimizeImageUrl(driveFiles[0].src, 900) : photos.map((item) => stillOf(item.image_url ?? "", 900)).find(Boolean) ?? null;
    // Unknown while the Drive folder is still being read — don't flash "0 foto" meanwhile.
    const count = drive?.isLoading ? null : driveFiles.length + photos.length;
    // The admin's "Keterangan" on the album's Drive entry, if one was written.
    const note = galleryItems.find((item) => isInAlbum(item, album.slug) && !isSinglePhoto(item) && item.description)?.description;
    return {
      key: `album-${album.slug}`,
      title: `Galeri ${album.name}`,
      description: note || (count === null ? `Kumpulan foto ${album.name}.` : count > 0 ? `Kumpulan ${count} foto ${album.name}.` : "Foto untuk album ini segera kami tambahkan."),
      image: cover,
      fullImage: null,
      video: null,
      link: null,
      album: { href: `/galeri/${album.slug}`, count },
    };
  });
  const stackItems = [...albumItems, ...activityItems];
  // Only the latest few here — the full, paginated list lives at /berita.
  const allNews = sortNewsNewestFirst(newsContent.data);
  const displayNews = allNews.slice(0, homeNewsLimit);
  const heroImages = (heroContent.data ?? []).map((item) => optimizeImageUrl(item.image_url, 960)).filter((url): url is string => Boolean(url));
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const interval = setInterval(() => setHeroIndex((current) => (current + 1) % heroImages.length), 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);
  // Until the CMS answers the hero stays plain navy (with a soft pulse) — never a stock photo.
  const heroImage = heroImages[heroIndex % heroImages.length] ?? null;
  const displayFacilities = (facilityContent.data ?? []).map((item) => ({ image: optimizeImageUrl(item.image_url, 700), title: item.title, desc: item.description }));
  const profileMainItem = profileContent.data?.find((item) => item.code === "utama") ?? profileContent.data?.[0];
  const profileSecondaryItem = profileContent.data?.find((item) => item.code === "sekunder") ?? profileContent.data?.[1];
  const profileMainImage = optimizeImageUrl(profileMainItem?.image_url, 700);
  const profileMainAlt = profileMainItem?.title ?? "Aktivitas siswa di lingkungan sekolah";
  const profileSecondaryImage = optimizeImageUrl(profileSecondaryItem?.image_url, 700);
  const profileSecondaryAlt = profileSecondaryItem?.title ?? "Siswa berkegiatan di ruang praktik bisnis digital";
  const MajorIcon = selectedMajor?.icon ?? GraduationCap;
  const createLead = useMutation({ mutationFn: (payload: { kind: "ppdb" | "contact"; name: string; phone: string; major?: string; question?: string; source: "website" }) => apiPost<Lead>("/leads", payload), onSuccess: (_lead, variables) => { if (variables.kind === "ppdb") setIsPpdbOpen(false); toast.success(variables.kind === "ppdb" ? "Terima kasih! Data SPMB tersimpan dan tim kami akan menghubungi Anda." : "Pertanyaan tersimpan. Tim sekolah akan segera menindaklanjuti."); }, onError: () => toast.error("Data belum tersimpan. Silakan coba kembali.") });

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroParallaxY = useTransform(heroScrollProgress, [0, 1], ["0%", "18%"]);

  const scrollTo = (href: string) => {
    const target = document.querySelector<HTMLElement>(href);
    if (target && lenisRef.current) lenisRef.current.scrollTo(target, { offset: -76 });
    else target?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };
  // The header's SPMB button lands on the SPMB announcement, even when another one is showing.
  const openSpmbAnnouncement = () => {
    const spmb = announcements.find((item) => announcementKind(item) === "spmb");
    if (spmb) setAnnouncementId(spmb.id);
    scrollTo("#spmb");
  };

  // Coming back from a news article lands on "/#berita-terkini" — jump straight to that
  // section instead of making the visitor scroll down from the hero again.
  useEffect(() => {
    const target = window.location.hash ? document.querySelector<HTMLElement>(window.location.hash) : null;
    if (target && lenisRef.current) lenisRef.current.scrollTo(target, { offset: -76, immediate: true });
    else target?.scrollIntoView();
  }, [lenisRef]);

  const navigate = useNavigate();
  // Re-point this history entry at the news section before the article pushes, so the
  // browser's back button also returns to the news grid. Modified clicks open a new tab
  // and leave this page alone.
  const rememberNewsSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    navigate("/#berita-terkini", { replace: true });
  };

  const submitPpdb = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createLead.mutate({ kind: "ppdb", name: String(data.get("student")), phone: String(data.get("whatsapp")), major: String(data.get("major")), source: "website" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" data-testid="school-website-shell">
      <Toaster position="top-right" richColors />

      <header className={`sticky z-40 backdrop-blur-xl transition-all duration-300 ${headerScrolled ? "top-[10px] mx-5 rounded-2xl border border-white/40 bg-slate-200/60 shadow-lg" : "top-0 mx-0 rounded-none border-b border-slate-200/80 bg-white/95 shadow-sm"}`} data-testid="site-header">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button type="button" className="flex items-center gap-3 text-left" onClick={() => scrollTo("#beranda")} data-testid="school-brand-button">
            <img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-blue-900/15" />
            <span className="hidden sm:block"><span className="block font-heading text-[15px] font-extrabold leading-tight text-[#0a3358]">SMK TERATAI PUTIH</span><span className="mt-0.5 block text-[10px] font-bold tracking-[0.18em] text-emerald-600">GLOBAL 2 BEKASI</span></span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama" data-testid="desktop-navigation">
            {navItems.map(([label, href]) => <button type="button" key={href} onClick={() => scrollTo(href)} className="inline-block text-[13px] font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-[#0f4c81]" data-testid={`nav-link-${label.toLowerCase()}`}>{label}</button>)}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={openSpmbAnnouncement} className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-all hover:-translate-y-0.5 hover:bg-amber-100 sm:gap-2 sm:px-4 sm:py-2" data-testid="header-spmb-link"><GraduationCap size={15} /> SPMB</button>
            <a href="https://s.id/DGB-TERPUT" target="_blank" rel="noreferrer" className="group flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-[#092c4c] shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-400 sm:gap-2 sm:px-5 sm:py-2.5" data-testid="header-guestbook-link"><span className="hidden min-[400px]:inline">Buku Tamu Digital</span><span className="min-[400px]:hidden">Buku Tamu</span> <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" /></a>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl p-2 text-[#0a3358] lg:hidden" aria-label="Buka menu" data-testid="mobile-menu-toggle">{mobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden" data-testid="mobile-navigation">
            {navItems.map(([label, href]) => <button type="button" key={href} onClick={() => scrollTo(href)} className="block w-full border-b border-slate-100 py-3 text-left text-sm font-bold text-slate-700" data-testid={`mobile-nav-link-${label.toLowerCase()}`}>{label}</button>)}
          </motion.nav>}
        </AnimatePresence>
      </header>

      <main>
        <section id="beranda" ref={heroRef} className="relative isolate overflow-hidden bg-[#092c4c]" data-testid="hero-section">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div style={{ y: heroParallaxY }} className="absolute inset-x-0 -top-[14%] h-[128%] w-full">
              <AnimatePresence mode="wait">
                {heroImage && <motion.img key={heroImage} src={heroImage} srcSet={buildDriveSrcSet(heroImage, [640, 960, 1400])} sizes="100vw" alt="Siswa SMK belajar bersama" fetchPriority="high" decoding="async" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="h-full w-full object-cover" />}
              </AnimatePresence>
            </motion.div>
            {heroContent.isPending && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0f4c81]/60 to-[#092c4c]" data-testid="hero-loading" />}
            <div className="absolute inset-0 bg-gradient-to-b from-[#092c4c]/80 via-[#092c4c]/45 to-[#092c4c]/85" />
            {heroImages.length > 1 && <div className="absolute right-5 top-24 z-10 flex gap-1.5 sm:right-8" data-testid="hero-carousel-dots">{heroImages.map((url, index) => <span key={url} className={`h-1.5 rounded-full transition-all ${index === heroIndex ? "w-5 bg-amber-300" : "w-1.5 bg-white/40"}`} />)}</div>}
          </div>
          <div className="relative mx-auto flex min-h-[690px] max-w-7xl flex-col justify-center gap-10 px-5 py-16 lg:px-8 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 190, damping: 26 }} className="relative z-10 mx-auto max-w-5xl text-center" data-testid="hero-copy">
              {/* Sizes picked so both rotating phrases take the same number of lines at every width
                  (2 on phones via the 300px cap, 1 from sm up) — no empty line while the short one shows. */}
              <h1 className="mx-auto max-w-[300px] font-heading text-[30px] font-normal leading-[1.08] tracking-tight text-white sm:max-w-none sm:text-[34px] md:text-[40px] lg:text-5xl xl:text-6xl" data-testid="hero-heading"><Typewriter phrases={heroPhrases} /></h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg" data-testid="hero-description">Kurikulum berbasis industri, lingkungan belajar yang suportif, dan lima program keahlian untuk membekali setiap siswa menghadapi masa depan.</p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => setIsVideoOpen(true)} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/10" data-testid="hero-profile-video-button"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:scale-110"><Play size={12} fill="currentColor" /></span> Lihat profil sekolah</button>
              </div>
            </motion.div>
          </div>
          <svg className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 w-full sm:h-14" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <path d="M0,64 C240,112 480,16 720,64 C960,112 1200,16 1440,64 L1440,120 L0,120 Z" fill="#f8fafc" />
          </svg>
        </section>

        <section className="relative" data-testid="value-props-section">
          <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 sm:-mt-14 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "5", label: "Program Keahlian", desc: "Pilihan sesuai potensimu", tone: "emerald" },
                { value: "Proyek", label: "Berbasis Industri", desc: "Belajar dari praktik nyata", tone: "navy" },
                { value: "3", label: "Jalur Masa Depan", desc: "Kerja, kuliah, dan usaha", tone: "emerald" },
                { value: "Aktif", label: "Pembinaan Karakter", desc: "Tumbuh dengan nilai positif", tone: "navy" },
              ].map((item, index) => (
                <Reveal key={item.label} delay={index * 100} className="rounded-2xl bg-white p-6 text-center shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/70" data-testid={`value-prop-${index + 1}`}>
                  <strong className={`block font-heading text-3xl font-extrabold ${item.tone === "emerald" ? "text-emerald-700" : "text-[#0a3358]"}`}>{item.value}</strong>
                  <span className="mt-2 block text-sm font-extrabold text-[#0a3358]">{item.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{item.desc}</span>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="h-4" />
        </section>

        <section id="profil" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16" data-testid="profile-section">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="relative mx-auto w-full max-w-md" data-testid="profile-media">
              <span className="absolute -left-4 -top-4 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#0f4c81] text-white shadow-lg shadow-blue-900/25"><GraduationCap size={26} /></span>
              {profileContent.isPending ? <Skeleton className="aspect-[4/5] rounded-[2rem]" /> : <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-100">{profileMainImage && <img src={profileMainImage} alt={profileMainAlt} className="h-full w-full object-cover" />}</div>}
              {profileContent.isPending ? <div className="absolute -bottom-8 -right-4 aspect-square sm:-right-6 w-[48%] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl"><Skeleton className="h-full w-full rounded-none" /></div> : profileSecondaryImage && <div className="absolute -bottom-8 -right-4 aspect-square sm:-right-6 w-[48%] overflow-hidden rounded-2xl border-4 border-white shadow-xl bg-slate-100"><img src={profileSecondaryImage} alt={profileSecondaryAlt} className="h-full w-full object-cover" /></div>}
            </Reveal>
            <Reveal delay={120} data-testid="profile-intro">
              <p className="section-kicker">01 · Tentang kami</p>
              <h2 className="section-heading mt-3"><ClipReveal>Sekolah yang menyalakan <span className="text-emerald-600">potensi.</span></ClipReveal></h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">SMK Teratai Putih Global 2 Bekasi hadir sebagai ruang tumbuh bagi generasi muda yang unggul, terpercaya, dan profesional. Kami mempertemukan karakter baik dengan kompetensi yang relevan dengan kebutuhan industri.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Kurikulum berbasis industri", "Sertifikasi kompetensi", "Bimbingan karier", "Pembinaan karakter islami"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Check size={16} className="shrink-0 text-emerald-600" /> {item}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={200} className="relative mt-14 rounded-[2rem] bg-white p-7 shadow-[0_20px_60px_-30px_rgba(15,76,129,.32)] ring-1 ring-slate-200/80 transition-transform duration-300 hover:-translate-y-1 sm:p-10" data-testid="foundation-quote-card"><Quote className="absolute right-8 top-8 text-amber-100" size={74} fill="currentColor" /><p className="relative max-w-2xl font-heading text-2xl font-bold leading-snug tracking-tight text-[#0a3358] sm:text-3xl">“Pendidikan adalah harga mati untuk menjadi pondasi bangsa dan negara dalam menghadapi perkembangan zaman.”</p><div className="relative mt-8 flex items-center gap-3 border-t border-slate-100 pt-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4c81] text-white"><Building2 size={18} /></span><span><strong className="block text-sm text-slate-800">Yayasan Teratai Putih Global</strong><small className="text-xs text-slate-500">Komitmen untuk generasi masa depan</small></span></div></Reveal>
        </section>

        <section id="jurusan" className="bg-white px-5 py-12 lg:py-16" data-testid="majors-section">
          <div className="mx-auto max-w-7xl lg:px-3"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">02 · Program unggulan</p><h2 className="section-heading mt-3"><ClipReveal>Temukan ruang untuk <span className="text-emerald-600">bersinar.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Kurikulum kami dirancang bersama dunia industri agar setiap pelajaran terasa dekat dengan masa depan.</p></Reveal>
            {majorContent.isPending ? <MajorsSkeleton /> : !selectedMajor ? <div className={`mt-12 ${emptyStateClass}`} data-testid="majors-empty">Program keahlian belum tersedia.</div> : <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]"><div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2" role="tablist" aria-label="Program keahlian" data-testid="major-tabs">{displayMajors.map((major) => <button type="button" role="tab" aria-selected={selectedMajor.code === major.code} key={major.code} onClick={() => setSelectedMajorCode(major.code)} className={`major-tab group ${selectedMajor.code === major.code ? "major-tab-active" : ""}`} data-testid={`major-tab-${major.code.toLowerCase()}`}><span className="font-mono text-[11px]">{major.code}</span><span className="hidden text-left lg:block">{major.name}</span><ChevronRight size={15} className="ml-auto hidden transition-transform duration-300 group-hover:translate-x-1 lg:block" /></button>)}</div>
              <AnimatePresence mode="wait"><motion.div key={selectedMajor.code} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="overflow-hidden rounded-[1.75rem] bg-[#092c4c]" data-testid="selected-major-panel"><div className="grid min-h-[395px] lg:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-[250px] overflow-hidden lg:min-h-0">{selectedMajor.image && <img src={selectedMajor.image} alt={selectedMajor.name} className="absolute inset-0 h-full w-full object-cover opacity-75" />}<div className="absolute inset-0 bg-gradient-to-r from-[#092c4c]/30 to-[#092c4c]/80 lg:bg-gradient-to-r lg:from-transparent lg:to-[#092c4c]" /><div className="absolute left-6 top-6 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{selectedMajor.badge}</div></div><div className="flex flex-col justify-center p-7 text-white sm:p-10"><div className="flex items-center gap-3 text-emerald-300"><MajorIcon size={22} /><span className="font-mono text-xs font-bold tracking-widest">PROGRAM {selectedMajor.code}</span></div><h3 className="mt-4 max-w-md font-heading text-2xl font-extrabold sm:text-3xl" data-testid="selected-major-title">{selectedMajor.name}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{selectedMajor.tagline}</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Kompetensi inti</span><ul className="mt-3 space-y-2">{selectedMajor.skills.map(skill => <li key={skill} className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-400" /> {skill}</li>)}</ul></div><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Pilihan karier</span><ul className="mt-3 space-y-2">{selectedMajor.careers.map(career => <li key={career} className="flex items-center gap-2 text-xs text-slate-200"><ArrowUpRight size={13} className="text-emerald-400" /> {career}</li>)}</ul></div></div></div></div></motion.div></AnimatePresence>
            </div>}
          </div>
        </section>

        <section id="fasilitas" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16" data-testid="facilities-section"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">03 · Fasilitas belajar</p><h2 className="section-heading mt-3"><ClipReveal>Belajar lebih <span className="text-emerald-600">nyata.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Ruang belajar yang dirancang untuk praktik, kolaborasi, dan keberanian mencoba hal baru.</p></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="facilities-grid">{facilityContent.isPending && <FacilitySkeletons />}{displayFacilities.map(({ image, title, desc }, index) => <motion.button type="button" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 200, damping: 24, delay: (index % 3) * 0.08 }} key={title} onClick={() => image && setFacilityLightbox({ image, title, desc })} className={`group relative overflow-hidden rounded-2xl bg-white text-left ring-1 ring-slate-200/80 shadow-sm ${image ? "cursor-zoom-in" : "cursor-default"} ${index === 0 ? "lg:col-span-2" : ""}`} data-testid={`facility-card-${index + 1}`}><div className={`relative overflow-hidden bg-gradient-to-br from-[#0f4c81] to-[#092c4c] ${index === 0 ? "h-64" : "h-52"}`}>{image && <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}<div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/80 to-transparent" /><div className="absolute bottom-4 left-5 right-5"><h3 className="font-heading text-lg font-bold text-white">{title}</h3><p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-200">{desc}</p></div></div></motion.button>)}{!facilityContent.isPending && displayFacilities.length === 0 && <div className={emptyStateClass} data-testid="facilities-empty">Informasi fasilitas belum tersedia.</div>}</div></section>

        <section id="berita" className="bg-[#eaf3f4] px-5 py-12 lg:py-16" data-testid="agenda-section"><div className="mx-auto max-w-7xl lg:px-3"><Reveal className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">04 · Agenda terkini</p><h2 className="section-heading mt-3"><ClipReveal>Rencanakan setiap <span className="text-emerald-600">momen.</span></ClipReveal></h2></div><div className="flex flex-col items-start gap-3 sm:items-end"><p className="max-w-sm text-sm leading-relaxed text-slate-600">Lihat agenda bulanan, detail kegiatan, dan simpan pengingat langsung ke kalender Anda.</p></div></Reveal>{agendaContent.isPending ? <AcademicCalendarSkeleton /> : <AcademicCalendar events={agendaContent.data ?? []} />}</div></section>

        <section id="berita-terkini" className="bg-slate-50 px-5 py-12 lg:px-8 lg:py-16" data-testid="news-section"><div className="mx-auto max-w-7xl"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">05 · Berita sekolah</p><h2 className="section-heading mt-3"><ClipReveal>Kabar terbaru dari <span className="text-emerald-600">kami.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Ikuti pengumuman, prestasi, dan kegiatan terkini sekolah.</p></Reveal><div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="news-grid">{newsContent.isPending && <NewsCardSkeletons />}{displayNews.map((item, index) => <NewsCard key={item.id} item={item} to={newsPath(item, allNews)} onClick={rememberNewsSection} data-testid={`news-item-${index + 1}`} />)}{!newsContent.isPending && displayNews.length === 0 && <div className={emptyStateClass} data-testid="news-empty">Belum ada berita.</div>}</div>{allNews.length > 0 && <div className="mt-10 flex flex-col items-center gap-3"><Link to="/berita" onClick={rememberNewsSection} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0f4c81] px-7 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-[#0a3358]" data-testid="news-see-all-link">Lihat semua berita <ArrowRight size={16} /></Link>{allNews.length > homeNewsLimit && <span className="text-xs text-slate-500" data-testid="news-more-count">+{allNews.length - homeNewsLimit} berita lainnya</span>}</div>}</div></section>

        <section id="galeri" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16" data-testid="gallery-section"><Reveal className="flex items-end justify-between"><div><p className="section-kicker">06 · Galeri aktivitas</p><h2 className="section-heading mt-3"><ClipReveal>Momen yang <span className="text-emerald-600">bermakna.</span></ClipReveal></h2></div></Reveal><div className="mt-10" data-testid="gallery-grid">{galleryContent.isPending ? <ActivityStackSkeleton /> : stackItems.length === 0 ? <div className={emptyStateClass} data-testid="gallery-empty">Belum ada foto galeri.</div> : <ActivityStack items={stackItems} onPlay={(item) => item.video && setGalleryVideo({ ...item.video, title: item.title })} onZoom={(item) => item.fullImage && setFacilityLightbox({ image: item.fullImage, title: item.title, desc: item.description })} />}</div></section>

        {showPartners && <section id="kerja-sama" className="bg-slate-50 px-5 py-12 lg:px-8 lg:py-16" data-testid="partners-section"><div className="mx-auto max-w-7xl"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">07 · Kerja sama</p><h2 className="section-heading mt-3"><ClipReveal>Mitra industri <span className="text-emerald-600">kami.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Bersama dunia usaha dan dunia industri, kami menyiapkan siswa lewat praktik kerja, rekrutmen, dan kurikulum yang relevan.</p></Reveal><div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="partners-grid">{partnerContent.isPending && <PartnerSkeletons />}{displayPartners.map((item, index) => {
              const entrance = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { type: "spring" as const, stiffness: 210, damping: 24, delay: (index % 5) * 0.06 } };
              const inner = <><img src={optimizeImageUrl(item.image_url, 400) ?? ""} alt={item.title} loading="lazy" className="h-14 w-full object-contain grayscale transition-all duration-500 group-hover:grayscale-0 sm:h-16" /><span className="mt-3 line-clamp-1 text-center text-[11px] font-bold text-slate-500 group-hover:text-[#0a3358]">{item.title}</span></>;
              const cardClass = "group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md";
              return item.link
                ? <motion.a {...entrance} whileHover={{ y: -4 }} href={item.link} target="_blank" rel="noreferrer" key={item.id} className={cardClass} data-testid={`partner-item-${index + 1}`}>{inner}</motion.a>
                : <motion.div {...entrance} whileHover={{ y: -4 }} key={item.id} className={cardClass} data-testid={`partner-item-${index + 1}`}>{inner}</motion.div>;
            })}</div></div></section>}

        {showBanner && <section id="spmb" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16" data-testid="spmb-banner-section">{announcements.length === 0 ? <BannerSkeleton /> : <Announcements items={announcements} number={spmbNumber} activeId={announcementId} onSelect={setAnnouncementId} />}</section>}

        <section id="kontak" className="bg-[#092c4c] px-5 py-12 text-white lg:py-16" data-testid="contact-section"><div className="mx-auto max-w-7xl lg:px-3"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><Reveal><p className="section-kicker text-emerald-300">{String(contactNumber).padStart(2, "0")} · Hubungi kami</p><h2 className="mt-3 max-w-lg font-heading text-3xl font-extrabold leading-tight sm:text-4xl"><ClipReveal>Langkah pertama menuju masa depan dimulai <span className="text-amber-300">di sini.</span></ClipReveal></h2><p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">Tim kami siap membantu calon siswa dan orang tua mendapatkan informasi terbaik tentang program, fasilitas, dan SPMB.</p><div className="mt-8 space-y-4"><a href="https://wa.me/628211058321" target="_blank" rel="noreferrer" className="contact-line group" data-testid="contact-whatsapp-primary"><span className="contact-icon bg-emerald-500/15 text-emerald-300"><MessageCircle size={18} /></span><span><small>WhatsApp SPMB</small><strong>+62 821-1058-321</strong></span><ArrowUpRight size={17} className="ml-auto transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a><a href="mailto:terataiputihglobal2@gmail.com" className="contact-line group" data-testid="contact-email-link"><span className="contact-icon bg-amber-500/15 text-amber-300"><Mail size={18} /></span><span><small>Email resmi</small><strong>terataiputihglobal2@gmail.com</strong></span><ArrowUpRight size={17} className="ml-auto transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a></div></Reveal><Reveal delay={140} className="overflow-hidden rounded-[1.75rem] border border-white/10" data-testid="contact-map"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.219862270376!2d106.97722267472493!3d-6.236668893760604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d21f23894cd%3A0x54ea838beac73d1d!2sSMK%20Teratai%20Putih%20Global%202%20Bekasi!5e0!3m2!1sid!2sid!4v1715569844943!5m2!1sid!2sid" width="100%" height="100%" className="min-h-[320px] lg:min-h-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi SMK Teratai Putih Global 2 Bekasi" data-testid="contact-map-iframe" /></Reveal></div></div></section>
      </main>

      <SiteFooter />

      <AnimatePresence>
        {isPpdbOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Formulir SPMB" data-testid="ppdb-modal"><motion.div initial={{ opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ type: "spring", stiffness: 240, damping: 26 }} className="relative w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setIsPpdbOpen(false)} className="group absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup formulir SPMB" data-testid="ppdb-modal-close-button"><X size={18} className="transition-transform duration-300 group-hover:rotate-90" /></button><p className="section-kicker">SPMB 2027 / 2028</p><h2 className="mt-2 font-heading text-2xl font-extrabold text-[#0a3358]">Mulai perjalananmu.</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Isi data singkat berikut. Tim SPMB kami akan menghubungi Anda melalui WhatsApp.</p><form onSubmit={submitPpdb} className="mt-6 space-y-4"><label className="block"><span className="form-label">Nama calon siswa</span><input required name="student" className="form-input" placeholder="Tulis nama lengkap" data-testid="ppdb-student-name-input" /></label><label className="block"><span className="form-label">Pilihan program keahlian</span><select name="major" className="form-input" defaultValue="RPL" data-testid="ppdb-major-select"><option value="RPL">RPL — Rekayasa Perangkat Lunak</option><option value="DKV">DKV — Desain Komunikasi Visual</option><option value="BD">BD — Bisnis Digital &amp; Pemasaran</option><option value="MP">MP — Manajemen Perkantoran</option><option value="AKL">AKL — Akuntansi Keuangan Lembaga</option></select></label><label className="block"><span className="form-label">Nomor WhatsApp orang tua / siswa</span><input required name="whatsapp" className="form-input" placeholder="08xx-xxxx-xxxx" data-testid="ppdb-whatsapp-input" /></label><button type="submit" className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-extrabold text-[#092c4c] transition-all hover:bg-amber-400" data-testid="ppdb-submit-button">Kirim minat pendaftaran <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></button></form></motion.div></motion.div>}
        {isVideoOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Video profil sekolah" data-testid="profile-video-modal"><div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"><button type="button" onClick={() => setIsVideoOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup video profil" data-testid="profile-video-close-button"><X size={18} /></button><div className="aspect-video"><iframe className="h-full w-full" src="https://www.youtube.com/embed/DtyvJvqRdpY?rel=0" title="Profil SMK Teratai Putih Global 2 Bekasi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="profile-video-iframe" /></div></div></motion.div>}
        {facilityLightbox && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={facilityLightbox.title} data-testid="facility-lightbox"><div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-[#092c4c] shadow-2xl"><button type="button" onClick={() => setFacilityLightbox(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup gambar" data-testid="facility-lightbox-close-button"><X size={18} /></button><img src={facilityLightbox.image} alt={facilityLightbox.title} className="max-h-[70vh] w-full object-contain bg-black" data-testid="facility-lightbox-image" /><div className="p-6"><h3 className="font-heading text-xl font-extrabold text-white">{facilityLightbox.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-300">{facilityLightbox.desc}</p></div></div></motion.div>}
        {galleryVideo && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={galleryVideo.title} data-testid="gallery-video-modal"><div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"><button type="button" onClick={() => setGalleryVideo(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup video" data-testid="gallery-video-close-button"><X size={18} /></button><div className="aspect-video">{galleryVideo.type === "youtube" ? <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${galleryVideo.src}?rel=0&autoplay=1`} title={galleryVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="gallery-video-iframe" /> : galleryVideo.type === "drive" ? <iframe className="h-full w-full" src={galleryVideo.src} title={galleryVideo.title} allow="autoplay" allowFullScreen data-testid="gallery-video-iframe" /> : <video className="h-full w-full" src={galleryVideo.src} controls autoPlay data-testid="gallery-video-player" />}</div></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}
