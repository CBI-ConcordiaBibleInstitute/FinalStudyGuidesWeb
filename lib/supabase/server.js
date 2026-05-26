// Server-side Supabase client for Server Components, Route Handlers, and
// Server Actions. Reads the session from cookies so RLS sees the right user.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // Setting cookies from a Server Component throws — swallow so reads
        // from RSC still work. Route Handlers + Server Actions hit the
        // catch only when invoked during a render, which is fine.
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: "", ...options }); } catch {}
        },
      },
    }
  );
}
