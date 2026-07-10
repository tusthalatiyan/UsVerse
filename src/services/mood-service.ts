"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { moodSchema, type MoodValues } from "@/lib/schemas";
import type { Database } from "@/types/database";

export async function createMoodCheckIn(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: MoodValues;
  },
) {
  const parsed = moodSchema.parse(input.values);

  return supabase.from("moods").insert({
    couple_id: input.coupleId,
    user_id: input.userId,
    mood: parsed.mood,
    note: parsed.note || null,
  });
}
