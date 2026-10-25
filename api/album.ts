// /data/album/<slug> (rewritten here by vercel.json): the pictures in an album's Google Drive
// folders, as JSON for the album page and the home page's album card. The folders come from the
// album's code setup and its published "Album dari Google Drive" entries in the CMS — never from
// the request — so this can't be used to read arbitrary Drive folders. Pictures come back as
// sealed /media links (see _lib/media.ts), so neither the folders nor the files are revealed.
import { albumDrivePictures } from "./_lib/drive";
import { albumDriveFolders } from "./_lib/gallery";
import { fetchPublishedGallery } from "./_lib/seo";

const json = (body: unknown, status: number, cacheControl: string) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cacheControl } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gallery = await fetchPublishedGallery(url.origin);
  if (!gallery) return json({ photos: [] }, 502, "public, s-maxage=30");
  const folders = albumDriveFolders(url.searchParams.get("album") ?? "", gallery);
  if (folders.length === 0) return json({ photos: [] }, 404, "public, s-maxage=300");
  const pictures = await albumDrivePictures(folders);
  // A Drive hiccup: say so briefly, so the CDN retries soon instead of caching a short album.
  if (!pictures) return json({ photos: [] }, 502, "public, s-maxage=30");
  // New pictures in a folder show up within 5 minutes; a stale list is served while refreshing.
  return json({ photos: pictures.map((src) => ({ src })) }, 200, "public, s-maxage=300, stale-while-revalidate=86400");
}

export const HEAD = GET;
