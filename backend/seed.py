from datetime import datetime, timezone
from uuid import uuid4

from passlib.context import CryptContext
from pymongo import MongoClient

from lib.db import mongo_url
import os


db = MongoClient(mongo_url)[os.environ["DB_NAME"]]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

accounts = [
    ("admin@terataiputih2.sch.id", "Admin Sekolah", "SEED_ADMIN_PASSWORD", "<redacted>", "super_admin"),
    ("editor@terataiputih2.sch.id", "Editor Konten", "SEED_EDITOR_PASSWORD", "<redacted>", "content_editor"),
    ("ppdb@terataiputih2.sch.id", "Petugas SPMB", "SEED_PPDB_PASSWORD", "<redacted>", "ppdb_officer"),
    ("agenda@terataiputih2.sch.id", "Pengelola Agenda", "SEED_AGENDA_PASSWORD", "<redacted>", "agenda_manager"),
]
for email, name, env_var, default_password, role in accounts:
    password = os.environ.get(env_var)
    if not password:
        password = default_password
        print(f"PERINGATAN: {env_var} tidak diset, memakai password default untuk {email}. Ganti password ini segera setelah login pertama.")
    db.admins.update_one(
        {"email": email},
        {"$set": {"name": name, "role": role, "is_active": True}, "$setOnInsert": {"id": str(uuid4()), "email": email, "password_hash": pwd_context.hash(password), "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )

now = datetime.now(timezone.utc)
items = [
    {"resource": "agenda", "title": "Ujian ASAT Genap TA 2025/2026", "description": "Ujian akhir semester berbasis CBT untuk seluruh siswa.", "date": "2026-06-08", "end_date": "2026-06-12", "time": "08:00", "link": "https://ujiango.smk-terataiputih2.sch.id/", "category": "ujian", "is_published": True},
    {"resource": "agenda", "title": "Pameran Karya Kreatif DKV & Expo RPL", "description": "Pameran karya dan inovasi siswa terbuka untuk keluarga sekolah.", "date": "2026-06-20", "time": "09:00", "category": "kegiatan", "is_published": True},
    {"resource": "agenda", "title": "Job Fair & Campus Hiring", "description": "Temukan peluang kerja dan magang bersama mitra industri.", "date": "2026-07-15", "time": "08:30", "category": "industri", "is_published": True},
    {"resource": "news", "title": "SPMB Tahun Ajaran 2027/2028 Dibuka", "description": "Pendaftaran peserta didik baru telah dibuka dengan kesempatan beasiswa prestasi.", "date": "2026-01-15", "is_published": True},
    {"resource": "hero", "title": "Gambar hero beranda", "description": "Foto utama yang tampil di bagian atas halaman depan.", "image_url": "https://images.unsplash.com/photo-1630331515839-dcf1de4e8d4d?auto=format&fit=crop&w=1400&q=85", "is_published": True},
    {"resource": "banner", "title": "Pendaftaran murid baru resmi dibuka.", "description": "Amankan kursimu di 5 program keahlian unggulan kami, lengkap dengan kesempatan beasiswa prestasi.", "badge": "SPMB 2027 / 2028", "is_published": True},
    {"resource": "facility", "title": "Lab Rekayasa Perangkat Lunak", "description": "PC high-spec, server mini, dan jaringan fiber untuk praktik coding.", "image_url": "https://images.unsplash.com/photo-1556636530-6b7482d80e3d?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "facility", "title": "Lab Desain Komunikasi Visual", "description": "Drawing tablet, studio lighting, dan perangkat kreatif profesional.", "image_url": "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "facility", "title": "Lab Bisnis Digital", "description": "Ruang live broadcast, display retail, dan simulator marketplace.", "image_url": "https://images.unsplash.com/photo-1630331515839-dcf1de4e8d4d?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "facility", "title": "Lab Manajemen Perkantoran", "description": "Simulasi kantor eksekutif dengan sistem filing modern.", "image_url": "https://images.unsplash.com/photo-1719159381981-1327b22aff9b?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "facility", "title": "Lab Akuntansi & Perbankan", "description": "Workstation Accurate / MYOB dan bank mini untuk praktik transaksi.", "image_url": "https://images.unsplash.com/photo-1625111381887-458fce74a923?auto=format&fit=crop&w=900&q=85", "is_published": True},
    {"resource": "facility", "title": "Masjid Yayasan", "description": "Pusat pembinaan akhlak, ibadah, dan kegiatan keagamaan siswa.", "image_url": "https://www.smk-terataiputih2.sch.id/img-promosi/gallery/Wh40.jpeg", "is_published": True},
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
    raw.update({"id": str(uuid4()), "date": raw.get("date"), "end_date": raw.get("end_date"), "time": raw.get("time"), "image_url": raw.get("image_url"), "link": raw.get("link"), "code": raw.get("code"), "badge": raw.get("badge"), "skills": raw.get("skills", []), "careers": raw.get("careers", []), "category": raw.get("category"), "created_at": now, "updated_at": now})
    db.cms_items.update_one({"resource": raw["resource"], "title": raw["title"]}, {"$setOnInsert": raw}, upsert=True)

db.cms_items.update_one({"resource": "agenda", "title": "Ujian ASAT Genap TA 2025/2026"}, {"$set": {"category": "ujian"}})
db.cms_items.update_one({"resource": "agenda", "title": "Pameran Karya Kreatif DKV & Expo RPL"}, {"$set": {"category": "kegiatan"}})
db.cms_items.update_one({"resource": "agenda", "title": "Job Fair & Campus Hiring"}, {"$set": {"category": "industri"}})
db.leads.update_many({"source": {"$exists": False}}, {"$set": {"source": "website", "assigned_to_id": None, "assigned_to_name": None}})
template_defaults = [
    ("greeting", "Salam awal", "Halo {nama}, kami dari {sekolah}. Terima kasih sudah mendaftar pada jurusan {jurusan}. Saya {petugas}, apakah ada informasi yang dapat kami bantu?"),
    ("documents", "Pengingat berkas", "Halo {nama}, kami mengingatkan kelengkapan berkas SPMB {sekolah} untuk jurusan {jurusan}. Mohon konfirmasi jika berkas sudah siap."),
    ("visit", "Jadwal kunjungan", "Halo {nama}, kami mengundang Anda untuk mengatur jadwal kunjungan ke {sekolah}. Silakan balas dengan waktu yang paling sesuai."),
    ("final_follow_up", "Tindak lanjut terakhir", "Halo {nama}, kami menindaklanjuti kembali minat pendaftaran jurusan {jurusan} di {sekolah}. Apakah proses pendaftaran ingin dilanjutkan?"),
]
for order, (key, label, content) in enumerate(template_defaults):
    db.whatsapp_templates.update_one({"key": key}, {"$setOnInsert": {"key": key, "label": label, "content": content, "is_active": True, "order": order, "updated_by": "Sistem", "updated_at": datetime.now(timezone.utc)}}, upsert=True)
db.leads.update_many({"last_contact_at": {"$exists": False}}, [{"$set": {"last_contact_type": "Lead dibuat", "last_contact_at": "$created_at", "last_contact_by": "Sistem", "next_action_date": None}}])
for lead in db.leads.find({}, {"id": 1, "phone": 1, "normalized_phone": 1}):
    if not lead.get("normalized_phone"):
        digits = "".join(character for character in lead.get("phone", "") if character.isdigit())
        normalized = f"62{digits[1:]}" if digits.startswith("0") else digits
        db.leads.update_one({"id": lead["id"]}, {"$set": {"normalized_phone": normalized, "duplicate_ids": []}})

print("Seed CMS dan admin selesai")