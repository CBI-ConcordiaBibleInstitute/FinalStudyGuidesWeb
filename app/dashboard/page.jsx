"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Library,
  Bookmark,
  CalendarClock,
  Download,
  Bell,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, isAdmin, setNotification } = useAuth();
  const { push } = useToast();
  const [episodesById, setEpisodesById] = useState({});

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/dashboard");
    if (ready && isAdmin) router.replace("/admin");
  }, [ready, user, isAdmin, router]);

  // Pull just the episodes referenced by the user's downloads + bookmarks.
  useEffect(() => {
    if (!user) return;
    const ids = Array.from(new Set([...user.downloads, ...user.bookmarks]));
    if (ids.length === 0) { setEpisodesById({}); return; }
    const sb = getSupabaseBrowser();
    sb.from("episodes")
      .select("id, title, guide_file")
      .in("id", ids)
      .then(({ data }) => {
        const map = {};
        for (const e of data ?? []) map[e.id] = { id: e.id, title: e.title, guideFile: e.guide_file };
        setEpisodesById(map);
      });
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="container-cb flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
      </div>
    );
  }

  const downloads = user.downloads.map((id) => episodesById[id]).filter(Boolean);
  const bookmarks = user.bookmarks.map((id) => episodesById[id]).filter(Boolean);

  const stats = [
    { icon: Library, label: "Guides in library", value: downloads.length },
    { icon: Bookmark, label: "Saved studies", value: bookmarks.length },
    {
      icon: CalendarClock,
      label: "Member since",
      value: fmtDate(user.joinedAt).replace(/,.*/, ""),
    },
  ];

  // Email notifications default to ON for every user.
  const prefs = {
    newEpisodes: true,
    digest: true,
    reminders: true,
    announcements: true,
    product: true,
    ...user.notifications,
  };

  const togglePref = (k) => {
    const next = !prefs[k];
    setNotification(k, next);
    push(
      next
        ? "Email notifications enabled."
        : "Notification preferences updated."
    );
  };

  return (
    <div className="container-cb py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="eyebrow">Your Dashboard</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-ink sm:text-5xl">
            Grace and peace, {user.name.split(" ")[0]}.
          </h1>
        </div>
        <Link href="/podcasts" className="btn-primary">
          Browse episodes <ArrowRight size={16} />
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card p-6 transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon text-white">
              <s.icon size={22} />
            </div>
            <p className="mt-4 font-serif text-4xl font-bold text-ink">
              {s.value}
            </p>
            <p className="text-sm text-ink">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {/* Library */}
          <section className="card p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-ink">
                My library
              </h2>
              <Link
                href="/podcasts"
                className="text-sm font-semibold text-maroon hover:underline"
              >
                Browse more
              </Link>
            </div>
            {downloads.length === 0 ? (
              <p className="mt-3 text-sm text-ink">
                No guides yet. Downloaded and purchased guides appear here.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {downloads.map((ep) => (
                  <li
                    key={ep.id}
                    className="flex items-center gap-3 rounded-lg border border-maroon/10 p-3"
                  >
                    <Library size={18} className="shrink-0 text-maroon" />
                    <Link
                      href={`/episodes/${ep.id}`}
                      className="line-clamp-1 flex-1 text-sm font-medium text-ink hover:text-maroon"
                    >
                      {ep.title}
                    </Link>
                    <a
                      href={`/api/guides/${ep.id}`}
                      download
                      aria-label={`Download ${ep.title}`}
                      className="rounded-full p-2 text-maroon hover:bg-maroon/10"
                    >
                      <Download size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Bookmarks */}
          <section className="card p-7">
            <h2 className="font-serif text-2xl font-bold text-ink">
              Saved studies
            </h2>
            {bookmarks.length === 0 ? (
              <p className="mt-3 text-sm text-ink">
                Tap “Save study” on any episode to bookmark it for later.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {bookmarks.map((ep) => (
                  <li key={ep.id}>
                    <Link
                      href={`/episodes/${ep.id}`}
                      className="flex items-center gap-3 rounded-lg border border-maroon/10 p-3 hover:border-maroon/30"
                    >
                      <Bookmark size={16} className="shrink-0 fill-maroon text-maroon" />
                      <span className="line-clamp-1 flex-1 text-sm font-medium text-ink">
                        {ep.title}
                      </span>
                      <ArrowRight size={15} className="text-maroon" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar: account + notifications */}
        <aside className="space-y-8">
          <section className="card p-7">
            <h2 className="font-serif text-2xl font-bold text-ink">Account</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row
                label="Email verified"
                value={user.verified ? "Yes" : "Pending"}
              />
            </dl>
          </section>

          <section className="card p-7">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
              <Bell size={18} /> Email notifications
            </h2>
            <p className="mt-1 text-xs text-ink">
              Receipts and security alerts are always sent.
            </p>
            <div className="mt-3 space-y-1">
              <Toggle
                label="New episode alerts"
                on={prefs.newEpisodes}
                onClick={() => togglePref("newEpisodes")}
              />
              <Toggle
                label="Weekly digest"
                on={prefs.digest}
                onClick={() => togglePref("digest")}
              />
              <Toggle
                label="Reminders (cart, saved studies)"
                on={prefs.reminders}
                onClick={() => togglePref("reminders")}
              />
              <Toggle
                label="Announcements & promotions"
                on={prefs.announcements}
                onClick={() => togglePref("announcements")}
              />
              <Toggle
                label="Product updates"
                on={prefs.product}
                onClick={() => togglePref("product")}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function Toggle({ label, on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between py-2 text-left text-sm text-ink"
    >
      {label}
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          on ? "bg-maroon" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
