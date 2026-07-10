"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCouplePresence } from "@/hooks/use-couple-presence";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { hasSupabaseConfig } from "@/lib/env";
import { formatTimestamp } from "@/lib/formatters";
import { makeOptimisticId, nowIso } from "@/lib/optimistic";
import { useChatStore } from "@/stores/chat-store";
import { useDemoStore } from "@/stores/demo-store";
import {
  markMessagesRead,
  sendMessage,
  toggleMessageReaction,
} from "@/services/chat-service";
import { toErrorMessage } from "@/services/service-utils";
import type { Tables } from "@/types/database";

const reactionPresets = [
  "\u{1F497}",
  "\u{1F602}",
  "\u{1F979}",
  "\u{1F525}",
];

type MessageRow = Tables<"messages">;
type ReactionMap = Record<string, string[]>;

function normalizeReactionMap(value: MessageRow["reaction_map"]) {
  return typeof value === "object" && value ? (value as ReactionMap) : {};
}

function summarizeMemberNames(members: Tables<"profiles">[]) {
  if (!members.length) {
    return "Someone";
  }

  if (members.length === 1) {
    return members[0].nickname;
  }

  if (members.length === 2) {
    return `${members[0].nickname} and ${members[1].nickname}`;
  }

  return `${members[0].nickname}, ${members[1].nickname}, and ${
    members.length - 2
  } more`;
}

