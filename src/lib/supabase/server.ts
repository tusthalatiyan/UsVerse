import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { appEnv, assertSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  assertSupabaseConfigured();

  const cookieStore = await cookies();

  return createServerClient<Database>(
    appEnv.supabaseUrl,
    appEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can read auth cookies but may not always mutate them.
          }
        },
      },
    },
  );
}
