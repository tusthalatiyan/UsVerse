import type { GoalTask } from "@/types/app";
import type { Tables } from "@/types/database";

export const goalIdeaCategory = "today_goal";
export const goalIdeaTag = "usverse_today_goal";

const goalDatePrefix = "goal_date:";
const completedByPrefix = "completed_by:";

export function getTodayGoalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isGoalIdea(idea: Tables<"ideas">) {
  return idea.category === goalIdeaCategory || idea.tags.includes(goalIdeaTag);
}

export function buildGoalTags(goalDate: string, completedBy?: string | null) {
  return [
    goalIdeaTag,
    `${goalDatePrefix}${goalDate}`,
    ...(completedBy ? [`${completedByPrefix}${completedBy}`] : []),
  ];
}

export function goalIdeaToTask(idea: Tables<"ideas">): GoalTask {
  const goalDateTag = idea.tags.find((tag) => tag.startsWith(goalDatePrefix));
  const completedByTag = idea.tags.find((tag) => tag.startsWith(completedByPrefix));
  const goalDate = goalDateTag?.slice(goalDatePrefix.length) || idea.created_at.slice(0, 10);
  const completedBy = completedByTag?.slice(completedByPrefix.length) || null;
  const isCompleted = idea.status === "completed";

  return {
    id: idea.id,
    couple_id: idea.couple_id,
    created_by: idea.created_by,
    title: idea.title,
    goal_date: goalDate,
    completed_at: isCompleted ? idea.updated_at : null,
    completed_by: isCompleted ? completedBy : null,
    created_at: idea.created_at,
    updated_at: idea.updated_at,
  };
}
