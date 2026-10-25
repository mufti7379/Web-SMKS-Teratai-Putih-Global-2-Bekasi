// Gallery albums and media — shared by the React app (frontend/src/lib/gallery.ts re-exports
// it) and the Vercel functions (album photos, album page tags, sitemap). Lives here, free of
// packages, for the same CommonJS reason as newsPath.ts.
//
// An album (a gallery category, e.g. "Perpisahan 2025") lives on /galeri/<slug> and is managed
// entirely in the CMS. Its photos come from, in this order:
//  1. Google Drive folders — every CMS gallery entry whose URL is a Drive *folder* link (added
//     in the admin as "Album dari Google Drive"). Every picture in those folders shows
//     automatically (read by api/album.ts, cached ~5 minutes);
//  2. single CMS gallery items whose "Album" field (stored in `badge`) names the album.
// Items filed under an album leave the home page's activity stack for the album page.
import { optimizeImageUrl } from "./images";

export type AlbumRef = { badge: string | null; title?: string; image_url?: string | null; created_at?: string };

export function albumSlug(name: string) {
  return name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "album";
}

/**
 * The folder in a Google Drive folder link ("…/drive/folders/<id>", also "…/drive/u/0/folders/<id>"),
 * or — in public content, where the backend seals it as "/media/folder/<token>" — its token; null otherwise.
 */
export function driveFolderId(url: string) {
  return url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)|^\s*\/media\/folder\/([\w-]+)/)?.slice(1).find(Boolean) ?? null;
}

const isFolderEntry = (item: AlbumRef) => Boolean(item.image_url && driveFolderId(item.image_url));

/** The album an item belongs to: its Album field, or — for a Drive folder entry left without one — its title. */
export function albumOf(item: AlbumRef) {
  return item.badge?.trim() || (isFolderEntry(item) ? item.title?.trim() || null : null);
}

export function isInAlbum(item: AlbumRef, slug: string) {
  const album = albumOf(item);
  return album !== null && albumSlug(album) === slug;
}

/** Every album found in the gallery, one per slug, in the order they first appear. */
export function listAlbums(items: AlbumRef[]) {
  const albums = new Map<string, string>();
  for (const name of items.map(albumOf)) {
    if (name && !albums.has(albumSlug(name))) albums.set(albumSlug(name), name);
  }
  return [...albums].map(([slug, name]) => ({ slug, name }));
}

/**
 * Drive folders feeding an album — its folder entries in the order they were added, without
 * repeats. Only folders published in the CMS are ever listed, so api/album.ts can't be used to
 * read arbitrary Drive folders.
 */
export function albumDriveFolders(slug: string, items: AlbumRef[]) {
  const entries = items.filter((item) => isFolderEntry(item) && isInAlbum(item, slug)).sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
  return [...new Set(entries.map((item) => driveFolderId(item.image_url ?? "")).filter((id): id is string => Boolean(id)))];
}

export type GalleryMedia =
  | { kind: "image"; src: string }
  // `still` is the file as a picture, `player` Drive's video player for it.
  | { kind: "drive"; still: string; player: string }
  | { kind: "folder"; id: string }
  | { kind: "youtube"; id: string }
  | { kind: "file"; src: string };

/** What a gallery item's URL points at: a picture, a Google Drive file or folder, a YouTube video or an uploaded video file. */
export function galleryMedia(url: string): GalleryMedia {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (youtube) return { kind: "youtube", id: youtube[1] };
  const folder = driveFolderId(url);
  if (folder) return { kind: "folder", id: folder };
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return { kind: "drive", still: `https://lh3.googleusercontent.com/d/${drive[1]}`, player: `https://drive.google.com/file/d/${drive[1]}/preview` };
  // The same, sealed in public content — served by api/media.ts.
  const sealed = url.match(/^\s*\/media\/drive\/([\w-]+)/);
  if (sealed) return { kind: "drive", still: `/media/${sealed[1]}`, player: `/media/preview/${sealed[1]}` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { kind: "file", src: url };
  return { kind: "image", src: url.trim() };
}

/** A still for a tile or a share preview (Drive files via Google's image CDN); null for folders and uploaded videos. */
export function galleryStill(media: GalleryMedia, width: number) {
  if (media.kind === "youtube") return `https://img.youtube.com/vi/${media.id}/hqdefault.jpg`;
  if (media.kind === "drive" || media.kind === "image") return optimizeImageUrl(media.kind === "drive" ? media.still : media.src, width);
  return null;
}

/** Album photos that are single items (not folder entries — those expand into their pictures). */
export const isSinglePhoto = (item: AlbumRef) => Boolean(item.image_url) && !isFolderEntry(item);
