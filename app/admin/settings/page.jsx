"use client";
// Admin · Settings — branding and pricing, persisted to the single
// `site_settings` row in Supabase (RLS restricts writes to admins). The
// public site reads these values via getSettings() / the SettingsProvider,
// so saving here updates the live site. Payments are handled off-site by
// CashNet's hosted checkout, so there are no payment secrets to store here.
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { SITE } from "@/lib/catalog-shared";

function Labeled({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink">
        {label}
      </span>
      {children}
    </label>
  );
}

const DEFAULTS = {
  site_name: SITE.name,
  support_email: SITE.email,
  episode_price: SITE.price,
  primary_color: "#660e1b",
};

export default function AdminSettingsPage() {
  const { push } = useToast();
  const supabase = getSupabaseBrowser();

  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the current saved settings on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("site_name, support_email, episode_price, primary_color")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        push("Couldn't load settings — showing defaults.", "error");
      } else if (data) {
        setForm({
          site_name: data.site_name ?? DEFAULTS.site_name,
          support_email: data.support_email ?? DEFAULTS.support_email,
          episode_price: data.episode_price ?? DEFAULTS.episode_price,
          primary_color: data.primary_color ?? DEFAULTS.primary_color,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, push]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        id: 1,
        site_name: form.site_name.trim(),
        support_email: form.support_email.trim(),
        episode_price: Number(form.episode_price),
        primary_color: form.primary_color,
      },
      { onConflict: "id" }
    );
    setSaving(false);
    if (error) {
      push(error.message || "Save failed — check you're signed in as admin.", "error");
      return;
    }
    push("Settings saved.");
  };

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-ink">Branding</h3>
        <div className="mt-3 space-y-3">
          <Labeled label="Site name">
            <input
              value={form.site_name}
              onChange={set("site_name")}
              disabled={loading}
              className="input"
            />
          </Labeled>
          <Labeled label="Primary color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={set("primary_color")}
                disabled={loading}
                className="h-10 w-14 cursor-pointer rounded border border-rule bg-white p-1"
                aria-label="Primary color picker"
              />
              <input
                value={form.primary_color}
                onChange={set("primary_color")}
                disabled={loading}
                className="input flex-1"
              />
            </div>
          </Labeled>
          <Labeled label="Support email">
            <input
              type="email"
              value={form.support_email}
              onChange={set("support_email")}
              disabled={loading}
              className="input"
            />
          </Labeled>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-ink">
          Payments &amp; pricing
        </h3>
        <div className="mt-3 space-y-3">
          <Labeled label="Episode price (USD)">
            <input
              value={form.episode_price}
              onChange={set("episode_price")}
              disabled={loading}
              type="number"
              min="0"
              step="1"
              className="input"
            />
          </Labeled>
          <p className="text-xs text-ink/60">
            Payments are processed by CashNet's hosted checkout. There are no
            payment keys to configure here — checkout redirects customers to
            CashNet, which sends them back once payment completes.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <button type="submit" disabled={loading || saving} className="btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
