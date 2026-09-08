const DRIVE_HOST = "lh3.googleusercontent.com";

/**
 * CMS photos come back as Google Drive "lh3.googleusercontent.com" links served at full
 * upload resolution (often 1-2MB, sometimes uncompressed PNG) — that's what was tanking
 * mobile LCP. Google's own image CDN accepts a "=w<pixels>" size suffix and resizes/
 * re-encodes server-side, so request only the width the layout actually needs instead of
 * shipping the original. Also trims stray whitespace some CMS entries were saved with.
 */
export function optimizeImageUrl(url: string | null | undefined, width: number): string | null {
  if (!url) return url ?? null;
  const trimmed = url.trim();
  if (!trimmed.includes(DRIVE_HOST)) return trimmed;
  const base = trimmed.replace(/=w\d+[^/]*$/, "");
  return `${base}=w${width}`;
}
