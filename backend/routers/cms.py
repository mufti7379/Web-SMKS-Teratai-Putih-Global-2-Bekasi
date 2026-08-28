import hashlib
import io
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from passlib.context import CryptContext

from lib.db import db
from models.cms import (
    AdminLogin,
    AdminAccount,
    AdminAccountCreate,
    AdminAccountUpdate,
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
CONTENT_ROLES = {
    "super_admin": {"news", "agenda", "gallery", "major"},
    "content_editor": {"news", "gallery", "major"},
    "agenda_manager": {"agenda"},
    "ppdb_officer": set(),
}


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


def serialize_admin(document: dict) -> AdminAccount:
    if "created_at" in document:
        document["created_at"] = normalize_datetime(document["created_at"])
    return AdminAccount(**document)


def ensure_content_permission(admin: dict, resource: ResourceType) -> None:
    if resource not in CONTENT_ROLES.get(admin.get("role", ""), set()):
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk konten ini")


def ensure_leads_permission(admin: dict) -> None:
    if admin.get("role") not in {"super_admin", "ppdb_officer"}:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke data pendaftar")


def ensure_super_admin(admin: dict) -> None:
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Hanya Super Admin yang dapat mengelola akun")


def build_lead_query(kind: str | None, status: str | None, start_date: str | None, end_date: str | None) -> dict:
    query: dict = {}
    if kind:
        query["kind"] = kind
    if status:
        query["status"] = status
    if start_date or end_date:
        date_query: dict = {}
        try:
            if start_date:
                date_query["$gte"] = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if end_date:
                date_query["$lt"] = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Format tanggal harus YYYY-MM-DD") from exc
        query["created_at"] = date_query
    return query


async def require_admin(session_token: str | None) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Sesi admin diperlukan")
    token_hash = hashlib.sha256(session_token.encode()).hexdigest()
    session = await db.admin_sessions.find_one({"token_hash": token_hash})
    if not session or normalize_datetime(session["expires_at"]) <= utc_now():
        raise HTTPException(status_code=401, detail="Sesi admin tidak valid")
    admin = await db.admins.find_one({"id": session["admin_id"]})
    if not admin or not admin.get("is_active", True):
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
    return AdminUser(id=admin["id"], email=admin["email"], name=admin["name"], role=admin.get("role", "super_admin"))


@router.get("/auth/me", response_model=AdminUser)
async def me(school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    return AdminUser(id=admin["id"], email=admin["email"], name=admin["name"], role=admin.get("role", "super_admin"))


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
    admin = await require_admin(school_admin_session)
    ensure_content_permission(admin, resource)
    documents = await db.cms_items.find({"resource": resource}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_item(document) for document in documents]


@router.post("/admin/content", response_model=CMSItem, status_code=201)
async def create_content(payload: CMSItemCreate, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_content_permission(admin, payload.resource)
    item = CMSItem(**payload.model_dump())
    await db.cms_items.insert_one(item.model_dump())
    return item


@router.patch("/admin/content/{item_id}", response_model=CMSItem)
async def update_content(item_id: str, payload: CMSItemUpdate, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    existing = await db.cms_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    ensure_content_permission(admin, existing["resource"])
    changes = payload.model_dump(exclude_unset=True)
    changes["updated_at"] = utc_now()
    document = await db.cms_items.find_one_and_update({"id": item_id}, {"$set": changes}, return_document=True, projection={"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return serialize_item(document)


@router.delete("/admin/content/{item_id}", response_model=MessageResponse)
async def delete_content(item_id: str, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    existing = await db.cms_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    ensure_content_permission(admin, existing["resource"])
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
async def list_leads(kind: str | None = None, status: str | None = None, start_date: str | None = None, end_date: str | None = None, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_leads_permission(admin)
    documents = await db.leads.find(build_lead_query(kind, status, start_date, end_date), {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [serialize_lead(document) for document in documents]


@router.get("/admin/leads/export.xlsx")
async def export_leads(kind: str | None = None, status: str | None = None, start_date: str | None = None, end_date: str | None = None, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_leads_permission(admin)
    documents = await db.leads.find(build_lead_query(kind, status, start_date, end_date), {"_id": 0}).sort("created_at", -1).to_list(10000)
    leads = [serialize_lead(document) for document in documents]
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Data Leads"
    headers = ["ID", "Jenis", "Nama", "WhatsApp", "Jurusan", "Pertanyaan", "Status", "Waktu Masuk"]
    sheet.append(headers)
    header_fill = PatternFill("solid", fgColor="0F4C81")
    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = Font(color="FFFFFF", bold=True)
    for lead in leads:
        sheet.append([lead.id, lead.kind, lead.name, lead.phone, lead.major or "", lead.question or "", lead.status, lead.created_at.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")])
    widths = [38, 12, 24, 18, 18, 45, 16, 22]
    for index, width in enumerate(widths, 1):
        sheet.column_dimensions[chr(64 + index)].width = width
    summary = workbook.create_sheet("Ringkasan")
    summary.append(["Ringkasan Ekspor Leads", "Jumlah"])
    summary.append(["Total data", len(leads)])
    summary.append(["Pendaftar PPDB", sum(lead.kind == "ppdb" for lead in leads)])
    summary.append(["Pertanyaan kontak", sum(lead.kind == "contact" for lead in leads)])
    summary.append(["Status baru", sum(lead.status == "new" for lead in leads)])
    summary.append(["Tindak lanjut", sum(lead.status == "follow_up" for lead in leads)])
    summary.append(["Selesai", sum(lead.status == "done" for lead in leads)])
    summary.append(["Filter jenis", kind or "Semua"])
    summary.append(["Filter status", status or "Semua"])
    summary.append(["Rentang tanggal", f"{start_date or '-'} s/d {end_date or '-'}"])
    for cell in summary[1]:
        cell.fill = header_fill
        cell.font = Font(color="FFFFFF", bold=True)
    summary.column_dimensions["A"].width = 28
    summary.column_dimensions["B"].width = 28
    stream = io.BytesIO()
    workbook.save(stream)
    stream.seek(0)
    filename = f"leads-teratai-{utc_now().date().isoformat()}.xlsx"
    return StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.patch("/admin/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, payload: LeadStatusUpdate, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_leads_permission(admin)
    document = await db.leads.find_one_and_update({"id": lead_id}, {"$set": {"status": payload.status}}, return_document=True, projection={"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return serialize_lead(document)


@router.get("/admin/users", response_model=list[AdminAccount])
async def list_admins(school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_super_admin(admin)
    documents = await db.admins.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", 1).to_list(100)
    return [serialize_admin(document) for document in documents]


@router.post("/admin/users", response_model=AdminAccount, status_code=201)
async def create_admin(payload: AdminAccountCreate, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_super_admin(admin)
    email = payload.email.lower().strip()
    if await db.admins.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email admin sudah digunakan")
    account = AdminAccount(email=email, name=payload.name, role=payload.role)
    document = account.model_dump()
    document["password_hash"] = pwd_context.hash(payload.password)
    await db.admins.insert_one(document)
    return account


@router.patch("/admin/users/{admin_id}", response_model=AdminAccount)
async def update_admin(admin_id: str, payload: AdminAccountUpdate, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_super_admin(admin)
    changes = payload.model_dump(exclude_unset=True, exclude={"password"})
    if payload.password:
        changes["password_hash"] = pwd_context.hash(payload.password)
    document = await db.admins.find_one_and_update({"id": admin_id}, {"$set": changes}, return_document=True, projection={"_id": 0, "password_hash": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Akun staf tidak ditemukan")
    return serialize_admin(document)


@router.delete("/admin/users/{admin_id}", response_model=MessageResponse)
async def delete_admin(admin_id: str, school_admin_session: str | None = Cookie(default=None)):
    admin = await require_admin(school_admin_session)
    ensure_super_admin(admin)
    if admin["id"] == admin_id:
        raise HTTPException(status_code=400, detail="Super Admin tidak dapat menghapus akun sendiri")
    result = await db.admins.delete_one({"id": admin_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Akun staf tidak ditemukan")
    await db.admin_sessions.delete_many({"admin_id": admin_id})
    return MessageResponse(message="Akun staf dihapus")