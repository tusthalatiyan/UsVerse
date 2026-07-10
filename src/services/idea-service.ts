"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { splitTags } from "@/lib/formatters";
import { ideaSchema, type IdeaValues } from "@/lib/schemas";
import type { Database, Enums } from "@/types/database";

export async function createIdea(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: IdeaValues;
  },
) {
  const parsed = ideaSchema.parse(input.values);

  return supabase.from("ideas").insert({
    couple_id: input.coupleId,
    created_by: input.userId,
    title: parsed.title,
    description: parsed.description || null,
    category: parsed.category,
    emoji: parsed.emoji,
    tags: splitTags(parsed.tags),
    image_url: parsed.imageUrl || null,
    status: parsed.status,
    priority_weight: parsed.priorityWeight,
  });
}

export async function updateIdeaStatus(
  supabase: SupabaseClient<Database>,
  ideaId: string,
  status: Enums<"idea_status">,
) {
  return supabase
    .from("ideas")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId);
}
