"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useSupabase } from "@/hooks/use-supabase";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas";
import { updatePassword } from "@/services/auth-service";
import { toErrorMessage } from "@/services/service-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(supabase, values);

      if (error) {
        toast.error(toErrorMessage(error));
        return;
      }

      toast.success("Password updated. You can log in now.");
      router.replace("/login");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="New password" htmlFor="password" error={form.formState.errors.password?.message}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...form.register("password")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 text-foreground/50"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 text-foreground/50"
            onClick={() => setShowConfirmPassword((value) => !value)}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button disabled={isSubmitting} type="submit" className="h-12 w-full rounded-full">
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Update password"
        )}
      </Button>

      <p className="text-center text-sm text-foreground/70">
        Need to go back?{" "}
        <Link href="/login" className="font-semibold text-rose-500 hover:text-rose-600">
          Login
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
