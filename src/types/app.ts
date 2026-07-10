import type { Enums, Tables } from "@/types/database";

export interface ViewerContext {
  profile: Tables<"profiles">;
  couple: Tables<"couples"> | null;
  members: Tables<"profiles">[];
  partner: Tables<"profiles"> | null;
}

export interface DashboardSnapshot extends ViewerContext {
  ideas: Tables<"ideas">[];
  goals: GoalTask[];
  votes: Tables<"votes">[];
  voteResponses: Tables<"vote_responses">[];
  messages: Tables<"messages">[];
  moods: Tables<"moods">[];
  memories: Tables<"memories">[];
  notifications: Tables<"notifications">[];
  gameSessions: Tables<"game_sessions">[];
}

export interface GoalTask {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  goal_date: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  emoji: string;
  source: "memory" | "idea" | "vote" | "milestone";
  accentClassName: string;
}

export interface MoodSuggestion {
  title: string;
  description: string;
  emoji: string;
  category: string | null;
}

export interface PickerResult {
  winner: Tables<"ideas">;
  celebrationCopy: string;
}

export interface VoteOptionSummary {
  label: string;
  count: number;
  percentage: number;
}

export interface VoteInsight {
  voteId: string;
  mode: Enums<"vote_mode">;
  totalResponses: number;
  topOption: string | null;
  averageRating: number | null;
  options: VoteOptionSummary[];
}
