"use client";

import { UniverseShellClient } from "@/components/app-shell/universe-shell-client";
import { GradientOrbs } from "@/components/shared/gradient-orbs";
import { SupabaseProvider } from "@/components/shared/supabase-provider";
import { useDemoSnapshot } from "@/stores/demo-store";

export function DemoAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = useDemoSnapshot();

  return (
    <SupabaseProvider>
      <div className="relative min-h-screen">
        <GradientOrbs />
        <UniverseShellClient
          profile={snapshot.profile}
          members={snapshot.members}
          couple={snapshot.couple}
          notifications={snapshot.notifications}
          mode="preview"
        >
          {children}
        </UniverseShellClient>
      </div>
    </SupabaseProvider>
  );
}
