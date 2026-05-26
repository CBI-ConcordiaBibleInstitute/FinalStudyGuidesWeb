import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/catalog-shared";

export const metadata = { title: "FAQ" };

const FAQ = [
  {
    q: "How do the free episodes work?",
    a: "The first episode of every series — all 22 — is completely free. You get the teaching video and the full downloadable study guide with no account or card required.",
  },
  {
    q: "What format are the study guides?",
    a: "Study guides are PDF documents, formatted for printing and group use. You can read them right in your browser, or download them to open in any PDF reader.",
  },
  {
    q: "How do I unlock a paid episode?",
    a: `Each episode is a one-time $${SITE.price} purchase that unlocks the full study guide and the episode video. There are no subscriptions — add the episodes you want to your cart and check out together.`,
  },
  {
    q: "Can I use these in a small group or Bible class?",
    a: "Yes — the guides are designed for personal and group study. A purchased guide may be used for the classes and groups you lead.",
  },
  {
    q: "How do refunds work?",
    a: "Every purchase is one-time, so there's nothing to cancel. If a study guide isn't right for you, request a full refund within 14 days of purchase, provided it hasn't been downloaded.",
  },
  {
    q: "Will there be new content?",
    a: "Yes. New episodes and guides are added regularly. Turn on new-episode alerts in your dashboard to be notified.",
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        subtitle="Everything you need to know about studying with Concordia."
      />
      <div className="container-cb section">
        <div className="mx-auto max-w-3xl space-y-4">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
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
        <p className="mt-14 text-center text-ink">
          Still have a question?{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="font-semibold text-maroon hover:underline"
          >
            {SITE.email}
          </a>
        </p>
      </div>
    </>
  );
}
