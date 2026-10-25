import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronLeft, ChevronRight, FilePenLine, ShieldCheck, UserCog } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { AdminAccount, AuditLog } from "@/lib/cms";
import { pageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const actionLabels: Record<string, string> = { content_created: "Konten dibuat", content_updated: "Konten diubah", content_deleted: "Konten dihapus", admin_created: "Akun dibuat", admin_updated: "Akun diubah", admin_deleted: "Akun dihapus", lead_assigned: "Lead ditugaskan", lead_status_updated: "Status lead diubah", lead_note_added: "Catatan ditambahkan", whatsapp_opened: "WhatsApp dibuka", whatsapp_template_updated: "Template diubah", whatsapp_template_reset: "Template dipulihkan", report_simulated: "Laporan disimulasikan" };

const PAGE_SIZE = 10;
const pageButtonClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-bold transition-colors";
const idlePageButtonClass = cn(pageButtonClass, "border border-slate-200 bg-white text-slate-600 hover:border-[#0f4c81]/30 hover:text-[#0f4c81] disabled:pointer-events-none disabled:text-slate-300");

function AuditPagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total === 0) return null;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return (
    <nav aria-label="Halaman riwayat aktivitas" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row" data-testid="audit-pagination">
      <p className="text-xs text-slate-500" data-testid="audit-pagination-summary">Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari {total} aktivitas</p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya" className={idlePageButtonClass} data-testid="audit-page-prev"><ChevronLeft size={15} /></button>
          {/* Phones get "Halaman x dari y"; the full number row only fits from sm up. */}
          <span className="px-2 text-xs font-bold text-slate-600 sm:hidden">Halaman {page} dari {totalPages}</span>
          {pageItems(page, totalPages).map((item, index) => item === "gap"
            ? <span key={`gap-${index}`} className="hidden px-1 text-xs font-bold text-slate-400 sm:inline">…</span>
            : item === page
              ? <span key={item} aria-current="page" className={cn(pageButtonClass, "hidden bg-[#0f4c81] text-white sm:inline-flex")}>{item}</span>
              : <button key={item} type="button" onClick={() => onChange(item)} aria-label={`Halaman ${item}`} className={cn(idlePageButtonClass, "hidden sm:inline-flex")} data-testid={`audit-page-${item}`}>{item}</button>)}
          <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Halaman berikutnya" className={idlePageButtonClass} data-testid="audit-page-next"><ChevronRight size={15} /></button>
        </div>
      )}
    </nav>
  );
}

export function AuditPanel() {
  const [filters, setFilters] = useState({ actor_id: "", action: "", start_date: "", end_date: "" });
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const audit = useQuery({ queryKey: ["audit-log", filters], queryFn: () => apiGet<AuditLog[]>(`/admin/audit${params.size ? `?${params}` : ""}`) });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet<AdminAccount[]>("/admin/users") });
  // The log arrives newest first, so page 1 is the latest ten.
  const logs = audit.data ?? [];
  const currentPage = Math.min(page, Math.max(1, Math.ceil(logs.length / PAGE_SIZE)));
  const pageLogs = logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const updateFilters = (next: typeof filters) => { setFilters(next); setPage(1); };
  const goToPage = (next: number) => {
    setPage(next);
    // The pager sits under the list; bring the new page's first entry back into view (scroll-mt-20 clears the sticky header).
    if (listRef.current && listRef.current.getBoundingClientRect().top < 80) listRef.current.scrollIntoView({ block: "start" });
  };

  return <section data-testid="audit-panel"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-600">Keamanan & Akuntabilitas</p><h1 className="mt-2 font-heading text-3xl font-extrabold text-[#0a3358]" data-testid="audit-heading">Riwayat aktivitas</h1><p className="mt-2 text-sm text-slate-500">Jejak perubahan konten, akun staf, penugasan, dan status lead.</p></div><div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="audit-filters"><label><span className="form-label">Pengguna</span><select value={filters.actor_id} onChange={(event) => updateFilters({ ...filters, actor_id: event.target.value })} className="form-input" data-testid="audit-filter-actor"><option value="">Semua pengguna</option>{users.data?.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label><span className="form-label">Aktivitas</span><select value={filters.action} onChange={(event) => updateFilters({ ...filters, action: event.target.value })} className="form-input" data-testid="audit-filter-action"><option value="">Semua aktivitas</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span className="form-label">Dari tanggal</span><input type="date" value={filters.start_date} onChange={(event) => updateFilters({ ...filters, start_date: event.target.value })} className="form-input" data-testid="audit-filter-start" /></label><label><span className="form-label">Sampai tanggal</span><input type="date" value={filters.end_date} onChange={(event) => updateFilters({ ...filters, end_date: event.target.value })} className="form-input" data-testid="audit-filter-end" /></label></div><div ref={listRef} className="mt-5 scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid="audit-list">{pageLogs.map((log) => <article key={log.id} className="flex gap-4 border-b border-slate-100 p-5 last:border-0" data-testid={`audit-item-${log.id}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0f4c81]">{log.entity_type === "content" ? <FilePenLine size={17} /> : log.entity_type === "admin" ? <UserCog size={17} /> : <Activity size={17} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-800">{log.actor_name}</strong><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase text-emerald-700"><ShieldCheck size={10} className="mr-1 inline" />{actionLabels[log.action] ?? log.action}</span></div><p className="mt-1 text-xs text-slate-600">{log.summary}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString("id-ID")} · {log.actor_email}</p></div></article>)}{audit.data?.length === 0 && <div className="p-10 text-center text-sm text-slate-400" data-testid="audit-empty">Belum ada aktivitas sesuai filter.</div>}</div><AuditPagination page={currentPage} total={logs.length} onChange={goToPage} /></section>;
}
