"use client";
// Supabase-backed auth. Surface kept identical to the previous demo layer
// (`user`, `ready`, `isAdmin`, `signup`, `login`, `logout`, `recordDownload`,
// `toggleBookmark`, `setNotification`, `changePassword`, `updateProfile`),
// so existing pages render unchanged.
import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  notifySignup, notifyLogin, notifyPasswordChanged, notifyProfileUpdated,
} from "@/lib/notifications";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Loads the rich user object (profile + downloads + bookmarks) for the
// currently signed-in auth.user. Returns null if not signed in.
async function loadUser(sb, authUser) {
  if (!authUser) return null;
  const [profileRes, downloadsRes, bookmarksRes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    sb.from("user_downloads").select("episode_id").eq("user_id", authUser.id),
    sb.from("user_bookmarks").select("episode_id").eq("user_id", authUser.id),
  ]);
  const profile = profileRes.data;
  return {
    id:        authUser.id,
    email:     authUser.email,
    name:      profile?.name ?? authUser.email?.split("@")[0],
    role:      profile?.role ?? "member",
    status:    profile?.status ?? "active",
    verified:  !!authUser.email_confirmed_at,
    downloads: (downloadsRes.data ?? []).map((r) => r.episode_id),
    bookmarks: (bookmarksRes.data ?? []).map((r) => r.episode_id),
    notifications: profile?.notifications ?? {},
    notificationsConsentAt: profile?.notifications_consent_at ?? null,
    joinedAt:  profile?.joined_at ?? authUser.created_at,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const sbRef = useRef(null);
  if (!sbRef.current) sbRef.current = getSupabaseBrowser();
  const sb = sbRef.current;

  const refresh = useCallback(async () => {
    const { data: { user: authUser } } = await sb.auth.getUser();
    const u = await loadUser(sb, authUser);
    setUser(u);
    return u;
  }, [sb]);

  useEffect(() => {
    refresh().finally(() => setReady(true));
    const { data: sub } = sb.auth.onAuthStateChange(() => { refresh(); });
    return () => sub.subscription.unsubscribe();
  }, [sb, refresh]);

  const signup = useCallback(async ({ name, email, password }) => {
    if (!name || !email || !password)
      return { ok: false, error: "All fields are required." };
    if (password.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." };
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    const u = await refresh();
    try { if (u) notifySignup(u); } catch {}
    return { ok: true };
  }, [sb, refresh]);

  const login = useCallback(async ({ email, password }) => {
    if (!email || !password)
      return { ok: false, error: "Enter your email and password." };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    const u = await refresh();
    try { if (u) notifyLogin(u); } catch {}
    return { ok: true };
  }, [sb, refresh]);

  const logout = useCallback(async () => {
    await sb.auth.signOut();
    setUser(null);
  }, [sb]);

  const changePassword = useCallback(async (newPassword) => {
    if (!user) return { ok: false, error: "Not signed in." };
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    try { notifyPasswordChanged(user); } catch {}
    return { ok: true };
  }, [sb, user]);

  // Kick off the Supabase "Reset password" email. The redirectTo points at
  // our /auth/callback route, which exchanges the one-time code for a
  // session cookie and then forwards to /reset-password.
  const requestPasswordReset = useCallback(async (email) => {
    if (!email) return { ok: false, error: "Enter your email address." };
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    // Don't reveal whether the email is on file — return ok either way.
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, [sb]);

  const updateProfile = useCallback(async (patch) => {
    if (!user) return;
    const dbPatch = {};
    if (patch.name        !== undefined) dbPatch.name = patch.name;
    if (patch.notifications !== undefined) dbPatch.notifications = patch.notifications;
    if (Object.keys(dbPatch).length) {
      await sb.from("profiles").update(dbPatch).eq("id", user.id);
    }
    const next = await refresh();
    try { if (next) notifyProfileUpdated(next); } catch {}
  }, [sb, user, refresh]);

  const recordDownload = useCallback(async (episodeId) => {
    if (!user) return;
    await sb.from("user_downloads")
      .upsert({ user_id: user.id, episode_id: episodeId }, { onConflict: "user_id,episode_id" });
    await refresh();
  }, [sb, user, refresh]);

  const toggleBookmark = useCallback(async (episodeId) => {
    if (!user) return false;
    const has = user.bookmarks.includes(episodeId);
    if (has) {
      await sb.from("user_bookmarks")
        .delete().eq("user_id", user.id).eq("episode_id", episodeId);
    } else {
      await sb.from("user_bookmarks")
        .insert({ user_id: user.id, episode_id: episodeId });
    }
    await refresh();
    return !has;
  }, [sb, user, refresh]);

  const setNotification = useCallback(async (key, value) => {
    if (!user) return;
    const notifications = { ...user.notifications, [key]: value };
    await sb.from("profiles").update({ notifications }).eq("id", user.id);
    await refresh();
  }, [sb, user, refresh]);

  // Record the user's answer to the first-time notifications consent prompt.
  // `allow=true` keeps the default opt-in set; `allow=false` flips every
  // marketing category off (account + purchases stay on — they're transactional).
  const recordNotificationConsent = useCallback(async (allow) => {
    if (!user) return;
    const notifications = allow
      ? { newEpisodes: true, digest: true, reminders: true, announcements: true, product: true, account: true, purchases: true }
      : { newEpisodes: false, digest: false, reminders: false, announcements: false, product: false, account: true, purchases: true };
    await sb.from("profiles")
      .update({ notifications, notifications_consent_at: new Date().toISOString() })
      .eq("id", user.id);
    await refresh();
  }, [sb, user, refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAdmin: user?.role === "admin",
        signup,
        login,
        logout,
        recordDownload,
        toggleBookmark,
        setNotification,
        recordNotificationConsent,
        changePassword,
        requestPasswordReset,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
