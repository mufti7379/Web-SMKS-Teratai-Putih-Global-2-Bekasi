# SMK Teratai Putih Global 2 Bekasi

## What it does
Single-page Indonesian school profile website based on the public information from smk-terataiputih2.sch.id. It presents the school identity, programs, facilities, agenda, gallery, PPDB call-to-action, contact information, and profile video.

## Data model
- `cms_items`: news, agenda, gallery, and major records; agendas include one of five color-coded categories (academic, exam, activity, industry, announcement).
- `leads`: PPDB/contact submissions with source, assignee, status, timestamps, contact details, major, and question.
- `audit_logs`: immutable activity entries for content, staff-account, assignment, and lead-status changes.
- `admins` and `admin_sessions`: administrator identity, role, active state, hashed password, and httpOnly-cookie sessions.

## Key flows
- Visitors navigate the sticky header to Profil, Jurusan, Fasilitas, Agenda, Galeri, and Kontak sections.
- Visitors switch between five program tabs to view skills and career paths.
- Visitors open the PPDB modal and persist an interest submission to MongoDB.
- Visitors open the YouTube profile video modal or external CBT / WhatsApp / Instagram links.
- Visitors submit a contact inquiry that is persisted and visible in the admin dashboard.
- Visitors browse an interactive monthly calendar, inspect event detail, and open a Google Calendar reminder link.
- Administrators sign in at `/admin`, manage news, agenda, gallery, and major CRUD, and update lead follow-up statuses.
- Super Admins manage staff accounts; PPDB staff can filter and export leads to an Excel workbook containing data and summary sheets.
- Super Admins assign leads to active PPDB Officers, inspect filtered activity history, and export branded Full/Compact/Contact workbooks.
- Super Admins and PPDB Officers view 30/90/365-day PPDB analytics by major, source, status, and week.

## Auth and roles
- Public visitors can read published CMS content and submit PPDB/contact leads.
- Administrators authenticate with email/password; the backend creates a seven-day httpOnly session cookie.
- Roles: Super Admin (everything), Content Editor (news/gallery/majors), PPDB Officer (leads/export), Agenda Manager (agenda only).
- Admin credentials are recorded in `memory/test_credentials.md`.

## Integrations
External links: WhatsApp, YouTube profile embed, Instagram, CBT portal, and prefilled Google Calendar reminder links. No external API credentials are required.