# SMK Teratai Putih Global 2 Bekasi

## What it does
Single-page Indonesian school profile website based on the public information from smk-terataiputih2.sch.id. It presents the school identity, programs, facilities, agenda, gallery, PPDB call-to-action, contact information, and profile video.

## Data model
- `cms_items`: news, agenda, gallery, and major records with title, description, date/time, image, link, publish state, and major-specific skills/careers.
- `leads`: PPDB and contact submissions with name, phone, selected major/question, timestamp, and follow-up status.
- `admins` and `admin_sessions`: administrator identity and hashed httpOnly-cookie sessions.

## Key flows
- Visitors navigate the sticky header to Profil, Jurusan, Fasilitas, Agenda, Galeri, and Kontak sections.
- Visitors switch between five program tabs to view skills and career paths.
- Visitors open the PPDB modal and persist an interest submission to MongoDB.
- Visitors open the YouTube profile video modal or external CBT / WhatsApp / Instagram links.
- Visitors submit a contact inquiry that is persisted and visible in the admin dashboard.
- Visitors browse an interactive monthly calendar, inspect event detail, and open a Google Calendar reminder link.
- Administrators sign in at `/admin`, manage news, agenda, gallery, and major CRUD, and update lead follow-up statuses.

## Auth and roles
- Public visitors can read published CMS content and submit PPDB/contact leads.
- Administrators authenticate with email/password; the backend creates a seven-day httpOnly session cookie.
- Admin credentials are recorded in `memory/test_credentials.md`.

## Integrations
External links: WhatsApp, YouTube profile embed, Instagram, CBT portal, and prefilled Google Calendar reminder links. No external API credentials are required.