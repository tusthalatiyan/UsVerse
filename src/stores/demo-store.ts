"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { splitTags } from "@/lib/formatters";
import { createDemoSnapshot } from "@/lib/demo-data";
import type {
  GoalValues,
  IdeaValues,
  MemoryValues,
  MoodValues,
  PairingValues,
  VoteResponseValues,
  VoteValues,
} from "@/lib/schemas";
import type { DashboardSnapshot, GoalTask } from "@/types/app";
import type { Enums, Json, Tables } from "@/types/database";

const demoReplies = [
  "Okay wait that is insanely cute.",
  "That just got promoted to immediate shortlist status.",
  "I support this with my whole tiny goblin heart.",
  "This app is enabling our chaos and I respect it.",
] as const;

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function buildVoteOptions(mode: VoteValues["mode"], optionsText?: string) {
  if (mode === "yes_no") {
    return ["Yes", "No"];
  }

  if (mode === "vibe") {
    return ["Hell yes", "Maybe", "Nope"];
  }

  if (mode === "rating") {
    return ["1", "2", "3", "4", "5"];
  }

  return optionsText
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? ["😍", "😌", "🤔", "🙅"];
}

function pushNotification(
  snapshot: DashboardSnapshot,
  notification: Tables<"notifications">,
) {
  snapshot.notifications = [notification, ...snapshot.notifications].slice(0, 20);
}

function ensureSnapshotMembers(
  snapshot: DashboardSnapshot | (DashboardSnapshot & { members?: Tables<"profiles">[] }),
) {
  const snapshotWithGoals = {
    ...snapshot,
    goals: snapshot.goals ?? [],
  };

  if (snapshot.members?.length) {
    return snapshotWithGoals as DashboardSnapshot;
  }

  return {
    ...snapshotWithGoals,
    members: [snapshotWithGoals.profile, ...(snapshotWithGoals.partner ? [snapshotWithGoals.partner] : [])],
  } satisfies DashboardSnapshot;
}

