// The /media/<token> stand-ins for Google Drive ids (see backend/lib/media.py, which seals the
// public CMS content). Here they are opened again — only server-side, with MEDIA_KEY — and made
// for the album photos api/album.ts reads straight from Drive. Must stay byte-for-byte the same
// scheme as the backend: AES-256-GCM, its nonce an HMAC of the id, keys derived from MEDIA_KEY.
import { createCipheriv, createDecipheriv, createHmac } from "node:crypto";

const DRIVE_ID = /^[\w-]+$/;

function keys() {
  const secret = process.env.MEDIA_KEY?.trim();
  if (!secret) return null;
  const derive = (label: string) => createHmac("sha256", secret).update(label).digest();
  return { enc: derive("media:enc"), iv: derive("media:iv") };
}

/** The token for a Drive id, or null while MEDIA_KEY is unset. */
export function sealDriveId(id: string) {
  const key = keys();
  if (!key) return null;
  const nonce = createHmac("sha256", key.iv).update(id).digest().subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key.enc, nonce);
  return Buffer.concat([nonce, cipher.update(id, "utf8"), cipher.final(), cipher.getAuthTag()]).toString("base64url");
}

/** The Drive id inside a token this site made; null for anything else. */
export function openToken(token: string) {
  const key = keys();
  const sealed = Buffer.from(token, "base64url");
  if (!key || sealed.length <= 28) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.enc, sealed.subarray(0, 12));
    decipher.setAuthTag(sealed.subarray(-16));
    const id = Buffer.concat([decipher.update(sealed.subarray(12, -16)), decipher.final()]).toString("utf8");
    return DRIVE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** A Drive folder from the public gallery: its token opened, or as is when content isn't sealed (no MEDIA_KEY on the backend). */
export const resolveDriveId = (ref: string) => openToken(ref) ?? ref;

/** Where a picture read from a Drive folder is shown: through /media, or Google's own address while MEDIA_KEY is unset. */
export function drivePictureUrl(id: string) {
  const token = sealDriveId(id);
  return token ? `/media/${token}` : `https://lh3.googleusercontent.com/d/${id}`;
}
