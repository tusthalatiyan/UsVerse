"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useOptionalSupabase } from "@/hooks/use-supabase";
import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];

export function useRealtimeRefresh(input: {
  enabled?: boolean;
  channel: string;
  tables: TableName[];
  filter?: string;
}) {
  const router = useRouter();
  const supabase = useOptionalSupabase();
  const refreshTimeoutRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (input.enabled === false || !input.tables.length || !supabase) {
      return;
    }

    const channel = supabase.channel(input.channel);
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 120);
    };

    input.tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: input.filter,
        },
        scheduleRefresh,
      );
    });

    channel.subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [input.channel, input.enabled, input.filter, input.tables, router, startTransition, supabase]);
}
