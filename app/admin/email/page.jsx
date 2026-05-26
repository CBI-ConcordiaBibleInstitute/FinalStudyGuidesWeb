"use client";
// Admin · Email — transactional templates, outbound campaigns, and a live
// log of every email the platform has dispatched (drawn from the demo
// localStorage queue). Wire `sendEmail` to your ESP later and this page
// continues to work unchanged.
import { useEffect, useMemo, useState } from "react";
import { Send, Inbox, RefreshCw, Trash2, Mail } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  TEMPLATES,
  NOTIFICATION_CATEGORIES,
  sendEmail,
  getEmailLog,
  clearEmailLog,
} from "@/lib/email";
import {
  notifyAnnouncement,
  notifyProductUpdate,
  notifyMaintenance,
  notifyPolicyUpdate,
  notifySurveyRequest,
} from "@/lib/notifications";

// Demo subscriber roster — replace with a query against your user table.
const DEMO_SUBSCRIBERS = [
  { email: "karen@example.com", name: "Karen Albrecht" },
  { email: "dhoffmann@example.com", name: "Daniel Hoffmann" },
  { email: "maria@example.com", name: "Maria Delgado" },
  { email: "tbecker@example.com", name: "Tom Becker" },
];

export default function AdminEmailPage() {
  const { push } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [type, setType] = useState("promotional");
  const [preview, setPreview] = useState(null);
  const [log, setLog] = useState([]);

  const refreshLog = () => setLog(getEmailLog());
  useEffect(() => { refreshLog(); }, []);

  // Templates grouped by category for the catalog view.
  const grouped = useMemo(() => {
    const out = {};
    Object.entries(TEMPLATES).forEach(([key, def]) => {
      if (def.internal) return;
      const cat = def.category || "announcements";
      (out[cat] ||= []).push({ key, ...def });
    });
    return out;
  }, []);

  const previewTemplate = (key) => {
    const def = TEMPLATES[key];
    if (!def) return;
    const sample = {
      name: "Karen Albrecht",
      orderId: "CB-001234",
      items: [{ title: "Genesis 1 — In the Beginning", price: 99 }],
      total: 99,
      episodeTitle: "Genesis 1 — In the Beginning",
      episodeId: "genesis-1",
      podcastName: "Top 40 Texts",
      at: new Date().toISOString(),
      effectiveAt: new Date(Date.now() + 14 * 86400_000).toISOString(),
      renewsAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
      amount: 99,
      resetUrl: "/reset?token=demo",
      verifyUrl: "/verify?token=demo",
      confirmUrl: "/confirm?token=demo",
      surveyUrl: "/survey",
      duration: "30 minutes",
      itemCount: 1,
    };
    setPreview({
      key,
      label: def.label,
      subject: typeof def.subject === "function" ? def.subject(sample) : def.subject,
      body: typeof def.body === "function" ? def.body(sample) : def.body,
    });
  };

  const send = () => {
    const list =
      audience === "paying"
        ? DEMO_SUBSCRIBERS.slice(0, 2)
        : audience === "free"
          ? DEMO_SUBSCRIBERS.slice(2)
          : DEMO_SUBSCRIBERS;

    if (type === "promotional") {
      if (!subject.trim()) {
        push("Add a subject line first.", "error");
        return;
      }
      notifyAnnouncement(list, { subject, body, message: body });
    } else if (type === "productUpdate") {
      notifyProductUpdate(list, body ? body.split("\n").filter(Boolean) : ["(no items)"]);
    } else if (type === "maintenanceNotice") {
      notifyMaintenance(list, new Date().toISOString(), body || "30 minutes");
    } else if (type === "policyUpdate") {
      notifyPolicyUpdate(list, new Date().toISOString());
    } else if (type === "surveyRequest") {
      notifySurveyRequest(list, "/survey");
    } else {
      // Single-template broadcast — render once per recipient.
      list.forEach((s) => {
        sendEmail({
          to: s.email,
          template: type,
          data: { name: s.name, subject, body, message: body },
          prefs: s.notifications,
          force: true,
        });
      });
    }
    push(`Campaign “${subject || TEMPLATES[type]?.label || type}” queued to ${list.length} recipients.`);
    setSubject("");
    setBody("");
    refreshLog();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Template catalog */}
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-ink">
            Notification templates
          </h3>
          <p className="mt-1 text-xs text-ink">
            Every transactional and lifecycle email the platform sends.
          </p>
          <div className="mt-3 space-y-5">
            {Object.entries(grouped).map(([cat, templates]) => (
              <div key={cat}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-maroon">
                  {NOTIFICATION_CATEGORIES[cat] || cat}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {templates.map((t) => (
                    <li
                      key={t.key}
                      className="flex items-center justify-between rounded-lg border border-maroon/10 px-3 py-2 text-sm"
                    >
                      <span className="text-ink">{t.label}</span>
                      <button
                        onClick={() => previewTemplate(t.key)}
                        className="text-xs font-semibold text-maroon hover:underline"
                      >
                        Preview
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign composer */}
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-ink">New campaign</h3>
          <div className="mt-3 space-y-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input"
            >
              <option value="promotional">Promotion / announcement</option>
              <option value="productUpdate">Product update</option>
              <option value="maintenanceNotice">Maintenance notice</option>
              <option value="policyUpdate">Terms / privacy update</option>
              <option value="surveyRequest">Survey request</option>
              <option value="reEngagement">Re-engagement (we miss you)</option>
              <option value="weeklyDigest">Weekly digest</option>
            </select>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="input"
            >
              <option value="all">All users</option>
              <option value="paying">Paying customers</option>
              <option value="free">Free-preview users</option>
            </select>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line (optional for typed campaigns)"
              className="input"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={6}
              className="input resize-none"
            />
            <button onClick={send} className="btn-primary w-full">
              <Send size={16} /> Send campaign
            </button>
          </div>

          {preview && (
            <div className="mt-5 rounded-xl border border-maroon/10 bg-cream p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-maroon">
                  Preview · {preview.label}
                </p>
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs text-ink hover:text-maroon"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                {preview.subject}
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-ink">
                {preview.body}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Recent sends */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
            <Inbox size={18} /> Recent dispatches
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshLog}
              className="btn-ghost px-3 py-1.5 text-xs"
              aria-label="Refresh log"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={() => { clearEmailLog(); refreshLog(); }}
              className="btn-ghost px-3 py-1.5 text-xs"
              aria-label="Clear log"
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>
        {log.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink">
            <Mail size={14} /> No emails dispatched yet — sign up, purchase, or
            send a campaign to populate the log.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-maroon/10 text-sm">
            {log.slice(0, 50).map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-maroon">
                  <Mail size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {entry.subject}
                  </p>
                  <p className="truncate text-xs text-ink">
                    To {entry.to} · {entry.label}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink">
                  {new Date(entry.at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
