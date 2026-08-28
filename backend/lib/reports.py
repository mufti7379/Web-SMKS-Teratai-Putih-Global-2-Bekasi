import asyncio
import os
from collections import Counter
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

from lib.db import db


def aware(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def jakarta_now() -> datetime:
    return datetime.now(ZoneInfo(os.environ.get("REPORT_TIMEZONE", "Asia/Jakarta")))


def next_report_time() -> datetime:
    now = jakarta_now()
    days_ahead = (7 - now.weekday()) % 7
    candidate = (now + timedelta(days=days_ahead)).replace(hour=7, minute=0, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=7)
    return candidate


async def build_weekly_summary() -> dict:
    start = datetime.now(timezone.utc) - timedelta(days=7)
    documents = await db.leads.find({"kind": "ppdb", "created_at": {"$gte": start}}, {"_id": 0}).to_list(10000)
    now = datetime.now(timezone.utc)
    overdue = sum(item.get("status") == "new" and (now - aware(item["created_at"])).total_seconds() >= 86400 for item in documents)
    duplicates = sum(bool(item.get("duplicate_ids")) for item in documents)
    majors = Counter(item.get("major") or "Belum memilih" for item in documents)
    officers = Counter(item.get("assigned_to_name") or "Belum ditugaskan" for item in documents)
    return {
        "total": len(documents),
        "overdue": overdue,
        "duplicates": duplicates,
        "top_major": majors.most_common(1)[0][0] if majors else "Belum ada data",
        "busiest_officer": officers.most_common(1)[0][0] if officers else "Belum ada data",
    }


async def create_report_run(trigger: str) -> dict:
    now = jakarta_now()
    key = f"{now.isocalendar().year}-W{now.isocalendar().week:02d}-{trigger}"
    summary = await build_weekly_summary()
    document = {
        "id": str(uuid4()),
        "recipient": os.environ.get("REPORT_RECIPIENT", "pimpinan@example.com"),
        "sender": os.environ.get("REPORT_SENDER", "onboarding@resend.dev"),
        "delivery_mode": "simulated",
        "status": "simulated",
        "trigger": trigger,
        "summary": summary,
        "schedule_key": key,
        "created_at": datetime.now(timezone.utc),
    }
    await db.report_runs.insert_one(document)
    return document


async def report_scheduler() -> None:
    while True:
        now = jakarta_now()
        if now.weekday() == 0 and now.hour == 7 and now.minute < 2:
            key = f"{now.isocalendar().year}-W{now.isocalendar().week:02d}-scheduled"
            if not await db.report_runs.find_one({"schedule_key": key}):
                await create_report_run("scheduled")
        await asyncio.sleep(60)