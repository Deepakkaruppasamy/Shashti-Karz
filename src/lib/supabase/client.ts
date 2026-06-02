"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "shashti-karz-auth",
            lockType: "custom",
            async lock(name: string, acquireTimeoutMs: number, fn: () => Promise<any>) {
              return fn();
            },
        },
        realtime: {
          params: {
            events_per_second: 10,
          },
        },
    }
  );
}

export const supabase = createClient();
