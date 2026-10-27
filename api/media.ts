// /media/<token>?w=<pixels> (rewritten here by vercel.json): a picture kept in Google Drive,
// fetched from Google's image CDN at that width and passed on under this site's own address,
// so the browser never sees the Drive id. /media/preview/<token> forwards to Drive's video
// player instead (a Drive video only plays there). Tokens are made only by the backend and
// api/album.ts (see _lib/media.ts); anything else is a 404, so this can't fetch other files.
import { openToken } from "./_lib/media";

const MAX_WIDTH = 2400;
// Without ?w (e.g. "view full size" links), still not the original upload.
const DEFAULT_WIDTH = 2000;

const plain = (body: string, status: number, cacheControl: string) => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cacheControl } });

/**
 * The picture from Google's image CDN. Browsers that accept WebP (every current one says so
 * in its Accept header) get it converted with "-rw" — often a fifth of the JPEG/PNG size,
 * which was most of the mobile LCP. Link-preview crawlers (WhatsApp, Facebook) don't ask for
 * WebP and keep the original format; so does anything the conversion fails for.
 */
async function fetchPicture(id: string, width: number, webp: boolean) {
  const url = `https://lh3.googleusercontent.com/d/${id}=w${width}`;
  const converted = webp ? await fetch(`${url}-rw`).catch(() => null) : null;
  return converted?.ok ? converted : fetch(url).catch(() => null);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = openToken(params.get("token") ?? "");
  if (!id) return plain("Tidak ditemukan", 404, "public, s-maxage=86400");
  if (params.has("preview")) return new Response(null, { status: 302, headers: { location: `https://drive.google.com/file/d/${id}/preview`, "cache-control": "public, s-maxage=86400" } });

  const width = Math.min(MAX_WIDTH, Math.max(16, Math.round(Number(params.get("w"))) || DEFAULT_WIDTH));
  const upstream = await fetchPicture(id, width, request.headers.get("accept")?.includes("image/webp") ?? false);
  const type = upstream?.headers.get("content-type") ?? "";
  // Unshared, deleted or not a picture: retried after a minute, so fixing it in Drive shows soon.
  if (!upstream?.ok || !upstream.body || !type.startsWith("image/")) return plain("Gambar tidak tersedia", 502, "public, s-maxage=60");
  return new Response(upstream.body, {
    headers: {
      "content-type": type,
      // A changed picture in the CMS is a new token, so these copies can be kept a long time.
      "cache-control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000",
      // WebP or not depends on Accept. Vercel's CDN already keys on it; this tells every other cache.
      vary: "Accept",
      "x-content-type-options": "nosniff",
    },
  });
}

export const HEAD = GET;
