import { moodOptions } from "@/lib/constants";
import type { MoodSuggestion } from "@/types/app";
import type { Tables } from "@/types/database";

const moodLabels = new Map(
  moodOptions.map((option) => [option.value, option.label] as const),
);

export function buildMoodSuggestions(
  moods: Tables<"moods">[],
  ideas: Tables<"ideas">[],
): MoodSuggestion[] {
  const latestPerUser = new Map<string, Tables<"moods">>();

  moods
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .forEach((entry) => {
      if (!latestPerUser.has(entry.user_id)) {
        latestPerUser.set(entry.user_id, entry);
      }
    });

  const activeMoods = Array.from(latestPerUser.values());
  const moodValues = activeMoods.map((entry) => entry.mood);
  const bothHungry = moodValues.length >= 2 && moodValues.every((value) => value === "hungry");
  const bothBored = moodValues.length >= 2 && moodValues.every((value) => value === "bored");
  const bothRomantic =
    moodValues.length >= 2 && moodValues.every((value) => value === "romantic");

  const byCategory = (category: string) =>
    ideas.filter(
      (idea) => idea.category === category && idea.status !== "completed",
    );

  if (bothHungry) {
    return [
      {
        title: "Both hungry. Zero overthinking.",
        description: "Spin from your saved food and restaurant ideas right now.",
        emoji: "🍜",
        category: byCategory("food")[0]?.category ?? "food",
      },
    ];
  }

  if (bothBored) {
    return [
      {
        title: "Bored energy detected.",
        description: "Jump into a quick game or let the wheel pick a spontaneous activity.",
        emoji: "🎲",
        category: byCategory("activities")[0]?.category ?? "activities",
      },
    ];
  }

  if (bothRomantic) {
    return [
      {
        title: "Cozy mode is synced.",
        description: "Open your outing shortlist and pick something soft and lovely.",
        emoji: "💗",
        category: byCategory("date_plans")[0]?.category ?? "date_plans",
      },
    ];
  }

  if (!activeMoods.length) {
    return [
      {
        title: "No mood check-ins yet.",
        description: "Drop a mood and let the app start tailoring suggestions for your space.",
        emoji: "🌙",
        category: null,
      },
    ];
  }

  return activeMoods.slice(0, 2).map((entry) => ({
    title: `${moodLabels.get(entry.mood) ?? "Mood"} vibes are in the air`,
    description: entry.note || "Your universe is paying attention and finding ideas to match.",
    emoji: moodOptions.find((option) => option.value === entry.mood)?.emoji ?? "✨",
    category: null,
  }));
}
