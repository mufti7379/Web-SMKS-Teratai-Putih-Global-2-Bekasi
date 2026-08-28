import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, CheckCircle2, Clock3, Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { PPDBAnalytics } from "@/lib/cms";

const sourceLabels: Record<string, string> = { website: "Website", whatsapp: "WhatsApp", instagram: "Instagram", walk_in: "Datang Langsung", referral: "Referensi" };

export function AnalyticsPanel() {
  const [days, setDays] = useState<30 | 90 | 365>(30);
  const analytics = useQuery({ queryKey: ["ppdb-analytics", days], queryFn: () => apiGet<PPDBAnalytics>(`/admin/analytics?days=${days}`) });
  const data = analytics.data;
  const sourceData = data?.by_source.map((item) => ({ ...item, label: sourceLabels[item.label] ?? item.label })) ?? [];
  const metricCards = [
    { label: "Total pendaftar", value: data?.total ?? 0, icon: Users },
    { label: "Belum diproses", value: data?.new_count ?? 0, icon: Clock3 },
    { label: "Tindak lanjut", value: data?.follow_up_count ?? 0, icon: ArrowUpRight },
    { label: "Selesai", value: data?.done_count ?? 0, icon: CheckCircle2 },
  ];

  return <section data-testid="analytics-panel"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-600">Statistik PPDB</p><h1 className="mt-2 font-heading text-3xl font-extrabold text-[#0a3358]" data-testid="analytics-heading">Insight pendaftar</h1><p className="mt-2 text-sm text-slate-500">Pantau tren, jurusan favorit, dan sumber calon siswa.</p></div><div className="flex rounded-xl border border-slate-200 bg-white p-1" data-testid="analytics-period-tabs">{([30, 90, 365] as const).map((period) => <button type="button" key={period} onClick={() => setDays(period)} className={`rounded-lg px-4 py-2 text-xs font-extrabold ${days === period ? "bg-[#0f4c81] text-white" : "text-slate-500"}`} data-testid={`analytics-period-${period}`}>{period} hari</button>)}</div></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(({ label, value, icon: Icon }, index) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`analytics-metric-${index + 1}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0f4c81]"><Icon size={17} /></span><strong className="mt-4 block font-heading text-3xl text-[#0a3358]">{value}</strong><span className="text-xs font-bold text-slate-500">{label}</span></article>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="analytics-weekly-chart"><div className="mb-5 flex items-center gap-2"><BarChart3 size={17} className="text-emerald-600" /><h2 className="text-sm font-extrabold text-slate-800">Tren pendaftar per minggu</h2></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.weekly ?? []}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="count" name="Pendaftar" stroke="#0f4c81" strokeWidth={3} dot={{ fill: "#d97706" }} /></LineChart></ResponsiveContainer></div></article><article className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="analytics-source-chart"><h2 className="mb-5 text-sm font-extrabold text-slate-800">Sumber pendaftar</h2><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" name="Pendaftar" fill="#059669" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></article></div>
    <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-5" data-testid="analytics-major-breakdown"><h2 className="text-sm font-extrabold text-slate-800">Minat jurusan</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.by_major.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" data-testid={`analytics-major-${item.label.toLowerCase().replaceAll(" ", "-")}`}><span className="text-xs font-bold text-slate-600">{item.label}</span><strong className="text-sm text-[#0f4c81]">{item.value}</strong></div>)}</div></article>
  </section>;
}