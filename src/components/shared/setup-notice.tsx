import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { FrostCard } from "@/components/shared/frost-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SetupNotice() {
  return (
    <FrostCard className="max-w-2xl">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">
            Local Preview Ready
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            The full website is available right now on localhost.
          </h2>
          <p className="text-sm leading-6 text-foreground/72">
            I removed the dead-end setup wall for local use. You can explore the
            full product in preview mode immediately, and connect Supabase later
            only if you want the production backend turned on.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-white/70 bg-white/65 p-4">
            <Sparkles className="mb-3 size-5 text-rose-500" />
            <p className="font-semibold">Full local preview</p>
            <p className="mt-1 text-sm text-foreground/68">
              Ideas, votes, chat, invites, games, moods, and memories all work
              locally without extra setup.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/65 p-4">
            <Sparkles className="mb-3 size-5 text-sky-500" />
            <p className="font-semibold">Production backend later</p>
            <p className="mt-1 text-sm text-foreground/68">
              Supabase Auth, Postgres, Realtime, and RLS are still wired in for
              when you want live production data.
            </p>
          </div>
        </div>

        <Link
          href="/space"
          className={cn(buttonVariants(), "w-fit rounded-full px-5")}
        >
          Enter the universe
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </FrostCard>
  );
}
