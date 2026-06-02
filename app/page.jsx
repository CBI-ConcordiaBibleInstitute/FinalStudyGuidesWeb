import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import PodcastCard from "@/components/PodcastCard";
import PricingPlans from "@/components/PricingPlans";
import { getFeatured, getSettings } from "@/lib/catalog";

export default async function HomePage() {
  // Catalog unreachable (e.g. CI build without Supabase env) → empty grid.
  const featured = await getFeatured(6).catch(() => []);
  const { price } = await getSettings();

  return (
    <>
      <Hero />

      {/* Featured podcasts */}
      <section className="container-cb section">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Featured Series</span>
            <h2 className="mt-3 section-title">
              Begin with a <span className="text-maroon">podcast</span>
            </h2>
            <div className="mt-4 rule" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink">
              Each book of the Bible is its own series. Press play on the free
              first episode — no account needed.
            </p>
          </div>
          <Link href="/podcasts" className="btn-ghost">
            All 22 series <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <PodcastCard key={p.slug} podcast={p} index={i} />
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white section">
        <div className="container-cb">
          <Reveal className="text-center">
            <span className="eyebrow">Simple Pricing</span>
            <h2 className="mt-3 section-title">
              One price, <span className="text-maroon">per episode</span>.
            </h2>
            <div className="mx-auto mt-4 rule" />
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink">
              Start free, then buy episodes as you go — ${price} each, no
              subscription.
            </p>
          </Reveal>
          <div className="mx-auto mt-14 max-w-4xl">
            <PricingPlans />
          </div>
        </div>
      </section>
    </>
  );
}
