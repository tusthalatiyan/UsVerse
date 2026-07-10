import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { FrostCard } from "@/components/shared/frost-card";
import { GradientOrbs } from "@/components/shared/gradient-orbs";
import { PageHeading } from "@/components/shared/page-heading";
import { SetupNotice } from "@/components/shared/setup-notice";
import { buttonVariants } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/env";
import { getSessionUser } from "@/services/server-data";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const primaryHref = hasSupabaseConfig ? "/signup" : "/space";
  const secondaryHref = hasSupabaseConfig ? "/login" : "/space";

  if (hasSupabaseConfig) {
    const user = await getSessionUser();

    if (user) {
      redirect("/space");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 sm:px-8">
      <GradientOrbs />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between rounded-full border border-white/65 bg-white/55 px-4 py-3 shadow-[0_18px_50px_rgba(255,194,194,0.14)] backdrop-blur-2xl">
          <AppLogo compact />
          <div className="flex items-center gap-3">
            <Link
              href={secondaryHref}
              className={cn(buttonVariants({ variant: "ghost" }), "rounded-full")}
            >
              {hasSupabaseConfig ? "Log in" : "Open preview"}
            </Link>
            <Link
              href={primaryHref}
              className={cn(buttonVariants(), "rounded-full px-5")}
            >
              {hasSupabaseConfig ? "Create your universe" : "Enter the universe"}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <PageHeading
              eyebrow="Cute Shared Space"
              title="A tiny premium world for your plans, moods, chats, ideas, and memories."
              description="UsVerse is a dreamy little shared space for best friends, roommates, siblings, and favorite humans who want one adorable place to plan food, save ideas, play mini games, and keep the good moments glowing."
            />

            <div className="flex flex-wrap gap-3 text-sm text-foreground/76">
              <div className="rounded-full border border-white/70 bg-white/65 px-4 py-2">
                Realtime chat + votes
              </div>
              <div className="rounded-full border border-white/70 bg-white/65 px-4 py-2">
                Reusable invite code for your whole space
              </div>
              <div className="rounded-full border border-white/70 bg-white/65 px-4 py-2">
                Dream board + memory wall
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}
              >
                {hasSupabaseConfig ? "Start the magic" : "Open the full preview"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={secondaryHref}
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "rounded-full px-6",
                )}
              >
                {hasSupabaseConfig ? "I already have an account" : "Skip setup for now"}
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {!hasSupabaseConfig ? <SetupNotice /> : null}

            <FrostCard className="mesh-panel">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/60 p-4">
                  <Sparkles className="mb-3 size-5 text-rose-500" />
                  <h3 className="font-semibold">Dream board</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Save food spots, movies, trips, gifts, and random little plan
                    chaos in one adorable wishlist.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/60 p-4">
                  <MessageCircleHeart className="mb-3 size-5 text-sky-500" />
                  <h3 className="font-semibold">Cozy realtime chat</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Typing indicators, reactions, presence, and read receipts,
                    all in a softer mood than a normal messenger.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/60 p-4">
                  <BadgeCheck className="mb-3 size-5 text-emerald-500" />
                  <h3 className="font-semibold">Fun decisions</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Vote yes/no, rate ideas, or let the spinning picker decide
                    with dramatic flair.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/60 p-4">
                  <Sparkles className="mb-3 size-5 text-amber-500" />
                  <h3 className="font-semibold">Mood-powered suggestions</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Hungry plus bored turns into food picks, games, and soft
                    prompts without the decision fatigue.
                  </p>
                </div>
              </div>
            </FrostCard>
          </div>
        </section>
      </div>
    </main>
  );
}
