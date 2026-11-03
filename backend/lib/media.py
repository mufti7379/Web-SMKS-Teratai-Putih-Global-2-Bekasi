"""Keeps Google Drive links out of public content.

Every Drive file or folder in a CMS item's image is replaced by an opaque, encrypted token on
this site's own address — /media/<token> for a picture, /media/drive/<token> for a Drive file
(the gallery plays those as videos), /media/folder/<token> for an album folder. Only the
frontend deployment's functions can open a token again (api/media.ts streams the picture from
Google, api/album.ts lists the folder), so visitors never learn the Drive ids or links.

Drive addresses typed into an item's text or its "link" are sealed too (mask_drive_links):
pictures into /media/<token> as above, files and folders into /media/open/<token>, which
forwards a visitor who follows it to the Drive page. Those tokens hold "file:", "folder:" or
"open:" before the id, so /media/open can't be used to open an album folder's token.

Sealing must match api/_lib/media.ts exactly, with the same MEDIA_KEY set on both Vercel
projects. Without MEDIA_KEY links pass through unchanged, so the site keeps working unsealed.
"""
import base64
import hashlib
import hmac
import os
import re

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

SITE_URL = "https://www.smk-terataiputih2.sch.id"

_FOLDER = re.compile(r"drive\.google\.com/drive/(?:u/\d+/)?folders/([\w-]+)")
_FILE = re.compile(r"drive\.google\.com/file/d/([\w-]+)")
# Always a picture.
_SHOWN = re.compile(r"lh3\.googleusercontent\.com/d/([\w-]+)|(?:drive|docs)\.google\.com/thumbnail\?(?:[^#]*&)?id=([\w-]+)")
# Any file — a picture when it's an item's image, but in text it may as well be a PDF.
_OPENED = re.compile(r"(?:drive|docs)\.google\.com/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)|drive\.usercontent\.google\.com/\w+\?(?:[^#]*&)?id=([\w-]+)")
# A Google address in text, up to the next space; the punctuation closing a sentence isn't part of it.
_DRIVE_URL = re.compile(r"(?:https?://)?(?:drive\.google\.com|docs\.google\.com|drive\.usercontent\.google\.com|lh3\.googleusercontent\.com)/[^\s<>\"'|]*[^\s<>\"'|.,;:!?)\]]")


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
    if match := _SHOWN.search(url) or _OPENED.search(url):
        return f"/media/{seal_drive_id(_first(match), keys)}"
    return url


def _first(match: re.Match) -> str:
    return next(group for group in match.groups() if group)


def _seal_link(url: str, keys: tuple[bytes, bytes]) -> str:
    if match := _FOLDER.search(url):
        target = f"folder:{match[1]}"
    elif match := _FILE.search(url):
        target = f"file:{match[1]}"
    elif match := _SHOWN.search(url):
        return f"{SITE_URL}/media/{seal_drive_id(_first(match), keys)}"
    elif match := _OPENED.search(url):
        target = f"open:{_first(match)}"
    else:
        # Docs, Sheets, Forms: not Drive files, left as they are.
        return url
    return f"{SITE_URL}/media/open/{seal_drive_id(target, keys)}"


def mask_drive_links(text: str | None) -> str | None:
    """Every Drive address in a piece of text (an article, a "link" field) swapped for a full address on this site; unchanged while MEDIA_KEY is unset."""
    keys = _keys()
    if not text or not keys:
        return text
    return _DRIVE_URL.sub(lambda match: _seal_link(match[0], keys), text)