interface DemoState {
  snapshot: DashboardSnapshot;
  reset: () => void;
  markNotificationRead: (notificationId: string) => void;
  createInviteCode: () => void;
  joinWithCode: (values: PairingValues) => void;
  unlinkCouple: () => void;
  createIdea: (values: IdeaValues) => void;
  updateIdeaStatus: (ideaId: string, status: Enums<"idea_status">) => void;
  createGoal: (values: GoalValues) => void;
  completeGoal: (goalId: string) => void;
  updateGoalTitle: (goalId: string, values: GoalValues) => void;
  createVote: (values: VoteValues) => void;
  respondToVote: (
    voteId: string,
    values: VoteResponseValues,
  ) => void;
  closeVote: (voteId: string) => void;
  sendMessage: (content: string) => void;
  markMessagesRead: () => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  addMood: (values: MoodValues) => void;
  addMemory: (values: MemoryValues) => void;
  addGameSession: (
    gameType: Tables<"game_sessions">["game_type"],
    prompt: string,
    state?: Json,
    winnerId?: string | null,
  ) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      snapshot: ensureSnapshotMembers(createDemoSnapshot()),
      reset: () => set({ snapshot: ensureSnapshotMembers(createDemoSnapshot()) }),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            notifications: state.snapshot.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, read_at: nowIso() }
                : notification,
            ),
          },
        })),
      createInviteCode: () =>
        set((state) => {
          const nextProfile = {
            ...state.snapshot.profile,
            active_couple_id: makeId("pending-couple"),
            updated_at: nowIso(),
          };
          const nextCouple: Tables<"couples"> = {
            id: nextProfile.active_couple_id!,
            created_by: nextProfile.id,
            partner_one_id: nextProfile.id,
            partner_two_id: state.snapshot.partner?.id ?? null,
            invite_code: `US${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            status: "active",
            paired_at: nowIso(),
            unlinked_at: null,
            created_at: nowIso(),
            updated_at: nowIso(),
          };

          const partner = state.snapshot.partner
            ? {
                ...state.snapshot.partner,
                active_couple_id: nextCouple.id,
                updated_at: nowIso(),
              }
            : null;

          return {
            snapshot: {
              ...state.snapshot,
              profile: nextProfile,
              members: partner ? [nextProfile, partner] : [nextProfile],
              partner,
              couple: nextCouple,
            },
          };
        }),
      joinWithCode: (values) =>
        set((state) => {
          const partner = state.snapshot.partner ?? {
            ...createDemoSnapshot().partner!,
            id: makeId("partner"),
            active_couple_id: state.snapshot.couple?.id ?? makeId("couple"),
          };

          const nextCouple: Tables<"couples"> = state.snapshot.couple
            ? {
                ...state.snapshot.couple,
                partner_two_id: partner.id,
                invite_code: values.inviteCode.toUpperCase(),
                paired_at: nowIso(),
                updated_at: nowIso(),
              }
            : {
                id: makeId("couple"),
                created_by: state.snapshot.profile.id,
                partner_one_id: state.snapshot.profile.id,
                partner_two_id: partner.id,
                invite_code: values.inviteCode.toUpperCase(),
                status: "active",
                paired_at: nowIso(),
                unlinked_at: null,
                created_at: nowIso(),
                updated_at: nowIso(),
              };

          return {
            snapshot: {
              ...state.snapshot,
              profile: {
                ...state.snapshot.profile,
                active_couple_id: nextCouple.id,
                updated_at: nowIso(),
              },
              members: [
                {
                  ...state.snapshot.profile,
                  active_couple_id: nextCouple.id,
                  updated_at: nowIso(),
                },
                {
                  ...partner,
                  active_couple_id: nextCouple.id,
                  updated_at: nowIso(),
                },
              ],
              partner: {
                ...partner,
                active_couple_id: nextCouple.id,
                updated_at: nowIso(),
              },
              couple: nextCouple,
              memories: [
                {
                  id: makeId("memory"),
                  couple_id: nextCouple.id,
                  created_by: state.snapshot.profile.id,
                  related_idea_id: null,
                  related_vote_id: null,
                  title: "Your universe connected",
                  description: "Preview mode connected your space instantly so the fun could start.",
                  memory_type: "milestone",
                  celebration_level: 5,
                  cover_url: null,
                  metadata: {
                    mode: "preview",
                  } satisfies Json,
                  occurred_at: nowIso(),
                  created_at: nowIso(),
                },
                ...state.snapshot.memories,
              ],
            },
          };
        }),
      unlinkCouple: () =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            profile: {
              ...state.snapshot.profile,
              active_couple_id: null,
              updated_at: nowIso(),
            },
            partner: state.snapshot.partner
              ? {
                  ...state.snapshot.partner,
                  active_couple_id: null,
                  updated_at: nowIso(),
                }
              : null,
            members: [
              {
                ...state.snapshot.profile,
                active_couple_id: null,
                updated_at: nowIso(),
              },
            ],
            couple: null,
          },
        })),
      createIdea: (values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          const nextIdea: Tables<"ideas"> = {
            id: makeId("idea"),
            couple_id: state.snapshot.couple.id,
            created_by: state.snapshot.profile.id,
            title: values.title,
            description: values.description || null,
            category: values.category,
            emoji: values.emoji,
            tags: splitTags(values.tags),
            image_url: values.imageUrl || null,
            priority_weight: values.priorityWeight,
            status: values.status,
            created_at: nowIso(),
            updated_at: nowIso(),
          };

          const snapshot = {
            ...state.snapshot,
            ideas: [nextIdea, ...state.snapshot.ideas],
          };

          if (snapshot.partner && snapshot.couple) {
            pushNotification(snapshot, {
              id: makeId("notification"),
              user_id: state.snapshot.profile.id,
              couple_id: snapshot.couple.id,
              actor_id: snapshot.partner.id,
              type: "idea_added",
              title: "something new landed 👀",
              body: `You added "${nextIdea.title}" to your dream board.`,
              payload: {} satisfies Json,
              read_at: null,
              created_at: nowIso(),
            });
          }

          return { snapshot };
        }),
      updateIdeaStatus: (ideaId, status) =>
        set((state) => {
          const nextIdeas = state.snapshot.ideas.map((idea) =>
            idea.id === ideaId
              ? { ...idea, status, updated_at: nowIso() }
              : idea,
          );

          const completedIdea = nextIdeas.find(
            (idea) => idea.id === ideaId && status === "completed",
          );

          const nextSnapshot: DashboardSnapshot = {
            ...state.snapshot,
            ideas: nextIdeas,
            memories: completedIdea
              ? [
                  {
                    id: makeId("memory"),
                    couple_id: completedIdea.couple_id,
                    created_by: state.snapshot.profile.id,
                    related_idea_id: completedIdea.id,
                    related_vote_id: null,
                    title: `${completedIdea.title} completed`,
                    description:
                      completedIdea.description ||
                      "A saved plan turned into a real memory.",
                    memory_type: "memory",
                    celebration_level: 4,
                    cover_url: completedIdea.image_url,
                    metadata: {} satisfies Json,
                    occurred_at: nowIso(),
                    created_at: nowIso(),
                  },
                  ...state.snapshot.memories,
                ]
              : state.snapshot.memories,
          };

          return { snapshot: nextSnapshot };
        }),
      createGoal: (values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          const nextGoal: GoalTask = {
            id: makeId("goal"),
            couple_id: state.snapshot.couple.id,
            created_by: state.snapshot.profile.id,
            title: values.title.trim(),
            goal_date: new Date().toISOString().slice(0, 10),
            completed_at: null,
            completed_by: null,
            created_at: nowIso(),
            updated_at: nowIso(),
          };

          return {
            snapshot: {
              ...state.snapshot,
              goals: [nextGoal, ...state.snapshot.goals],
            },
          };
        }),
      completeGoal: (goalId) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            goals: state.snapshot.goals.map((goal) =>
              goal.id === goalId &&
              goal.created_by === state.snapshot.profile.id &&
              !goal.completed_at
                ? {
                    ...goal,
                    completed_at: nowIso(),
                    completed_by: state.snapshot.profile.id,
                    updated_at: nowIso(),
                  }
                : goal,
            ),
          },
        })),
      updateGoalTitle: (goalId, values) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            goals: state.snapshot.goals.map((goal) =>
              goal.id === goalId && goal.created_by === state.snapshot.profile.id
                ? {
                    ...goal,
                    title: values.title.trim(),
                    updated_at: nowIso(),
                  }
                : goal,
            ),
          },
        })),
      createVote: (values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          const nextVote: Tables<"votes"> = {
            id: makeId("vote"),
            couple_id: state.snapshot.couple.id,
            created_by: state.snapshot.profile.id,
            idea_id: values.ideaId || null,
            prompt: values.prompt,
            mode: values.mode,
            status: "active",
            options: buildVoteOptions(values.mode, values.optionsText),
            closes_at: null,
            created_at: nowIso(),
            updated_at: nowIso(),
          };

          return {
            snapshot: {
              ...state.snapshot,
              votes: [nextVote, ...state.snapshot.votes],
            },
          };
        }),
      respondToVote: (voteId, values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          const existingIndex = state.snapshot.voteResponses.findIndex(
            (response) =>
              response.vote_id === voteId &&
              response.user_id === state.snapshot.profile.id,
          );

          const nextResponse: Tables<"vote_responses"> = {
            id:
              existingIndex >= 0
                ? state.snapshot.voteResponses[existingIndex].id
                : makeId("vote-response"),
            couple_id: state.snapshot.couple.id,
            vote_id: voteId,
            user_id: state.snapshot.profile.id,
            response_value: values.responseValue || null,
            rating_value: values.ratingValue ?? null,
            emoji_value: values.emojiValue || null,
            comment: values.comment || null,
            created_at:
              existingIndex >= 0
                ? state.snapshot.voteResponses[existingIndex].created_at
                : nowIso(),
            updated_at: nowIso(),
          };

          const nextResponses =
            existingIndex >= 0
              ? state.snapshot.voteResponses.map((response, index) =>
                  index === existingIndex ? nextResponse : response,
                )
              : [nextResponse, ...state.snapshot.voteResponses];

          return {
            snapshot: {
              ...state.snapshot,
              voteResponses: nextResponses,
            },
          };
        }),
      closeVote: (voteId) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            votes: state.snapshot.votes.map((vote) =>
              vote.id === voteId
                ? { ...vote, status: "closed", updated_at: nowIso() }
                : vote,
            ),
          },
        })),
      sendMessage: (content) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          const nextMessage: Tables<"messages"> = {
            id: makeId("message"),
            couple_id: state.snapshot.couple.id,
            sender_id: state.snapshot.profile.id,
            content,
            read_by: [state.snapshot.profile.id],
            reaction_map: {} satisfies Json,
            created_at: nowIso(),
            updated_at: nowIso(),
          };

          window.setTimeout(() => {
            const latest = get().snapshot;
            const latestCouple = latest.couple;
            const latestPartner = latest.partner;

            if (!latestCouple || !latestPartner) {
              return;
            }

            set((current) => ({
              snapshot: {
                ...current.snapshot,
                messages: current.snapshot.messages.map((message) =>
                  message.id === nextMessage.id
                    ? {
                        ...message,
                        read_by: Array.from(
                          new Set([
                            ...message.read_by,
                            latestPartner.id,
                          ]),
                        ),
                        updated_at: nowIso(),
                      }
                    : message,
                ).concat({
                  id: makeId("message"),
                  couple_id: latestCouple.id,
                  sender_id: latestPartner.id,
                  content:
                    demoReplies[Math.floor(Math.random() * demoReplies.length)],
                  read_by: [latestPartner.id],
                  reaction_map: {} satisfies Json,
                  created_at: nowIso(),
                  updated_at: nowIso(),
                }),
              },
            }));
          }, 900);

          return {
            snapshot: {
              ...state.snapshot,
              messages: [...state.snapshot.messages, nextMessage],
            },
          };
        }),
      markMessagesRead: () =>
        set((state) => {
          let didChange = false;

          const nextMessages = state.snapshot.messages.map((message) => {
            if (
              message.sender_id === state.snapshot.profile.id ||
              message.read_by.includes(state.snapshot.profile.id)
            ) {
              return message;
            }

            didChange = true;

            return {
              ...message,
              read_by: Array.from(
                new Set([...message.read_by, state.snapshot.profile.id]),
              ),
              updated_at: nowIso(),
            };
          });

          if (!didChange) {
            return state;
          }

          return {
            snapshot: {
              ...state.snapshot,
              messages: nextMessages,
            },
          };
        }),
      toggleReaction: (messageId, emoji) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            messages: state.snapshot.messages.map((message) => {
              if (message.id !== messageId) {
                return message;
              }

              const reactionMap = (message.reaction_map ??
                {}) as Record<string, string[]>;
              const currentUsers = reactionMap[emoji] ?? [];
              const nextUsers = currentUsers.includes(state.snapshot.profile.id)
                ? currentUsers.filter((id) => id !== state.snapshot.profile.id)
                : [...currentUsers, state.snapshot.profile.id];

              return {
                ...message,
                reaction_map: {
                  ...reactionMap,
                  [emoji]: nextUsers,
                } satisfies Json,
                updated_at: nowIso(),
              };
            }),
          },
        })),
      addMood: (values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          return {
            snapshot: {
              ...state.snapshot,
              moods: [
                {
                  id: makeId("mood"),
                  couple_id: state.snapshot.couple.id,
                  user_id: state.snapshot.profile.id,
                  mood: values.mood,
                  note: values.note || null,
                  created_at: nowIso(),
                },
                ...state.snapshot.moods.filter(
                  (mood) => mood.user_id !== state.snapshot.profile.id,
                ),
              ],
            },
          };
        }),
      addMemory: (values) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          return {
            snapshot: {
              ...state.snapshot,
              memories: [
                {
                  id: makeId("memory"),
                  couple_id: state.snapshot.couple.id,
                  created_by: state.snapshot.profile.id,
                  related_idea_id: null,
                  related_vote_id: null,
                  title: values.title,
                  description: values.description || null,
                  memory_type: "memory",
                  celebration_level: 4,
                  cover_url: values.coverUrl || null,
                  metadata: {} satisfies Json,
                  occurred_at: new Date(values.occurredAt).toISOString(),
                  created_at: nowIso(),
                },
                ...state.snapshot.memories,
              ],
            },
          };
        }),
      addGameSession: (gameType, prompt, sessionState = {}, winnerId = null) =>
        set((state) => {
          if (!state.snapshot.couple) {
            return state;
          }

          return {
            snapshot: {
              ...state.snapshot,
              gameSessions: [
                {
                  id: makeId("game-session"),
                  couple_id: state.snapshot.couple.id,
                  created_by: state.snapshot.profile.id,
                  game_type: gameType,
                  prompt,
                  state: sessionState,
                  winner_id: winnerId ?? state.snapshot.profile.id,
                  completed_at: nowIso(),
                  created_at: nowIso(),
                  updated_at: nowIso(),
                },
                ...state.snapshot.gameSessions,
              ],
            },
          };
        }),
    }),
    {
      name: "usverse-demo-store",
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<DemoState> | undefined;

        return {
          ...currentState,
          ...typedPersistedState,
          snapshot: typedPersistedState?.snapshot
            ? ensureSnapshotMembers(typedPersistedState.snapshot)
            : currentState.snapshot,
        };
      },
      partialize: (state) => ({
        snapshot: state.snapshot,
      }),
    },
  ),
);

export function useDemoSnapshot() {
  return useDemoStore((state) => state.snapshot);
}
