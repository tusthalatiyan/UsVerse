import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PageHeading } from "@/components/shared/page-heading";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Password Reset"
        title="We’ll help you get back in."
        description="Send a reset link to your email and we’ll let you set a new password."
      />
      <ForgotPasswordForm />
    </div>
  );
}
