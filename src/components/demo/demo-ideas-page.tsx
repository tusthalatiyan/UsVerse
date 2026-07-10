"use client";

import { TodaysGoalsSection } from "@/components/goals/todays-goals-section";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoSnapshot } from "@/stores/demo-store";

export function DemoIdeasPage() {
  const snapshot = useDemoSnapshot();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Ideas"
        title="Today's shared goals, all in one soft checklist"
        description="Everything on this page is editable locally, so you can keep building the experience immediately."
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
