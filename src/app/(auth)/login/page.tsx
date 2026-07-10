import { LoginForm } from "@/components/auth/login-form";
import { PageHeading } from "@/components/shared/page-heading";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Welcome Back"
        title="Step back into your universe."
        description="Log in to chat, vote, spin, and keep your shared story moving."
      />
      <LoginForm />
    </div>
  );
}
