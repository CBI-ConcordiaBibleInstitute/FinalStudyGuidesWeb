"use client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useSettings } from "@/context/SettingsContext";

const PLAN = {
  name: "Study Guide Access",
  cadence: "per episode",
  blurb: "Unlock the full companion study guide and video for any episode.",
  features: [
    "Complete companion study guide for the episode",
    "Full episode video — watch anytime",
    "In-page viewer with zoom, page navigation & print",
    "Download the guide — yours to keep",
    "One-time purchase, no subscription",
  ],
  cta: "Browse episodes",
};

export default function PricingPlans() {
  const router = useRouter();
  const { user } = useAuth();
  const { push } = useToast();
  const { price } = useSettings();

  const onChoose = () => {
    if (!user) {
      router.push("/signup?next=/podcasts");
      return;
    }
    push(`Add any episode to your cart to unlock it for $${price}.`);
    router.push("/podcasts");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="border border-rule bg-white shadow-card">
        <div className="border-b border-rule bg-panel px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-maroon">
            Simple pricing
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-maroon">
            {PLAN.name}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-ink">{PLAN.blurb}</p>

          <div className="mt-4 flex items-end gap-1">
            <span className="font-serif text-4xl font-bold text-maroon">
              ${price}
            </span>
            <span className="mb-1 text-sm text-ink">{PLAN.cadence}</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {PLAN.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink">
                <Check
                  size={16}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0 text-gold"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button onClick={onChoose} className="btn-primary mt-6 w-full">
            {PLAN.cta}
          </button>
          <p className="mt-3 text-center text-xs text-ink">
            Secure checkout via CashNet · 14-day refund policy
          </p>
        </div>
      </div>
    </div>
  );
}
