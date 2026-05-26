"use client";
// Admin · Users — list every member, toggle access (active/suspended), and
// promote between member/admin. Backed by the profiles table; RLS lets the
// signed-in admin read and update all rows.
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  notifyAccountSuspended, notifyAccountReinstated,
} from "@/lib/notifications";

export default function AdminUsersPage() {
  const { push } = useToast();
  const sb = getSupabaseBrowser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // user_downloads is owner-only under RLS, so the "episodes owned" count
    // here is best-effort from the admin's perspective. For an exact count
    // we'd add a SQL view; not worth it for one admin's dashboard.
    const { data, error } = await sb
      .from("profiles")
      .select("id, name, email, role, status, joined_at")
      .order("joined_at", { ascending: false });
    if (error) push(error.message, "error");
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const toggleStatus = async (u) => {
    const next = u.status === "active" ? "suspended" : "active";
    const { error } = await sb.from("profiles").update({ status: next }).eq("id", u.id);
    if (error) return push(error.message, "error");
    try {
      if (next === "suspended") notifyAccountSuspended(u);
      else notifyAccountReinstated(u);
    } catch {}
    push("User status updated.");
    setUsers((list) => list.map((x) => x.id === u.id ? { ...x, status: next } : x));
  };

  const toggleAdmin = async (u) => {
    const next = u.role === "admin" ? "member" : "admin";
    const { error } = await sb.from("profiles").update({ role: next }).eq("id", u.id);
    if (error) return push(error.message, "error");
    push(`User is now ${next}.`);
    setUsers((list) => list.map((x) => x.id === u.id ? { ...x, role: next } : x));
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink">
          <tr>
            <th className="px-5 py-3">Member</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="px-5 py-10 text-center text-ink">Loading…</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={4} className="px-5 py-10 text-center text-ink">No members yet.</td></tr>
          ) : users.map((u) => (
            <tr key={u.id} className="border-t border-maroon/10">
              <td className="px-5 py-3">
                <p className="font-semibold text-ink">{u.name ?? "—"}</p>
                <p className="text-xs text-ink">{u.email}</p>
              </td>
              <td className="px-5 py-3">
                <span className={u.role === "admin" ? "badge-free" : "badge-locked"}>
                  {u.role}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={u.status === "active" ? "badge-free" : "badge-locked"}>
                  {u.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => toggleAdmin(u)}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    {u.role === "admin" ? "Demote" : "Make admin"}
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    {u.status === "active" ? "Suspend" : "Reinstate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
