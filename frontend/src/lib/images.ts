import { isResizableImage, optimizeImageUrl } from "../../../api/_lib/images";

// Shared with the Vercel functions that build share images (see that file).
export { optimizeImageUrl };

/**
 * Builds a "srcset" string requesting several widths of the same drive image so the browser
 * can pick the one that matches the viewport instead of every device downloading one
 * fixed-size (often way-too-large-for-mobile) file. No-op for non-drive URLs — returns
 * undefined so callers can skip the srcSet attribute entirely.
 */
export function buildDriveSrcSet(url: string | null | undefined, widths: number[]): string | undefined {
  if (!url || !isResizableImage(url)) return undefined;
  return widths.map((width) => `${optimizeImageUrl(url, width)} ${width}w`).join(", ");
}
