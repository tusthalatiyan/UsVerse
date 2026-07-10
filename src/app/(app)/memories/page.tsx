import { DemoMemoriesPage } from "@/components/demo/demo-memories-page";
import { MemoryTimeline } from "@/components/memories/memory-timeline";
import { PageHeading } from "@/components/shared/page-heading";
import { hasSupabaseConfig } from "@/lib/env";
import { getDashboardSnapshot } from "@/services/server-data";

export default async function MemoriesPage() {
  if (!hasSupabaseConfig) {
    return <DemoMemoriesPage />;
  }

  const snapshot = await getDashboardSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Memories"
        title="A timeline for the moments that mattered"
        description="Manual memories, completed plans, milestones, and closed votes all stack into a scrapbook-style shared feed."
      />
      <MemoryTimeline
        couple={snapshot.couple}
        profile={snapshot.profile}
        memories={snapshot.memories}
        ideas={snapshot.ideas}
        votes={snapshot.votes}
      />
    </div>
  );
}
