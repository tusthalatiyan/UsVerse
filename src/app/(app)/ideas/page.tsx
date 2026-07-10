import { DemoIdeasPage } from "@/components/demo/demo-ideas-page";
import { TodaysGoalsSection } from "@/components/goals/todays-goals-section";
import { PageHeading } from "@/components/shared/page-heading";
import { hasSupabaseConfig } from "@/lib/env";
import { getDashboardSnapshot } from "@/services/server-data";

export default async function IdeasPage() {
  if (!hasSupabaseConfig) {
    return <DemoIdeasPage />;
  }

  const snapshot = await getDashboardSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Ideas"
        title="Today's shared goals, all in one soft checklist"
        description="Add the tiny tasks for today, check them off together, and keep completed wins visible for everyone in the space."
      />
      <TodaysGoalsSection
        goals={snapshot.goals}
        coupleId={snapshot.profile.active_couple_id}
        members={snapshot.members}
        profile={snapshot.profile}
      />
    </div>
  );
}
