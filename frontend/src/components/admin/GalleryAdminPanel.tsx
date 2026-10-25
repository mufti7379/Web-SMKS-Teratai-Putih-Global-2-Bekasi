import { Edit3, ExternalLink, Eye, EyeOff, FolderOpen, Images, Play, Trash2 } from "lucide-react";
import { albumOf, albumSlug, galleryMedia, galleryStill } from "@/lib/gallery";
import { optimizeImageUrl } from "@/lib/images";
import type { CMSItem } from "@/lib/cms";

type GalleryAdminPanelProps = {
  items: CMSItem[];
  onEdit: (item: CMSItem) => void;
  onDelete: (item: CMSItem) => void;
};

const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;

function EntryCard({ item, onEdit, onDelete }: { item: CMSItem; onEdit: () => void; onDelete: () => void }) {
  const media = item.image_url ? galleryMedia(item.image_url) : null;
  const still = !media ? null : media.kind === "image" ? optimizeImageUrl(media.src, 600) : galleryStill(media, 600);
  // A Drive file plays as a video in the home page stack but shows as a photo in an album, so it gets a neutral label.
  const kind = media?.kind === "folder" ? "Album Google Drive" : media?.kind === "drive" ? "File Google Drive" : media?.kind === "youtube" || media?.kind === "file" ? "Video" : "Foto";
  const album = albumOf(item);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid={`admin-content-item-${item.id}`}>
      {media?.kind === "folder" ? (
        <div className="flex h-36 flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0f4c81] to-[#092c4c] text-white">
          <FolderOpen size={30} className="text-amber-300" />
          <a href={folderUrl(media.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-200 hover:text-white">Buka folder di Drive <ExternalLink size={11} /></a>
        </div>
      ) : (
        <div className="relative h-36 bg-slate-100">
          {still && <img src={still} alt="" className="h-full w-full object-cover" />}
          {(media?.kind === "youtube" || media?.kind === "file") && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#0f4c81]"><Play size={15} fill="currentColor" /></span></span>}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${item.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.is_published ? <Eye size={11} /> : <EyeOff size={11} />}{item.is_published ? "Tayang" : "Draft"}</span>
          <span className="text-[10px] font-bold text-[#0f4c81]">{kind}</span>
        </div>
        <h3 className="mt-3 font-heading font-extrabold text-[#0a3358]">{item.title}</h3>
        {/* Which album it belongs to — for a Drive album entry that's itself; for a photo, the album it was filed under. */}
        {album && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700"><Images size={11} /> {album}</span>
            <a href={`/galeri/${albumSlug(album)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#0f4c81] hover:text-emerald-600">Lihat album <ExternalLink size={11} /></a>
          </div>
        )}
        {item.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold" data-testid={`admin-edit-content-${item.id}`}><Edit3 size={14} /> Edit</button>
          <button type="button" onClick={onDelete} className="rounded-xl bg-red-50 px-3 text-red-600" aria-label="Hapus" data-testid={`admin-delete-content-${item.id}`}><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  );
}

/**
 * The admin's gallery in two parts: every album item together (Drive album entries first, then
 * photos filed under an album, grouped by album name) and the items shown in the home page's
 * activity stack — so a new album never adds another block here.
 */
export function GalleryAdminPanel({ items, onEdit, onDelete }: GalleryAdminPanelProps) {
  const isFolder = (item: CMSItem) => galleryMedia(item.image_url ?? "").kind === "folder";
  const albumEntries = items
    .filter((item) => albumOf(item))
    .sort((a, b) => (albumOf(a) ?? "").localeCompare(albumOf(b) ?? "", "id") || Number(isFolder(b)) - Number(isFolder(a)) || a.created_at.localeCompare(b.created_at));
  const groups = [
    { key: "album", label: "Kategori", title: "Album", hint: "Album dari folder Google Drive dan foto yang dimasukkan ke album. Masing-masing punya halaman sendiri di website.", href: null, entries: albumEntries },
    { key: "beranda", label: "Tanpa album", title: "Galeri Aktivitas (beranda)", hint: "Foto dan video yang tampil langsung di tumpukan Galeri Aktivitas beranda.", href: "/#galeri", entries: items.filter((item) => !albumOf(item)) },
  ];
  return (
    <div className="mt-7 space-y-10" data-testid="admin-gallery-groups">
      {groups.map((group) => (
        <section key={group.key} data-testid={`admin-gallery-group-${group.key}`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{group.label}</p>
              <h2 className="mt-1 font-heading text-xl font-extrabold text-[#0a3358]">{group.title} <span className="text-sm font-bold text-slate-400">({group.entries.length})</span></h2>
              <p className="mt-1 text-xs text-slate-500">{group.hint}</p>
            </div>
            {group.href && <a href={group.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f4c81] hover:text-emerald-600">Lihat di website <ExternalLink size={13} /></a>}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.entries.map((item) => <EntryCard key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />)}
            {group.entries.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">{group.key === "album" ? "Belum ada album. Klik “Album dari Google Drive” untuk menambahkan." : "Belum ada isi."}</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
