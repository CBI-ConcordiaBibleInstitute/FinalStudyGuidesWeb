"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, Loader2, Lock, ArrowRight, Check } from "lucide-react";
import { useCart, GUIDE_PRICE } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { notifyPurchase } from "@/lib/notifications";

export default function CartPage() {
  const router = useRouter();
  const { items, remove, clear, total } = useCart();
  const { user, recordDownload } = useAuth();
  const { push } = useToast();
  const [processing, setProcessing] = useState(false);

  const checkout = () => {
    if (!user) {
      push("Please log in to complete checkout.", "info");
      router.push("/login?next=/cart");
      return;
    }
    setProcessing(true);
    // Integration point: create a Stripe Checkout session for these line items.
    const purchasedItems = items.slice();
    const purchasedTotal = total;
    setTimeout(() => {
      purchasedItems.forEach((i) => recordDownload(i.episodeId));
      clear();
      try {
        notifyPurchase(user, purchasedItems, purchasedTotal);
      } catch { /* email is best-effort */ }
      setProcessing(false);
      push("Payment successful — your guides are in your library.");
      router.push("/dashboard");
    }, 1300);
  };

  return (
    <div className="container-cb min-h-[70vh] py-16 sm:py-20">
      <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
        Your cart
      </h1>
      <p className="mt-3 text-lg text-ink">
        Study guides are ${GUIDE_PRICE} per episode — the full guide and video,
        yours to keep.
      </p>

      {items.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-24 text-center">
          <ShoppingBag size={56} className="text-maroon/30" />
          <p className="mt-5 font-serif text-2xl font-semibold text-ink">
            Your cart is empty
          </p>
          <p className="mt-2 text-ink">
            Browse the library and add study guides to get started.
          </p>
          <Link href="/podcasts" className="btn-primary mt-6">
            Explore podcasts <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.episodeId}
                  layout
                  exit={{ opacity: 0, x: -40 }}
                  className="flex items-center gap-4 rounded-2xl border border-maroon/10 bg-white p-5 shadow-card transition hover:shadow-lift"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon text-white">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/episodes/${item.episodeId}`}
                      className="line-clamp-1 font-serif text-lg font-semibold text-ink hover:text-maroon"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs uppercase tracking-wide text-ink">
                      Study guide
                    </p>
                  </div>
                  <span className="font-semibold text-ink">
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => remove(item.episodeId)}
                    aria-label={`Remove ${item.title}`}
                    className="rounded-full p-2 text-ink transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              onClick={clear}
              className="text-sm font-medium text-ink hover:text-maroon"
            >
              Clear cart
            </button>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-7">
              <h2 className="font-serif text-2xl font-bold text-ink">
                Order summary
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-ink">
                  <dt>
                    {items.length} guide{items.length === 1 ? "" : "s"} ·
                    ${GUIDE_PRICE} each
                  </dt>
                  <dd>${total.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-ink">
                  <dt>Estimated tax</dt>
                  <dd>$0.00</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-maroon/10 pt-3 font-serif text-xl font-bold text-ink">
                  <dt>Total</dt>
                  <dd>${total.toFixed(2)}</dd>
                </div>
              </dl>

              <button
                onClick={checkout}
                disabled={processing}
                className="btn-primary mt-5 w-full"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock size={15} /> Checkout securely
                  </>
                )}
              </button>

              <div className="mt-4 rounded-xl bg-cream p-3 text-xs text-ink">
                <p className="flex items-center gap-1.5 font-semibold text-maroon">
                  <Check size={14} /> Yours to keep
                </p>
                <p className="mt-1">
                  Every purchase is one-time — guides stay in your library with
                  unlimited downloads.
                </p>
              </div>
              <p className="mt-3 text-center text-[11px] text-ink">
                Payments processed by Stripe · 14-day refund policy
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
