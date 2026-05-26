"use client";
// Admin landing — at-a-glance live stats, quick links into each management
// area, and a real downloads chart. Auth guard + chrome live in layout.jsx.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, FileText, Users, Mail, DollarSign, Download, TrendingUp, ArrowRight,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const QUICK_LINKS = [
  { href: "/admin/podcasts", title: "Manage Podcasts", desc: "Create, edit, and organize the podcast series.", cta: "Go to Podcasts", icon: BookOpen },
  { href: "/admin/episodes", title: "Manage Episodes", desc: "Add episodes and upload their study guides.", cta: "Go to Episodes", icon: FileText },
  { href: "/admin/users",    title: "Manage Users",    desc: "View members and manage their access.",       cta: "Go to Users",    icon: Users },
  { href: "/admin/email",    title: "Email Campaigns", desc: "Send announcements and edit transactional mail.", cta: "Go to Email", icon: Mail },
];

// 6-month rolling window — labels for the bar chart x-axis.
function lastSixMonths() {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: m.toLocaleString("en-US", { month: "short" }),
      v: 0,
    });
  }
  return out;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ podcasts: 0, episodes: 0, guides: 0, members: 0 });
  const [downloads, setDownloads] = useState({
    total: 0,
    last7: 0,
    perMonth: lastSixMonths(),
    activeMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    (async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [p, e, g, m, dlTotal, dlRecent, dlSeries] = await Promise.all([
        sb.from("podcasts").select("slug", { count: "exact", head: true }).eq("published", true),
        sb.from("episodes").select("id",  { count: "exact", head: true }).eq("published", true),
        sb.from("episodes").select("id",  { count: "exact", head: true }).eq("published", true).not("guide_file", "is", null),
        sb.from("profiles").select("id",  { count: "exact", head: true }),
        sb.from("download_events").select("id", { count: "exact", head: true }),
        sb.from("download_events").select("id", { count: "exact", head: true }).gte("downloaded_at", sevenDaysAgo.toISOString()),
        sb.from("download_events").select("downloaded_at, user_id").gte("downloaded_at", sixMonthsAgo.toISOString()),
      ]);

      const perMonth = lastSixMonths();
      const seenMembers = new Set();
      for (const row of dlSeries.data ?? []) {
        const d = new Date(row.downloaded_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = perMonth.find((b) => b.key === key);
        if (bucket) bucket.v += 1;
        if (row.user_id) seenMembers.add(row.user_id);
      }

      setStats({
        podcasts: p.count ?? 0,
        episodes: e.count ?? 0,
        guides:   g.count ?? 0,
        members:  m.count ?? 0,
      });
      setDownloads({
        total: dlTotal.count ?? 0,
        last7: dlRecent.count ?? 0,
        perMonth,
        activeMembers: seenMembers.size,
      });
      setLoading(false);
    })();
  }, []);

  const max = useMemo(
    () => Math.max(1, ...downloads.perMonth.map((r) => r.v)),
    [downloads.perMonth]
  );

  const statCards = [
    { icon: BookOpen, label: "Podcast series",       value: stats.podcasts },
    { icon: FileText, label: "Episodes published",   value: stats.episodes },
    { icon: FileText, label: "Study guides (PDF)",   value: stats.guides },
    { icon: Users,    label: "Members",              value: stats.members },
  ];

  const reachPct = stats.members > 0
    ? Math.round((downloads.activeMembers / stats.members) * 1000) / 10
    : 0;

  const metricCards = [
    {
      icon: Download,
      label: "Guides downloaded — all time",
      value: downloads.total.toLocaleString(),
      trend: `+${downloads.last7.toLocaleString()} in the last 7 days`,
    },
    {
      icon: TrendingUp,
      label: "Member reach (last 6 mo)",
      value: stats.members > 0 ? `${reachPct}%` : "—",
      trend: `${downloads.activeMembers.toLocaleString()} of ${stats.members.toLocaleString()} members downloaded`,
    },
    {
      icon: DollarSign,
      label: "Revenue",
      value: "—",
      trend: "Connect Stripe to track sales",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon text-white">
              <c.icon size={22} />
            </div>
            <p className="mt-4 font-serif text-4xl font-bold text-ink">{c.value}</p>
            <p className="text-sm text-ink">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-serif text-3xl font-bold text-ink">Manage the platform</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((q) => (
            <Link key={q.href} href={q.href} className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-maroon/30 hover:shadow-lift">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon text-white">
                <q.icon size={22} />
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-ink">{q.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-ink">{q.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-maroon">
                {q.cta}
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-7">
          <h3 className="font-serif text-2xl font-bold text-ink">Downloads — last 6 months</h3>
          <p className="mt-1 text-sm text-ink">
            Every guide opened via <code className="rounded bg-cream px-1.5 py-0.5 text-[12px]">/api/guides/[id]</code> is logged in <code className="rounded bg-cream px-1.5 py-0.5 text-[12px]">download_events</code>.
          </p>
          <div className="mt-7 flex h-56 items-end gap-3">
            {downloads.perMonth.map((r, i) => (
              <div key={r.key} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: loading ? "4%" : `${Math.max(4, (r.v / max) * 100)}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                  className="w-full rounded-t-lg bg-maroon"
                  title={`${r.v.toLocaleString()} downloads`}
                />
                <span className="text-xs font-medium text-ink">{r.label}</span>
                <span className="text-[11px] text-ink/60">{r.v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {metricCards.map((c) => (
            <div key={c.label} className="card p-6 transition hover:shadow-lift">
              <c.icon size={22} className="text-maroon" />
              <p className="mt-3 font-serif text-3xl font-bold text-ink">{c.value}</p>
              <p className="text-sm text-ink">{c.label}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">{c.trend}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
