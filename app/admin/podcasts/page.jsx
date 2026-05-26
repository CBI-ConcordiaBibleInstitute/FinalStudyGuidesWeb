"use client";
// Admin · Podcasts — create / publish / delete series, backed by Supabase.
// RLS lets the signed-in admin see and mutate every row.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { TESTAMENTS } from "@/lib/catalog-shared";

export default function AdminPodcastsPage() {
  const { push } = useToast();
  const sb = getSupabaseBrowser();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newTestament, setNewTestament] = useState("New Testament");
  const [editingSlug, setEditingSlug] = useState(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb
      .from("podcasts")
      .select("slug, name, testament, published, sort_order, episodes(id)")
      .order("sort_order", { ascending: true });
    if (error) {
      push(error.message, "error");
    } else {
      setPodcasts(
        (data ?? []).map((p) => ({
          slug: p.slug, name: p.name, testament: p.testament,
          published: p.published, episodeCount: p.episodes?.length ?? 0,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const addPodcast = async () => {
    const name = newName.trim();
    if (!name) return push("Enter a series name first.", "error");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (podcasts.some((p) => p.slug === slug))
      return push("A series with that name already exists.", "error");
    const sort_order = podcasts.length;
    const { error } = await sb.from("podcasts").insert({
      slug, name, testament: newTestament, published: false, sort_order,
    });
    if (error) return push(error.message, "error");
    push(`Series “${name}” created as a draft.`);
    setNewName("");
    load();
  };

  const beginEdit = (p) => { setEditingSlug(p.slug); setEditName(p.name); };
  const cancelEdit = () => { setEditingSlug(null); setEditName(""); };
  const saveEdit = async (slug) => {
    const name = editName.trim();
    if (!name) return push("Series name can't be empty.", "error");
    const { error } = await sb.from("podcasts").update({ name }).eq("slug", slug);
    if (error) return push(error.message, "error");
    push("Series renamed.");
    setPodcasts((p) => p.map((x) => x.slug === slug ? { ...x, name } : x));
    cancelEdit();
  };

  const togglePublished = async (slug, current) => {
    const { error } = await sb.from("podcasts").update({ published: !current }).eq("slug", slug);
    if (error) return push(error.message, "error");
    push("Series status updated.");
    setPodcasts((p) => p.map((x) => x.slug === slug ? { ...x, published: !current } : x));
  };

  const removePodcast = async (slug) => {
    if (!confirm("Delete this series and all of its episodes?")) return;
    const { error } = await sb.from("podcasts").delete().eq("slug", slug);
    if (error) return push(error.message, "error");
    push("Series deleted.", "info");
    setPodcasts((p) => p.filter((x) => x.slug !== slug));
  };

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New podcast / series name…"
          className="input flex-1"
        />
        <select
          value={newTestament}
          onChange={(e) => setNewTestament(e.target.value)}
          className="input w-44"
        >
          {TESTAMENTS.filter((t) => t !== "All" && t !== "Featured").map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button onClick={addPodcast} className="btn-primary">
          <Plus size={16} /> Add series
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink">
            <tr>
              <th className="px-5 py-3">Series</th>
              <th className="px-5 py-3">Testament</th>
              <th className="px-5 py-3">Episodes</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ink">Loading…</td></tr>
            ) : podcasts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ink">No series yet.</td></tr>
            ) : podcasts.map((p) => (
              <tr key={p.slug} className="border-t border-maroon/10">
                <td className="px-5 py-3 font-semibold text-ink">
                  {editingSlug === p.slug ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(p.slug);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="input h-8 w-full max-w-[260px]"
                      />
                      <button onClick={() => saveEdit(p.slug)} aria-label="Save name" className="rounded-full p-1.5 text-emerald-600 hover:bg-emerald-50">
                        <Check size={15} />
                      </button>
                      <button onClick={cancelEdit} aria-label="Cancel" className="rounded-full p-1.5 text-ink hover:bg-cream">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => beginEdit(p)} className="group inline-flex items-center gap-1.5 text-left hover:text-maroon" title="Rename series">
                      {p.name}
                      <Pencil size={13} className="opacity-0 transition group-hover:opacity-70" />
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-ink">{p.testament}</td>
                <td className="px-5 py-3 text-ink">{p.episodeCount}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => togglePublished(p.slug, p.published)}
                    className={p.published ? "badge-free" : "badge-locked"}
                  >
                    {p.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/episodes?series=${p.slug}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-maroon hover:bg-maroon/10"
                    >
                      <FileText size={14} /> Episodes
                    </Link>
                    <button
                      onClick={() => removePodcast(p.slug)}
                      aria-label={`Delete ${p.name}`}
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
