from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


ResourceType = Literal["news", "agenda", "gallery", "major"]
RoleType = Literal["super_admin", "content_editor", "ppdb_officer", "agenda_manager"]
AgendaCategory = Literal["akademik", "ujian", "kegiatan", "industri", "pengumuman"]
LeadSource = Literal["website", "whatsapp", "instagram", "walk_in", "referral"]


class CMSItemBase(BaseModel):
    resource: ResourceType
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)
    date: str | None = None
    end_date: str | None = None
    time: str | None = None
    image_url: str | None = None
    link: str | None = None
    is_published: bool = True
    code: str | None = None
    badge: str | None = None
    skills: list[str] = Field(default_factory=list)
    careers: list[str] = Field(default_factory=list)
    category: AgendaCategory | None = None


class CMSItemCreate(CMSItemBase):
    pass


class CMSItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    date: str | None = None
    end_date: str | None = None
    time: str | None = None
    image_url: str | None = None
    link: str | None = None
    is_published: bool | None = None
    code: str | None = None
    badge: str | None = None
    skills: list[str] | None = None
    careers: list[str] | None = None
    category: AgendaCategory | None = None


class CMSItem(CMSItemBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadCreate(BaseModel):
    kind: Literal["ppdb", "contact"]
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=24)
    major: str | None = None
    question: str | None = Field(default=None, max_length=1500)
    source: LeadSource = "website"


class Lead(LeadCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: Literal["new", "follow_up", "done"] = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    assigned_to_id: str | None = None
    assigned_to_name: str | None = None
    normalized_phone: str = ""
    duplicate_ids: list[str] = Field(default_factory=list)
    duplicate_count: int = 0
    sla_level: Literal["ok", "warning", "critical"] = "ok"
    age_hours: int = 0
    last_contact_type: str = "Lead dibuat"
    last_contact_at: datetime | None = None
    last_contact_by: str = "Sistem"
    next_action_date: str | None = None


class LeadUpdate(BaseModel):
    status: Literal["new", "follow_up", "done"] | None = None
    source: LeadSource | None = None
    assigned_to_id: str | None = None


class LeadNoteCreate(BaseModel):
    text: str = Field(min_length=2, max_length=2000)
    next_action_date: str | None = None


class LeadNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    lead_id: str
    author_id: str
    author_name: str
    text: str
    next_action_date: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhatsAppActionCreate(BaseModel):
    template: Literal["greeting", "documents", "visit", "final_follow_up"]


class WhatsAppActionResponse(BaseModel):
    id: str
    lead_id: str
    template: str
    message: str
    url: str
    actor_name: str
    created_at: datetime


class WhatsAppTemplate(BaseModel):
    key: Literal["greeting", "documents", "visit", "final_follow_up"]
    label: str
    content: str = Field(min_length=10, max_length=2000)
    is_active: bool = True
    updated_by: str = "Sistem"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhatsAppTemplateUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=10, max_length=2000)
    is_active: bool | None = None


class TimelineEvent(BaseModel):
    id: str
    event_type: Literal["created", "assignment", "status", "note", "whatsapp"]
    title: str
    description: str
    actor_name: str
    created_at: datetime
    metadata: dict = Field(default_factory=dict)


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminUser(BaseModel):
    id: str
    email: str
    name: str
    role: RoleType


class AdminAccountCreate(BaseModel):
    email: str
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: RoleType


class AdminAccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: RoleType | None = None
    is_active: bool | None = None


class AdminAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    name: str
    role: RoleType
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    actor_id: str
    actor_name: str
    actor_email: str
    actor_role: RoleType
    action: str
    entity_type: Literal["content", "admin", "lead"]
    entity_id: str
    summary: str
    details: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnalyticsSlice(BaseModel):
    label: str
    value: int


class AnalyticsPoint(BaseModel):
    label: str
    count: int


class PPDBAnalytics(BaseModel):
    period_days: Literal[30, 90, 365]
    total: int
    new_count: int
    follow_up_count: int
    done_count: int
    by_major: list[AnalyticsSlice]
    by_source: list[AnalyticsSlice]
    weekly: list[AnalyticsPoint]


class WeeklyReportSummary(BaseModel):
    total: int
    overdue: int
    duplicates: int
    top_major: str
    busiest_officer: str


class ReportRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    recipient: str
    sender: str
    delivery_mode: Literal["simulated", "live"]
    status: Literal["simulated", "sent", "failed"]
    trigger: Literal["manual", "scheduled"]
    summary: WeeklyReportSummary
    schedule_key: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportOverview(BaseModel):
    recipient: str
    sender: str
    delivery_mode: Literal["simulated", "live"]
    schedule: str
    next_run: datetime
    preview: WeeklyReportSummary
    runs: list[ReportRun]


class MessageResponse(BaseModel):
    message: str