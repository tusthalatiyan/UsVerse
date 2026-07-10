"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { moodOptions } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { buildMoodSuggestions } from "@/services/recommendation-service";
import { createMoodCheckIn } from "@/services/mood-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { Tables } from "@/types/database";

type MoodRow = Tables<"moods">;

export function MoodCheckInCard({
  profile,
  coupleId,
  ideas,
  moods,
}: {
  profile: Tables<"profiles">;
  coupleId: string | null;
  ideas: Tables<"ideas">[];
  moods: MoodRow[];
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [selectedMood, setSelectedMood] = useState<(typeof moodOptions)[number]["value"]>(
    "hungry",
  );
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [liveMoods, setLiveMoods] = useState(moods);
  const addPreviewMood = useDemoStore((state) => state.addMood);
  const suggestions = buildMoodSuggestions(liveMoods, ideas);

  useEffect(() => {
    setLiveMoods(moods);
  }, [moods]);

  useRealtimeRefresh({
    enabled: Boolean(coupleId),
    channel: `moods:${coupleId ?? "solo"}`,
    tables: ["moods"],
    filter: coupleId ? `couple_id=eq.${coupleId}` : undefined,
  });

  return (
    <FrostCard className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
          Mood Check-In
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          How are you feeling right now?
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => setSelectedMood(mood.value)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              selectedMood === mood.value
                ? "bg-rose-500 text-white shadow-[0_14px_28px_rgba(255,120,140,0.25)]"
                : "bg-white/65 text-foreground/72"
            }`}
          >
            <span className="mr-2">{mood.emoji}</span>
            {mood.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mood-note">Optional note</Label>
        <Input
          id="mood-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Need cozy carbs and zero decisions."
        />
      </div>

      <Button
        disabled={!coupleId || isPending}
        className="rounded-full"
        onClick={() =>
          startTransition(async () => {
            if (!coupleId) {
              toast.error("Connect your space first so mood suggestions can sync.");
              return;
            }

            if (isPreview) {
              addPreviewMood({
                mood: selectedMood,
                note,
              });
              toast.success("Mood saved.");
              setNote("");
              return;
            }

            if (!supabase) {
              toast.error("Supabase client unavailable.");
              return;
            }

            const optimisticMood: MoodRow = {
              id: makeOptimisticId("mood"),
              couple_id: coupleId,
              user_id: profile.id,
              mood: selectedMood,
              note: note.trim() || null,
              created_at: nowIso(),
            };

            setLiveMoods((currentMoods) => [optimisticMood, ...currentMoods]);
            setNote("");

            const { error } = await createMoodCheckIn(supabase, {
              coupleId,
              userId: profile.id,
              values: {
                mood: selectedMood,
                note,
              },
            });

            if (error) {
              setLiveMoods((currentMoods) =>
                currentMoods.filter((mood) => mood.id !== optimisticMood.id),
              );
              setNote(note);
              toast.error(toErrorMessage(error));
              return;
            }

            toast.success("Mood saved.");
          })
        }
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Save mood"
        )}
      </Button>

      <div className="grid gap-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.title}
            className="rounded-[1.5rem] border border-white/75 bg-white/65 p-4"
          >
            <p className="text-sm font-semibold">
              <span className="mr-2">{suggestion.emoji}</span>
              {suggestion.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/68">
              {suggestion.description}
            </p>
          </div>
        ))}
      </div>
    </FrostCard>
  );
}
