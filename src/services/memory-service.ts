"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { memorySchema, type MemoryValues } from "@/lib/schemas";
import type { Database } from "@/types/database";

export async function createMemory(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: MemoryValues;
  },
) {
  const parsed = memorySchema.parse(input.values);

  return supabase.from("memories").insert({
    couple_id: input.coupleId,
    created_by: input.userId,
    title: parsed.title,
    description: parsed.description || null,
    cover_url: parsed.coverUrl || null,
    memory_type: "memory",
    occurred_at: new Date(parsed.occurredAt).toISOString(),
  });
}

export async function markNotificationRead(
  supabase: SupabaseClient<Database>,
  notificationId: string,
) {
  return supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);
}
