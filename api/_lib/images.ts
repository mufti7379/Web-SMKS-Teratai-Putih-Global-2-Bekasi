// Picture sizing — shared by the React app (frontend/src/lib/images.ts re-exports it) and the
// Vercel functions' share images. Dependency-free for the same CommonJS reason as newsPath.ts.

const DRIVE_HOST = "lh3.googleusercontent.com";
// A sealed Drive picture or file (see backend/lib/media.py); api/media.ts serves both as /media/<token>.
const SEALED = /^\/media\/(?:drive\/)?([\w-]+)(?:\?.*)?$/;

/** Whether a picture can be asked for at a given width. */
export const isResizableImage = (url: string) => url.includes(DRIVE_HOST) || SEALED.test(url.trim());

/**
 * CMS photos are kept in Google Drive and served at full upload resolution (often 1-2MB,
 * sometimes uncompressed PNG) — that's what was tanking mobile LCP. Google's own image CDN
 * accepts a "=w<pixels>" size suffix and resizes/re-encodes server-side, so request only the
 * width the layout actually needs instead of shipping the original. Sealed /media links pass
 * the width on as ?w=. Also trims stray whitespace some CMS entries were saved with.
 */
export function optimizeImageUrl(url: string | null | undefined, width: number): string | null {
  if (!url) return url ?? null;
  const trimmed = url.trim();
  const sealed = trimmed.match(SEALED);
  if (sealed) return `/media/${sealed[1]}?w=${width}`;
  if (!trimmed.includes(DRIVE_HOST)) return trimmed;
  const base = trimmed.replace(/=w\d+[^/]*$/, "");
  return `${base}=w${width}`;
}
