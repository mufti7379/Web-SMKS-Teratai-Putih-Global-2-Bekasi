import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
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
import { apiGet, apiPost } from "@/lib/api";
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
  ["Beranda", "#beranda"], ["Profil", "#profil"], ["Jurusan", "#jurusan"], ["Fasilitas", "#fasilitas"], ["Agenda", "#berita"], ["Galeri", "#galeri"], ["Kontak", "#kontak"],
] as const;

const mobileNavItems = navItems.filter(([label]) => ["Beranda", "Jurusan", "Agenda", "Kontak"].includes(label));

const fallbackGalleryItems = [
  { title: "Praktik DKV", category: "Karya Siswa", image: imageUrls.design, size: "large" },
  { title: "Belajar RPL", category: "Kegiatan Lab", image: imageUrls.software, size: "tall" },
  { title: "Bisnis Digital", category: "Kewirausahaan", image: imageUrls.digital, size: "small" },
  { title: "Ruang Kolaborasi", category: "Fasilitas", image: imageUrls.office, size: "small" },
  { title: "Akuntansi Terapan", category: "Kegiatan Lab", image: imageUrls.accounting, size: "wide" },
  { title: "Masjid Yayasan", category: "Pembinaan Karakter", image: imageUrls.mosque, size: "small" },
];

