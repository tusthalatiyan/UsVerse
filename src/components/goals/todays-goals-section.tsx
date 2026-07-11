"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, LoaderCircle, Pencil, Plus, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileLookup } from "@/hooks/use-profile-lookup";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { formatTimestamp } from "@/lib/formatters";
import { hasSupabaseConfig } from "@/lib/env";
import { getTodayGoalDate } from "@/lib/goals";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { goalSchema, type GoalValues } from "@/lib/schemas";
import { completeGoal, createGoal, updateGoalTitle } from "@/services/goal-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { GoalTask } from "@/types/app";
import type { Tables } from "@/types/database";

type ProfileRow = Tables<"profiles">;

interface GoalGroup {
  creatorId: string;
  creatorName: string;
  goals: GoalTask[];
}

export function TodaysGoalsSection({
  goals,
  coupleId,
  members,
  profile,
  compact = false,
}: {
  goals: GoalTask[];
  coupleId: string | null;
  members: ProfileRow[];
  profile: ProfileRow;
  compact?: boolean;
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [liveGoals, setLiveGoals] = useState(goals);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const createPreviewGoal = useDemoStore((state) => state.createGoal);
  const completePreviewGoal = useDemoStore((state) => state.completeGoal);
  const updatePreviewGoalTitle = useDemoStore((state) => state.updateGoalTitle);
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    setLiveGoals(goals);
  }, [goals]);

  useRealtimeRefresh({
    enabled: Boolean(coupleId),
    channel: `goals:${coupleId ?? "solo"}`,
    tables: ["ideas"],
    filter: coupleId ? `couple_id=eq.${coupleId}` : undefined,
  });

  const todayGoalDate = getTodayGoalDate();
  const todaysGoals = useMemo(
    () => liveGoals.filter((goal) => goal.goal_date === todayGoalDate),
    [liveGoals, todayGoalDate],
  );
  const referencedProfileIds = useMemo(
    () => [
      profile.id,
      ...members.map((member) => member.id),
      ...todaysGoals.map((goal) => goal.created_by),
      ...todaysGoals
        .map((goal) => goal.completed_by)
        .filter((profileId): profileId is string => Boolean(profileId)),
    ],
    [members, profile.id, todaysGoals],
  );
  const knownProfiles = useMemo(() => [profile, ...members], [members, profile]);
  const memberMap = useProfileLookup(knownProfiles, referencedProfileIds);
  const memberNameById = useMemo(() => {
    const names = new Map<string, string>();

    memberMap.forEach((member) => {
      names.set(member.id, member.nickname);
    });

    return names;
  }, [memberMap]);
  const activeGoals = todaysGoals
    .filter((goal) => !goal.completed_at)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const completedGoals = todaysGoals
    .filter((goal) => goal.completed_at)
    .sort(
      (a, b) =>
        Date.parse(b.completed_at ?? b.updated_at) -
        Date.parse(a.completed_at ?? a.updated_at),
    );
  const visibleActiveGoals = compact ? activeGoals.slice(0, 5) : activeGoals;
  const visibleCompletedGoals = compact ? completedGoals.slice(0, 5) : completedGoals;
  const activeGoalGroups = groupGoalsByCreator(visibleActiveGoals, memberNameById);
  const completedGoalGroups = groupGoalsByCreator(visibleCompletedGoals, memberNameById);

  async function handleCreateGoal(values: GoalValues) {
    if (isSubmitting) {
      return;
    }

    if (!coupleId) {
      toast.error("Connect your space first to add shared goals.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isPreview) {
        createPreviewGoal(values);
        form.reset();
        toast.success("Goal added.");
        return;
      }

      if (!supabase) {
        toast.error("Supabase client unavailable.");
        return;
      }

      const optimisticGoal: GoalTask = {
        id: makeOptimisticId("goal"),
        couple_id: coupleId,
        created_by: profile.id,
        title: values.title.trim(),
        goal_date: todayGoalDate,
        completed_at: null,
        completed_by: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      setLiveGoals((currentGoals) => [optimisticGoal, ...currentGoals]);
      form.reset();

      const { error } = await createGoal(supabase, {
        coupleId,
        userId: profile.id,
        values,
      });

      if (error) {
        setLiveGoals((currentGoals) =>
          currentGoals.filter((goal) => goal.id !== optimisticGoal.id),
        );
        toast.error(toErrorMessage(error));
        return;
      }

      toast.success("Goal added.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteGoal(goal: GoalTask) {
    if (!coupleId || completingGoalId || goal.completed_at) {
      return;
    }

    if (goal.created_by !== profile.id) {
      toast.error("Only the person who added this goal can complete it.");
      return;
    }

    setCompletingGoalId(goal.id);

    try {
      if (isPreview) {
        completePreviewGoal(goal.id);
        return;
      }

      if (!supabase) {
        toast.error("Supabase client unavailable.");
        return;
      }

      const previousGoals = liveGoals;
      const completedAt = nowIso();

      setLiveGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === goal.id
            ? {
                ...currentGoal,
                completed_at: completedAt,
                completed_by: profile.id,
                updated_at: completedAt,
              }
            : currentGoal,
        ),
      );

      const { error } = await completeGoal(supabase, {
        goalId: goal.id,
        userId: profile.id,
        goalDate: goal.goal_date,
      });

      if (error) {
        setLiveGoals(previousGoals);
        toast.error(toErrorMessage(error));
        return;
      }

      toast.success("Goal completed.");
    } finally {
      setCompletingGoalId(null);
    }
  }

  function startEditingGoal(goal: GoalTask) {
    if (goal.created_by !== profile.id) {
      return;
    }

    setEditingGoalId(goal.id);
    setEditingTitle(goal.title);
  }

  function stopEditingGoal() {
    setEditingGoalId(null);
    setEditingTitle("");
  }

  async function handleSaveGoal(goal: GoalTask) {
    if (goal.created_by !== profile.id || savingGoalId) {
      return;
    }

    const parsed = goalSchema.safeParse({
      title: editingTitle,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Update the goal title first.");
      return;
    }

    if (parsed.data.title === goal.title) {
      stopEditingGoal();
      return;
    }

    setSavingGoalId(goal.id);

    try {
      if (isPreview) {
        updatePreviewGoalTitle(goal.id, parsed.data);
        stopEditingGoal();
        toast.success("Goal updated.");
        return;
      }

      if (!supabase) {
        toast.error("Supabase client unavailable.");
        return;
      }

      const previousGoals = liveGoals;
      const updatedAt = nowIso();

      setLiveGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === goal.id
            ? {
                ...currentGoal,
                title: parsed.data.title,
                updated_at: updatedAt,
              }
            : currentGoal,
        ),
      );
      stopEditingGoal();

      const { error } = await updateGoalTitle(supabase, {
        goalId: goal.id,
        userId: profile.id,
        values: parsed.data,
      });

      if (error) {
        setLiveGoals(previousGoals);
        toast.error(toErrorMessage(error));
        return;
      }

      toast.success("Goal updated.");
    } finally {
      setSavingGoalId(null);
    }
  }

  return (
    <FrostCard className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Today&apos;s Goals
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            A soft checklist for the whole space
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-foreground/70">
            Add tiny shared goals, check them off together, and keep the wins visible for everyone.
          </p>
        </div>
        <div className="rounded-full bg-white/65 px-4 py-2 text-sm text-foreground/70">
          {activeGoals.length} open / {completedGoals.length} done
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(handleCreateGoal)}
        className="flex flex-col gap-3 rounded-[1.5rem] border border-white/75 bg-white/58 p-3 sm:flex-row"
      >
        <div className="flex-1">
          <Input
            placeholder="Add a goal for today"
            {...form.register("title")}
          />
          {form.formState.errors.title?.message ? (
            <p className="mt-2 text-xs text-rose-500">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>
        <Button disabled={isSubmitting || !coupleId} type="submit" className="rounded-full">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add goal
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <GoalGroupList
          title={"Today's Goals"}
          count={activeGoals.length}
          emptyTitle="No open goals"
          emptyDescription="Add the first tiny task and everyone in the space will see it."
          groups={activeGoalGroups}
          profileId={profile.id}
          completedNameById={memberNameById}
          completingGoalId={completingGoalId}
          editingGoalId={editingGoalId}
          editingTitle={editingTitle}
          savingGoalId={savingGoalId}
          onComplete={handleCompleteGoal}
          onStartEdit={startEditingGoal}
          onCancelEdit={stopEditingGoal}
          onEditTitle={setEditingTitle}
          onSaveEdit={handleSaveGoal}
        />

        <GoalGroupList
          title={"Today's Completed Tasks"}
          count={completedGoals.length}
          emptyTitle="Nothing completed yet"
          emptyDescription="Checked goals will move here with the time and person who completed them."
          groups={completedGoalGroups}
          profileId={profile.id}
          completedNameById={memberNameById}
          completingGoalId={completingGoalId}
          editingGoalId={editingGoalId}
          editingTitle={editingTitle}
          savingGoalId={savingGoalId}
          onComplete={handleCompleteGoal}
          onStartEdit={startEditingGoal}
          onCancelEdit={stopEditingGoal}
          onEditTitle={setEditingTitle}
          onSaveEdit={handleSaveGoal}
        />
      </div>
    </FrostCard>
  );
}

