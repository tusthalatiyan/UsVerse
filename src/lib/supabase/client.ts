"use client";

import { createBrowserClient } from "@supabase/ssr";

import { appEnv, assertSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  assertSupabaseConfigured();

  return createBrowserClient<Database>(
    appEnv.supabaseUrl,
    appEnv.supabaseAnonKey,
  );
}
