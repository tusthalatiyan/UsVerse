"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { messageSchema, type MessageValues } from "@/lib/schemas";
import type { Database } from "@/types/database";

type ReactionMap = Record<string, string[]>;

export async function sendMessage(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
    values: MessageValues;
  },
) {
  const parsed = messageSchema.parse(input.values);

  return supabase.from("messages").insert({
    couple_id: input.coupleId,
    sender_id: input.userId,
    content: parsed.content,
    read_by: [input.userId],
  });
}

export async function markMessagesRead(
  supabase: SupabaseClient<Database>,
  input: {
    coupleId: string;
    userId: string;
  },
) {
  const { data: unreadMessages, error } = await supabase
    .from("messages")
    .select("id, read_by, sender_id")
    .eq("couple_id", input.coupleId)
    .neq("sender_id", input.userId);

  if (error || !unreadMessages?.length) {
    return { error };
  }

  await Promise.all(
    unreadMessages.map((message) => {
      const readBy = Array.from(new Set([...(message.read_by ?? []), input.userId]));

      return supabase
        .from("messages")
        .update({
          read_by: readBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", message.id);
    }),
  );

  return { error: null };
}

export async function toggleMessageReaction(
  supabase: SupabaseClient<Database>,
  input: {
    messageId: string;
    emoji: string;
    userId: string;
  },
) {
  const { data: message, error } = await supabase
    .from("messages")
    .select("reaction_map")
    .eq("id", input.messageId)
    .single();

  if (error) {
    return { error };
  }

  const reactionMap = (message.reaction_map ?? {}) as ReactionMap;
  const currentUsers = reactionMap[input.emoji] ?? [];
  const nextUsers = currentUsers.includes(input.userId)
    ? currentUsers.filter((userId) => userId !== input.userId)
    : [...currentUsers, input.userId];

  const nextReactionMap: ReactionMap = {
    ...reactionMap,
    [input.emoji]: nextUsers,
  };

  return supabase
    .from("messages")
    .update({
      reaction_map: nextReactionMap,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.messageId);
}
