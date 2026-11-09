// /media/<token>?w=<pixels> (rewritten here by vercel.json): a picture kept in Google Drive,
// fetched from Google's image CDN at that width and passed on under this site's own address,
// so the browser never sees the Drive id. /media/preview/<token> forwards to Drive's video
// player instead (a Drive video only plays there), and /media/open/<token> to the Drive page of
// a file or folder linked from an item's text or "link". Tokens are made only by the backend and
// api/album.ts (see _lib/media.ts); anything else is a 404, so this can't fetch other files.
import { openLink, openToken } from "./_lib/media";

const MAX_WIDTH = 2400;
// Without ?w (e.g. "view full size" links), still not the original upload.
const DEFAULT_WIDTH = 2000;

const plain = (body: string, status: number, cacheControl: string) => new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cacheControl } });

/**
 * Whether Google sent a lossless picture with nothing see-through in it: a photo uploaded as a
 * PNG, or the WebP it converts one into, which stays lossless too. Those were 300KB-1.2MB where
 * a photo needs ~100KB (the hero's 960px one alone was 708KB). Logos with transparency are
 * lossless with alpha and stay as they are.
 */
export function isOpaqueLossless(bytes: Uint8Array) {
  const ascii = (at: number, length: number) => String.fromCharCode(...bytes.subarray(at, at + length));
  const uint32 = (at: number, littleEndian: boolean) => new DataView(bytes.buffer, bytes.byteOffset + at, 4).getUint32(0, littleEndian);
  if (bytes.length >= 33 && ascii(1, 3) === "PNG") {
    // Grey or RGB without a tRNS chunk before the pixel data; RGBA and palettes may be see-through.
    if (bytes[25] !== 0 && bytes[25] !== 2) return false;
    for (let at = 8; at + 8 <= bytes.length; at += 12 + uint32(at, false)) {
      const type = ascii(at + 4, 4);
      if (type === "tRNS") return false;
      if (type === "IDAT") return true;
    }
    return false;
  }
  if (bytes.length < 21 || ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") return false;
  let alpha = false;
  for (let at = 12; at + 8 <= bytes.length;) {
    const type = ascii(at, 4);
    const size = uint32(at + 4, true);
    if (type === "VP8X") alpha = Boolean(bytes[at + 8] & 0x10);
    if (type === "VP8 ") return false; // already lossy
    // Lossless: after its 0x2f signature, 28 bits of size and then the alpha_is_used bit.
    if (type === "VP8L") return at + 13 <= bytes.length && !alpha && !((uint32(at + 9, true) >>> 28) & 1);
    at += 8 + size + (size & 1);
  }
  return false;
}

/**
 * The picture from Google's image CDN. Browsers that accept WebP (every current one says so
 * in its Accept header) get it converted with "-rw" — often a fifth of the JPEG/PNG size,
 * which was most of the mobile LCP. Link-preview crawlers (WhatsApp, Facebook) don't ask for
 * WebP and keep the original format; so does anything the conversion fails for. A photo kept
 * as PNG comes back lossless either way, and goes out as a JPEG ("-rj") instead.
 */
async function fetchPicture(id: string, width: number, webp: boolean) {
  const url = `https://lh3.googleusercontent.com/d/${id}=w${width}`;
  const converted = webp ? await fetch(`${url}-rw`).catch(() => null) : null;
  const upstream = converted?.ok ? converted : await fetch(url).catch(() => null);
  const type = upstream?.headers.get("content-type") ?? "";
  if (!upstream?.ok || !type.startsWith("image/")) return null;
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  if (isOpaqueLossless(bytes)) {
    const jpeg = await fetch(`${url}-rj`).catch(() => null);
    const jpegType = jpeg?.headers.get("content-type") ?? "";
    if (jpeg?.ok && jpegType.startsWith("image/")) return { type: jpegType, body: new Uint8Array(await jpeg.arrayBuffer()) };
  }
  return { type, body: bytes };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.has("open")) {
    const page = openLink(params.get("token") ?? "");
    return page ? new Response(null, { status: 302, headers: { location: page, "cache-control": "public, s-maxage=86400" } }) : plain("Tidak ditemukan", 404, "public, s-maxage=86400");
  }
  const id = openToken(params.get("token") ?? "");
  if (!id) return plain("Tidak ditemukan", 404, "public, s-maxage=86400");
  if (params.has("preview")) return new Response(null, { status: 302, headers: { location: `https://drive.google.com/file/d/${id}/preview`, "cache-control": "public, s-maxage=86400" } });

  const width = Math.min(MAX_WIDTH, Math.max(16, Math.round(Number(params.get("w"))) || DEFAULT_WIDTH));
  const picture = await fetchPicture(id, width, request.headers.get("accept")?.includes("image/webp") ?? false);
  // Unshared, deleted or not a picture: retried after a minute, so fixing it in Drive shows soon.
  if (!picture) return plain("Gambar tidak tersedia", 502, "public, s-maxage=60");
  return new Response(picture.body, {
    headers: {
      "content-type": picture.type,
      // A changed picture in the CMS is a new token, so these copies can be kept a long time.
      "cache-control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000",
      // WebP or not depends on Accept. Vercel's CDN already keys on it; this tells every other cache.
      vary: "Accept",
      "x-content-type-options": "nosniff",
    },
  });
}

export const HEAD = GET;
