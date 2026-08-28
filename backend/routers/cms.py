import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db
from models.cms import (
    AdminLogin,
    AdminUser,
    CMSItem,
    CMSItemCreate,
    CMSItemUpdate,
    Lead,
    LeadCreate,
    LeadStatusUpdate,
    MessageResponse,
    ResourceType,
)


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SESSION_COOKIE = "school_admin_session"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def serialize_item(document: dict) -> CMSItem:
    document["created_at"] = normalize_datetime(document["created_at"])
    document["updated_at"] = normalize_datetime(document["updated_at"])
    return CMSItem(**document)


def serialize_lead(document: dict) -> Lead:
    document["created_at"] = normalize_datetime(document["created_at"])
    return Lead(**document)


async def require_admin(session_token: str | None) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Sesi admin diperlukan")
    token_hash = hashlib.sha256(session_token.encode()).hexdigest()
    session = await db.admin_sessions.find_one({"token_hash": token_hash})
    if not session or normalize_datetime(session["expires_at"]) <= utc_now():
        raise HTTPException(status_code=401, detail="Sesi admin tidak valid")
    admin = await db.admins.find_one({"id": session["admin_id"]})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin tidak ditemukan")
    return admin


@router.post("/auth/login", response_model=AdminUser)
async def login(payload: AdminLogin, request: Request, response: Response):
    admin = await db.admins.find_one({"email": payload.email.lower().strip()})
    if not admin or not pwd_context.verify(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    token = secrets.token_urlsafe(32)
    await db.admin_sessions.insert_one({
        "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        "admin_id": admin["id"],
        "expires_at": utc_now() + timedelta(days=7),
    })
    is_secure = request.headers.get("x-forwarded-proto", request.url.scheme) == "https"
    response.set_cookie(SESSION_COOKIE, token, httponly=True, secure=is_secure, samesite="lax", max_age=604800, path="/")
    return AdminUser(id=admin["id"], email=admin["email"], name=admin["name"])


@router.get("/auth/me", response_model=AdminUser)
async def me(school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    return AdminUser(id=admin["id"], email=admin["email"], name=admin["name"])


@router.post("/auth/logout", response_model=MessageResponse)
async def logout(response: Response, school_admin_session: str | None = Cookie(default=None)):
    if school_admin_session:
        token_hash = hashlib.sha256(school_admin_session.encode()).hexdigest()
        await db.admin_sessions.delete_one({"token_hash": token_hash})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return MessageResponse(message="Berhasil keluar")


@router.get("/content/{resource}", response_model=list[CMSItem])
async def public_content(resource: ResourceType):
    documents = await db.cms_items.find({"resource": resource, "is_published": True}, {"_id": 0}).sort("date", 1).to_list(200)
    return [serialize_item(document) for document in documents]


@router.get("/admin/content/{resource}", response_model=list[CMSItem])
async def admin_content(resource: ResourceType, school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    documents = await db.cms_items.find({"resource": resource}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_item(document) for document in documents]


@router.post("/admin/content", response_model=CMSItem, status_code=201)
async def create_content(payload: CMSItemCreate, school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    item = CMSItem(**payload.model_dump())
    await db.cms_items.insert_one(item.model_dump())
    return item


@router.patch("/admin/content/{item_id}", response_model=CMSItem)
async def update_content(item_id: str, payload: CMSItemUpdate, school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    changes = payload.model_dump(exclude_unset=True)
    changes["updated_at"] = utc_now()
    document = await db.cms_items.find_one_and_update({"id": item_id}, {"$set": changes}, return_document=True, projection={"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return serialize_item(document)


@router.delete("/admin/content/{item_id}", response_model=MessageResponse)
async def delete_content(item_id: str, school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    result = await db.cms_items.delete_one({"id": item_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return MessageResponse(message="Konten dihapus")


@router.post("/leads", response_model=Lead, status_code=201)
async def create_lead(payload: LeadCreate):
    lead = Lead(**payload.model_dump())
    await db.leads.insert_one(lead.model_dump())
    return lead


@router.get("/admin/leads", response_model=list[Lead])
async def list_leads(school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    documents = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [serialize_lead(document) for document in documents]


@router.patch("/admin/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, payload: LeadStatusUpdate, school_admin_session: str | None = Cookie(default=None)):
    await require_admin(school_admin_session)
    document = await db.leads.find_one_and_update({"id": lead_id}, {"$set": {"status": payload.status}}, return_document=True, projection={"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return serialize_lead(document)