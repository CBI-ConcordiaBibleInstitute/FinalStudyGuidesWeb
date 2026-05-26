"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const QUOTES = [
  {
    text: "The study guides turned my quiet mornings into real Bible study. Having the podcast and a printable guide together is exactly what our small group needed.",
    name: "Rev. Daniel Hoffmann",
    role: "Parish Pastor, Wisconsin",
  },
  {
    text: "I went through all of Genesis in a season. The depth is seminary-grade, but it never loses the gospel. Worth far more than the price of a single guide.",
    name: "Karen Albrecht",
    role: "Adult Bible Class Leader",
  },
  {
    text: "As a homeschool parent I use the free episodes to introduce a book, then unlock the rest. The search makes finding the right passage instant.",
    name: "Maria Delgado",
    role: "Homeschool Educator",
  },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  const go = (d) => setI((p) => (p + d + QUOTES.length) % QUOTES.length);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % QUOTES.length), 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative mx-auto max-w-3xl text-center">
      <Quote size={48} className="mx-auto text-gold" />
      <div className="relative mt-4 min-h-[190px] sm:min-h-[150px]">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-serif text-2xl font-medium leading-relaxed text-ink sm:text-3xl">
              “{QUOTES[i].text}”
            </p>
            <footer className="mt-5">
              <p className="font-semibold text-maroon">{QUOTES[i].name}</p>
              <p className="text-sm text-ink">{QUOTES[i].role}</p>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="rounded-full border border-maroon/20 p-2 text-maroon hover:bg-maroon/10"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {QUOTES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Testimonial ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === i ? "w-6 bg-maroon" : "w-2 bg-maroon/25"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="rounded-full border border-maroon/20 p-2 text-maroon hover:bg-maroon/10"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
