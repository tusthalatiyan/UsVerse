"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { buildGoalTags, getTodayGoalDate, goalIdeaCategory } from "@/lib/goals";
import { goalSchema, type GoalValues } from "@/lib/schemas";
import type { Database } from "@/types/database";

export async function createGoal(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: GoalValues;
  },
) {
  const parsed = goalSchema.parse(input.values);
  const goalDate = getTodayGoalDate();

  return supabase.from("ideas").insert({
    couple_id: input.coupleId,
    created_by: input.userId,
    title: parsed.title,
    description: null,
    category: goalIdeaCategory,
    emoji: "G",
    tags: buildGoalTags(goalDate),
    image_url: null,
    status: "pending",
    priority_weight: 1,
  });
}

export async function completeGoal(
  supabase: SupabaseClient<Database>,
  input: {
    goalId: string;
    userId: string;
    goalDate: string;
  },
) {
  const completedAt = new Date().toISOString();

  return supabase
    .from("ideas")
    .update({
      status: "completed",
      tags: buildGoalTags(input.goalDate, input.userId),
      updated_at: completedAt,
    })
    .eq("id", input.goalId)
    .eq("created_by", input.userId)
    .neq("status", "completed");
}

export async function updateGoalTitle(
  supabase: SupabaseClient<Database>,
  input: {
    goalId: string;
    userId: string;
    values: GoalValues;
  },
) {
  const parsed = goalSchema.parse(input.values);

  return supabase
    .from("ideas")
    .update({
      title: parsed.title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.goalId)
    .eq("created_by", input.userId);
}
