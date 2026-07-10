import { redirect } from "next/navigation";

import { AppLogo } from "@/components/shared/app-logo";
import { GradientOrbs } from "@/components/shared/gradient-orbs";
import { SupabaseProvider } from "@/components/shared/supabase-provider";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { FrostCard } from "@/components/shared/frost-card";
import { hasSupabaseConfig } from "@/lib/env";
import { getSessionUser } from "@/services/server-data";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseConfig) {
    redirect("/space");
  }

  if (hasSupabaseConfig) {
    const user = await getSessionUser();

    if (user) {
      redirect("/space");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 sm:px-8">
      <GradientOrbs />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6">
        <div className="rounded-full border border-white/65 bg-white/55 px-4 py-3 shadow-[0_18px_50px_rgba(255,194,194,0.14)] backdrop-blur-2xl">
          <AppLogo />
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_0.92fr]">
          <div className="hidden lg:block">
            <AuthShowcase />
          </div>

          <div className="flex items-center">
            <FrostCard className="glass-card-strong w-full rounded-[2rem] p-5 sm:p-8">
              <SupabaseProvider>{children}</SupabaseProvider>
            </FrostCard>
          </div>
        </div>
      </div>
    </main>
  );
}
