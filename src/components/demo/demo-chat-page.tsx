"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { PageHeading } from "@/components/shared/page-heading";
import { useDemoSnapshot } from "@/stores/demo-store";

export function DemoChatPage() {
  const snapshot = useDemoSnapshot();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Chat"
        title="A softer kind of private chat"
        description="Local preview mode keeps this fully usable, including reactions and little auto replies."
      />
      <ChatPanel
        couple={snapshot.couple}
        members={snapshot.members}
        profile={snapshot.profile}
        messages={snapshot.messages}
      />
    </div>
  );
}
