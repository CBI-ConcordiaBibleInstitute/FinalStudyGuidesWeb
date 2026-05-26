"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const NAV = [
  { href: "/podcasts", label: "Podcasts" },
  { href: "/podcasts", label: "Study Guides", match: "/podcasts" },
  { href: "/pricing", label: "Pricing" },
  { href: "/search", label: "Search" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/20 bg-maroon-dark text-white shadow-[0_2px_18px_rgba(102,14,27,0.45)]">
      {/* Subtle glowing gold underline that runs across the whole bar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-80"
      />
      <div className="container-cb relative flex h-20 items-center justify-between gap-4">
        {/* Brand — left, on a white pill so the official logo stays legible
            against the maroon bar */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 transition hover:opacity-90"
        >
          <Logo size={56} />
          <span className="flex flex-col leading-tight">
            <span className="text-[12px] font-bold uppercase tracking-wider text-white sm:text-[15px]">
              Concordia Bible Institute
            </span>
            <span className="text-[10px] italic text-gold sm:text-[12px]">
              Christ in Every Word
            </span>
          </span>
        </Link>

        {/* Nav — center, inline with logo */}
        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === (item.match || item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-3 py-2 text-[13px] font-bold uppercase tracking-wider transition no-underline hover:no-underline ${
                    active
                      ? "text-gold drop-shadow-[0_0_6px_rgba(0,168,230,0.55)]"
                      : "text-white/90 hover:text-gold hover:drop-shadow-[0_0_6px_rgba(0,168,230,0.45)]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-gold via-white to-gold shadow-[0_0_8px_rgba(0,168,230,0.7)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right-side actions — cart, dashboard, auth */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative rounded-md p-2 text-white transition hover:bg-white/10 hover:text-gold"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(0,168,230,0.8)]">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="btn-outline-light px-4 py-2"
              >
                <LayoutDashboard size={16} />
                {isAdmin ? "Admin" : "Dashboard"}
              </Link>
              <button
                onClick={logout}
                aria-label="Sign out"
                className="rounded-md p-2 text-white transition hover:bg-white/10 hover:text-gold"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="btn-outline-light px-4 py-2">
                Log in
              </Link>
              <Link href="/signup" className="btn-gold px-5 py-2">
                Get started
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/15 bg-maroon-dark md:hidden">
          <div className="container-cb flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded px-3 py-2 text-sm font-semibold uppercase tracking-wider text-white hover:bg-white/10 hover:text-gold no-underline hover:no-underline"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/15 pt-3">
              {user ? (
                <>
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    className="btn-outline-light"
                  >
                    {isAdmin ? "Admin dashboard" : "My dashboard"}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn-outline-light"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-outline-light">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-gold">
                    Get started — explore free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
