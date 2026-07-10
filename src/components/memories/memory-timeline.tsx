"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarHeart, LoaderCircle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { hasSupabaseConfig } from "@/lib/env";
import { formatTimelineDate } from "@/lib/formatters";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { memorySchema, type MemoryValues } from "@/lib/schemas";
import { createMemory } from "@/services/memory-service";
import { toErrorMessage } from "@/services/service-utils";
import { buildTimeline } from "@/services/timeline-service";
import { useDemoStore } from "@/stores/demo-store";
import type { Tables } from "@/types/database";

type MemoryRow = Tables<"memories">;

export function MemoryTimeline({
  couple,
  profile,
  memories,
  ideas,
  votes,
  compact = false,
}: {
  couple: Tables<"couples"> | null;
  profile: Tables<"profiles">;
  memories: MemoryRow[];
  ideas: Tables<"ideas">[];
  votes: Tables<"votes">[];
  compact?: boolean;
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [liveMemories, setLiveMemories] = useState(memories);
  const addPreviewMemory = useDemoStore((state) => state.addMemory);
  const form = useForm<MemoryValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      title: "",
      description: "",
      occurredAt: new Date().toISOString().slice(0, 10),
      coverUrl: "",
    },
  });

  useEffect(() => {
    setLiveMemories(memories);
  }, [memories]);

  useRealtimeRefresh({
    enabled: Boolean(couple?.id),
    channel: `memories:${couple?.id ?? "solo"}`,
    tables: ["memories", "ideas", "votes"],
    filter: couple?.id ? `couple_id=eq.${couple.id}` : undefined,
  });

  const timeline = buildTimeline(
    liveMemories,
    ideas,
    votes,
    couple?.paired_at ?? couple?.created_at ?? null,
  ).slice(0, compact ? 5 : undefined);

  return (
    <FrostCard className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Memory Wall
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your little timeline of plans, feelings, and moments that happened
          </h2>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button disabled={!couple} className="rounded-full" />}
          >
            <Plus className="size-4" />
            Add memory
          </DialogTrigger>
          <DialogContent className="border-white/70 bg-white/92">
            <DialogHeader>
              <DialogTitle>Add a memory</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  if (!couple) {
                    toast.error("Connect your space first to build the memory wall.");
                    return;
                  }

                  if (isPreview) {
                    addPreviewMemory(values);
                    toast.success("Memory saved.");
                    setDialogOpen(false);
                    form.reset();
                    return;
                  }

                  if (!supabase) {
                    toast.error("Supabase client unavailable.");
                    return;
                  }

                  const optimisticMemory: MemoryRow = {
                    id: makeOptimisticId("memory"),
                    couple_id: couple.id,
                    created_by: profile.id,
                    related_idea_id: null,
                    related_vote_id: null,
                    title: values.title.trim(),
                    description: values.description?.trim() || null,
                    memory_type: "memory",
                    celebration_level: 3,
                    cover_url: values.coverUrl?.trim() || null,
                    metadata: {},
                    occurred_at: new Date(values.occurredAt).toISOString(),
                    created_at: nowIso(),
                  };

                  setLiveMemories((currentMemories) => [optimisticMemory, ...currentMemories]);
                  setDialogOpen(false);
                  form.reset();

                  const { error } = await createMemory(supabase, {
                    coupleId: couple.id,
                    userId: profile.id,
                    values,
                  });

                  if (error) {
                    setLiveMemories((currentMemories) =>
                      currentMemories.filter((memory) => memory.id !== optimisticMemory.id),
                    );
                    toast.error(toErrorMessage(error));
                    return;
                  }

                  toast.success("Memory saved.");
                });
              })}
              className="space-y-4"
            >
              <Input placeholder="Sunset chai walk" {...form.register("title")} />
              <Textarea
                placeholder="It was simple and perfect and somehow tasted like comfort."
                {...form.register("description")}
              />
              <Input type="date" {...form.register("occurredAt")} />
              <Input placeholder="https://..." {...form.register("coverUrl")} />

              <Button disabled={isPending} type="submit" className="w-full rounded-full">
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "Save memory"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {timeline.length ? (
        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={item.id} className="grid gap-3 sm:grid-cols-[84px_1fr]">
              <div className="flex items-start">
                <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${item.accentClassName} text-lg shadow-[0_16px_28px_rgba(255,190,190,0.15)]`}
                  >
                    {item.emoji}
                  </div>
                  <div className="hidden h-full min-h-14 w-px bg-gradient-to-b from-rose-200 to-transparent sm:block" />
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/75 bg-white/65 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-foreground/66">
                      {formatTimelineDate(item.occurredAt)}
                    </p>
                  </div>
                  <CalendarHeart className="size-4 text-rose-400" />
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No memories saved yet"
          description="Complete ideas, add milestones, and your timeline will start feeling like a scrapbook."
        />
      )}
    </FrostCard>
  );
}
