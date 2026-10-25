import { Link } from "react-router-dom";
import { SubpageLayout } from "@/components/SubpageLayout";

// Any URL no other route claims. Vercel serves it from dist/404.html with a 404 status.
export default function NotFound() {
  return (
    <SubpageLayout backTo="/" backLabel="Beranda" data-testid="not-found-page">
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="section-kicker">404</p>
        <h1 className="mt-3 font-heading text-2xl font-extrabold text-[#0a3358]">Halaman tidak ditemukan.</h1>
        <p className="mt-2 text-sm text-slate-500">Alamat ini mungkin salah ketik, atau halamannya sudah dipindahkan.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center rounded-full bg-[#0f4c81] px-5 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#0a3358]" data-testid="not-found-home-link">Ke beranda</Link>
          <Link to="/berita" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-extrabold text-[#0f4c81] transition-colors hover:text-emerald-600" data-testid="not-found-news-link">Lihat berita</Link>
        </div>
      </div>
    </SubpageLayout>
  );
}
