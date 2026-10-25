import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { AlbumCarousel, AlbumCarouselSkeleton } from "@/components/AlbumCarousel";
import { SubpageLayout } from "@/components/SubpageLayout";
import { albumDriveFolders, albumPhotosQuery, galleryMedia, galleryQuery, galleryStill, isInAlbum, isSinglePhoto, listAlbums } from "@/lib/gallery";
import type { GalleryMedia } from "@/lib/gallery";

type AlbumPhoto = { key: string; title: string; description: string | null; media: GalleryMedia };

// In an album, Google Drive files are treated as photos (shown through Google's image CDN) —
// albums are mostly event photos; videos belong on YouTube. `card` sizes the carousel, `full`
// the full-screen viewer.
function albumMedia(media: GalleryMedia) {
  const isVideo = media.kind === "youtube" || media.kind === "file";
  const card = galleryStill(media, 1000);
  const full = media.kind === "image" || media.kind === "drive" ? galleryStill(media, 1600) : null;
  return { media, isVideo, card, full };
}

// One photo album at /galeri/<slug>, e.g. /galeri/perpisahan-2025: the pictures in its Google
// Drive folder (if it has one), then every gallery item whose CMS "Album" field names it, in
// upload order — in a coverflow carousel with a full-screen viewer. Both share one position.
export default function GalleryAlbum() {
  const { album = "" } = useParams();
  const slug = album.toLowerCase();
  const gallery = useQuery(galleryQuery);
  const items = gallery.data ?? [];
  // Folder entries live in the gallery, so the Drive photos are only asked for once it has loaded.
  const drivePhotos = useQuery(albumPhotosQuery(slug, albumDriveFolders(slug, items).length > 0));
  const albumName = listAlbums(items).find((entry) => entry.slug === slug)?.name ?? null;
  const photos: AlbumPhoto[] = [
    ...(drivePhotos.data ?? []).map((photo, index) => ({ key: photo.src, title: `${albumName ?? "Foto"} — foto ${index + 1}`, description: null, media: { kind: "image", src: photo.src } as const })),
    ...items.filter((item) => isSinglePhoto(item) && isInAlbum(item, slug)).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((item) => ({ key: item.id, title: item.title, description: item.description || null, media: galleryMedia(item.image_url ?? "") })),
  ];
  // isLoading, not isPending: a disabled query (album without a Drive folder) stays "pending" forever.
  const loading = gallery.isPending || drivePhotos.isLoading;
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const current = photos[index] ?? null;
  const step = (delta: number) => setIndex((position) => (position + delta + photos.length) % photos.length);

  useEffect(() => {
    if (!albumName) return;
    const previousTitle = document.title;
    document.title = `Galeri ${albumName} — SMK Teratai Putih Global 2 Bekasi`;
    return () => { document.title = previousTitle; };
  }, [albumName]);

  // Arrow keys move the carousel (or the viewer, which follows the same position); Escape closes the viewer.
  useEffect(() => {
    if (photos.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <SubpageLayout backTo="/#galeri" backLabel="Beranda" wide data-testid="gallery-album-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-kicker">Galeri sekolah</p>
          <h1 className="section-heading mt-3" data-testid="gallery-album-title">{loading ? "Memuat album…" : albumName ? `Galeri ${albumName}` : "Album tidak ditemukan"}</h1>
        </div>
        {albumName && photos.length > 0 && <p className="text-sm text-slate-500" data-testid="gallery-album-count">{photos.length} foto · geser atau klik foto di samping untuk berpindah</p>}
      </div>

      {loading ? (
        <div className="mt-4"><AlbumCarouselSkeleton /></div>
      ) : !albumName || photos.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center" data-testid="gallery-album-empty">
          <Images size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{gallery.isError || drivePhotos.isError ? "Galeri belum bisa dimuat. Silakan muat ulang halaman beberapa saat lagi." : albumName ? "Foto untuk album ini belum tersedia. Segera kami tambahkan." : "Album yang Anda cari tidak ada."}</p>
        </div>
      ) : (
        <div className="mt-4">
          <AlbumCarousel
            photos={photos.map((photo) => { const { card, isVideo } = albumMedia(photo.media); return { key: photo.key, title: photo.title, image: card, isVideo }; })}
            index={Math.min(index, photos.length - 1)}
            onIndexChange={setIndex}
            onOpen={() => setViewerOpen(true)}
          />
        </div>
      )}

      {viewerOpen && current && (() => {
        const { media, full } = albumMedia(current.media);
        return (
          <div role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setViewerOpen(false)} className="fixed inset-0 z-[60] flex flex-col bg-[#061e34]/95 backdrop-blur-sm" data-testid="gallery-album-viewer">
            <div className="flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-300 sm:px-6">
              <span data-testid="gallery-album-viewer-counter">{index + 1} / {photos.length}</span>
              <button type="button" onClick={() => setViewerOpen(false)} className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" aria-label="Tutup" data-testid="gallery-album-viewer-close"><X size={20} /></button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
              <div onClick={(event) => event.stopPropagation()} className="flex max-h-full w-full items-center justify-center">
                {media.kind === "youtube" ? <iframe className="aspect-video w-full max-w-5xl rounded-xl" src={`https://www.youtube.com/embed/${media.id}?rel=0&autoplay=1`} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  : media.kind === "file" ? <video className="max-h-[75vh] max-w-full rounded-xl" src={media.src} controls autoPlay />
                  : <img src={full ?? ""} alt={current.title} className="max-h-[75vh] max-w-full rounded-xl object-contain" data-testid="gallery-album-viewer-image" />}
              </div>
              {photos.length > 1 && <>
                <button type="button" onClick={(event) => { event.stopPropagation(); step(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:left-4" aria-label="Foto sebelumnya" data-testid="gallery-album-viewer-prev"><ChevronLeft size={22} /></button>
                <button type="button" onClick={(event) => { event.stopPropagation(); step(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:right-4" aria-label="Foto berikutnya" data-testid="gallery-album-viewer-next"><ChevronRight size={22} /></button>
              </>}
            </div>
            <div className="px-4 pb-6 pt-3 text-center sm:px-6">
              <p className="font-heading text-base font-bold text-white">{current.title}</p>
              {current.description && <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{current.description}</p>}
            </div>
          </div>
        );
      })()}
    </SubpageLayout>
  );
}
