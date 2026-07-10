"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { voteModeOptions } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { voteSchema, type VoteValues } from "@/lib/schemas";
import {
  closeVote,
  createVote,
  resolveVoteOptions,
  respondToVote,
} from "@/services/vote-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { Tables } from "@/types/database";

type VoteRow = Tables<"votes">;
type VoteResponseRow = Tables<"vote_responses">;

export function VotingPanel({
  coupleId,
  profile,
  votes,
  voteResponses,
  compact = false,
}: {
  coupleId: string | null;
  profile: Tables<"profiles">;
  votes: VoteRow[];
  voteResponses: VoteResponseRow[];
  compact?: boolean;
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [liveVotes, setLiveVotes] = useState(votes);
  const [liveVoteResponses, setLiveVoteResponses] = useState(voteResponses);
  const createPreviewVote = useDemoStore((state) => state.createVote);
  const respondPreviewToVote = useDemoStore((state) => state.respondToVote);
  const closePreviewVote = useDemoStore((state) => state.closeVote);
  const form = useForm<VoteValues>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      prompt: "",
      mode: "vibe",
      ideaId: "",
      optionsText: "",
    },
  });

  useEffect(() => {
    setLiveVotes(votes);
  }, [votes]);

  useEffect(() => {
    setLiveVoteResponses(voteResponses);
  }, [voteResponses]);

  useRealtimeRefresh({
    enabled: Boolean(coupleId),
    channel: `votes:${coupleId ?? "solo"}`,
    tables: ["votes", "vote_responses"],
    filter: coupleId ? `couple_id=eq.${coupleId}` : undefined,
  });

  const visibleVotes = compact ? liveVotes.slice(0, 3) : liveVotes;

  return (
    <FrostCard className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Voting
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Make decisions more fun
          </h2>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button disabled={!coupleId} className="rounded-full" />}
          >
            <Plus className="size-4" />
            Start vote
          </DialogTrigger>
          <DialogContent className="border-white/70 bg-white/92">
            <DialogHeader>
              <DialogTitle>Start a new vote</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  if (!coupleId) {
                    toast.error("Connect your space first to create a shared vote.");
                    return;
                  }

                  if (isPreview) {
                    createPreviewVote(values);
                    toast.success("Vote started.");
                    setDialogOpen(false);
                    form.reset();
                    return;
                  }

                  if (!supabase) {
                    toast.error("Supabase client unavailable.");
                    return;
                  }

                  const optimisticVote: VoteRow = {
                    id: makeOptimisticId("vote"),
                    couple_id: coupleId,
                    created_by: profile.id,
                    idea_id: values.ideaId || null,
                    prompt: values.prompt.trim(),
                    mode: values.mode,
                    status: "active",
                    options: resolveVoteOptions(values.mode, values.optionsText),
                    closes_at: null,
                    created_at: nowIso(),
                    updated_at: nowIso(),
                  };

                  setLiveVotes((currentVotes) => [optimisticVote, ...currentVotes]);
                  setDialogOpen(false);
                  form.reset();

                  const { error } = await createVote(supabase, {
                    coupleId,
                    userId: profile.id,
                    values,
                  });

                  if (error) {
                    setLiveVotes((currentVotes) =>
                      currentVotes.filter((vote) => vote.id !== optimisticVote.id),
                    );
                    toast.error(toErrorMessage(error));
                    return;
                  }

                  toast.success("Vote started.");
                });
              })}
              className="space-y-4"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/82">Prompt</p>
                <Textarea
                  placeholder="Dinner plan: ramen run or tacos?"
                  {...form.register("prompt")}
                />
                {form.formState.errors.prompt?.message ? (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.prompt.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/82">Mode</p>
                <div className="grid gap-2">
                  {voteModeOptions.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => form.setValue("mode", mode.value)}
                      className={`rounded-[1.3rem] border p-3 text-left ${
                        form.watch("mode") === mode.value
                          ? "border-rose-300 bg-rose-50"
                          : "border-white/70 bg-white/60"
                      }`}
                    >
                      <p className="font-semibold">{mode.label}</p>
                      <p className="mt-1 text-sm text-foreground/68">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {form.watch("mode") === "emoji" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground/82">
                    Emoji options
                  </p>
                  <input
                    className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                    placeholder="😍, 😌, 🤔, 🙅"
                    {...form.register("optionsText")}
                  />
                </div>
              ) : null}

              <Button disabled={isPending} type="submit" className="w-full rounded-full">
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "Launch vote"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {visibleVotes.length ? (
        <div className="space-y-4">
          {visibleVotes.map((vote) => {
            const responses = liveVoteResponses.filter((response) => response.vote_id === vote.id);
            const options = Array.isArray(vote.options) ? vote.options.map(String) : [];
            const total = responses.length;
            const counts = new Map<string, number>();

            responses.forEach((response) => {
              const key =
                vote.mode === "emoji"
                  ? response.emoji_value
                  : vote.mode === "rating"
                    ? String(response.rating_value ?? "")
                    : response.response_value;

              if (!key) {
                return;
              }

              counts.set(key, (counts.get(key) ?? 0) + 1);
            });

            const ratingAverage =
              vote.mode === "rating" && total
                ? responses.reduce(
                    (sum, entry) => sum + Number(entry.rating_value ?? 0),
                    0,
                  ) / total
                : null;

            return (
              <div
                key={vote.id}
                className="rounded-[1.6rem] border border-white/75 bg-white/65 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{vote.prompt}</p>
                    <p className="mt-1 text-sm text-foreground/66">
                      {vote.mode.replace("_", " ")} • {total} response
                      {total === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize text-foreground/68">
                      {vote.status}
                    </span>
                    {vote.status === "active" ? (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            if (isPreview) {
                              closePreviewVote(vote.id);
                              return;
                            }

                            if (!supabase) {
                              toast.error("Supabase client unavailable.");
                              return;
                            }

                            const previousVotes = liveVotes;

                            setLiveVotes((currentVotes) =>
                              currentVotes.map((currentVote) =>
                                currentVote.id === vote.id
                                  ? { ...currentVote, status: "closed", updated_at: nowIso() }
                                  : currentVote,
                              ),
                            );

                            const { error } = await closeVote(supabase, vote.id);

                            if (error) {
                              setLiveVotes(previousVotes);
                              toast.error(toErrorMessage(error));
                            }
                          })
                        }
                        className="rounded-full bg-white px-3 py-1 text-xs text-foreground/68"
                      >
                        Close
                      </button>
                    ) : null}
                  </div>
                </div>

                {vote.mode === "rating" ? (
                  <div className="mt-4 rounded-[1.3rem] bg-white/70 p-3 text-sm">
                    Average rating:{" "}
                    <span className="font-semibold">
                      {ratingAverage ? ratingAverage.toFixed(1) : "No ratings yet"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {options.map((option) => {
                      const count = counts.get(option) ?? 0;
                      const percentage = total ? Math.round((count / total) * 100) : 0;

                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{option}</span>
                            <span className="text-foreground/62">
                              {count} • {percentage}%
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {vote.status === "active" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(vote.mode === "rating"
                      ? ["1", "2", "3", "4", "5"]
                      : options
                    ).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            if (isPreview) {
                              respondPreviewToVote(vote.id, {
                                emojiValue:
                                  vote.mode === "emoji" ? option : undefined,
                                ratingValue:
                                  vote.mode === "rating" ? Number(option) : undefined,
                                responseValue:
                                  vote.mode === "emoji" || vote.mode === "rating"
                                    ? undefined
                                    : option,
                              });
                              return;
                            }

                            if (!supabase || !coupleId) {
                              toast.error("Supabase client unavailable.");
                              return;
                            }

                            const previousResponses = liveVoteResponses;
                            const existingResponse = liveVoteResponses.find(
                              (response) =>
                                response.vote_id === vote.id && response.user_id === profile.id,
                            );

                            const optimisticResponse: VoteResponseRow = {
                              id: existingResponse?.id ?? makeOptimisticId("vote-response"),
                              couple_id: coupleId,
                              vote_id: vote.id,
                              user_id: profile.id,
                              response_value:
                                vote.mode === "emoji" || vote.mode === "rating"
                                  ? null
                                  : option,
                              rating_value: vote.mode === "rating" ? Number(option) : null,
                              emoji_value: vote.mode === "emoji" ? option : null,
                              comment: existingResponse?.comment ?? null,
                              created_at: existingResponse?.created_at ?? nowIso(),
                              updated_at: nowIso(),
                            };

                            setLiveVoteResponses((currentResponses) => [
                              optimisticResponse,
                              ...currentResponses.filter(
                                (response) =>
                                  !(
                                    response.vote_id === vote.id &&
                                    response.user_id === profile.id
                                  ),
                              ),
                            ]);

                            const { error } = await respondToVote(supabase, {
                              coupleId,
                              voteId: vote.id,
                              userId: profile.id,
                              values:
                                vote.mode === "emoji"
                                  ? { emojiValue: option }
                                  : vote.mode === "rating"
                                    ? { ratingValue: Number(option) }
                                    : { responseValue: option },
                            });

                            if (error) {
                              setLiveVoteResponses(previousResponses);
                              toast.error(toErrorMessage(error));
                            }
                          })
                        }
                        className="rounded-full bg-white px-3 py-2 text-sm text-foreground/72 transition hover:bg-rose-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No votes yet"
          description="Start with a tiny one: dinner, movie, spontaneous walk, or stay home cocoon?"
        />
      )}
    </FrostCard>
  );
}
