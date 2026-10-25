// Lists the pictures in a public Google Drive folder without an API key, through Drive's
// long-standing (but undocumented) embeddable folder view. The folder must be shared as
// "Anyone with the link". If Google ever drops that page, replace this with the official
// Drive API (files.list with an API key) — callers only need { id, name }.

export type DriveFile = { id: string; name: string };

const IMAGE_NAME = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
const decodeEntities = (value: string) => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Image files in the folder (subfolders and other files skipped), in natural name order; null if Drive can't be reached. */
export async function listDriveImages(folderId: string): Promise<DriveFile[] | null> {
  try {
    const response = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`);
    if (!response.ok) return null;
    const html = await response.text();
    const files = html.split('<div class="flip-entry"').slice(1).flatMap((entry) => {
      const id = entry.match(/<a href="[^"]*\/file\/d\/([\w-]+)/)?.[1];
      const name = decodeEntities(entry.match(/flip-entry-title">([^<]*)/)?.[1] ?? "");
      return id && IMAGE_NAME.test(name) ? [{ id, name }] : [];
    });
    // Natural order, so "2.JPG" comes before "10.JPG".
    return files.sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true }));
  } catch {
    return null;
  }
}
