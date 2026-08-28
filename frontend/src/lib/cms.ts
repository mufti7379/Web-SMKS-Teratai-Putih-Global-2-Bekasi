export type ResourceType = "news" | "agenda" | "gallery" | "major";

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
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface MessageResponse { message: string }

export const resourceLabels: Record<ResourceType, string> = {
  news: "Berita",
  agenda: "Agenda",
  gallery: "Galeri",
  major: "Jurusan",
};