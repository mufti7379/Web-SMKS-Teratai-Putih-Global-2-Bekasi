import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

// Code-split routes nobody but staff/devs visit — every home page visitor was otherwise
// downloading the full admin dashboard bundle before it could even show the landing page.
const Admin = lazy(() => import("@/pages/AdminPortal"));
const HeroPreview = lazy(() => import("@/pages/HeroPreview"));

const routeFallback = <div className="flex min-h-screen items-center justify-center text-sm font-bold text-slate-500">Memuat…</div>;

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Suspense fallback={routeFallback}><Admin /></Suspense>} />
      <Route path="/hero-preview" element={<Suspense fallback={routeFallback}><HeroPreview /></Suspense>} />
    </Routes>
  );
}
