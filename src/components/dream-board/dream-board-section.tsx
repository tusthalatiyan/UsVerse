"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Search, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { splitTags } from "@/lib/formatters";
import {
  ideaCategories,
  ideaStatusValues,
} from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { ideaSchema, type IdeaValues } from "@/lib/schemas";
import { createIdea, updateIdeaStatus } from "@/services/idea-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { Tables } from "@/types/database";

type IdeaRow = Tables<"ideas">;

export function DreamBoardSection({
  ideas,
  coupleId,
  profile,
  compact = false,
}: {
  ideas: IdeaRow[];
  coupleId: string | null;
  profile: Tables<"profiles">;
  compact?: boolean;
}) {
  const router = useRouter();
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [liveIdeas, setLiveIdeas] = useState(ideas);
  const createPreviewIdea = useDemoStore((state) => state.createIdea);
  const updatePreviewIdeaStatus = useDemoStore((state) => state.updateIdeaStatus);
  const deferredQuery = useDeferredValue(query);
  const form = useForm<IdeaValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: "",
      description: "",
      category: ideaCategories[0].value,
      emoji: "✨",
      tags: "",
      imageUrl: "",
      status: "pending",
      priorityWeight: 3,
    },
  });

  useEffect(() => {
    setLiveIdeas(ideas);
  }, [ideas]);

  useRealtimeRefresh({
    enabled: Boolean(coupleId),
    channel: `ideas:${coupleId ?? "solo"}`,
    tables: ["ideas"],
    filter: coupleId ? `couple_id=eq.${coupleId}` : undefined,
  });

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return liveIdeas
      .filter((idea) => {
        if (activeCategory !== "all" && idea.category !== activeCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return (
          idea.title.toLowerCase().includes(normalizedQuery) ||
          (idea.description ?? "").toLowerCase().includes(normalizedQuery) ||
          idea.tags.join(" ").toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, compact ? 6 : liveIdeas.length);
  }, [activeCategory, compact, deferredQuery, liveIdeas]);

  return (
    <FrostCard className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Dream Board
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Save every cute idea before it disappears
          </h2>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button disabled={!coupleId} className="rounded-full" />}
          >
            <Plus className="size-4" />
            Add idea
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-white/70 bg-white/92">
            <DialogHeader>
              <DialogTitle>Add something to your shared wishlist</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  if (!coupleId) {
                    toast.error("Connect your space first to save shared ideas.");
                    return;
                  }

                  if (isPreview) {
                    createPreviewIdea(values);
                    toast.success("Idea added.");
                    setDialogOpen(false);
                    form.reset();
                    return;
                  }

                  if (!supabase) {
                    toast.error("Supabase client unavailable.");
                    return;
                  }

                  const optimisticIdea: IdeaRow = {
                    id: makeOptimisticId("idea"),
                    couple_id: coupleId,
                    created_by: profile.id,
                    title: values.title.trim(),
                    description: values.description?.trim() || null,
                    category: values.category,
                    emoji: values.emoji.trim(),
                    tags: splitTags(values.tags),
                    image_url: values.imageUrl?.trim() || null,
                    priority_weight: values.priorityWeight,
                    status: values.status,
                    created_at: nowIso(),
                    updated_at: nowIso(),
                  };

                  setLiveIdeas((currentIdeas) => [optimisticIdea, ...currentIdeas]);
                  setDialogOpen(false);
                  form.reset();

                  const { error } = await createIdea(supabase, {
                    coupleId,
                    userId: profile.id,
                    values,
                  });

                  if (error) {
                    setLiveIdeas((currentIdeas) =>
                      currentIdeas.filter((idea) => idea.id !== optimisticIdea.id),
                    );
                    toast.error(toErrorMessage(error));
                    return;
                  }

                  toast.success("Idea added.");
                });
              })}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" error={form.formState.errors.title?.message}>
                  <Input placeholder="Late-night dumpling crawl" {...form.register("title")} />
                </Field>
                <Field label="Emoji" error={form.formState.errors.emoji?.message}>
                  <Input placeholder="🥟" {...form.register("emoji")} />
                </Field>
              </div>

              <Field label="Description" error={form.formState.errors.description?.message}>
                <Textarea
                  placeholder="Tiny spicy dumplings, big emotional support."
                  {...form.register("description")}
                />
              </Field>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/82">Category</p>
                <div className="flex flex-wrap gap-2">
                  {ideaCategories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        form.setValue("category", category.value, { shouldValidate: true })
                      }
                      className={`rounded-full px-3 py-2 text-sm ${
                        form.watch("category") === category.value
                          ? "bg-rose-500 text-white"
                          : "bg-secondary text-foreground/72"
                      }`}
                    >
                      <span className="mr-2">{category.emoji}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tags" error={form.formState.errors.tags?.message}>
                  <Input placeholder="cozy, spicy, payday" {...form.register("tags")} />
                </Field>
                <Field label="Image URL" error={form.formState.errors.imageUrl?.message}>
                  <Input placeholder="https://..." {...form.register("imageUrl")} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status" error={form.formState.errors.status?.message}>
                  <select
                    className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                    {...form.register("status")}
                  >
                    {ideaStatusValues.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Importance"
                  error={form.formState.errors.priorityWeight?.message}
                >
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    {...form.register("priorityWeight", { valueAsNumber: true })}
                  />
                </Field>
              </div>

              <Button disabled={isPending} type="submit" className="w-full rounded-full">
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "Save to dream board"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search saved ideas"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-2 text-sm ${
              activeCategory === "all" ? "bg-rose-500 text-white" : "bg-white/65"
            }`}
          >
            All
          </button>
          {ideaCategories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-full px-3 py-2 text-sm ${
                activeCategory === category.value ? "bg-rose-500 text-white" : "bg-white/65"
              }`}
            >
              {category.emoji}
            </button>
          ))}
        </div>
      </div>

      {filteredIdeas.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-[1.6rem] border border-white/75 bg-white/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    <span className="mr-2">{idea.emoji}</span>
                    {idea.title}
                  </p>
                  <p className="mt-1 text-sm text-foreground/66">
                    {ideaCategories.find((item) => item.value === idea.category)?.label ??
                      idea.category}
                  </p>
                </div>
                <div className="rounded-full bg-secondary px-3 py-1 text-xs capitalize text-foreground/70">
                  {idea.status}
                </div>
              </div>

              {idea.description ? (
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {idea.description}
                </p>
              ) : null}

              {idea.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {ideaStatusValues.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        if (isPreview) {
                          updatePreviewIdeaStatus(idea.id, status);
                          return;
                        }

                        if (!supabase) {
                          toast.error("Supabase client unavailable.");
                          return;
                        }

                        const previousIdeas = liveIdeas;

                        setLiveIdeas((currentIdeas) =>
                          currentIdeas.map((currentIdea) =>
                            currentIdea.id === idea.id
                              ? { ...currentIdea, status, updated_at: nowIso() }
                              : currentIdea,
                          ),
                        );

                        const { error } = await updateIdeaStatus(supabase, idea.id, status);

                        if (error) {
                          setLiveIdeas(previousIdeas);
                          toast.error(toErrorMessage(error));
                        }
                      })
                    }
                    className={`rounded-full px-3 py-2 text-xs capitalize transition ${
                      idea.status === status
                        ? "bg-foreground text-background"
                        : "bg-white text-foreground/72"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No ideas yet"
          description="Add the first spark: food, movies, travel chaos, surprise gifts, anything."
        />
      )}

      {compact && liveIdeas.length > filteredIdeas.length ? (
        <Button variant="secondary" className="rounded-full" onClick={() => router.push("/ideas")}>
          <Sparkles className="size-4" />
          See the full board
        </Button>
      ) : null}
    </FrostCard>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground/82">{label}</p>
      {children}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