export function ChatPanel({
  couple,
  members,
  profile,
  messages,
  compact = false,
}: {
  couple: Tables<"couples"> | null;
  members: Tables<"profiles">[];
  profile: Tables<"profiles">;
  messages: MessageRow[];
  compact?: boolean;
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [isPending, startTransition] = useTransition();
  const [liveMessages, setLiveMessages] = useState(messages);
  const draft = useChatStore((state) => state.draft);
  const setDraft = useChatStore((state) => state.setDraft);
  const typingTimeoutRef = useRef<number | null>(null);
  const sendPreviewMessage = useDemoStore((state) => state.sendMessage);
  const markPreviewMessagesRead = useDemoStore((state) => state.markMessagesRead);
  const togglePreviewReaction = useDemoStore((state) => state.toggleReaction);
  const { onlineUserIds, typingUserIds, sendTyping } = useCouplePresence({
    couple,
    profile,
  });

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useRealtimeRefresh({
    enabled: Boolean(couple?.id),
    channel: `messages:${couple?.id ?? "solo"}`,
    tables: ["messages"],
    filter: couple?.id ? `couple_id=eq.${couple.id}` : undefined,
  });

  const hasUnreadIncomingMessages = liveMessages.some(
    (message) =>
      message.sender_id !== profile.id && !message.read_by.includes(profile.id),
  );

  useEffect(() => {
    if (!couple?.id || !hasUnreadIncomingMessages) {
      return;
    }

    if (isPreview) {
      markPreviewMessagesRead();
      return;
    }

    if (!supabase) {
      return;
    }

    void markMessagesRead(supabase, {
      coupleId: couple.id,
      userId: profile.id,
    });
  }, [
    couple?.id,
    hasUnreadIncomingMessages,
    isPreview,
    markPreviewMessagesRead,
    profile.id,
    supabase,
  ]);

  if (!couple) {
    return (
      <FrostCard>
        <EmptyState
          title="No chat until you connect"
          description="Invite someone first, then your cozy private chat will live here."
        />
      </FrostCard>
    );
  }

  const visibleMessages = compact ? liveMessages.slice(-6) : liveMessages;
  const otherMembers = members.filter((member) => member.id !== profile.id);
  const onlineOtherMembers = otherMembers.filter((member) =>
    onlineUserIds.includes(member.id),
  );
  const typingMembers = otherMembers.filter((member) =>
    typingUserIds.includes(member.id),
  );
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const headerTitle =
    otherMembers.length === 1
      ? otherMembers[0].nickname
      : `${otherMembers.length} people in space`;
  const headerStatus =
    typingMembers.length > 0
      ? `${summarizeMemberNames(typingMembers)} typing...`
      : otherMembers.length === 1
        ? onlineOtherMembers.length
          ? "online"
          : "offline"
        : `${onlineOtherMembers.length}/${otherMembers.length} online`;

  return (
    <FrostCard className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Cozy Chat
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your soft little conversation corner
          </h2>
        </div>

        {otherMembers.length ? (
          <div className="flex items-center gap-3 rounded-full bg-white/65 px-3 py-2 text-sm">
            <UserAvatar
              avatarKey={otherMembers[0].avatar_key}
              nickname={otherMembers[0].nickname}
              className="size-9"
            />
            <div>
              <p className="font-semibold">{headerTitle}</p>
              <p className="text-foreground/66">{headerStatus}</p>
            </div>
          </div>
        ) : null}
      </div>

      <ScrollArea
        className={`${compact ? "h-[22rem]" : "h-[34rem]"} rounded-[1.7rem] border border-white/75 bg-white/50 p-4`}
      >
        <div className="space-y-3">
          {visibleMessages.length ? (
            visibleMessages.map((message) => {
              const mine = message.sender_id === profile.id;
              const sender = memberMap.get(message.sender_id);
              const senderName = mine ? "You" : sender?.nickname ?? "Someone";
              const seenByCount = otherMembers.filter((member) =>
                message.read_by.includes(member.id),
              ).length;
              const seenLabel =
                otherMembers.length <= 1
                  ? seenByCount
                    ? "Seen"
                    : "Sent"
                  : seenByCount
                    ? `Seen by ${seenByCount}/${otherMembers.length}`
                    : "Sent";
              const reactionMap = normalizeReactionMap(message.reaction_map);

              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.6rem] px-4 py-3 ${
                      mine
                        ? "bg-foreground text-background"
                        : "border border-white/70 bg-white/80 text-foreground"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        mine ? "text-background/65" : "text-foreground/50"
                      }`}
                    >
                      {senderName}
                    </p>
                    <p className="mt-1 text-sm leading-6">{message.content}</p>
                    <div
                      className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${
                        mine ? "text-background/75" : "text-foreground/55"
                      }`}
                    >
                      <span>{formatTimestamp(message.created_at)}</span>
                      {mine ? <span>{seenLabel}</span> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {reactionPresets.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              if (isPreview) {
                                togglePreviewReaction(message.id, emoji);
                                return;
                              }

                              if (!supabase) {
                                toast.error("Supabase client unavailable.");
                                return;
                              }

                              const previousMessages = liveMessages;

                              setLiveMessages((currentMessages) =>
                                currentMessages.map((currentMessage) => {
                                  if (currentMessage.id !== message.id) {
                                    return currentMessage;
                                  }

                                  const currentReactionMap = normalizeReactionMap(
                                    currentMessage.reaction_map,
                                  );
                                  const currentUsers = currentReactionMap[emoji] ?? [];
                                  const nextUsers = currentUsers.includes(profile.id)
                                    ? currentUsers.filter((userId) => userId !== profile.id)
                                    : [...currentUsers, profile.id];

                                  return {
                                    ...currentMessage,
                                    reaction_map: {
                                      ...currentReactionMap,
                                      [emoji]: nextUsers,
                                    },
                                    updated_at: nowIso(),
                                  };
                                }),
                              );

                              const { error } = await toggleMessageReaction(supabase, {
                                messageId: message.id,
                                emoji,
                                userId: profile.id,
                              });

                              if (error) {
                                setLiveMessages(previousMessages);
                                toast.error(toErrorMessage(error));
                              }
                            })
                          }
                          className={`rounded-full px-2 py-1 text-xs ${
                            reactionMap[emoji]?.length
                              ? "bg-white/25"
                              : mine
                                ? "bg-white/15"
                                : "bg-secondary"
                          }`}
                        >
                          {emoji}
                          {reactionMap[emoji]?.length ? ` ${reactionMap[emoji].length}` : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No messages yet"
              description="Send the first cute little note and make this space feel lived in."
            />
          )}
        </div>
      </ScrollArea>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            const trimmedDraft = draft.trim();

            if (!trimmedDraft) {
              return;
            }

            if (isPreview) {
              sendPreviewMessage(trimmedDraft);
              setDraft("");
              await sendTyping(false);
              return;
            }

            if (!supabase) {
              toast.error("Supabase client unavailable.");
              return;
            }

            const optimisticMessage: MessageRow = {
              id: makeOptimisticId("message"),
              couple_id: couple.id,
              sender_id: profile.id,
              content: trimmedDraft,
              read_by: [profile.id],
              reaction_map: {},
              created_at: nowIso(),
              updated_at: nowIso(),
            };

            setLiveMessages((currentMessages) => [...currentMessages, optimisticMessage]);
            setDraft("");
            await sendTyping(false);

            const { error } = await sendMessage(supabase, {
              coupleId: couple.id,
              userId: profile.id,
              values: {
                content: trimmedDraft,
              },
            });

            if (error) {
              setLiveMessages((currentMessages) =>
                currentMessages.filter((message) => message.id !== optimisticMessage.id),
              );
              setDraft(trimmedDraft);
              toast.error(toErrorMessage(error));
            }
          });
        }}
        className="flex items-center gap-3"
      >
        <Input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            void sendTyping(true);

            if (typingTimeoutRef.current) {
              window.clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = window.setTimeout(() => {
              void sendTyping(false);
            }, 900);
          }}
          placeholder="Type a tiny note..."
        />
        <Button disabled={!draft.trim() || isPending} type="submit" className="rounded-full">
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>

      {typingMembers.length ? (
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Sparkles className="size-4 text-rose-400" />
          {summarizeMemberNames(typingMembers)} {typingMembers.length === 1 ? "is" : "are"}{" "}
          typing...
        </div>
      ) : null}
    </FrostCard>
  );
}
