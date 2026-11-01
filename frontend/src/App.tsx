import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ChatAssistant } from "@/components/ChatAssistant";
import Home from "@/pages/Home";

// Code-split routes nobody but staff/devs visit — every home page visitor was otherwise
// downloading the full admin dashboard bundle before it could even show the landing page.
const Admin = lazy(() => import("@/pages/AdminPortal"));
const HeroPreview = lazy(() => import("@/pages/HeroPreview"));
const NewsList = lazy(() => import("@/pages/NewsList"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const GalleryAlbum = lazy(() => import("@/pages/GalleryAlbum"));
const VisionMission = lazy(() => import("@/pages/VisionMission"));
const PrincipalWelcome = lazy(() => import("@/pages/PrincipalWelcome"));
const StaffDirectory = lazy(() => import("@/pages/StaffDirectory"));
const hideAssistantOn = ["/admin", "/hero-preview"];
const routeFallback = <div className="flex min-h-screen items-center justify-center text-sm font-bold text-slate-500">Memuat…</div>;

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const {pathname} = useLocation(); 
  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/berita" element={<Suspense fallback={routeFallback}><NewsList /></Suspense>} />
      <Route path="/berita/:bulan/:tahun/:slug" element={<Suspense fallback={routeFallback}><NewsDetail /></Suspense>} />
      {/* Old id-based links (/berita/<uuid>) already shared before the readable URLs — NewsDetail redirects them. */}
      <Route path="/berita/:id" element={<Suspense fallback={routeFallback}><NewsDetail /></Suspense>} />
      <Route path="/galeri/:album" element={<Suspense fallback={routeFallback}><GalleryAlbum /></Suspense>} />
      <Route path="/visi-misi" element={<Suspense fallback={routeFallback}><VisionMission /></Suspense>} />
      <Route path="/sambutan-kepala-sekolah" element={<Suspense fallback={routeFallback}><PrincipalWelcome /></Suspense>} />
      <Route path="/gtk" element={<Suspense fallback={routeFallback}><StaffDirectory /></Suspense>} />
      <Route path="/admin" element={<Suspense fallback={routeFallback}><Admin /></Suspense>} />
      <Route path="/hero-preview" element={<Suspense fallback={routeFallback}><HeroPreview /></Suspense>} />
      <Route path="*" element={<Suspense fallback={routeFallback}><NotFound /></Suspense>} />
    </Routes>
    {!hideAssistantOn.includes(pathname) && <ChatAssistant />}
    </>
  );
}
