"""Keeps Google Drive links out of public content.

Every Drive file or folder in a CMS item's image is replaced by an opaque, encrypted token on
this site's own address — /media/<token> for a picture, /media/drive/<token> for a Drive file
(the gallery plays those as videos), /media/folder/<token> for an album folder. Only the
frontend deployment's functions can open a token again (api/media.ts streams the picture from
Google, api/album.ts lists the folder), so visitors never learn the Drive ids or links.

Sealing must match api/_lib/media.ts exactly, with the same MEDIA_KEY set on both Vercel
projects. Without MEDIA_KEY links pass through unchanged, so the site keeps working unsealed.
"""
import base64
import hashlib
import hmac
import os
import re

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_FOLDER = re.compile(r"drive\.google\.com/drive/(?:u/\d+/)?folders/([\w-]+)")
_FILE = re.compile(r"drive\.google\.com/file/d/([\w-]+)")
_PICTURE = re.compile(r"lh3\.googleusercontent\.com/d/([\w-]+)|(?:drive|docs)\.google\.com/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([\w-]+)|drive\.usercontent\.google\.com/\w+\?(?:[^#]*&)?id=([\w-]+)")


def _keys() -> tuple[bytes, bytes] | None:
    secret = os.environ.get("MEDIA_KEY", "").strip().encode()
    if not secret:
        return None
    return hmac.new(secret, b"media:enc", hashlib.sha256).digest(), hmac.new(secret, b"media:iv", hashlib.sha256).digest()


def seal_drive_id(drive_id: str, keys: tuple[bytes, bytes]) -> str:
    enc_key, iv_key = keys
    # The nonce comes from the id itself, so a file always gets the same token (and stays
    # cached) while the id itself stays unreadable.
    nonce = hmac.new(iv_key, drive_id.encode(), hashlib.sha256).digest()[:12]
    sealed = nonce + AESGCM(enc_key).encrypt(nonce, drive_id.encode(), None)
    return base64.urlsafe_b64encode(sealed).rstrip(b"=").decode()


def mask_drive_url(url: str | None) -> str | None:
    """A Drive link swapped for its /media/… stand-in; anything else (and every link while MEDIA_KEY is unset) unchanged."""
    keys = _keys()
    if not url or not keys:
        return url
    if match := _FOLDER.search(url):
        return f"/media/folder/{seal_drive_id(match[1], keys)}"
    if match := _FILE.search(url):
        return f"/media/drive/{seal_drive_id(match[1], keys)}"
    if match := _PICTURE.search(url):
        return f"/media/{seal_drive_id(next(group for group in match.groups() if group), keys)}"
    return url
