import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Camera,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MonitorPlay,
  Newspaper,
  Palette,
  Play,
  Quote,
  Send,
  Sparkles,
  TrendingUp,
  Video,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AcademicCalendar } from "@/components/AcademicCalendar";
import { Reveal, ClipReveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { apiGet, apiPost } from "@/lib/api";
import { optimizeImageUrl, buildDriveSrcSet } from "@/lib/images";
import { takePreloadedHero } from "@/lib/preload";
import type { CMSItem, Lead } from "@/lib/cms";
import { toast } from "sonner";

const imageUrls = {
  hero: "https://images.unsplash.com/photo-1630331515839-dcf1de4e8d4d?auto=format&fit=crop&w=1400&q=85",
  software: "https://images.unsplash.com/photo-1556636530-6b7482d80e3d?auto=format&fit=crop&w=900&q=85",
  design: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=85",
  digital: "https://images.unsplash.com/photo-1630331515839-dcf1de4e8d4d?auto=format&fit=crop&w=900&q=85",
  office: "https://images.unsplash.com/photo-1719159381981-1327b22aff9b?auto=format&fit=crop&w=900&q=85",
  accounting: "https://images.unsplash.com/photo-1625111381887-458fce74a923?auto=format&fit=crop&w=900&q=85",
  mosque: "https://www.smk-terataiputih2.sch.id/img-promosi/gallery/Wh40.jpeg",
};

type Major = {
  code: string;
  name: string;
  badge: string;
  tagline: string;
  skills: string[];
  careers: string[];
  image: string;
  icon: typeof Code2;
  accent: string;
};

const fallbackMajors: Major[] = [
  { code: "RPL", name: "Rekayasa Perangkat Lunak", badge: "Software Engineering", tagline: "Membangun aplikasi modern, web, mobile, dan cloud technology.", skills: ["Web Development", "Mobile Apps", "Database Design", "UI/UX & Git"], careers: ["Junior Software Engineer", "Frontend / Backend Developer", "QA Tester", "Tech Entrepreneur"], image: imageUrls.software, icon: Code2, accent: "blue" },
  { code: "DKV", name: "Desain Komunikasi Visual", badge: "Visual Communication Design", tagline: "Mengolah kreativitas menjadi karya visual, animasi, dan brand digital.", skills: ["Adobe Creative Cloud", "Branding & Typography", "Motion Graphics", "Fotografi Digital"], careers: ["Graphic Designer", "Video Editor", "Content Creator", "Brand Strategist"], image: imageUrls.design, icon: Palette, accent: "rose" },
  { code: "BD", name: "Bisnis Digital & Pemasaran", badge: "Digital Business", tagline: "Menjadi penggerak bisnis dengan strategi e-commerce dan marketing digital.", skills: ["E-Commerce Operations", "Digital Marketing & SEO", "Live Commerce", "Customer Analytics"], careers: ["Digital Marketer", "E-Commerce Specialist", "Content Marketer", "Online Business Manager"], image: imageUrls.digital, icon: TrendingUp, accent: "emerald" },
  { code: "MP", name: "Manajemen Perkantoran", badge: "Office Management", tagline: "Menguasai tata kelola perkantoran modern dan layanan bisnis profesional.", skills: ["Digital Archiving", "Public Relations", "Modern Office Tools", "Administrasi Keuangan"], careers: ["Administrative Officer", "Executive Assistant", "Document Controller", "Customer Relations"], image: imageUrls.office, icon: BriefcaseBusiness, accent: "amber" },
  { code: "AKL", name: "Akuntansi Keuangan Lembaga", badge: "Financial Accounting", tagline: "Membangun presisi laporan keuangan, pajak, dan audit berbasis software.", skills: ["MYOB & Accurate", "Perpajakan PPH & PPN", "Financial Auditing", "Banking Finance"], careers: ["Junior Accountant", "Tax Consultant Staff", "Auditor Assistant", "Banking Officer"], image: imageUrls.accounting, icon: Calculator, accent: "teal" },
];

const navItems = [
  ["Beranda", "#beranda"], ["Profil", "#profil"], ["Jurusan", "#jurusan"], ["Fasilitas", "#fasilitas"], ["Agenda", "#berita"], ["Berita", "#berita-terkini"], ["Galeri", "#galeri"], ["Kontak", "#kontak"],
] as const;

const mobileNavItems = navItems.filter(([label]) => ["Beranda", "Jurusan", "Agenda", "Kontak"].includes(label));

const footerShortcuts = [
  ["Ujian", "https://ujiango.smk-terataiputih2.sch.id"],
  ["Absensi", "https://absensi.smk-terataiputih2.sch.id"],
  ["Raport", "https://rapor.smk-terataiputih2.sch.id"],
  ["Validasi SHTKA", "https://shtka.kemendikdasmen.go.id/verifikasi-shtka"],
  ["NISN", "https://nisn.data.kemdikbud.go.id/"],
  ["KIP-K", "https://kip-kuliah.kemdiktisaintek.go.id/"],
] as const;

const fallbackFacilities = [
  { image: imageUrls.software, title: "Lab Rekayasa Perangkat Lunak", desc: "PC high-spec, server mini, dan jaringan fiber untuk praktik coding." },
  { image: imageUrls.design, title: "Lab Desain Komunikasi Visual", desc: "Drawing tablet, studio lighting, dan perangkat kreatif profesional." },
  { image: imageUrls.digital, title: "Lab Bisnis Digital", desc: "Ruang live broadcast, display retail, dan simulator marketplace." },
  { image: imageUrls.office, title: "Lab Manajemen Perkantoran", desc: "Simulasi kantor eksekutif dengan sistem filing modern." },
  { image: imageUrls.accounting, title: "Lab Akuntansi & Perbankan", desc: "Workstation Accurate / MYOB dan bank mini untuk praktik transaksi." },
  { image: imageUrls.mosque, title: "Masjid Yayasan", desc: "Pusat pembinaan akhlak, ibadah, dan kegiatan keagamaan siswa." },
];

const fallbackGalleryItems = [
  { title: "Praktik DKV", category: "Karya Siswa", image: imageUrls.design, size: "large" },
  { title: "Belajar RPL", category: "Kegiatan Lab", image: imageUrls.software, size: "tall" },
  { title: "Bisnis Digital", category: "Kewirausahaan", image: imageUrls.digital, size: "small" },
  { title: "Ruang Kolaborasi", category: "Fasilitas", image: imageUrls.office, size: "small" },
  { title: "Akuntansi Terapan", category: "Kegiatan Lab", image: imageUrls.accounting, size: "wide" },
  { title: "Masjid Yayasan", category: "Pembinaan Karakter", image: imageUrls.mosque, size: "small" },
];

const whatsappUrl = "https://wa.me/628211058321?text=Halo%20SMK%20Teratai%20Putih%202%2C%20saya%20ingin%20mendapatkan%20informasi%20SPMB.";
const majorIcons: Record<string, typeof Code2> = { RPL: Code2, DKV: Palette, BD: TrendingUp, MP: BriefcaseBusiness, AKL: Calculator };

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function getDriveFileId(url: string) {
  const match = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return match ? match[1] : null;
}

export default function Home() {
  const lenisRef = useLenisScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMajorCode, setSelectedMajorCode] = useState("RPL");
  const [isPpdbOpen, setIsPpdbOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [galleryVideo, setGalleryVideo] = useState<{ type: "youtube" | "drive" | "file"; src: string; title: string } | null>(null);
  const [facilityLightbox, setFacilityLightbox] = useState<{ image: string; title: string; desc: string } | null>(null);
  const [newsDetail, setNewsDetail] = useState<CMSItem | null>(null);
  const bannerContent = useQuery({ queryKey: ["public-content", "banner"], queryFn: () => apiGet<CMSItem[]>("/content/banner"), retry: false });
  const activeBanner = bannerContent.data?.[0] ?? null;
  useEffect(() => {
    const anyModalOpen = isPpdbOpen || isVideoOpen || Boolean(galleryVideo) || Boolean(facilityLightbox) || Boolean(newsDetail);
    if (!anyModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isPpdbOpen) setIsPpdbOpen(false);
      if (isVideoOpen) setIsVideoOpen(false);
      if (galleryVideo) setGalleryVideo(null);
      if (facilityLightbox) setFacilityLightbox(null);
      if (newsDetail) setNewsDetail(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPpdbOpen, isVideoOpen, galleryVideo, facilityLightbox, newsDetail]);
  const heroContent = useQuery({ queryKey: ["public-content", "hero"], queryFn: async () => (await takePreloadedHero()) ?? apiGet<CMSItem[]>("/content/hero"), retry: false });
  const profileContent = useQuery({ queryKey: ["public-content", "profile"], queryFn: () => apiGet<CMSItem[]>("/content/profile"), retry: false });
  const facilityContent = useQuery({ queryKey: ["public-content", "facility"], queryFn: () => apiGet<CMSItem[]>("/content/facility"), retry: false });
  const majorContent = useQuery({ queryKey: ["public-content", "major"], queryFn: () => apiGet<CMSItem[]>("/content/major"), retry: false });
  const galleryContent = useQuery({ queryKey: ["public-content", "gallery"], queryFn: () => apiGet<CMSItem[]>("/content/gallery"), retry: false });
  const agendaContent = useQuery({ queryKey: ["public-content", "agenda"], queryFn: () => apiGet<CMSItem[]>("/content/agenda"), retry: false });
  const newsContent = useQuery({ queryKey: ["public-content", "news"], queryFn: () => apiGet<CMSItem[]>("/content/news"), retry: false });
  const displayMajors: Major[] = majorContent.data?.length ? majorContent.data.map((item) => ({ code: item.code ?? "PROG", name: item.title, badge: item.badge ?? "Program Keahlian", tagline: item.description, skills: item.skills, careers: item.careers, image: optimizeImageUrl(item.image_url, 700) ?? imageUrls.hero, icon: majorIcons[item.code ?? ""] ?? GraduationCap, accent: "blue" })) : fallbackMajors;
  const selectedMajor = displayMajors.find((major) => major.code === selectedMajorCode) ?? displayMajors[0];
  const rawGallery = galleryContent.data?.length ? galleryContent.data.map((item, index) => ({ title: item.title, category: item.description || "Kegiatan Sekolah", image_url: item.image_url, link: item.link || "https://www.instagram.com/smkterput2.bekasi/", size: index === 0 ? "large" : index === 1 ? "tall" : index === 4 ? "wide" : "small" })) : fallbackGalleryItems.map((item) => ({ title: item.title, category: item.category, image_url: item.image as string | null, link: "https://www.instagram.com/smkterput2.bekasi/", size: item.size }));
  const displayGallery = rawGallery.map((item) => {
    const videoId = item.image_url ? getYouTubeId(item.image_url) : null;
    const driveId = !videoId && item.image_url ? getDriveFileId(item.image_url) : null;
    const isFileVideo = !videoId && !driveId && Boolean(item.image_url) && /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.image_url ?? "");
    const image = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : driveId ? `https://lh3.googleusercontent.com/d/${driveId}=w500` : optimizeImageUrl(item.image_url, 500) ?? imageUrls.hero;
    return { ...item, image, videoId, driveId, isFileVideo };
  });
  const displayNews = [...(newsContent.data ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const heroImages = (heroContent.data ?? []).map((item) => optimizeImageUrl(item.image_url, 960)).filter((url): url is string => Boolean(url));
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const interval = setInterval(() => setHeroIndex((current) => (current + 1) % heroImages.length), 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);
  // Don't fall back to the stock photo until the CMS fetch has actually settled — otherwise
  // every visitor briefly sees an unrelated stock photo before the real school photo swaps in.
  const heroImage = heroImages[heroIndex % heroImages.length] ?? (heroContent.isFetched ? imageUrls.hero : null);
  const displayFacilities = facilityContent.data?.length ? facilityContent.data.map((item) => ({ image: optimizeImageUrl(item.image_url, 700) ?? imageUrls.hero, title: item.title, desc: item.description })) : fallbackFacilities;
  const profileMainItem = profileContent.data?.find((item) => item.code === "utama") ?? profileContent.data?.[0];
  const profileSecondaryItem = profileContent.data?.find((item) => item.code === "sekunder") ?? profileContent.data?.[1];
  const profileMainImage = optimizeImageUrl(profileMainItem?.image_url, 700) ?? imageUrls.office;
  const profileMainAlt = profileMainItem?.title ?? "Aktivitas siswa di lingkungan sekolah";
  const profileSecondaryImage = optimizeImageUrl(profileSecondaryItem?.image_url, 700) ?? imageUrls.digital;
  const profileSecondaryAlt = profileSecondaryItem?.title ?? "Siswa berkegiatan di ruang praktik bisnis digital";
  const MajorIcon = selectedMajor.icon;
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

  const submitPpdb = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createLead.mutate({ kind: "ppdb", name: String(data.get("student")), phone: String(data.get("whatsapp")), major: String(data.get("major")), source: "website" });
  };

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createLead.mutate({ kind: "contact", name: String(data.get("name")), phone: String(data.get("phone")), question: String(data.get("question")), source: "website" });
    event.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 text-slate-900 sm:pb-0" data-testid="school-website-shell">
      <Toaster position="top-right" richColors />
      <div className="bg-[#092c4c] px-5 py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm" data-testid="announcement-bar">
        <span className="mr-2 text-amber-300">●</span> SPMB TA 2027/2028 telah dibuka — kesempatan beasiswa prestasi menanti Anda
        <button type="button" onClick={() => setIsPpdbOpen(true)} className="ml-2 underline decoration-amber-300 underline-offset-4 transition-colors hover:text-amber-200" data-testid="announcement-ppdb-link">Daftar sekarang</button>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl" data-testid="site-header">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button type="button" className="flex items-center gap-3 text-left" onClick={() => scrollTo("#beranda")} data-testid="school-brand-button">
            <img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-blue-900/15" />
            <span className="hidden sm:block"><span className="block font-heading text-[15px] font-extrabold leading-tight text-[#0a3358]">SMK TERATAI PUTIH</span><span className="mt-0.5 block text-[10px] font-bold tracking-[0.18em] text-emerald-600">GLOBAL 2 BEKASI</span></span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama" data-testid="desktop-navigation">
            {navItems.map(([label, href]) => <button type="button" key={href} onClick={() => scrollTo(href)} className="inline-block text-[13px] font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-[#0f4c81]" data-testid={`nav-link-${label.toLowerCase()}`}>{label}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 sm:flex" data-testid="header-whatsapp-link"><MessageCircle size={15} /> WhatsApp</a>
            <Button onClick={() => setIsPpdbOpen(true)} className="group hidden rounded-full bg-amber-500 px-5 font-bold text-[#092c4c] shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-400 sm:inline-flex" data-testid="header-ppdb-button">SPMB Online <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" /></Button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl p-2 text-[#0a3358] lg:hidden" aria-label="Buka menu" data-testid="mobile-menu-toggle">{mobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden" data-testid="mobile-navigation">
            {mobileNavItems.map(([label, href]) => <button type="button" key={href} onClick={() => scrollTo(href)} className="block w-full border-b border-slate-100 py-3 text-left text-sm font-bold text-slate-700" data-testid={`mobile-nav-link-${label.toLowerCase()}`}>{label}</button>)}
            <Button onClick={() => { setMobileMenuOpen(false); setIsPpdbOpen(true); }} className="mt-4 w-full rounded-xl bg-amber-500 font-bold text-[#092c4c]" data-testid="mobile-ppdb-button">Mulai Pendaftaran <ArrowRight size={16} /></Button>
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
            <div className="absolute inset-0 bg-gradient-to-b from-[#092c4c]/80 via-[#092c4c]/45 to-[#092c4c]/85" />
            {heroImages.length > 1 && <div className="absolute right-5 top-24 z-10 flex gap-1.5 sm:right-8" data-testid="hero-carousel-dots">{heroImages.map((url, index) => <span key={url} className={`h-1.5 rounded-full transition-all ${index === heroIndex ? "w-5 bg-amber-300" : "w-1.5 bg-white/40"}`} />)}</div>}
          </div>
          <div className="relative mx-auto flex min-h-[690px] max-w-7xl flex-col justify-center gap-10 px-5 py-16 lg:px-8 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 190, damping: 26 }} className="relative z-10 max-w-2xl" data-testid="hero-copy">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-300"><Sparkles size={14} /> Sekolah inspirasi masa depan</div>
              <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl" data-testid="hero-heading"><ClipReveal delay={200}>Mempersiapkan generasi <span className="text-amber-300">emas</span> yang kompeten &amp; siap kerja global.</ClipReveal></h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg" data-testid="hero-description">Kurikulum berbasis industri, lingkungan belajar yang suportif, dan lima program keahlian untuk membekali setiap siswa menghadapi masa depan.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => setIsPpdbOpen(true)} className="group h-12 rounded-full bg-amber-500 px-6 text-sm font-extrabold text-[#092c4c] shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-1 hover:bg-amber-400" data-testid="hero-ppdb-button">Jelajahi SPMB 2027 <ArrowUpRight size={17} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" /></Button>
                <button type="button" onClick={() => setIsVideoOpen(true)} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/10" data-testid="hero-profile-video-button"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:scale-110"><Play size={12} fill="currentColor" /></span> Lihat profil sekolah</button>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-white/15 pt-6"><div className="flex -space-x-2"><span className="avatar-dot bg-emerald-400">A</span><span className="avatar-dot bg-amber-400">R</span><span className="avatar-dot bg-sky-400">S</span></div><p className="text-xs leading-relaxed text-slate-300"><strong className="text-white">Dipercaya keluarga Bekasi</strong><br />untuk tumbuh, berkarya, dan berprestasi</p></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 170, damping: 26, delay: .2 }} className="relative z-10 flex flex-wrap items-stretch gap-4" data-testid="hero-image-block">
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-emerald-300"><Award size={19} /></span><div><span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Komitmen kami</span><p className="font-heading text-sm font-extrabold text-white">Belajar untuk berdampak</p></div></div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-amber-300"><GraduationCap size={21} /></span><div><strong className="block font-heading text-xl text-white">5</strong><small className="text-[10px] font-bold text-slate-200">PROGRAM KEAHLIAN</small></div></div>
              <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-md"><span className="max-w-[220px] font-heading text-sm font-bold leading-tight text-white">Masa depan cerah,<br /><span className="text-amber-300">hidup pun indah.</span></span><span className="w-fit rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">BEKASI · JAWA BARAT</span></div>
            </motion.div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-5 sm:-mt-14 lg:px-8">
          <Reveal y={24} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123a70] via-[#0a2c56] to-[#061e34] px-6 py-8 shadow-2xl shadow-blue-950/40 sm:px-10 sm:py-9" data-testid="hero-metrics">
            <div className="pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid grid-cols-3 gap-x-4 gap-y-6">
              <div data-testid="hero-metric-tahun-ajaran"><strong className="block font-heading text-xl font-extrabold text-white sm:text-3xl">2026/2027</strong><span className="mt-1 block text-xs font-bold text-white/90 sm:text-sm">Tahun Ajaran</span></div>
              <div data-testid="hero-metric-guru-tendik"><strong className="block font-heading text-xl font-extrabold text-white sm:text-3xl"><CountUp value={35} suffix="+" /></strong><span className="mt-1 block text-[10px] font-bold text-white/90 sm:text-sm">Guru Tendik</span></div>
              <div data-testid="hero-metric-mitra-industri"><strong className="block font-heading text-xl font-extrabold text-white sm:text-3xl"><CountUp value={8} suffix="+" /></strong><span className="mt-1 block text-[10px] font-bold text-white/90 sm:text-sm">Mitra Industri</span></div>
            </div>
          </Reveal>
        </div>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20" data-testid="value-props-section">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: BriefcaseBusiness, title: "Kurikulum Industri", desc: "Materi belajar dirancang bersama mitra industri agar relevan dengan kebutuhan kerja nyata." },
              { icon: GraduationCap, title: "5 Program Keahlian", desc: "RPL, DKV, Bisnis Digital, Manajemen Perkantoran, dan Akuntansi — pilih sesuai minatmu." },
              { icon: TrendingUp, title: "Pendampingan Karier", desc: "Bimbingan karier, sertifikasi kompetensi, dan penyaluran kerja bagi setiap lulusan." },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 100} className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#0f4c81]/30 hover:shadow-lg" data-testid={`value-prop-${index + 1}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf3f4] text-[#0f4c81]"><item.icon size={22} /></span>
                <h3 className="mt-5 font-heading text-lg font-extrabold text-[#0a3358]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="profil" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="profile-section">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="relative mx-auto w-full max-w-md" data-testid="profile-media">
              <span className="absolute -left-4 -top-4 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#0f4c81] text-white shadow-lg shadow-blue-900/25"><GraduationCap size={26} /></span>
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem]"><img src={profileMainImage} alt={profileMainAlt} className="h-full w-full object-cover" /></div>
              <div className="absolute -bottom-8 -right-6 aspect-square w-[48%] overflow-hidden rounded-2xl border-4 border-white shadow-xl"><img src={profileSecondaryImage} alt={profileSecondaryAlt} className="h-full w-full object-cover" /></div>
            </Reveal>
            <Reveal delay={120} data-testid="profile-intro">
              <p className="section-kicker">01 · Tentang kami</p>
              <h2 className="section-heading mt-3"><ClipReveal>Sekolah yang menyalakan <span className="text-emerald-600">potensi.</span></ClipReveal></h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">SMK Teratai Putih Global 2 Bekasi hadir sebagai ruang tumbuh bagi generasi muda yang unggul, terpercaya, dan profesional. Kami mempertemukan karakter baik dengan kompetensi yang relevan dengan kebutuhan industri.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Kurikulum berbasis industri", "Sertifikasi kompetensi", "Bimbingan karier & SPMB", "Pembinaan karakter islami"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Check size={16} className="shrink-0 text-emerald-600" /> {item}</li>
                ))}
              </ul>
              <button type="button" onClick={() => setIsVideoOpen(true)} className="group mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0f4c81] transition-colors hover:text-emerald-600" data-testid="profile-video-link">Kenali kami lebih dekat <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></button>
            </Reveal>
          </div>
          <Reveal delay={200} className="relative mt-14 rounded-[2rem] bg-white p-7 shadow-[0_20px_60px_-30px_rgba(15,76,129,.32)] ring-1 ring-slate-200/80 transition-transform duration-300 hover:-translate-y-1 sm:p-10" data-testid="foundation-quote-card"><Quote className="absolute right-8 top-8 text-amber-100" size={74} fill="currentColor" /><p className="relative max-w-2xl font-heading text-2xl font-bold leading-snug tracking-tight text-[#0a3358] sm:text-3xl">“Pendidikan adalah harga mati untuk menjadi pondasi bangsa dan negara dalam menghadapi perkembangan zaman.”</p><div className="relative mt-8 flex items-center gap-3 border-t border-slate-100 pt-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4c81] text-white"><Building2 size={18} /></span><span><strong className="block text-sm text-slate-800">Yayasan Teratai Putih Global</strong><small className="text-xs text-slate-500">Komitmen untuk generasi masa depan</small></span></div></Reveal>
        </section>

        <section id="jurusan" className="bg-white px-5 py-20 lg:py-28" data-testid="majors-section">
          <div className="mx-auto max-w-7xl lg:px-3"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">02 · Program unggulan</p><h2 className="section-heading mt-3"><ClipReveal>Temukan ruang untuk <span className="text-emerald-600">bersinar.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Kurikulum kami dirancang bersama dunia industri agar setiap pelajaran terasa dekat dengan masa depan.</p></Reveal>
            <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]"><div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2" role="tablist" aria-label="Program keahlian" data-testid="major-tabs">{displayMajors.map((major) => <button type="button" role="tab" aria-selected={selectedMajor.code === major.code} key={major.code} onClick={() => setSelectedMajorCode(major.code)} className={`major-tab group ${selectedMajor.code === major.code ? "major-tab-active" : ""}`} data-testid={`major-tab-${major.code.toLowerCase()}`}><span className="font-mono text-[11px]">{major.code}</span><span className="hidden text-left lg:block">{major.name}</span><ChevronRight size={15} className="ml-auto hidden transition-transform duration-300 group-hover:translate-x-1 lg:block" /></button>)}</div>
              <AnimatePresence mode="wait"><motion.div key={selectedMajor.code} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="overflow-hidden rounded-[1.75rem] bg-[#092c4c]" data-testid="selected-major-panel"><div className="grid min-h-[395px] lg:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-[250px] overflow-hidden lg:min-h-0"><img src={selectedMajor.image} alt={selectedMajor.name} className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-r from-[#092c4c]/30 to-[#092c4c]/80 lg:bg-gradient-to-r lg:from-transparent lg:to-[#092c4c]" /><div className="absolute left-6 top-6 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{selectedMajor.badge}</div></div><div className="flex flex-col justify-center p-7 text-white sm:p-10"><div className="flex items-center gap-3 text-emerald-300"><MajorIcon size={22} /><span className="font-mono text-xs font-bold tracking-widest">PROGRAM {selectedMajor.code}</span></div><h3 className="mt-4 max-w-md font-heading text-2xl font-extrabold sm:text-3xl" data-testid="selected-major-title">{selectedMajor.name}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{selectedMajor.tagline}</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Kompetensi inti</span><ul className="mt-3 space-y-2">{selectedMajor.skills.map(skill => <li key={skill} className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-400" /> {skill}</li>)}</ul></div><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Pilihan karier</span><ul className="mt-3 space-y-2">{selectedMajor.careers.map(career => <li key={career} className="flex items-center gap-2 text-xs text-slate-200"><ArrowUpRight size={13} className="text-emerald-400" /> {career}</li>)}</ul></div></div></div></div></motion.div></AnimatePresence>
            </div>
          </div>
        </section>

        <section id="fasilitas" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="facilities-section"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">03 · Fasilitas belajar</p><h2 className="section-heading mt-3"><ClipReveal>Belajar lebih <span className="text-emerald-600">nyata.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Ruang belajar yang dirancang untuk praktik, kolaborasi, dan keberanian mencoba hal baru.</p></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{displayFacilities.map(({ image, title, desc }, index) => <motion.button type="button" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 200, damping: 24, delay: (index % 3) * 0.08 }} key={title} onClick={() => setFacilityLightbox({ image, title, desc })} className={`group relative overflow-hidden rounded-2xl bg-white text-left ring-1 ring-slate-200/80 shadow-sm cursor-zoom-in ${index === 0 ? "lg:col-span-2" : ""}`} data-testid={`facility-card-${index + 1}`}><div className={`relative overflow-hidden ${index === 0 ? "h-64" : "h-52"}`}><img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/80 to-transparent" /><div className="absolute bottom-4 left-5 right-5"><h3 className="font-heading text-lg font-bold text-white">{title}</h3><p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-200">{desc}</p></div></div></motion.button>)}</div></section>

        <section id="berita" className="bg-[#eaf3f4] px-5 py-20 lg:py-28" data-testid="agenda-section"><div className="mx-auto max-w-7xl lg:px-3"><Reveal className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">04 · Agenda terkini</p><h2 className="section-heading mt-3"><ClipReveal>Rencanakan setiap <span className="text-emerald-600">momen.</span></ClipReveal></h2></div><div className="flex flex-col items-start gap-3 sm:items-end"><p className="max-w-sm text-sm leading-relaxed text-slate-600">Lihat agenda bulanan, detail kegiatan, dan simpan pengingat langsung ke kalender Anda.</p><a href="https://ujiango.smk-terataiputih2.sch.id/" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-xs font-extrabold text-[#0f4c81]" data-testid="cbt-portal-link"><MonitorPlay size={16} /> Portal ujian CBT <ExternalLink size={14} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a></div></Reveal><AcademicCalendar events={agendaContent.data ?? []} /></div></section>

        <section id="berita-terkini" className="bg-slate-50 px-5 py-20 lg:px-8 lg:py-28" data-testid="news-section"><div className="mx-auto max-w-7xl"><Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">05 · Berita sekolah</p><h2 className="section-heading mt-3"><ClipReveal>Kabar terbaru dari <span className="text-emerald-600">kami.</span></ClipReveal></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Ikuti pengumuman, prestasi, dan kegiatan terkini sekolah.</p></Reveal><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="news-grid">{displayNews.map((item, index) => <motion.button type="button" onClick={() => setNewsDetail(item)} key={item.id} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 200, damping: 24, delay: (index % 3) * 0.08 }} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm" data-testid={`news-item-${index + 1}`}><div className="flex items-center gap-2 text-[#0f4c81]"><Newspaper size={16} /><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{item.date ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Berita"}</span></div><h3 className="mt-3 font-heading text-base font-extrabold text-[#0a3358]">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#0f4c81] group-hover:text-emerald-600" data-testid={`news-item-link-${index + 1}`}>Baca selengkapnya <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" /></span></motion.button>)}{displayNews.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400" data-testid="news-empty">Belum ada berita.</div>}</div></div></section>

        <section id="galeri" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="gallery-section"><Reveal className="flex items-end justify-between"><div><p className="section-kicker">06 · Galeri aktivitas</p><h2 className="section-heading mt-3"><ClipReveal>Momen yang <span className="text-emerald-600">bermakna.</span></ClipReveal></h2></div><a href="https://www.instagram.com/smkterput2.bekasi/" target="_blank" rel="noreferrer" className="group hidden items-center gap-2 text-xs font-extrabold text-[#0f4c81] hover:text-emerald-600 sm:flex" data-testid="instagram-gallery-link"><Camera size={16} /> @smkterput2.bekasi <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a></Reveal><div className="mt-10 grid auto-rows-[145px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4">{displayGallery.map((item, index) => {
              const isVideo = Boolean(item.videoId || item.driveId || item.isFileVideo);
              const sizeClass = item.size === "large" ? "col-span-2 row-span-2" : item.size === "tall" ? "row-span-2" : item.size === "wide" ? "col-span-2" : "";
              const entrance = { initial: { opacity: 0, y: 24, scale: 0.96 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: 0.3 }, transition: { type: "spring" as const, stiffness: 210, damping: 24, delay: (index % 4) * 0.07 } };
              const inner = <><img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />{isVideo && <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0f4c81]"><Play size={18} fill="currentColor" /></span></span>}<div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/80 via-transparent to-transparent opacity-80" /><div className="absolute bottom-3 left-3"><span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">{item.category}</span><h3 className="mt-1 text-sm font-bold text-white">{item.title}</h3></div></>;
              return isVideo
                ? <motion.button type="button" {...entrance} whileHover={{ scale: 1.03 }} onClick={() => setGalleryVideo({ type: item.videoId ? "youtube" : item.driveId ? "drive" : "file", src: item.videoId ?? item.driveId ?? (item.image_url ?? ""), title: item.title })} key={`${item.title}-${index}`} className={`group relative overflow-hidden rounded-2xl text-left ${sizeClass}`} data-testid={`gallery-item-${index + 1}`}>{inner}</motion.button>
                : <motion.a {...entrance} whileHover={{ scale: 1.03 }} href={item.link} target="_blank" rel="noreferrer" key={`${item.title}-${index}`} className={`group relative overflow-hidden rounded-2xl ${sizeClass}`} data-testid={`gallery-item-${index + 1}`}>{inner}</motion.a>;
            })}</div></section>

        {activeBanner && <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="spmb-banner-section"><Reveal className="overflow-hidden rounded-[1.75rem] bg-[#092c4c] text-white shadow-2xl"><div className="grid lg:grid-cols-2 lg:items-center">{activeBanner.image_url ? <img src={optimizeImageUrl(activeBanner.image_url, 900) ?? activeBanner.image_url} alt={activeBanner.title} className="h-auto w-full" data-testid="spmb-banner-image" /> : <div className="min-h-[220px] bg-gradient-to-br from-[#0f4c81] to-[#092c4c]" />}<div className="flex flex-col justify-center p-7 sm:p-10"><p className="section-kicker text-emerald-300">07 · Pengumuman SPMB</p>{activeBanner.badge && <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-amber-400/15 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-amber-300"><Sparkles size={14} /> {activeBanner.badge}</span>}<h2 className="mt-5 font-heading text-2xl font-extrabold leading-tight sm:text-3xl">{activeBanner.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">{activeBanner.description}</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => setIsPpdbOpen(true)} className="h-12 rounded-full bg-amber-500 px-6 text-sm font-extrabold text-[#092c4c] hover:bg-amber-400" data-testid="spmb-banner-cta-button">Daftar sekarang <ArrowUpRight size={16} /></Button></div></div></div></Reveal></section>}

        <section id="kontak" className="bg-[#092c4c] px-5 py-20 text-white lg:py-28" data-testid="contact-section"><div className="mx-auto max-w-7xl lg:px-3"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><Reveal><p className="section-kicker text-emerald-300">08 · Hubungi kami</p><h2 className="mt-3 max-w-lg font-heading text-3xl font-extrabold leading-tight sm:text-4xl"><ClipReveal>Langkah pertama menuju masa depan dimulai <span className="text-amber-300">di sini.</span></ClipReveal></h2><p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">Tim kami siap membantu calon siswa dan orang tua mendapatkan informasi terbaik tentang program, fasilitas, dan SPMB.</p><div className="mt-8 space-y-4"><a href="https://wa.me/628211058321" target="_blank" rel="noreferrer" className="contact-line group" data-testid="contact-whatsapp-primary"><span className="contact-icon bg-emerald-500/15 text-emerald-300"><MessageCircle size={18} /></span><span><small>WhatsApp SPMB</small><strong>+62 821-1058-321</strong></span><ArrowUpRight size={17} className="ml-auto transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a><a href="mailto:terataiputihglobal2@gmail.com" className="contact-line group" data-testid="contact-email-link"><span className="contact-icon bg-amber-500/15 text-amber-300"><Mail size={18} /></span><span><small>Email resmi</small><strong>terataiputihglobal2@gmail.com</strong></span><ArrowUpRight size={17} className="ml-auto transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a><div className="contact-line" data-testid="contact-address-info"><span className="contact-icon bg-sky-500/15 text-sky-300"><MapPin size={18} /></span><span><small>Lokasi sekolah</small><strong>Jl. Rajawali V Perumnas 1, Bekasi Selatan</strong></span></div></div><div className="mt-6 overflow-hidden rounded-2xl border border-white/10" data-testid="contact-map"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.219862270376!2d106.97722267472493!3d-6.236668893760604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d21f23894cd%3A0x54ea838beac73d1d!2sSMK%20Teratai%20Putih%20Global%202%20Bekasi!5e0!3m2!1sid!2sid!4v1715569844943!5m2!1sid!2sid" width="100%" height="220" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi SMK Teratai Putih Global 2 Bekasi" data-testid="contact-map-iframe" /></div></Reveal><Reveal delay={140} className="rounded-[1.75rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8" data-testid="contact-inquiry-card"><div className="flex items-start justify-between gap-4"><div><h3 className="font-heading text-xl font-extrabold text-[#0a3358]">Butuh informasi lebih lanjut?</h3><p className="mt-1 text-sm text-slate-500">Kirim pertanyaan, kami bantu jawab.</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Send size={18} /></span></div><form onSubmit={submitContact} className="mt-7 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-1"><span className="form-label">Nama lengkap</span><input required name="name" placeholder="Nama Anda" className="form-input" data-testid="contact-name-input" /></label><label className="sm:col-span-1"><span className="form-label">Nomor WhatsApp</span><input required name="phone" placeholder="08xx-xxxx-xxxx" className="form-input" data-testid="contact-phone-input" /></label><label className="sm:col-span-2"><span className="form-label">Pertanyaan</span><textarea required name="question" rows={3} placeholder="Apa yang ingin Anda ketahui?" className="form-input resize-none" data-testid="contact-question-input" /></label><button type="submit" disabled={createLead.isPending} className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f4c81] px-5 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0a3358] disabled:opacity-60 sm:col-span-2" data-testid="contact-submit-button">{createLead.isPending ? "Menyimpan…" : <>Kirim pertanyaan <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></>}</button></form></Reveal></div></div></section>
      </main>

      {/* Higher than the header's z-40 so the footer visually covers the sticky header
          as soon as it scrolls up to the top of the viewport, instead of the header
          staying pinned on top of the footer for the rest of the scroll. */}
      <footer className="relative z-50 bg-[#061e34] px-5 pb-8 pt-16 text-slate-400" data-testid="site-footer">
        <div className="mx-auto max-w-7xl lg:px-3">
          <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3"><img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-10 w-10 rounded-xl object-contain" /><span><strong className="block text-sm text-white">SMK Teratai Putih Global 2</strong><small className="text-[10px]">Unggul · Terpercaya · Profesional</small></span></div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-400">Ruang tumbuh bagi generasi muda yang unggul, terpercaya, dan profesional dengan lima program keahlian siap kerja.</p>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">Jl. Rajawali V Perumnas 1,<br />Bekasi Selatan, Jawa Barat</p>
              <div className="mt-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1.5"><img src="/logo-yayasan.png" alt="Logo Yayasan Teratai Putih Global" className="h-full w-full object-contain" data-testid="footer-foundation-logo" /></span><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1.5"><img src="/logo-smk-hebat.jpg" alt="Logo SMK Bisa Hebat" className="h-full w-full object-contain" data-testid="footer-smk-hebat-logo" /></span></div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Navigasi</p>
              <ul className="mt-4 space-y-2.5">{navItems.map(([label, href]) => <li key={href}><button type="button" onClick={() => scrollTo(href)} className="inline-block text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white">{label}</button></li>)}</ul>
            </div>
            <div data-testid="footer-shortcuts">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Tautan</p>
              <ul className="mt-4 space-y-2.5">{footerShortcuts.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid={`footer-shortcut-${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</a></li>)}</ul>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Hubungi Kami</p>
              <ul className="mt-4 space-y-2.5">
                <li><a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid="footer-whatsapp-link"><MessageCircle size={14} /> WhatsApp SPMB</a></li>
                <li><a href="mailto:terataiputihglobal2@gmail.com" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white"><Mail size={14} /> Email resmi</a></li>
                <li><a href="https://www.instagram.com/smkterput2.bekasi/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid="footer-instagram-link"><Camera size={14} /> Instagram</a></li>
                <li><a href="https://www.youtube.com/watch?v=DtyvJvqRdpY" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid="footer-youtube-link"><Video size={14} /> YouTube</a></li>
                <li><Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid="footer-admin-link">Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><span className="text-[11px]">© 2026 etosdev.com</span></div>
        </div>
      </footer>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white p-2 shadow-[0_-8px_30px_rgba(15,23,42,.12)] sm:hidden" data-testid="mobile-bottom-actions"><a href={whatsappUrl} className="flex h-11 items-center justify-center gap-2 text-xs font-extrabold text-emerald-700" data-testid="mobile-bottom-whatsapp"><MessageCircle size={17} /> Tanya Admin</a><button type="button" onClick={() => setIsPpdbOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 text-xs font-extrabold text-[#092c4c]" data-testid="mobile-bottom-ppdb"><GraduationCap size={17} /> Daftar SPMB</button></div>

      <AnimatePresence>
        {isPpdbOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Formulir SPMB" data-testid="ppdb-modal"><motion.div initial={{ opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ type: "spring", stiffness: 240, damping: 26 }} className="relative w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setIsPpdbOpen(false)} className="group absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup formulir SPMB" data-testid="ppdb-modal-close-button"><X size={18} className="transition-transform duration-300 group-hover:rotate-90" /></button><p className="section-kicker">SPMB 2027 / 2028</p><h2 className="mt-2 font-heading text-2xl font-extrabold text-[#0a3358]">Mulai perjalananmu.</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Isi data singkat berikut. Tim SPMB kami akan menghubungi Anda melalui WhatsApp.</p><form onSubmit={submitPpdb} className="mt-6 space-y-4"><label className="block"><span className="form-label">Nama calon siswa</span><input required name="student" className="form-input" placeholder="Tulis nama lengkap" data-testid="ppdb-student-name-input" /></label><label className="block"><span className="form-label">Pilihan program keahlian</span><select name="major" className="form-input" defaultValue="RPL" data-testid="ppdb-major-select"><option value="RPL">RPL — Rekayasa Perangkat Lunak</option><option value="DKV">DKV — Desain Komunikasi Visual</option><option value="BD">BD — Bisnis Digital &amp; Pemasaran</option><option value="MP">MP — Manajemen Perkantoran</option><option value="AKL">AKL — Akuntansi Keuangan Lembaga</option></select></label><label className="block"><span className="form-label">Nomor WhatsApp orang tua / siswa</span><input required name="whatsapp" className="form-input" placeholder="08xx-xxxx-xxxx" data-testid="ppdb-whatsapp-input" /></label><button type="submit" className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-extrabold text-[#092c4c] transition-all hover:bg-amber-400" data-testid="ppdb-submit-button">Kirim minat pendaftaran <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></button></form></motion.div></motion.div>}
        {isVideoOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Video profil sekolah" data-testid="profile-video-modal"><div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"><button type="button" onClick={() => setIsVideoOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup video profil" data-testid="profile-video-close-button"><X size={18} /></button><div className="aspect-video"><iframe className="h-full w-full" src="https://www.youtube.com/embed/DtyvJvqRdpY?rel=0" title="Profil SMK Teratai Putih Global 2 Bekasi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="profile-video-iframe" /></div></div></motion.div>}
        {facilityLightbox && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={facilityLightbox.title} data-testid="facility-lightbox"><div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-[#092c4c] shadow-2xl"><button type="button" onClick={() => setFacilityLightbox(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup gambar" data-testid="facility-lightbox-close-button"><X size={18} /></button><img src={facilityLightbox.image} alt={facilityLightbox.title} className="max-h-[70vh] w-full object-contain bg-black" data-testid="facility-lightbox-image" /><div className="p-6"><h3 className="font-heading text-xl font-extrabold text-white">{facilityLightbox.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-300">{facilityLightbox.desc}</p></div></div></motion.div>}
        {newsDetail && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={newsDetail.title} data-testid="news-detail-modal"><motion.div initial={{ opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ type: "spring", stiffness: 240, damping: 26 }} className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setNewsDetail(null)} className="group absolute right-4 top-4 rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700" aria-label="Tutup berita" data-testid="news-detail-close-button"><X size={18} className="transition-transform duration-300 group-hover:rotate-90" /></button>{newsDetail.image_url && <img src={optimizeImageUrl(newsDetail.image_url, 700) ?? newsDetail.image_url} alt={newsDetail.title} className="-mx-6 -mt-6 mb-6 h-48 w-[calc(100%+3rem)] object-cover sm:-mx-8 sm:-mt-8 sm:h-56 sm:w-[calc(100%+4rem)]" data-testid="news-detail-image" />}<div className="flex items-center gap-2 text-[#0f4c81]"><Newspaper size={16} /><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{newsDetail.date ? new Date(newsDetail.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Berita"}</span></div><h2 className="mt-3 font-heading text-2xl font-extrabold leading-tight text-[#0a3358]">{newsDetail.title}</h2><p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{newsDetail.description}</p>{newsDetail.link && <a href={newsDetail.link} target="_blank" rel="noreferrer" className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#0f4c81] hover:text-emerald-600" data-testid="news-detail-source-link">Sumber lengkap <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" /></a>}</motion.div></motion.div>}
        {galleryVideo && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={galleryVideo.title} data-testid="gallery-video-modal"><div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"><button type="button" onClick={() => setGalleryVideo(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup video" data-testid="gallery-video-close-button"><X size={18} /></button><div className="aspect-video">{galleryVideo.type === "youtube" ? <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${galleryVideo.src}?rel=0&autoplay=1`} title={galleryVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="gallery-video-iframe" /> : galleryVideo.type === "drive" ? <iframe className="h-full w-full" src={`https://drive.google.com/file/d/${galleryVideo.src}/preview`} title={galleryVideo.title} allow="autoplay" allowFullScreen data-testid="gallery-video-iframe" /> : <video className="h-full w-full" src={galleryVideo.src} controls autoPlay data-testid="gallery-video-player" />}</div></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}
