import { queryOptions } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CMSItem } from "@/lib/cms";

// One query for the home page grid and the album pages, so moving between them reuses the fetch.
export const galleryQuery = queryOptions({ queryKey: ["public-content", "gallery"], queryFn: () => apiGet<CMSItem[]>("/content/gallery"), retry: false });

export type DriveAlbumPhoto = { id: string; name: string };

/** Pictures in an album's Google Drive folders (via api/album.ts). Pass `hasFolders` = albumDriveFolders(slug, items).length > 0. */
export const albumPhotosQuery = (slug: string, hasFolders: boolean) => queryOptions({
  queryKey: ["album-photos", slug],
  queryFn: async () => {
    const response = await fetch(`/data/album/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error(`album photos failed with ${response.status}`);
    return ((await response.json()) as { photos: DriveAlbumPhoto[] }).photos;
  },
  enabled: hasFolders,
  retry: false,
  staleTime: 5 * 60_000,
});

// Shared with the Vercel functions that list album photos, build album page tags and the sitemap (see that file).
export { albumDriveFolders, albumOf, albumSlug, driveFolderId, galleryMedia, galleryStill, isInAlbum, isSinglePhoto, listAlbums } from "../../../api/_lib/gallery";
export type { GalleryMedia } from "../../../api/_lib/gallery";
