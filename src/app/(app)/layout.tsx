import { redirect } from "next/navigation";

import { DemoAppLayout } from "@/components/demo/demo-app-layout";
import { GradientOrbs } from "@/components/shared/gradient-orbs";
import { SupabaseProvider } from "@/components/shared/supabase-provider";
import { UniverseShellClient } from "@/components/app-shell/universe-shell-client";
import { hasSupabaseConfig } from "@/lib/env";
import { getDashboardSnapshot } from "@/services/server-data";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseConfig) {
    return <DemoAppLayout>{children}</DemoAppLayout>;
  }

  const snapshot = await getDashboardSnapshot();

  if (!snapshot) {
    redirect("/login");
  }

  return (
    <SupabaseProvider>
      <div className="relative min-h-screen">
        <GradientOrbs />
        <UniverseShellClient
          profile={snapshot.profile}
          members={snapshot.members}
          couple={snapshot.couple}
          notifications={snapshot.notifications}
          mode="live"
        >
          {children}
        </UniverseShellClient>
      </div>
    </SupabaseProvider>
  );
}
