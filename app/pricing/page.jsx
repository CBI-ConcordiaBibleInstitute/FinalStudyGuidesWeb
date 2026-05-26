import PageHeader from "@/components/PageHeader";
import PricingPlans from "@/components/PricingPlans";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/catalog-shared";

export const metadata = {
  title: "Pricing",
  description:
    "Every episode is $99 — the full companion study guide and video, yours to keep.",
};

const FAQ = [
  {
    q: "What do I get for $99?",
    a: "Each $99 purchase unlocks one episode in full — the complete companion study guide and the episode video. The guide is viewable in-page and downloadable, and it's yours to keep.",
  },
  {
    q: "Do I have to subscribe?",
    a: "No. There are no subscriptions or tiers — you buy episodes individually, one at a time, for $99 each. Add as many as you like to your cart and check out together.",
  },
  {
    q: "Is anything free?",
    a: "Yes. The first episode of every series — video and the full study guide — is free, with no card required.",
  },
  {
    q: "How does payment work?",
    a: "Each episode is a one-time $99 payment through Stripe. There's no recurring billing and nothing to cancel.",
  },
  {
    q: "What is your refund policy?",
    a: "If a study guide isn't right for you, request a full refund within 14 days of purchase.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Simple, honest pricing"
        subtitle={`One price for every episode — the full study guide and video for $${SITE.price}. No tiers, no subscription.`}
      />

      <div className="container-cb section">
        <div className="mx-auto max-w-4xl">
          <PricingPlans />
        </div>

        <div className="mx-auto mt-28 max-w-3xl">
          <Reveal className="text-center">
            <span className="eyebrow">Questions</span>
            <h2 className="mt-3 font-serif text-4xl font-bold text-ink sm:text-5xl">
              Frequently asked
            </h2>
          </Reveal>
          <div className="mt-12 space-y-4">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.06}>
                <details className="card group p-7 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-xl font-semibold text-ink">
                    {item.q}
                    <span className="text-3xl text-maroon transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-ink">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
