"use client";
// Admin · Settings — branding and payment configuration. Demo form; persist
// these values to your store/Supabase later.
import { useToast } from "@/context/ToastContext";
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

export default function AdminSettingsPage() {
  const { push } = useToast();

  const save = (e) => {
    e.preventDefault();
    push("Settings saved.");
  };

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-ink">Branding</h3>
        <div className="mt-3 space-y-3">
          <Labeled label="Site name">
            <input defaultValue={SITE.name} className="input" />
          </Labeled>
          <Labeled label="Primary color">
            <input defaultValue="#8B1538" className="input" />
          </Labeled>
          <Labeled label="Support email">
            <input defaultValue={SITE.email} className="input" />
          </Labeled>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-ink">
          Payments &amp; pricing
        </h3>
        <div className="mt-3 space-y-3">
          <Labeled label="Episode price (USD)">
            <input defaultValue={SITE.price} type="number" className="input" />
          </Labeled>
          <Labeled label="Stripe publishable key">
            <input placeholder="pk_live_…" className="input" />
          </Labeled>
          <Labeled label="Stripe secret key">
            <input placeholder="sk_live_…" type="password" className="input" />
          </Labeled>
        </div>
      </div>

      <div className="lg:col-span-2">
        <button type="submit" className="btn-primary">
          Save settings
        </button>
      </div>
    </form>
  );
}
