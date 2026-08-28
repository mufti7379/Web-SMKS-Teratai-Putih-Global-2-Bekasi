# SMK Teratai Putih Global 2 Bekasi

## What it does
Single-page Indonesian school profile website based on the public information from smk-terataiputih2.sch.id. It presents the school identity, programs, facilities, agenda, gallery, PPDB call-to-action, contact information, and profile video.

## Data model
- `cms_items`: news, agenda, gallery, and major records; agendas include one of five color-coded categories (academic, exam, activity, industry, announcement).
- `leads`: PPDB/contact submissions with source, assignee, status, timestamps, contact details, major, and question.
- `audit_logs`: immutable activity entries for content, staff-account, assignment, and lead-status changes.
- `lead_notes`: timestamped officer notes and optional next-action dates linked to a lead.
- `report_runs`: weekly PPDB report simulations with summary snapshot, schedule key, recipient, and delivery status.
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
- Repeated normalized WhatsApp numbers remain separate but are cross-linked and marked as duplicates; new leads receive 24h warning and 48h critical SLA states.
- Officers add shared follow-up notes; Super Admins preview and simulate the Monday 07.00 WIB weekly leadership report.
- Lead timeline merges creation, assignment, status, notes, and WhatsApp actions into one newest-first history.
- Officers open one of four prefilled WhatsApp templates from a lead card; every click is recorded in timeline and audit history.

## Auth and roles
- Public visitors can read published CMS content and submit PPDB/contact leads.
- Administrators authenticate with email/password; the backend creates a seven-day httpOnly session cookie.
- Roles: Super Admin (everything), Content Editor (news/gallery/majors), PPDB Officer (leads/export), Agenda Manager (agenda only).
- Admin credentials are recorded in `memory/test_credentials.md`.

## Integrations
External links: WhatsApp, YouTube, Instagram, CBT, and Google Calendar. Resend delivery is **SIMULATED** until a real API key and verified recipient are supplied.