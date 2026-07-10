import { DemoPlayPage } from "@/components/demo/demo-play-page";
import { PageHeading } from "@/components/shared/page-heading";
import { hasSupabaseConfig } from "@/lib/env";

export default async function PlayPage() {
  if (!hasSupabaseConfig) {
    return <DemoPlayPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Play"
        title="Playful tools are resting for now"
        description="The decision wheel, voting, and mini games are removed for this version and can come back later without touching your shared space."
      />
    </div>
  );
}
