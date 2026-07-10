"use client";

import { PairingCard } from "@/components/pairing/pairing-card";
import { FrostCard } from "@/components/shared/frost-card";
import { PageHeading } from "@/components/shared/page-heading";
import { UserAvatar } from "@/components/shared/user-avatar";
import { themeOptions } from "@/lib/constants";
import { useDemoSnapshot } from "@/stores/demo-store";

export function DemoSettingsPage() {
  const snapshot = useDemoSnapshot();
  const activeTheme = themeOptions.find(
    (theme) => theme.value === snapshot.profile.theme_preference,
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Settings"
        title="Your side of the universe"
        description="This local preview keeps your profile, connection state, and visual style visible without forcing backend setup first."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <FrostCard className="space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar
              avatarKey={snapshot.profile.avatar_key}
              nickname={snapshot.profile.nickname}
              className="size-16"
            />
            <div>
              <p className="text-2xl font-semibold">{snapshot.profile.nickname}</p>
              <p className="text-foreground/68">{snapshot.profile.emoji_identity}</p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/75 bg-white/65 p-4">
            <p className="text-sm font-semibold">Theme preference</p>
            <div
              className={`mt-3 h-24 rounded-[1.5rem] bg-gradient-to-br ${activeTheme?.gradient}`}
            />
            <p className="mt-3 font-medium">{activeTheme?.name}</p>
            <p className="mt-1 text-sm text-foreground/68">{activeTheme?.description}</p>
          </div>
        </FrostCard>

        <PairingCard
          couple={snapshot.couple}
          members={snapshot.members}
          profile={snapshot.profile}
        />
      </div>
    </div>
  );
}
