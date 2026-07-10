"use client";

import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { useOptionalSupabase } from "@/hooks/use-supabase";
import { hasSupabaseConfig } from "@/lib/env";
import { formatTimestamp, relativeTime } from "@/lib/formatters";
import { markNotificationRead } from "@/services/memory-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Tables } from "@/types/database";

export function NotificationsSheet({
  notifications,
}: {
  notifications: Tables<"notifications">[];
}) {
  const supabase = useOptionalSupabase();
  const markPreviewNotificationRead = useDemoStore(
    (state) => state.markNotificationRead,
  );
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" className="relative rounded-full" />
        }
      >
        <Bell className="size-4" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent className="w-full border-white/70 bg-white/88 sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Cute pings from your universe, newest first.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={async () => {
                  if (!notification.read_at) {
                    if (!hasSupabaseConfig || !supabase) {
                      markPreviewNotificationRead(notification.id);
                      return;
                    }

                    const { error } = await markNotificationRead(
                      supabase,
                      notification.id,
                    );

                    if (error) {
                      toast.error(toErrorMessage(error));
                    }
                  }
                }}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                  notification.read_at
                    ? "border-white/70 bg-white/55"
                    : "border-rose-200 bg-rose-50/85"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-foreground/68">
                      {notification.body}
                    </p>
                  </div>
                  {!notification.read_at ? (
                    <CheckCheck className="mt-1 size-4 text-rose-500" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-foreground/52">
                  {formatTimestamp(notification.created_at)} •{" "}
                  {relativeTime(notification.created_at)}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-white/55 p-6 text-center text-sm text-foreground/68">
              No notifications yet. The cute little pings will show up here.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
