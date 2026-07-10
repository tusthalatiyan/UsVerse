"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Gamepad2,
  MessageCircleHeart,
  ScrollText,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import { motion } from "framer-motion";

import { NotificationsSheet } from "@/components/app-shell/notifications-sheet";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { AppLogo } from "@/components/shared/app-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useDocumentTheme } from "@/hooks/use-document-theme";
import type { Tables } from "@/types/database";

const navigation = [
  { href: "/space", label: "Space", icon: Sparkles },
  { href: "/ideas", label: "Ideas", icon: Compass },
  { href: "/chat", label: "Chat", icon: MessageCircleHeart },
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/memories", label: "Memories", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: UserRoundCog },
] as const;

function summarizeConnectedMembers(members: Tables<"profiles">[]) {
  if (!members.length) {
    return "Ready to connect";
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

export function UniverseShellClient({
  profile,
  members,
  couple,
  notifications,
  mode = "live",
  children,
}: {
  profile: Tables<"profiles">;
  members: Tables<"profiles">[];
  couple: Tables<"couples"> | null;
  notifications: Tables<"notifications">[];
  mode?: "live" | "preview";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useDocumentTheme(profile.theme_preference);

  const otherMembers = members.filter((member) => member.id !== profile.id);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6">
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col gap-5">
        <header className="glass-card rounded-[2rem] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AppLogo compact={false} />
              <div className="hidden h-10 w-px bg-border/70 sm:block" />
              <div className="hidden items-center gap-3 rounded-full bg-white/65 px-3 py-2 sm:flex">
                <UserAvatar avatarKey={profile.avatar_key} nickname={profile.nickname} />
                <div className="text-sm">
                  <p className="font-semibold">{profile.nickname}</p>
                  <p className="text-foreground/66">{profile.emoji_identity}</p>
                </div>
              </div>
              {mode === "preview" ? (
                <div className="hidden rounded-full bg-amber-100/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 lg:flex">
                  Local Preview
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="hidden rounded-full bg-white/65 px-3 py-2 text-sm sm:flex sm:items-center sm:gap-3">
                {otherMembers.length ? (
                  <>
                    <UserAvatar
                      avatarKey={otherMembers[0].avatar_key}
                      nickname={otherMembers[0].nickname}
                    />
                    <div>
                      <p className="font-semibold">
                        {otherMembers.length === 1
                          ? otherMembers[0].nickname
                          : `${otherMembers.length} connected`}
                      </p>
                      <p className="text-foreground/66">
                        {summarizeConnectedMembers(otherMembers)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-rose-500" />
                    <span className="text-foreground/68">
                      {couple ? "Invite people in" : "Ready to connect"}
                    </span>
                  </>
                )}
              </div>
              <NotificationsSheet notifications={notifications} />
              <SignOutButton mode={mode} />
            </div>
          </div>
        </header>

        <div className="flex-1 pb-24">{children}</div>

        <nav className="glass-card fixed inset-x-4 bottom-4 z-40 mx-auto max-w-4xl rounded-[1.7rem] px-2 py-2 sm:inset-x-6">
          <div className="grid grid-cols-6 gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative rounded-[1.3rem] px-2 py-3 text-center text-xs font-medium text-foreground/70 transition hover:text-foreground"
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-[1.3rem] bg-white/85 shadow-[0_14px_28px_rgba(255,190,190,0.15)]"
                    />
                  ) : null}
                  <span className="relative flex flex-col items-center gap-1">
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