const whatsappUrl = "https://wa.me/6281398865871?text=Halo%20SMK%20Teratai%20Putih%202%2C%20saya%20ingin%20mendapatkan%20informasi%20SPMB.";
const majorIcons: Record<string, typeof Code2> = { RPL: Code2, DKV: Palette, BD: TrendingUp, MP: BriefcaseBusiness, AKL: Calculator };

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMajorCode, setSelectedMajorCode] = useState("RPL");
  const [isPpdbOpen, setIsPpdbOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const majorContent = useQuery({ queryKey: ["public-content", "major"], queryFn: () => apiGet<CMSItem[]>("/content/major"), retry: false });
  const galleryContent = useQuery({ queryKey: ["public-content", "gallery"], queryFn: () => apiGet<CMSItem[]>("/content/gallery"), retry: false });
  const agendaContent = useQuery({ queryKey: ["public-content", "agenda"], queryFn: () => apiGet<CMSItem[]>("/content/agenda"), retry: false });
  const newsContent = useQuery({ queryKey: ["public-content", "news"], queryFn: () => apiGet<CMSItem[]>("/content/news"), retry: false });
  const displayMajors: Major[] = majorContent.data?.length ? majorContent.data.map((item) => ({ code: item.code ?? "PROG", name: item.title, badge: item.badge ?? "Program Keahlian", tagline: item.description, skills: item.skills, careers: item.careers, image: item.image_url ?? imageUrls.hero, icon: majorIcons[item.code ?? ""] ?? GraduationCap, accent: "blue" })) : fallbackMajors;
  const selectedMajor = displayMajors.find((major) => major.code === selectedMajorCode) ?? displayMajors[0];
  const displayGallery = galleryContent.data?.length ? galleryContent.data.map((item, index) => ({ title: item.title, category: item.description || "Kegiatan Sekolah", image: item.image_url ?? imageUrls.hero, size: index === 0 ? "large" : index === 1 ? "tall" : index === 4 ? "wide" : "small" })) : fallbackGalleryItems;
  const MajorIcon = selectedMajor.icon;
  const createLead = useMutation({ mutationFn: (payload: { kind: "ppdb" | "contact"; name: string; phone: string; major?: string; question?: string; source: "website" }) => apiPost<Lead>("/leads", payload), onSuccess: (_lead, variables) => { if (variables.kind === "ppdb") setIsPpdbOpen(false); toast.success(variables.kind === "ppdb" ? "Terima kasih! Data SPMB tersimpan dan tim kami akan menghubungi Anda." : "Pertanyaan tersimpan. Tim sekolah akan segera menindaklanjuti."); }, onError: () => toast.error("Data belum tersimpan. Silakan coba kembali.") });

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
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
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] pb-16 text-slate-900 sm:pb-0" data-testid="school-website-shell">
      <Toaster position="top-right" richColors />
      <div className="bg-[#092c4c] px-5 py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm" data-testid="announcement-bar">
        <span className="mr-2 text-amber-300">●</span> SPMB TA 2026/2027 telah dibuka — kesempatan beasiswa prestasi menanti Anda
        <button type="button" onClick={() => setIsPpdbOpen(true)} className="ml-2 underline decoration-amber-300 underline-offset-4 transition-colors hover:text-amber-200" data-testid="announcement-ppdb-link">Daftar sekarang</button>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl" data-testid="site-header">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button type="button" className="flex items-center gap-3 text-left" onClick={() => scrollTo("#beranda")} data-testid="school-brand-button">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f4c81] text-white shadow-lg shadow-blue-900/15"><GraduationCap size={24} /></span>
            <span className="hidden sm:block"><span className="block font-heading text-[15px] font-extrabold leading-tight text-[#0a3358]">SMK TERATAI PUTIH</span><span className="mt-0.5 block text-[10px] font-bold tracking-[0.18em] text-emerald-600">GLOBAL 2 BEKASI</span></span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama" data-testid="desktop-navigation">
            {navItems.map(([label, href]) => <button type="button" key={href} onClick={() => scrollTo(href)} className="text-[13px] font-bold text-slate-600 transition-colors hover:text-[#0f4c81]" data-testid={`nav-link-${label.toLowerCase()}`}>{label}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 sm:flex" data-testid="header-whatsapp-link"><MessageCircle size={15} /> WhatsApp</a>
            <Button onClick={() => setIsPpdbOpen(true)} className="hidden rounded-full bg-amber-500 px-5 font-bold text-[#092c4c] shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-400 sm:inline-flex" data-testid="header-ppdb-button">SPMB Online <ArrowUpRight size={16} /></Button>
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
        <section id="beranda" className="relative isolate overflow-hidden bg-[#092c4c]" data-testid="hero-section">
          <div className="absolute -right-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute -bottom-48 left-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-3xl" />
          <div className="mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10" data-testid="hero-copy">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-300"><Sparkles size={14} /> Sekolah inspirasi masa depan</div>
              <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl" data-testid="hero-heading">Mempersiapkan generasi <span className="text-amber-300">emas</span> yang kompeten & siap kerja global.</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg" data-testid="hero-description">Kurikulum berbasis industri, lingkungan belajar yang suportif, dan lima program keahlian untuk membekali setiap siswa menghadapi masa depan.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => setIsPpdbOpen(true)} className="h-12 rounded-full bg-amber-500 px-6 text-sm font-extrabold text-[#092c4c] shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-1 hover:bg-amber-400" data-testid="hero-ppdb-button">Jelajahi SPMB 2026 <ArrowUpRight size={17} /></Button>
                <button type="button" onClick={() => setIsVideoOpen(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/10" data-testid="hero-profile-video-button"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15"><Play size={12} fill="currentColor" /></span> Lihat profil sekolah</button>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-white/15 pt-6"><div className="flex -space-x-2"><span className="avatar-dot bg-emerald-400">A</span><span className="avatar-dot bg-amber-400">R</span><span className="avatar-dot bg-sky-400">S</span></div><p className="text-xs leading-relaxed text-slate-300"><strong className="text-white">Dipercaya keluarga Bekasi</strong><br />untuk tumbuh, berkarya, dan berprestasi</p></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .15 }} className="relative" data-testid="hero-image-block">
              <div className="absolute -left-5 top-12 z-10 hidden rounded-2xl border border-white/20 bg-white/95 p-4 shadow-2xl sm:block"><div className="mb-1 flex items-center gap-2 text-emerald-600"><Award size={17} /><span className="text-[10px] font-extrabold uppercase tracking-wider">Komitmen kami</span></div><p className="font-heading text-sm font-extrabold text-[#0a3358]">Belajar untuk berdampak</p></div>
              <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-white/20 bg-slate-800 shadow-2xl lg:h-[500px]"><img src={imageUrls.hero} alt="Siswa SMK belajar bersama" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/70 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><span className="max-w-[220px] font-heading text-lg font-bold leading-tight text-white">Masa depan cerah,<br /><span className="text-amber-300">hidup pun indah.</span></span><span className="rounded-xl bg-white/15 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-md">BEKASI · JAWA BARAT</span></div></div>
              <div className="absolute -bottom-6 -right-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:flex"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><GraduationCap size={21} /></span><span><strong className="block font-heading text-xl text-[#0a3358]">5</strong><small className="text-[10px] font-bold text-slate-500">PROGRAM KEAHLIAN</small></span></div>
            </motion.div>
          </div>
          <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-white/10 px-5 sm:grid-cols-4 lg:px-8" data-testid="hero-metrics">
            {[['94%', 'Serapan kerja & wirausaha'], ['5', 'Program keahlian unggulan'], ['120+', 'Mitra industri'], ['100%', 'Lulusan bersertifikasi']].map(([value, label]) => <div key={label} className="border-r border-white/10 px-4 py-6 first:pl-0 last:border-0 sm:py-8"><strong className="block font-heading text-2xl font-extrabold text-amber-300 sm:text-3xl">{value}</strong><span className="mt-1 block max-w-[130px] text-[10px] font-medium leading-relaxed text-slate-300 sm:text-xs">{label}</span></div>)}
          </div>
        </section>

        <section id="profil" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="profile-section">
          <div className="grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div data-testid="profile-intro"><p className="section-kicker">01 · Tentang kami</p><h2 className="section-heading mt-3">Sekolah yang menyalakan <span className="text-emerald-600">potensi.</span></h2><p className="mt-5 text-base leading-relaxed text-slate-600">SMK Teratai Putih Global 2 Bekasi hadir sebagai ruang tumbuh bagi generasi muda yang unggul, terpercaya, dan profesional. Kami mempertemukan karakter baik dengan kompetensi yang relevan dengan kebutuhan industri.</p><button type="button" onClick={() => setIsVideoOpen(true)} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0f4c81] transition-colors hover:text-emerald-600" data-testid="profile-video-link">Kenali kami lebih dekat <ArrowRight size={16} /></button></div>
            <div className="relative rounded-[2rem] bg-white p-7 shadow-[0_20px_60px_-30px_rgba(15,76,129,.32)] ring-1 ring-slate-200/80 lg:p-10" data-testid="foundation-quote-card"><Quote className="absolute right-8 top-8 text-amber-100" size={74} fill="currentColor" /><p className="relative max-w-2xl font-heading text-2xl font-bold leading-snug tracking-tight text-[#0a3358] sm:text-3xl">“Pendidikan adalah harga mati untuk menjadi pondasi bangsa dan negara dalam menghadapi perkembangan zaman.”</p><div className="relative mt-8 flex items-center gap-3 border-t border-slate-100 pt-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4c81] text-white"><Building2 size={18} /></span><span><strong className="block text-sm text-slate-800">Yayasan Teratai Putih Global</strong><small className="text-xs text-slate-500">Komitmen untuk generasi masa depan</small></span></div></div>
          </div>
        </section>

        <section id="jurusan" className="bg-white px-5 py-20 lg:py-28" data-testid="majors-section">
          <div className="mx-auto max-w-7xl lg:px-3"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">02 · Program unggulan</p><h2 className="section-heading mt-3">Temukan ruang untuk <span className="text-emerald-600">bersinar.</span></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Kurikulum kami dirancang bersama dunia industri agar setiap pelajaran terasa dekat dengan masa depan.</p></div>
            <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]"><div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2" role="tablist" aria-label="Program keahlian" data-testid="major-tabs">{displayMajors.map((major) => <button type="button" role="tab" aria-selected={selectedMajor.code === major.code} key={major.code} onClick={() => setSelectedMajorCode(major.code)} className={`major-tab ${selectedMajor.code === major.code ? "major-tab-active" : ""}`} data-testid={`major-tab-${major.code.toLowerCase()}`}><span className="font-mono text-[11px]">{major.code}</span><span className="hidden text-left lg:block">{major.name}</span><ChevronRight size={15} className="ml-auto hidden lg:block" /></button>)}</div>
              <AnimatePresence mode="wait"><motion.div key={selectedMajor.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .25 }} className="overflow-hidden rounded-[1.75rem] bg-[#092c4c]" data-testid="selected-major-panel"><div className="grid min-h-[395px] lg:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-[250px] overflow-hidden lg:min-h-0"><img src={selectedMajor.image} alt={selectedMajor.name} className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-r from-[#092c4c]/30 to-[#092c4c]/80 lg:bg-gradient-to-r lg:from-transparent lg:to-[#092c4c]" /><div className="absolute left-6 top-6 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{selectedMajor.badge}</div></div><div className="flex flex-col justify-center p-7 text-white sm:p-10"><div className="flex items-center gap-3 text-emerald-300"><MajorIcon size={22} /><span className="font-mono text-xs font-bold tracking-widest">PROGRAM {selectedMajor.code}</span></div><h3 className="mt-4 max-w-md font-heading text-2xl font-extrabold sm:text-3xl" data-testid="selected-major-title">{selectedMajor.name}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{selectedMajor.tagline}</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Kompetensi inti</span><ul className="mt-3 space-y-2">{selectedMajor.skills.map(skill => <li key={skill} className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-400" /> {skill}</li>)}</ul></div><div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Pilihan karier</span><ul className="mt-3 space-y-2">{selectedMajor.careers.map(career => <li key={career} className="flex items-center gap-2 text-xs text-slate-200"><ArrowUpRight size={13} className="text-emerald-400" /> {career}</li>)}</ul></div></div></div></div></motion.div></AnimatePresence>
            </div>
          </div>
        </section>

        <section id="fasilitas" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="facilities-section"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">03 · Fasilitas belajar</p><h2 className="section-heading mt-3">Belajar lebih <span className="text-emerald-600">nyata.</span></h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Ruang belajar yang dirancang untuk praktik, kolaborasi, dan keberanian mencoba hal baru.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[[imageUrls.software, "Lab Rekayasa Perangkat Lunak", "PC high-spec, server mini, dan jaringan fiber untuk praktik coding."], [imageUrls.design, "Lab Desain Komunikasi Visual", "Drawing tablet, studio lighting, dan perangkat kreatif profesional."], [imageUrls.digital, "Lab Bisnis Digital", "Ruang live broadcast, display retail, dan simulator marketplace."], [imageUrls.office, "Lab Manajemen Perkantoran", "Simulasi kantor eksekutif dengan sistem filing modern."], [imageUrls.accounting, "Lab Akuntansi & Perbankan", "Workstation Accurate / MYOB dan bank mini untuk praktik transaksi."], [imageUrls.mosque, "Masjid Yayasan", "Pusat pembinaan akhlak, ibadah, dan kegiatan keagamaan siswa."]].map(([image, title, desc], index) => <motion.article whileHover={{ y: -5 }} transition={{ duration: .2 }} key={title} className={`group relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm ${index === 0 ? "lg:col-span-2" : ""}`} data-testid={`facility-card-${index + 1}`}><div className={`relative overflow-hidden ${index === 0 ? "h-64" : "h-52"}`}><img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/80 to-transparent" /><div className="absolute bottom-4 left-5 right-5"><h3 className="font-heading text-lg font-bold text-white">{title}</h3><p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-200">{desc}</p></div></div></motion.article>)}</div></section>

        <section id="berita" className="bg-[#eaf3f4] px-5 py-20 lg:py-28" data-testid="agenda-section"><div className="mx-auto max-w-7xl lg:px-3"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">04 · Agenda terkini</p><h2 className="section-heading mt-3">Rencanakan setiap <span className="text-emerald-600">momen.</span></h2></div><div className="flex flex-col items-start gap-3 sm:items-end"><p className="max-w-sm text-sm leading-relaxed text-slate-600">Lihat agenda bulanan, detail kegiatan, dan simpan pengingat langsung ke kalender Anda.</p><a href="https://ujiango.smk-terataiputih2.sch.id/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0f4c81]" data-testid="cbt-portal-link"><MonitorPlay size={16} /> Portal ujian CBT <ExternalLink size={14} /></a></div></div><AcademicCalendar events={agendaContent.data ?? []} news={newsContent.data ?? []} /></div></section>

        <section id="galeri" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" data-testid="gallery-section"><div className="flex items-end justify-between"><div><p className="section-kicker">05 · Galeri aktivitas</p><h2 className="section-heading mt-3">Momen yang <span className="text-emerald-600">bermakna.</span></h2></div><a href="https://www.instagram.com/smkterput2.bekasi/" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-xs font-extrabold text-[#0f4c81] hover:text-emerald-600 sm:flex" data-testid="instagram-gallery-link"><Camera size={16} /> @smkterput2.bekasi <ArrowUpRight size={14} /></a></div><div className="mt-10 grid auto-rows-[145px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4">{displayGallery.map((item, index) => <motion.a whileHover={{ scale: 1.015 }} href="https://www.instagram.com/smkterput2.bekasi/" target="_blank" rel="noreferrer" key={`${item.title}-${index}`} className={`group relative overflow-hidden rounded-2xl ${item.size === "large" ? "col-span-2 row-span-2" : item.size === "tall" ? "row-span-2" : item.size === "wide" ? "col-span-2" : ""}`} data-testid={`gallery-item-${index + 1}`}><img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-[#092c4c]/80 via-transparent to-transparent opacity-80" /><div className="absolute bottom-3 left-3"><span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">{item.category}</span><h3 className="mt-1 text-sm font-bold text-white">{item.title}</h3></div></motion.a>)}</div></section>

        <section id="kontak" className="bg-[#092c4c] px-5 py-20 text-white lg:py-28" data-testid="contact-section"><div className="mx-auto max-w-7xl lg:px-3"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="section-kicker text-emerald-300">06 · Hubungi kami</p><h2 className="mt-3 max-w-lg font-heading text-3xl font-extrabold leading-tight sm:text-4xl">Langkah pertama menuju masa depan dimulai <span className="text-amber-300">di sini.</span></h2><p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">Tim kami siap membantu calon siswa dan orang tua mendapatkan informasi terbaik tentang program, fasilitas, dan SPMB.</p><div className="mt-8 space-y-4"><a href="https://wa.me/6281398865871" target="_blank" rel="noreferrer" className="contact-line" data-testid="contact-whatsapp-primary"><span className="contact-icon bg-emerald-500/15 text-emerald-300"><MessageCircle size={18} /></span><span><small>WhatsApp SPMB</small><strong>+62 813-9886-5871</strong></span><ArrowUpRight size={17} className="ml-auto" /></a><a href="mailto:reportterput2@gmail.com" className="contact-line" data-testid="contact-email-link"><span className="contact-icon bg-amber-500/15 text-amber-300"><Mail size={18} /></span><span><small>Email resmi</small><strong>reportterput2@gmail.com</strong></span><ArrowUpRight size={17} className="ml-auto" /></a><div className="contact-line" data-testid="contact-address-info"><span className="contact-icon bg-sky-500/15 text-sky-300"><MapPin size={18} /></span><span><small>Lokasi sekolah</small><strong>Jl. Rajawali V Perumnas 1, Bekasi Selatan</strong></span></div></div><div className="mt-6 overflow-hidden rounded-2xl border border-white/10" data-testid="contact-map"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.219862270376!2d106.97722267472493!3d-6.236668893760604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d21f23894cd%3A0x54ea838beac73d1d!2sSMK%20Teratai%20Putih%20Global%202%20Bekasi!5e0!3m2!1sid!2sid!4v1715569844943!5m2!1sid!2sid" width="100%" height="220" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi SMK Teratai Putih Global 2 Bekasi" data-testid="contact-map-iframe" /></div></div><div className="rounded-[1.75rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8" data-testid="contact-inquiry-card"><div className="flex items-start justify-between gap-4"><div><h3 className="font-heading text-xl font-extrabold text-[#0a3358]">Butuh informasi lebih lanjut?</h3><p className="mt-1 text-sm text-slate-500">Kirim pertanyaan, kami bantu jawab.</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Send size={18} /></span></div><form onSubmit={submitContact} className="mt-7 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-1"><span className="form-label">Nama lengkap</span><input required name="name" placeholder="Nama Anda" className="form-input" data-testid="contact-name-input" /></label><label className="sm:col-span-1"><span className="form-label">Nomor WhatsApp</span><input required name="phone" placeholder="08xx-xxxx-xxxx" className="form-input" data-testid="contact-phone-input" /></label><label className="sm:col-span-2"><span className="form-label">Pertanyaan</span><textarea required name="question" rows={3} placeholder="Apa yang ingin Anda ketahui?" className="form-input resize-none" data-testid="contact-question-input" /></label><button type="submit" disabled={createLead.isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f4c81] px-5 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0a3358] disabled:opacity-60 sm:col-span-2" data-testid="contact-submit-button">{createLead.isPending ? "Menyimpan…" : <>Kirim pertanyaan <ArrowRight size={16} /></>}</button></form></div></div></div></section>
      </main>

      <footer className="bg-[#061e34] px-5 py-8 text-slate-400" data-testid="site-footer"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center lg:px-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f4c81] text-white"><GraduationCap size={18} /></span><span><strong className="block text-sm text-white">SMK Teratai Putih Global 2</strong><small className="text-[10px]">Unggul · Terpercaya · Profesional</small></span></div><div className="flex items-center gap-4"><a href="https://www.instagram.com/smkterput2.bekasi/" target="_blank" rel="noreferrer" className="transition-colors hover:text-white" aria-label="Instagram" data-testid="footer-instagram-link"><Camera size={17} /></a><a href="https://www.youtube.com/watch?v=DtyvJvqRdpY" target="_blank" rel="noreferrer" className="transition-colors hover:text-white" aria-label="Youtube" data-testid="footer-youtube-link"><Video size={18} /></a><Link to="/admin" className="ml-1 text-[10px] font-bold hover:text-white" data-testid="footer-admin-link">Admin</Link><span className="border-l border-white/10 pl-4 text-[11px]">© 2026 Teratai Putih Global</span></div></div></footer>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white p-2 shadow-[0_-8px_30px_rgba(15,23,42,.12)] sm:hidden" data-testid="mobile-bottom-actions"><a href={whatsappUrl} className="flex h-11 items-center justify-center gap-2 text-xs font-extrabold text-emerald-700" data-testid="mobile-bottom-whatsapp"><MessageCircle size={17} /> Tanya Admin</a><button type="button" onClick={() => setIsPpdbOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 text-xs font-extrabold text-[#092c4c]" data-testid="mobile-bottom-ppdb"><GraduationCap size={17} /> Daftar SPMB</button></div>

      <AnimatePresence>
        {isPpdbOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Formulir SPMB" data-testid="ppdb-modal"><motion.div initial={{ y: 20, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: .97 }} className="relative w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setIsPpdbOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup formulir SPMB" data-testid="ppdb-modal-close-button"><X size={18} /></button><p className="section-kicker">SPMB 2026 / 2027</p><h2 className="mt-2 font-heading text-2xl font-extrabold text-[#0a3358]">Mulai perjalananmu.</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Isi data singkat berikut. Tim SPMB kami akan menghubungi Anda melalui WhatsApp.</p><form onSubmit={submitPpdb} className="mt-6 space-y-4"><label className="block"><span className="form-label">Nama calon siswa</span><input required name="student" className="form-input" placeholder="Tulis nama lengkap" data-testid="ppdb-student-name-input" /></label><label className="block"><span className="form-label">Pilihan program keahlian</span><select name="major" className="form-input" defaultValue="RPL" data-testid="ppdb-major-select"><option value="RPL">RPL — Rekayasa Perangkat Lunak</option><option value="DKV">DKV — Desain Komunikasi Visual</option><option value="BD">BD — Bisnis Digital &amp; Pemasaran</option><option value="MP">MP — Manajemen Perkantoran</option><option value="AKL">AKL — Akuntansi Keuangan Lembaga</option></select></label><label className="block"><span className="form-label">Nomor WhatsApp orang tua / siswa</span><input required name="whatsapp" className="form-input" placeholder="08xx-xxxx-xxxx" data-testid="ppdb-whatsapp-input" /></label><button type="submit" className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-extrabold text-[#092c4c] transition-all hover:bg-amber-400" data-testid="ppdb-submit-button">Kirim minat pendaftaran <ArrowRight size={17} /></button></form></motion.div></motion.div>}
        {isVideoOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#061e34]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Video profil sekolah" data-testid="profile-video-modal"><div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"><button type="button" onClick={() => setIsVideoOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80" aria-label="Tutup video profil" data-testid="profile-video-close-button"><X size={18} /></button><div className="aspect-video"><iframe className="h-full w-full" src="https://www.youtube.com/embed/DtyvJvqRdpY?rel=0" title="Profil SMK Teratai Putih Global 2 Bekasi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="profile-video-iframe" /></div></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}
