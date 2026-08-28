export type ResourceType = "news" | "agenda" | "gallery" | "major";
export type RoleType = "super_admin" | "content_editor" | "ppdb_officer" | "agenda_manager";
export type AgendaCategory = "akademik" | "ujian" | "kegiatan" | "industri" | "pengumuman";
export type LeadSource = "website" | "whatsapp" | "instagram" | "walk_in" | "referral";

export interface CMSItem {
  id: string;
  resource: ResourceType;
  title: string;
  description: string;
  date: string | null;
  end_date: string | null;
  time: string | null;
  image_url: string | null;
  link: string | null;
  is_published: boolean;
  code: string | null;
  badge: string | null;
  skills: string[];
  careers: string[];
  category: AgendaCategory | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  kind: "ppdb" | "contact";
  name: string;
  phone: string;
  major: string | null;
  question: string | null;
  status: "new" | "follow_up" | "done";
  source: LeadSource;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  normalized_phone: string;
  duplicate_ids: string[];
  duplicate_count: number;
  sla_level: "ok" | "warning" | "critical";
  age_hours: number;
  last_contact_type: string;
  last_contact_at: string | null;
  last_contact_by: string;
  next_action_date: string | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  author_name: string;
  text: string;
  next_action_date: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  event_type: "created" | "assignment" | "status" | "note" | "whatsapp";
  title: string;
  description: string;
  actor_name: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface WhatsAppActionResponse {
  id: string;
  lead_id: string;
  template: string;
  message: string;
  url: string;
  actor_name: string;
  created_at: string;
}

export interface WhatsAppTemplate {
  key: "greeting" | "documents" | "visit" | "final_follow_up";
  label: string;
  content: string;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: RoleType;
}

export interface AdminAccount extends AdminUser {
  is_active: boolean;
  created_at: string;
}

export interface MessageResponse { message: string }

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  actor_role: RoleType;
  action: string;
  entity_type: "content" | "admin" | "lead";
  entity_id: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSlice { label: string; value: number }
export interface AnalyticsPoint { label: string; count: number }
export interface PPDBAnalytics {
  period_days: 30 | 90 | 365;
  total: number;
  new_count: number;
  follow_up_count: number;
  done_count: number;
  by_major: AnalyticsSlice[];
  by_source: AnalyticsSlice[];
  weekly: AnalyticsPoint[];
}

export interface WeeklyReportSummary {
  total: number;
  overdue: number;
  duplicates: number;
  top_major: string;
  busiest_officer: string;
}

export interface ReportRun {
  id: string;
  recipient: string;
  sender: string;
  delivery_mode: "simulated" | "live";
  status: "simulated" | "sent" | "failed";
  trigger: "manual" | "scheduled";
  summary: WeeklyReportSummary;
  schedule_key: string;
  created_at: string;
}

export interface ReportOverview {
  recipient: string;
  sender: string;
  delivery_mode: "simulated" | "live";
  schedule: string;
  next_run: string;
  preview: WeeklyReportSummary;
  runs: ReportRun[];
}

export const resourceLabels: Record<ResourceType, string> = {
  news: "Berita",
  agenda: "Agenda",
  gallery: "Galeri",
  major: "Jurusan",
};