import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgendaCategory, CMSItem } from "@/lib/cms";

const categoryStyle: Record<AgendaCategory, { label: string; day: string; dot: string; badge: string }> = {
  akademik: { label: "Akademik", day: "bg-blue-600 text-white hover:bg-blue-700", dot: "bg-blue-500", badge: "bg-blue-400/15 text-blue-200" },
  ujian: { label: "Ujian", day: "bg-rose-600 text-white hover:bg-rose-700", dot: "bg-rose-500", badge: "bg-rose-400/15 text-rose-200" },
  kegiatan: { label: "Kegiatan", day: "bg-emerald-600 text-white hover:bg-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-400/15 text-emerald-200" },
  industri: { label: "Industri", day: "bg-amber-500 text-[#092c4c] hover:bg-amber-600", dot: "bg-amber-500", badge: "bg-amber-400/15 text-amber-200" },
  pengumuman: { label: "Pengumuman", day: "bg-violet-600 text-white hover:bg-violet-700", dot: "bg-violet-500", badge: "bg-violet-400/15 text-violet-200" },
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function googleCalendarUrl(event: CMSItem) {
  const start = event.date?.replaceAll("-", "") ?? "";
  const endDate = event.end_date ? parseDate(event.end_date) : event.date ? parseDate(event.date) : new Date();
  endDate.setDate(endDate.getDate() + 1);
  const end = dateKey(endDate).replaceAll("-", "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${start}/${end}`, details: event.description, location: "SMK Teratai Putih Global 2 Bekasi" });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Loading placeholder with the calendar's shape: month grid on the left, event card on the right. */
export function AcademicCalendarSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]" data-testid="academic-calendar-loading">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between"><div><Skeleton className="h-2.5 w-28" /><Skeleton className="mt-2 h-6 w-40" /></div><div className="flex gap-2"><Skeleton className="h-9 w-9" /><Skeleton className="h-9 w-9" /></div></div>
        <Skeleton className="mt-4 h-2.5 w-3/4" />
        <div className="mt-6 grid grid-cols-7 gap-1">{Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="aspect-square bg-slate-100" />)}</div>
      </div>
      <div className="flex flex-col rounded-[1.5rem] bg-[#092c4c] p-6">
        <div className="flex items-center justify-between"><Skeleton className="h-10 w-10 bg-white/10" /><Skeleton className="h-6 w-20 rounded-full bg-white/10" /></div>
        <Skeleton className="mt-6 h-2.5 w-32 bg-white/10" />
        <Skeleton className="mt-3 h-6 w-3/4 bg-white/10" />
        <Skeleton className="mt-3 h-3 w-full bg-white/10" />
        <Skeleton className="mt-2 h-3 w-2/3 bg-white/10" />
        <Skeleton className="mt-8 h-10 w-40 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

interface AcademicCalendarProps {
  events: CMSItem[];
}

export function AcademicCalendar({ events }: AcademicCalendarProps) {
  // Mount only once the agenda has loaded: the initially selected date is derived from it.
  const displayEvents = events.filter((item) => item.date);
  const today = new Date();
  const todayKey = dateKey(today);
  const sortedEvents = [...displayEvents].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const nearestEvent = sortedEvents.find((item) => (item.end_date ?? item.date ?? "") >= todayKey) ?? sortedEvents[sortedEvents.length - 1];
  const [manualMonth, setManualMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(nearestEvent?.date ?? null);
  const activeMonth = manualMonth ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const selectedEvent = displayEvents.find((item) => selectedDate && item.date && item.date <= selectedDate && (item.end_date ?? item.date) >= selectedDate) ?? nearestEvent;

  const calendarDays = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= daysInMonth ? new Date(year, month, day) : null;
    });
  }, [activeMonth]);

  const changeMonth = (offset: number) => setManualMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1));

  return (
    <div className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]" data-testid="academic-calendar">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="calendar-month-card">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-600">Kalender akademik</p><h3 className="mt-1 font-heading text-xl font-extrabold capitalize text-[#0a3358]" data-testid="calendar-month-label">{activeMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h3></div>
          <div className="flex gap-2"><button type="button" onClick={() => changeMonth(-1)} className="calendar-nav-button" aria-label="Bulan sebelumnya" data-testid="calendar-previous-button"><ChevronLeft size={18} /></button><button type="button" onClick={() => changeMonth(1)} className="calendar-nav-button" aria-label="Bulan berikutnya" data-testid="calendar-next-button"><ChevronRight size={18} /></button></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2" data-testid="calendar-category-legend">{(Object.keys(categoryStyle) as AgendaCategory[]).map((category) => <span key={category} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-500" data-testid={`calendar-legend-${category}`}><span className={`h-2 w-2 rounded-full ${categoryStyle[category].dot}`} />{categoryStyle[category].label}</span>)}</div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <span key={day} className="py-2 text-[10px] font-extrabold uppercase text-slate-400">{day}</span>)}{calendarDays.map((date, index) => {
          const dayEvents = date ? displayEvents.filter((event) => event.date && event.date <= dateKey(date) && (event.end_date ?? event.date) >= dateKey(date)) : [];
          const category = dayEvents[0]?.category ?? "akademik";
          return date ? <button type="button" key={dateKey(date)} onClick={() => setSelectedDate(dateKey(date))} className={`relative aspect-square rounded-xl text-xs font-bold transition-colors ${dayEvents.length ? categoryStyle[category].day : "text-slate-600 hover:bg-slate-100"}`} data-testid={`calendar-day-${dateKey(date)}`}><span>{date.getDate()}</span>{dayEvents.length > 0 && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80" />}</button> : <span key={`empty-${index}`} />;
        })}</div>
      </div>
      <div className="flex flex-col gap-4">
        {selectedEvent ? <article className="flex-1 rounded-[1.5rem] bg-[#092c4c] p-6 text-white" data-testid="calendar-event-detail"><div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><CalendarDays size={19} /></span><span className={`rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider ${categoryStyle[selectedEvent.category ?? "akademik"].badge}`} data-testid="calendar-event-category">{categoryStyle[selectedEvent.category ?? "akademik"].label}</span></div><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-amber-300" data-testid="calendar-event-date">{selectedEvent.date && parseDate(selectedEvent.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p><h3 className="mt-2 font-heading text-xl font-extrabold" data-testid="calendar-event-title">{selectedEvent.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedEvent.description}</p><p className="mt-4 flex items-center gap-2 text-xs text-slate-300"><Clock3 size={14} /> {selectedEvent.time ?? "Sepanjang hari"} WIB</p><div className="mt-6 flex flex-wrap gap-2"><a href={googleCalendarUrl(selectedEvent)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#092c4c] hover:bg-amber-300" data-testid="calendar-reminder-link">Tambah pengingat <ArrowUpRight size={14} /></a>{selectedEvent.link && <a href={selectedEvent.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10" data-testid="calendar-event-link">Buka tautan <ArrowUpRight size={14} /></a>}</div></article> : <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-[#092c4c] p-6 text-center text-sm text-slate-300" data-testid="calendar-event-empty"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-400"><CalendarDays size={19} /></span>Belum ada agenda.</div>}
      </div>
    </div>
  );
}