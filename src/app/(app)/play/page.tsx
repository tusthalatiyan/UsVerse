import { DemoPlayPage } from "@/components/demo/demo-play-page";
import { GermanWordSprint } from "@/components/games/german-word-sprint";
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
        title="Learn German in tiny cozy rounds"
        description="Practice useful words, build streaks, and keep the Play section light while the rest of your shared space stays untouched."
      />
      <GermanWordSprint />
    </div>
  );
}
