"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Youtube, BookOpen, ArrowUpRight } from "lucide-react";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/catalog-shared";
import { useSettings } from "@/context/SettingsContext";

const PRIMARY = [
  { href: "/podcasts", label: "Podcasts" },
  { href: "/podcasts", label: "Study Guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/search", label: "Search" },
];

const SECONDARY = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Footer() {
  const { email } = useSettings();
  return (
    <footer className="relative mt-16 overflow-hidden bg-maroon-gradient text-cream">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="container-cb relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="flex items-center gap-3">
            <Logo size={56} />
            <span className="leading-tight">
              <span className="block font-serif text-lg font-bold text-cream">
                Concordia Bible Institute
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-light">
                Christ in Every Word
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/75">
            {SITE.tagline} Premium study guides and a podcast paired with every
            book of the Bible.
          </p>
        </motion.div>

        <FooterCol heading="Browse" links={PRIMARY} />
        <FooterCol heading="Institute" links={SECONDARY} />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h3 className="text-cream font-serif text-sm font-bold uppercase tracking-[0.22em]">
            Connect
          </h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <a
                href={`mailto:${email}`}
                className="group inline-flex items-center gap-2 text-cream/80 transition hover:text-white"
              >
                <Mail size={14} /> {email}
                <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <a
                href={SITE.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-cream/80 transition hover:text-white"
              >
                <Youtube size={14} /> YouTube channel
                <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 text-cream/80 transition hover:text-white"
              >
                <BookOpen size={14} /> Start with a free study
                <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-cb flex flex-col gap-3 py-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Concordia Bible Institute. All rights reserved.</p>
          <p className="font-serif italic">
            “Read, mark, learn, and inwardly digest the sacred Scripture.”
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: 0.07 }}
    >
      <h3 className="text-cream font-serif text-sm font-bold uppercase tracking-[0.22em]">
        {heading}
      </h3>
      <ul className="mt-5 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-cream/80 transition hover:text-white hover:underline underline-offset-4"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
