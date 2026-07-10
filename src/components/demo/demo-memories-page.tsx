"use client";

import { MemoryTimeline } from "@/components/memories/memory-timeline";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoSnapshot } from "@/stores/demo-store";

export function DemoMemoriesPage() {
  const snapshot = useDemoSnapshot();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Memories"
        title="A timeline for the moments that mattered"
        description="The timeline updates locally as you complete ideas and add memories."
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
