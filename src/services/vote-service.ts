"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  voteResponseSchema,
  voteSchema,
  type VoteResponseValues,
  type VoteValues,
} from "@/lib/schemas";
import type { Database } from "@/types/database";

export function resolveVoteOptions(mode: VoteValues["mode"], optionsText?: string) {
  if (mode === "yes_no") {
    return ["Yes", "No"];
  }

  if (mode === "vibe") {
    return ["Hell yes", "Maybe", "Nope"];
  }

  if (mode === "rating") {
    return ["1", "2", "3", "4", "5"];
  }

  const customOptions = optionsText
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return customOptions?.length ? customOptions : ["😍", "😌", "🤔", "🙅"];
}

export async function createVote(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: VoteValues;
  },
) {
  const parsed = voteSchema.parse(input.values);

  return supabase.from("votes").insert({
    couple_id: input.coupleId,
    created_by: input.userId,
    idea_id: parsed.ideaId || null,
    prompt: parsed.prompt,
    mode: parsed.mode,
    options: resolveVoteOptions(parsed.mode, parsed.optionsText),
  });
}

export async function respondToVote(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    voteId: string;
    userId: string;
    values: VoteResponseValues;
  },
) {
  const parsed = voteResponseSchema.parse(input.values);

  return supabase.from("vote_responses").upsert(
    {
      couple_id: input.coupleId,
      vote_id: input.voteId,
      user_id: input.userId,
      response_value: parsed.responseValue || null,
      rating_value: parsed.ratingValue ?? null,
      emoji_value: parsed.emojiValue || null,
      comment: parsed.comment || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "vote_id,user_id",
    },
  );
}

export async function closeVote(
  supabase: SupabaseClient<Database>,
  voteId: string,
) {
  return supabase
    .from("votes")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", voteId);
}
