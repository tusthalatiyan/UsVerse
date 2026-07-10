import { SignupForm } from "@/components/auth/signup-form";
import { PageHeading } from "@/components/shared/page-heading";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Create Account"
        title="Set up your little universe."
        description="Pick the nickname, avatar, and color palette that feels like you."
      />
      <SignupForm />
    </div>
  );
}
