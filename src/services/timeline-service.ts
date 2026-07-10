import type { TimelineItem } from "@/types/app";
import type { Tables } from "@/types/database";

export function buildTimeline(
  memories: Tables<"memories">[],
  ideas: Tables<"ideas">[],
  votes: Tables<"votes">[],
  coupleCreatedAt: string | null,
): TimelineItem[] {
  const memoryItems: TimelineItem[] = memories.map((memory) => ({
    id: `memory-${memory.id}`,
    title: memory.title,
    description: memory.description || "Another soft little piece of your story.",
    occurredAt: memory.occurred_at,
    emoji: "📸",
    source: memory.memory_type === "milestone" ? "milestone" : "memory",
    accentClassName: "from-rose-200/70 to-orange-100/70",
  }));

  const completedIdeas: TimelineItem[] = ideas
    .filter((idea) => idea.status === "completed")
    .map((idea) => ({
      id: `idea-${idea.id}`,
      title: `${idea.title} completed`,
      description: idea.description || "A saved dream turned into a real memory.",
      occurredAt: idea.updated_at,
      emoji: idea.emoji,
      source: "idea",
      accentClassName: "from-emerald-200/70 to-cyan-100/70",
    }));

  const closedVotes: TimelineItem[] = votes
    .filter((vote) => vote.status === "closed")
    .map((vote) => ({
      id: `vote-${vote.id}`,
      title: vote.prompt,
      description: "A decision got made and the vibe moved forward.",
      occurredAt: vote.updated_at,
      emoji: "🗳️",
      source: "vote",
      accentClassName: "from-sky-200/70 to-indigo-100/70",
    }));

  const milestones: TimelineItem[] = coupleCreatedAt
    ? [
        {
          id: "milestone-first-link",
          title: "Your shared universe went live",
          description: "The first connection that made everything feel official.",
          occurredAt: coupleCreatedAt,
          emoji: "💫",
          source: "milestone",
          accentClassName: "from-amber-200/70 to-rose-100/70",
        },
      ]
    : [];

  return [...milestones, ...memoryItems, ...completedIdeas, ...closedVotes].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}
