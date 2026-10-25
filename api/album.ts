// /data/album/<slug> (rewritten here by vercel.json): the pictures in an album's Google Drive
// folders, as JSON for the album page and the home page's album card. The folders come from the
// album's code setup and its published "Album dari Google Drive" entries in the CMS — never from
// the request — so this can't be used to read arbitrary Drive folders.
import { listDriveImages } from "./_lib/drive";
import { albumDriveFolders } from "./_lib/gallery";
import { fetchPublishedGallery } from "./_lib/seo";

const json = (body: unknown, status: number, cacheControl: string) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cacheControl } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gallery = await fetchPublishedGallery(url.origin);
  if (!gallery) return json({ photos: [] }, 502, "public, s-maxage=30");
  const folders = albumDriveFolders(url.searchParams.get("album") ?? "", gallery);
  if (folders.length === 0) return json({ photos: [] }, 404, "public, s-maxage=300");
  const listings = await Promise.all(folders.map(listDriveImages));
  // A Drive hiccup: say so briefly, so the CDN retries soon instead of caching a short album.
  if (listings.some((files) => files === null)) return json({ photos: [] }, 502, "public, s-maxage=30");
  // Folder after folder, each in name order; a picture in two folders shows once.
  const seen = new Set<string>();
  const photos = listings.flatMap((files) => files ?? []).filter((file) => {
    if (seen.has(file.id)) return false;
    seen.add(file.id);
    return true;
  });
  // New pictures in a folder show up within 5 minutes; a stale list is served while refreshing.
  return json({ photos }, 200, "public, s-maxage=300, stale-while-revalidate=86400");
}

export const HEAD = GET;
