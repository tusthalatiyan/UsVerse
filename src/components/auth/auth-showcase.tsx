"use client";

import { Heart, MessageCircleHeart, Sparkles, Vote } from "lucide-react";
import { motion } from "framer-motion";

import { FrostCard } from "@/components/shared/frost-card";

const highlights = [
  {
    title: "Connect once, then everything is shared",
    description: "One invite code opens your private little space and stays reusable for more people.",
    icon: Heart,
  },
  {
    title: "Cute chat, live votes, and mood syncing",
    description: "Realtime presence makes the app feel alive, not delayed.",
    icon: MessageCircleHeart,
  },
  {
    title: "Memories and tiny rituals build over time",
    description: "Completed ideas and milestones become part of your scrapbook wall.",
    icon: Sparkles,
  },
];

export function AuthShowcase() {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">
          Cute Shared Space
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Make your plans, chaos, and soft moments feel like their own universe.
        </h1>
        <p className="max-w-xl text-sm leading-7 text-foreground/72 sm:text-base">
          UsVerse keeps the practical stuff cute for best friends, roommates,
          siblings, and favorite humans: food ideas, tiny votes, dinner
          decisions, mood check-ins, shared games, and the memories you want to
          keep glowing.
        </p>
      </div>

      <div className="grid gap-4">
        {highlights.map((highlight, index) => {
          const Icon = highlight.icon;

          return (
            <motion.div
              key={highlight.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
            >
              <FrostCard className="rounded-[1.7rem] p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.2rem] bg-white/75 text-rose-500">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{highlight.title}</h2>
                    <p className="text-sm leading-6 text-foreground/68">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </FrostCard>
            </motion.div>
          );
        })}

        <FrostCard className="rounded-[1.7rem] mesh-panel">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1.2rem] bg-white/75 text-sky-500">
              <Vote className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Tonight&apos;s vibe</p>
              <p className="text-sm text-foreground/68">
                Hell yes to dumplings, maybe to horror, nope to overthinking.
              </p>
            </div>
          </div>
        </FrostCard>
      </div>
    </div>
  );
}
