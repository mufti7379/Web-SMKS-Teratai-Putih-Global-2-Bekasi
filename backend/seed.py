from datetime import datetime, timezone
from uuid import uuid4

from passlib.context import CryptContext
from pymongo import MongoClient

from lib.db import mongo_url
import os


db = MongoClient(mongo_url)[os.environ["DB_NAME"]]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

admin_email = "admin@terataiputih2.sch.id"
db.admins.update_one(
    {"email": admin_email},
    {"$setOnInsert": {"id": str(uuid4()), "email": admin_email, "name": "Admin Sekolah", "password_hash": pwd_context.hash("<redacted>")}},
    upsert=True,
)

now = datetime.now(timezone.utc)
items = [
    {"resource": "agenda", "title": "Ujian ASAT Genap TA 2025/2026", "description": "Ujian akhir semester berbasis CBT untuk seluruh siswa.", "date": "2026-06-08", "end_date": "2026-06-12", "time": "08:00", "link": "https://ujiango.smk-terataiputih2.sch.id/", "is_published": True},
    {"resource": "agenda", "title": "Pameran Karya Kreatif DKV & Expo RPL", "description": "Pameran karya dan inovasi siswa terbuka untuk keluarga sekolah.", "date": "2026-06-20", "time": "09:00", "is_published": True},
    {"resource": "agenda", "title": "Job Fair & Campus Hiring", "description": "Temukan peluang kerja dan magang bersama mitra industri.", "date": "2026-07-15", "time": "08:30", "is_published": True},
    {"resource": "news", "title": "PPDB Tahun Ajaran 2026/2027 Dibuka", "description": "Pendaftaran peserta didik baru telah dibuka dengan kesempatan beasiswa prestasi.", "date": "2026-01-15", "is_published": True},
    {"resource": "gallery", "title": "Praktik DKV", "description": "Karya Siswa", "image_url": "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "gallery", "title": "Belajar RPL", "description": "Kegiatan Lab", "image_url": "https://images.unsplash.com/photo-1556636530-6b7482d80e3d?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "gallery", "title": "Masjid Yayasan", "description": "Pembinaan Karakter", "image_url": "https://www.smk-terataiputih2.sch.id/img-promosi/gallery/Wh40.jpeg", "is_published": True},
    {"resource": "major", "code": "RPL", "title": "Rekayasa Perangkat Lunak", "badge": "Software Engineering", "description": "Membangun aplikasi modern, web, mobile, dan cloud technology.", "image_url": "https://images.unsplash.com/photo-1556636530-6b7482d80e3d?auto=format&fit=crop&w=900&q=85", "skills": ["Web Development", "Mobile Apps", "Database Design", "UI/UX & Git"], "careers": ["Junior Software Engineer", "Frontend / Backend Developer", "QA Tester", "Tech Entrepreneur"], "is_published": True},
    {"resource": "major", "code": "DKV", "title": "Desain Komunikasi Visual", "badge": "Visual Communication Design", "description": "Mengolah kreativitas menjadi karya visual, animasi, dan brand digital.", "image_url": "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=85", "skills": ["Adobe Creative Cloud", "Branding & Typography", "Motion Graphics", "Fotografi Digital"], "careers": ["Graphic Designer", "Video Editor", "Content Creator", "Brand Strategist"], "is_published": True},
    {"resource": "major", "code": "BD", "title": "Bisnis Digital & Pemasaran", "badge": "Digital Business", "description": "Menjadi penggerak bisnis dengan strategi e-commerce dan marketing digital.", "image_url": "https://images.unsplash.com/photo-1630331515839-dcf1de4e8d4d?auto=format&fit=crop&w=900&q=85", "skills": ["E-Commerce Operations", "Digital Marketing & SEO", "Live Commerce", "Customer Analytics"], "careers": ["Digital Marketer", "E-Commerce Specialist", "Content Marketer", "Online Business Manager"], "is_published": True},
    {"resource": "major", "code": "MP", "title": "Manajemen Perkantoran", "badge": "Office Management", "description": "Menguasai tata kelola perkantoran modern dan layanan bisnis profesional.", "image_url": "https://images.unsplash.com/photo-1719159381981-1327b22aff9b?auto=format&fit=crop&w=900&q=85", "skills": ["Digital Archiving", "Public Relations", "Modern Office Tools", "Administrasi Keuangan"], "careers": ["Administrative Officer", "Executive Assistant", "Document Controller", "Customer Relations"], "is_published": True},
    {"resource": "major", "code": "AKL", "title": "Akuntansi Keuangan Lembaga", "badge": "Financial Accounting", "description": "Membangun presisi laporan keuangan, pajak, dan audit berbasis software.", "image_url": "https://images.unsplash.com/photo-1625111381887-458fce74a923?auto=format&fit=crop&w=900&q=85", "skills": ["MYOB & Accurate", "Perpajakan PPH & PPN", "Financial Auditing", "Banking Finance"], "careers": ["Junior Accountant", "Tax Consultant Staff", "Auditor Assistant", "Banking Officer"], "is_published": True},
]
for raw in items:
    raw.update({"id": str(uuid4()), "date": raw.get("date"), "end_date": raw.get("end_date"), "time": raw.get("time"), "image_url": raw.get("image_url"), "link": raw.get("link"), "code": raw.get("code"), "badge": raw.get("badge"), "skills": raw.get("skills", []), "careers": raw.get("careers", []), "created_at": now, "updated_at": now})
    db.cms_items.update_one({"resource": raw["resource"], "title": raw["title"]}, {"$setOnInsert": raw}, upsert=True)

print("Seed CMS dan admin selesai")