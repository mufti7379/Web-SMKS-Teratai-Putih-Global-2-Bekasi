from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


ResourceType = Literal["news", "agenda", "gallery", "major"]


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


class Lead(LeadCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: Literal["new", "follow_up", "done"] = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadStatusUpdate(BaseModel):
    status: Literal["new", "follow_up", "done"]


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminUser(BaseModel):
    id: str
    email: str
    name: str


class MessageResponse(BaseModel):
    message: str