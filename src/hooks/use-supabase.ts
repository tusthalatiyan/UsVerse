"use client";

import {
  useOptionalSupabaseContext,
  useSupabaseContext,
} from "@/components/shared/supabase-provider";

export function useSupabase() {
  return useSupabaseContext();
}

export function useOptionalSupabase() {
  return useOptionalSupabaseContext();
}
