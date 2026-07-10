import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageHeading } from "@/components/shared/page-heading";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Set New Password"
        title="Choose a new password."
        description="Once it's updated, you'll be ready to jump back into your universe."
      />
      <ResetPasswordForm />
    </div>
  );
}
