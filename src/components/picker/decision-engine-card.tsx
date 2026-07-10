"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { usePickerStore } from "@/stores/picker-store";
import { ideaCategories } from "@/lib/constants";
import { buildPickerPool, pickRandomIdea } from "@/lib/picker";
import type { Tables } from "@/types/database";

export function DecisionEngineCard({
  ideas,
}: {
  ideas: Tables<"ideas">[];
}) {
  const category = usePickerStore((state) => state.category);
  const weightedMode = usePickerStore((state) => state.weightedMode);
  const excludeCompleted = usePickerStore((state) => state.excludeCompleted);
  const spinning = usePickerStore((state) => state.spinning);
  const setCategory = usePickerStore((state) => state.setCategory);
  const setWeightedMode = usePickerStore((state) => state.setWeightedMode);
  const setExcludeCompleted = usePickerStore((state) => state.setExcludeCompleted);
  const setSpinning = usePickerStore((state) => state.setSpinning);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [copy, setCopy] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const eligibleIdeas = buildPickerPool(ideas, {
    category,
    weighted: false,
    excludeCompleted,
  });

  const displayedIdeas = Array.from(new Map(eligibleIdeas.map((idea) => [idea.id, idea])).values()).slice(
    0,
    8,
  );

  return (
    <FrostCard className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
          Decision Wheel
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Let the wheel take the pressure
        </h2>
      </div>

      {displayedIdeas.length ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-3 py-2 text-sm ${
                category === "all" ? "bg-rose-500 text-white" : "bg-white/65"
              }`}
            >
              All
            </button>
            {ideaCategories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`rounded-full px-3 py-2 text-sm ${
                  category === item.value ? "bg-rose-500 text-white" : "bg-white/65"
                }`}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex items-center justify-center">
              <div className="relative flex size-72 items-center justify-center rounded-full border border-white/75 bg-white/60 p-4 shadow-[0_20px_60px_rgba(255,187,187,0.18)]">
                <div className="absolute top-0 z-10 translate-y-[-14px] rounded-full bg-foreground px-3 py-1 text-xs text-background">
                  pick me
                </div>
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{ duration: 1.8, ease: [0.2, 0.9, 0.2, 1] }}
                  className="grid size-full grid-cols-2 gap-3 rounded-full"
                >
                  {displayedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="flex min-h-28 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-white to-rose-50 p-3 text-center text-sm font-medium"
                    >
                      <span>
                        <span className="mr-2">{idea.emoji}</span>
                        {idea.title}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setWeightedMode(!weightedMode)}
                  className={`rounded-[1.4rem] border p-4 text-left ${
                    weightedMode ? "border-rose-300 bg-rose-50" : "border-white/70 bg-white/65"
                  }`}
                >
                  <p className="font-semibold">Weighted mode</p>
                  <p className="mt-1 text-sm text-foreground/68">
                    Let high-priority ideas show up more often.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setExcludeCompleted(!excludeCompleted)}
                  className={`rounded-[1.4rem] border p-4 text-left ${
                    excludeCompleted
                      ? "border-rose-300 bg-rose-50"
                      : "border-white/70 bg-white/65"
                  }`}
                >
                  <p className="font-semibold">Exclude completed</p>
                  <p className="mt-1 text-sm text-foreground/68">
                    Keep the wheel focused on things you still want to do.
                  </p>
                </button>
              </div>

              <Button
                disabled={spinning || isPending}
                className="rounded-full"
                onClick={() =>
                  startTransition(async () => {
                    setSpinning(true);
                    setResult(null);
                    setCopy(null);
                    setRotation((value) => value + 1080 + Math.floor(Math.random() * 360));

                    const nextResult = pickRandomIdea(ideas, {
                      category,
                      weighted: weightedMode,
                      excludeCompleted,
                    });

                    window.setTimeout(() => {
                      setSpinning(false);

                      if (!nextResult) {
                        return;
                      }

                      setResult(nextResult.winner.title);
                      setCopy(nextResult.celebrationCopy);
                      void confetti({
                        particleCount: 80,
                        spread: 80,
                        origin: { y: 0.6 },
                      });
                    }, 1700);
                  })
                }
              >
                {spinning || isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "Spin the wheel"
                )}
              </Button>

              {result ? (
                <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                    Winner
                  </p>
                  <p className="mt-2 text-xl font-semibold">{result}</p>
                  <p className="mt-2 text-sm text-foreground/70">{copy}</p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="The wheel needs ideas"
          description="Shortlist a few activities, foods, or movies and the picker will handle the dramatic final choice."
        />
      )}
    </FrostCard>
  );
}
