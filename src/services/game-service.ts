"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Json } from "@/types/database";

export async function createGameSession(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    gameType: Enums<"game_type">;
    prompt: string;
    state?: Json;
    winnerId?: string | null;
    completedAt?: string | null;
  },
) {
  return supabase.from("game_sessions").insert({
    couple_id: input.coupleId,
    created_by: input.userId,
    game_type: input.gameType,
    prompt: input.prompt,
    state: input.state ?? {},
    winner_id: input.winnerId ?? input.userId,
    completed_at: input.completedAt ?? new Date().toISOString(),
  });
}
