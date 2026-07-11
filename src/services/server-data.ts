import { hasSupabaseConfig } from "@/lib/env";
import { goalIdeaToTask, isGoalIdea } from "@/lib/goals";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardSnapshot, ViewerContext } from "@/types/app";

export async function getSessionUser() {
  if (!hasSupabaseConfig) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  if (!hasSupabaseConfig) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const couple = profile.active_couple_id
    ? (
        await supabase
          .from("couples")
          .select("*")
          .eq("id", profile.active_couple_id)
          .single()
      ).data
    : null;

  const members = couple
    ? (
        await supabase.rpc("get_space_members", {
          user_id_input: user.id,
        })
      ).data ??
      (
        await supabase
          .from("profiles")
          .select("*")
          .eq("active_couple_id", couple.id)
          .order("created_at", { ascending: true })
      ).data ??
      [profile]
    : [profile];

  const partner = members.find((member) => member.id !== profile.id) ?? null;

  return {
    profile,
    couple,
    members,
    partner,
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  if (!hasSupabaseConfig) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const viewer = await getViewerContext();

  if (!viewer) {
    return null;
  }

  const coupleId = viewer.profile.active_couple_id;

  if (!coupleId) {
    return {
      ...viewer,
      ideas: [],
      goals: [],
      votes: [],
      voteResponses: [],
      messages: [],
      moods: [],
      memories: [],
      notifications: [],
      gameSessions: [],
    };
  }

  const [
    ideasResult,
    votesResult,
    voteResponsesResult,
    messagesResult,
    moodsResult,
    memoriesResult,
    notificationsResult,
    gameSessionsResult,
  ] = await Promise.all([
    supabase
      .from("ideas")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("votes")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vote_responses")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: true }),
    supabase
      .from("moods")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("memories")
      .select("*")
      .eq("couple_id", coupleId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", viewer.profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("game_sessions")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const allIdeas = ideasResult.data ?? [];
  const goalIdeas = allIdeas.filter(isGoalIdea);
  const regularIdeas = allIdeas.filter((idea) => !isGoalIdea(idea));

  return {
    ...viewer,
    ideas: regularIdeas,
    goals: goalIdeas.map(goalIdeaToTask),
    votes: votesResult.data ?? [],
    voteResponses: voteResponsesResult.data ?? [],
    messages: messagesResult.data ?? [],
    moods: moodsResult.data ?? [],
    memories: memoriesResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    gameSessions: gameSessionsResult.data ?? [],
  };
}
