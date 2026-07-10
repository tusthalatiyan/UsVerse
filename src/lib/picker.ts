import type { PickerResult } from "@/types/app";
import type { Tables } from "@/types/database";

export function buildPickerPool(
  ideas: Tables<"ideas">[],
  options?: {
    category?: string;
    weighted?: boolean;
    excludeCompleted?: boolean;
  },
) {
  const { category, weighted = false, excludeCompleted = true } = options ?? {};

  const filtered = ideas.filter((idea) => {
    if (excludeCompleted && idea.status === "completed") {
      return false;
    }

    if (category && category !== "all" && idea.category !== category) {
      return false;
    }

    return true;
  });

  if (!weighted) {
    return filtered;
  }

  return filtered.flatMap((idea) =>
    Array.from({ length: Math.max(1, idea.priority_weight) }, () => idea),
  );
}

export function pickRandomIdea(
  ideas: Tables<"ideas">[],
  options?: Parameters<typeof buildPickerPool>[1],
): PickerResult | null {
  const pool = buildPickerPool(ideas, options);

  if (!pool.length) {
    return null;
  }

  const winner = pool[Math.floor(Math.random() * pool.length)];

  return {
    winner,
    celebrationCopy: [
      "The universe picked a very cute plan.",
      "Decision made. No second-guessing, only sparkle.",
      "Tonight just got dramatically easier.",
    ][Math.floor(Math.random() * 3)],
  };
}
