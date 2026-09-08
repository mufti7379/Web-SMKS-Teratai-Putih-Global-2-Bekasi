import type { CMSItem } from "./cms";

declare global {
  interface Window {
    __PRELOAD__?: { hero?: Promise<CMSItem[] | null> };
  }
}

/**
 * Consumes the inline fetch kicked off in index.html's <head> — that request starts as
 * soon as the HTML begins parsing, running in parallel with the JS bundle download,
 * instead of only starting once React mounts and calls apiGet (which was the single
 * biggest contributor to the hero image's LCP delay). Read once — deleted after so a
 * stale response never masks a later real refetch (e.g. after a CMS edit).
 */
export function takePreloadedHero(): Promise<CMSItem[] | null> | undefined {
  const promise = window.__PRELOAD__?.hero;
  if (window.__PRELOAD__) delete window.__PRELOAD__.hero;
  return promise;
}
