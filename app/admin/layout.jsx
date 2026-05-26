"use client";
// Shared admin shell — auth guard + console header + section nav. Every page
// under /admin renders inside this, so the guard lives in one place.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Mail,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/podcasts", label: "Podcasts", icon: BookOpen },
  { href: "/admin/episodes", label: "Episodes", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, isAdmin } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/admin");
    else if (ready && user && !isAdmin) router.replace("/dashboard");
  }, [ready, user, isAdmin, router]);

  if (!ready || !user || !isAdmin) {
    return (
      <div className="container-cb flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container-cb py-14 sm:py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-ink sm:text-5xl">
            Institute dashboard
          </h1>
        </div>
        <span className="hidden rounded-full bg-maroon/10 px-4 py-2 text-sm font-semibold text-maroon sm:block">
          {user.email}
        </span>
      </div>

      {/* Section nav */}
      <nav className="mt-8 flex gap-1 overflow-x-auto scrollbar-thin border-b border-maroon/10">
        {NAV.map((t) => {
          const active =
            t.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border-maroon text-maroon"
                  : "border-transparent text-ink hover:text-maroon"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10">{children}</div>
    </div>
  );
}
