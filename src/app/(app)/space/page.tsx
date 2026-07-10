import { DemoSpacePage } from "@/components/demo/demo-space-page";
import { ChatPanel } from "@/components/chat/chat-panel";
import { TodaysGoalsSection } from "@/components/goals/todays-goals-section";
import { MemoryTimeline } from "@/components/memories/memory-timeline";
import { PairingCard } from "@/components/pairing/pairing-card";
import { FrostCard } from "@/components/shared/frost-card";
import { PageHeading } from "@/components/shared/page-heading";
import { hasSupabaseConfig } from "@/lib/env";
import { getDashboardSnapshot } from "@/services/server-data";

function buildUniversePulse(members: { emoji_identity: string }[]) {
  if (members.length <= 1) {
    return "One side of the universe is ready.";
  }

  const memberEnergies = members.map((member) => member.emoji_identity);

  if (memberEnergies.length <= 3) {
    return memberEnergies.join(" + ");
  }

  return `${memberEnergies.slice(0, 2).join(" + ")} + ${memberEnergies.length - 2} more`;
}

export default async function SpacePage() {
  if (!hasSupabaseConfig) {
    return <DemoSpacePage />;
  }

  const snapshot = await getDashboardSnapshot();

  if (!snapshot) {
    return null;
  }

  const openGoalsCount = snapshot.goals.filter((goal) => !goal.completed_at).length;
  const completedGoalsCount = snapshot.goals.filter((goal) => goal.completed_at).length;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Home"
        title={`Welcome back, ${snapshot.profile.nickname}`}
        description="Everything soft and shared lives here: today's goals, chat, invites, and the memories you keep growing together."
      />

      <FrostCard className="mesh-panel">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
              Your Universe Pulse
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {buildUniversePulse(snapshot.members)}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-foreground/72">
              Keep the day moving with a tiny shared checklist, cozy chat, and the moments your space is saving together.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Today's goals" value={String(openGoalsCount)} emoji="+" />
            <StatCard label="Done today" value={String(completedGoalsCount)} emoji="✓" />
            <StatCard label="Memories" value={String(snapshot.memories.length)} emoji="*" />
          </div>
        </div>
      </FrostCard>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-6">
          <PairingCard
            couple={snapshot.couple}
            members={snapshot.members}
            profile={snapshot.profile}
          />
          <TodaysGoalsSection
            goals={snapshot.goals}
            coupleId={snapshot.profile.active_couple_id}
            members={snapshot.members}
            profile={snapshot.profile}
            compact
          />
          <ChatPanel
            couple={snapshot.couple}
            members={snapshot.members}
            profile={snapshot.profile}
            messages={snapshot.messages}
            compact
          />
        </div>

        <div className="space-y-6">
          <MemoryTimeline
            couple={snapshot.couple}
            profile={snapshot.profile}
            memories={snapshot.memories}
            ideas={snapshot.ideas}
            votes={snapshot.votes}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white/65 p-4">
      <p className="text-sm text-foreground/66">{label}</p>
      <p className="mt-2 text-3xl font-semibold">
        <span className="mr-2">{emoji}</span>
        {value}
      </p>
    </div>
  );
}
