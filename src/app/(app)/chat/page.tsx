import { DemoChatPage } from "@/components/demo/demo-chat-page";
import { ChatPanel } from "@/components/chat/chat-panel";
import { PageHeading } from "@/components/shared/page-heading";
import { hasSupabaseConfig } from "@/lib/env";
import { getDashboardSnapshot } from "@/services/server-data";

export default async function ChatPage() {
  if (!hasSupabaseConfig) {
    return <DemoChatPage />;
  }

  const snapshot = await getDashboardSnapshot();

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Chat"
        title="A softer kind of private chat"
        description="Realtime messages, reactions, typing indicators, read receipts, and just enough warmth to make the whole app feel alive."
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
