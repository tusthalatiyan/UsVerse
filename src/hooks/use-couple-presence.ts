"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useOptionalSupabase } from "@/hooks/use-supabase";
import type { Tables } from "@/types/database";

interface PresenceState {
  onlineUserIds: string[];
}

export function useCouplePresence(input: {
  couple: Tables<"couples"> | null;
  profile: Tables<"profiles">;
}) {
  const supabase = useOptionalSupabase();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(
    null,
  );

  const presenceChannelName = useMemo(
    () => (input.couple ? `presence:${input.couple.id}` : null),
    [input.couple],
  );

  useEffect(() => {
    if (!presenceChannelName || !supabase) {
      return;
    }

    const channel = supabase.channel(presenceChannelName, {
      config: {
        presence: {
          key: input.profile.id,
        },
      },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const nextIds = Object.keys(state);
        setOnlineUserIds(nextIds);
        setTypingUserIds((currentIds) =>
          currentIds.filter((userId) => nextIds.includes(userId)),
        );
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const nextPayload = payload as { typing?: boolean; userId?: string };

        if (!nextPayload.userId || nextPayload.userId === input.profile.id) {
          return;
        }

        const typingUserId = nextPayload.userId;

        setTypingUserIds((currentIds) => {
          if (nextPayload.typing) {
            return currentIds.includes(typingUserId)
              ? currentIds
              : [...currentIds, typingUserId];
          }

          return currentIds.filter((userId) => userId !== typingUserId);
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            onlineUserIds: [input.profile.id],
          } satisfies PresenceState);
        }
      });

    return () => {
      channelRef.current = null;
      setTypingUserIds([]);
      void supabase.removeChannel(channel);
    };
  }, [input.profile.id, presenceChannelName, supabase]);

  return {
    onlineUserIds,
    typingUserIds,
    async sendTyping(typing: boolean) {
      if (!presenceChannelName || !channelRef.current) {
        return;
      }

      await channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          typing,
          userId: input.profile.id,
        },
      });
    },
  };
}
