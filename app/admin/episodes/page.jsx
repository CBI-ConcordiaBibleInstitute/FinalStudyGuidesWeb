"use client";
// Admin · Episodes — browse, edit, add, delete. PDF upload puts the file in
// the `study-guides` Supabase Storage bucket and stores its public URL on
// the episode row. RLS lets only signed-in admins write.
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus, Trash2, Search, FileText, Youtube, ExternalLink, UploadCloud, Pencil, Check, X,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function EpisodesManager() {
  const { push } = useToast();
  const params = useSearchParams();
  const sb = getSupabaseBrowser();

  const [podcasts, setPodcasts] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState(params.get("series") || "all");
  const [query, setQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSeries, setNewSeries] = useState(params.get("series") || "");
  const [uploadingId, setUploadingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([
      sb.from("podcasts").select("slug, name").order("sort_order"),
      sb.from("episodes")
        .select("*, podcasts(name)")
        .order("podcast_slug").order("number"),
    ]);
    if (pRes.error) push(pRes.error.message, "error");
    if (eRes.error) push(eRes.error.message, "error");
    setPodcasts(pRes.data ?? []);
    setEpisodes(
      (eRes.data ?? []).map((e) => ({
        id: e.id,
        number: e.number,
        title: e.title,
        slug: e.slug,
        podcastSlug: e.podcast_slug,
        podcastName: e.podcasts?.name ?? "",
        guideFile: e.guide_file,
        youtubeUrl: e.youtube_url,
        free: e.free,
        published: e.published,
      }))
    );
    if (!newSeries && pRes.data?.length) setNewSeries(pRes.data[0].slug);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return episodes.filter(
      (e) =>
        (series === "all" || e.podcastSlug === series) &&
        (!q || e.title.toLowerCase().includes(q))
    );
  }, [episodes, series, query]);

  const addEpisode = async () => {
    const title = newTitle.trim();
    if (!title) return push("Enter an episode title first.", "error");
    if (!newSeries) return push("Choose a series for this episode.", "error");
    const podcast = podcasts.find((p) => p.slug === newSeries);
    const count = episodes.filter((e) => e.podcastSlug === newSeries).length;
    const id = `ep-${newSeries}-${Date.now()}`;
    const { error } = await sb.from("episodes").insert({
      id, podcast_slug: newSeries, number: count + 1,
      title, slug: slugify(title), free: count === 0, published: true,
    });
    if (error) return push(error.message, "error");
    push(`Episode “${title}” added to ${podcast?.name ?? newSeries}.`);
    setNewTitle("");
    load();
  };

  const beginEdit = (e) => { setEditingId(e.id); setEditTitle(e.title); };
  const cancelEdit = () => { setEditingId(null); setEditTitle(""); };
  const saveEdit = async (id) => {
    const title = editTitle.trim();
    if (!title) return push("Episode title can't be empty.", "error");
    const slug = slugify(title);
    const { error } = await sb.from("episodes").update({ title, slug }).eq("id", id);
    if (error) return push(error.message, "error");
    push("Episode renamed.");
    setEpisodes((list) => list.map((x) => x.id === id ? { ...x, title, slug } : x));
    cancelEdit();
  };

  const toggleFree = async (id, current) => {
    const { error } = await sb.from("episodes").update({ free: !current }).eq("id", id);
    if (error) return push(error.message, "error");
    push("Episode access updated.");
    setEpisodes((list) => list.map((e) => e.id === id ? { ...e, free: !current } : e));
  };

  const removeEpisode = async (id) => {
    if (!confirm("Delete this episode?")) return;
    const { error } = await sb.from("episodes").delete().eq("id", id);
    if (error) return push(error.message, "error");
    push("Episode deleted.", "info");
    setEpisodes((list) => list.filter((e) => e.id !== id));
  };

  const uploadGuide = async (episode, file) => {
    if (!file) return;
    setUploadingId(episode.id);
    const path = `${episode.podcastSlug}/${episode.slug || episode.id}.pdf`;
    const { error: upErr } = await sb.storage
      .from("study-guides")
      .upload(path, file, { upsert: true, contentType: file.type || "application/pdf" });
    if (upErr) { setUploadingId(null); return push(upErr.message, "error"); }
    const { error: updErr } = await sb.from("episodes")
      .update({ guide_file: path, guide_format: "pdf" })
      .eq("id", episode.id);
    setUploadingId(null);
    if (updErr) return push(updErr.message, "error");
    push("Study guide uploaded.");
    setEpisodes((list) => list.map((e) => e.id === episode.id ? { ...e, guideFile: path } : e));
  };

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New episode title…"
          className="input flex-1"
        />
        <select
          value={newSeries}
          onChange={(e) => setNewSeries(e.target.value)}
          className="input w-52"
        >
          {podcasts.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <button onClick={addEpisode} className="btn-primary">
          <Plus size={16} /> Add episode
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search episodes…"
            className="input pl-9"
          />
        </div>
        <select value={series} onChange={(e) => setSeries(e.target.value)} className="input w-52">
          <option value="all">All series</option>
          {podcasts.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <span className="text-sm text-ink">
          {filtered.length} episode{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Episode</th>
              <th className="px-5 py-3">Series</th>
              <th className="px-5 py-3">Study guide</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink">No episodes match your filters.</td></tr>
            ) : filtered.map((e) => (
              <tr key={e.id} className="border-t border-maroon/10">
                <td className="px-5 py-3 text-ink">{e.number}</td>
                <td className="px-5 py-3">
                  {editingId === e.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(ev) => setEditTitle(ev.target.value)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") saveEdit(e.id);
                          if (ev.key === "Escape") cancelEdit();
                        }}
                        className="input h-8 w-full max-w-[320px]"
                      />
                      <button onClick={() => saveEdit(e.id)} aria-label="Save title" className="rounded-full p-1.5 text-emerald-600 hover:bg-emerald-50">
                        <Check size={15} />
                      </button>
                      <button onClick={cancelEdit} aria-label="Cancel" className="rounded-full p-1.5 text-ink hover:bg-cream">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="group inline-flex items-center gap-2">
                      <Link href={`/episodes/${e.id}`} className="font-semibold text-ink hover:text-maroon">
                        {e.title}
                      </Link>
                      <button
                        onClick={() => beginEdit(e)}
                        aria-label={`Rename ${e.title}`}
                        title="Rename episode"
                        className="rounded-full p-1 text-ink opacity-0 transition group-hover:opacity-70 hover:text-maroon"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-ink">{e.podcastName}</td>
                <td className="px-5 py-3">
                  <div className="inline-flex items-center gap-2">
                    {e.guideFile ? (
                      <a
                        href={`/api/guides/${e.id}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:underline"
                      >
                        <FileText size={14} /> PDF <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-ink">— none —</span>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-maroon/20 px-2 py-1 text-[11px] font-semibold text-maroon hover:bg-maroon/10">
                      <UploadCloud size={12} />
                      {uploadingId === e.id ? "Uploading…" : e.guideFile ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          ev.target.value = "";
                          uploadGuide(e, f);
                        }}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleFree(e.id, e.free)}
                    className={e.free ? "badge-free" : "badge-locked"}
                  >
                    {e.free ? "Free preview" : "Paid"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {e.youtubeUrl && (
                      <a
                        href={e.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        aria-label="Open episode video"
                        className="rounded-full p-2 text-ink hover:bg-maroon/10 hover:text-maroon"
                      >
                        <Youtube size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => removeEpisode(e.id)}
                      aria-label={`Delete ${e.title}`}
                      className="rounded-full p-2 text-ink hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminEpisodesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-ink">Loading episodes…</div>}>
      <EpisodesManager />
    </Suspense>
  );
}