function groupGoalsByCreator(
  goals: GoalTask[],
  memberNameById: Map<string, string>,
): GoalGroup[] {
  const groups = new Map<string, GoalGroup>();

  goals.forEach((goal) => {
    const existingGroup = groups.get(goal.created_by);

    if (existingGroup) {
      existingGroup.goals.push(goal);
      return;
    }

    groups.set(goal.created_by, {
      creatorId: goal.created_by,
      creatorName: memberNameById.get(goal.created_by) ?? "Someone",
      goals: [goal],
    });
  });

  return Array.from(groups.values());
}

function GoalGroupList({
  title,
  count,
  emptyTitle,
  emptyDescription,
  groups,
  profileId,
  completedNameById,
  completingGoalId,
  editingGoalId,
  editingTitle,
  savingGoalId,
  onComplete,
  onStartEdit,
  onCancelEdit,
  onEditTitle,
  onSaveEdit,
}: {
  title: string;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  groups: GoalGroup[];
  profileId: string;
  completedNameById: Map<string, string>;
  completingGoalId: string | null;
  editingGoalId: string | null;
  editingTitle: string;
  savingGoalId: string | null;
  onComplete: (goal: GoalTask) => void;
  onStartEdit: (goal: GoalTask) => void;
  onCancelEdit: () => void;
  onEditTitle: (title: string) => void;
  onSaveEdit: (goal: GoalTask) => void;
}) {
  return (
    <div className="space-y-3">
      <SectionHeader title={title} count={count} />
      {groups.length ? (
        groups.map((group) => (
          <div key={group.creatorId} className="space-y-2">
            <div className="flex items-center justify-between rounded-full bg-white/58 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">
                {group.creatorName}
              </p>
              <span className="text-xs text-foreground/58">
                {group.goals.length} {group.goals.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            {group.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                creatorName={group.creatorName}
                completedByName={
                  goal.completed_by
                    ? completedNameById.get(goal.completed_by) ?? "Someone"
                    : null
                }
                canEdit={goal.created_by === profileId}
                isCompleting={completingGoalId === goal.id}
                isEditing={editingGoalId === goal.id}
                editingTitle={editingTitle}
                isSaving={savingGoalId === goal.id}
                onComplete={() => onComplete(goal)}
                onStartEdit={() => onStartEdit(goal)}
                onCancelEdit={onCancelEdit}
                onEditTitle={onEditTitle}
                onSaveEdit={() => onSaveEdit(goal)}
              />
            ))}
          </div>
        ))
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-foreground/65">
        {count}
      </span>
    </div>
  );
}

function GoalCard({
  goal,
  creatorName,
  completedByName,
  canEdit,
  isCompleting,
  isEditing,
  editingTitle,
  isSaving,
  onComplete,
  onStartEdit,
  onCancelEdit,
  onEditTitle,
  onSaveEdit,
}: {
  goal: GoalTask;
  creatorName: string;
  completedByName: string | null;
  canEdit: boolean;
  isCompleting: boolean;
  isEditing: boolean;
  editingTitle: string;
  isSaving: boolean;
  onComplete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditTitle: (title: string) => void;
  onSaveEdit: () => void;
}) {
  const isCompleted = Boolean(goal.completed_at);

  return (
    <div className="rounded-[1.6rem] border border-white/75 bg-white/70 p-4 shadow-[0_18px_45px_rgba(255,182,182,0.1)]">
      <div className="flex gap-3">
        {isCompleted ? (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
        ) : canEdit ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={isCompleting || isEditing}
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Complete ${goal.title}`}
          >
            {isCompleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </button>
        ) : (
          <div
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/55 text-foreground/35"
            title="Only the creator can update this goal"
          >
            <Check className="size-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={editingTitle}
                onChange={(event) => onEditTitle(event.target.value)}
                className="h-10 bg-white/80"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={onSaveEdit}
                  disabled={isSaving}
                  className="rounded-full"
                >
                  {isSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onCancelEdit}
                  className="rounded-full"
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <p
                className={`text-base font-semibold leading-6 ${
                  isCompleted ? "text-foreground/62 line-through decoration-rose-300" : ""
                }`}
              >
                {goal.title}
              </p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="rounded-full bg-white/70 p-2 text-foreground/48 transition hover:bg-rose-50 hover:text-rose-500"
                  aria-label={`Edit ${goal.title}`}
                >
                  <Pencil className="size-4" />
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-white/65 px-3 py-1 text-xs text-foreground/48">
                  View only
                </span>
              )}
            </div>
          )}

          <p className="mt-1 text-xs leading-5 text-foreground/60">
            Created by {creatorName} - {formatTimestamp(goal.created_at)}
          </p>
          {goal.completed_at ? (
            <p className="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
              Completed by {completedByName ?? "Someone"} - {formatTimestamp(goal.completed_at)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
