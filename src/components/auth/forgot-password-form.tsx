"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useSupabase } from "@/hooks/use-supabase";
import {
  formatCooldown,
  getAuthEmailCooldown,
  rememberAuthEmailAttempt,
} from "@/lib/auth-cooldown";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas";
import { requestPasswordReset } from "@/services/auth-service";
import { isEmailRateLimitError, toErrorMessage } from "@/services/service-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const supabase = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    const cooldown = getAuthEmailCooldown("password-reset", values.email);

    if (cooldown) {
      toast.error(`Please wait ${formatCooldown(cooldown)} before requesting another reset link.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await requestPasswordReset(supabase, values);

      if (error) {
        if (isEmailRateLimitError(error)) {
          rememberAuthEmailAttempt("password-reset", values.email, {
            rateLimited: true,
          });
        }

        toast.error(toErrorMessage(error));
        return;
      }

      rememberAuthEmailAttempt("password-reset", values.email);
      toast.success("Reset instructions are on the way.");
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
        {form.formState.errors.email?.message ? (
          <p className="text-xs text-rose-500">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <Button disabled={isSubmitting} type="submit" className="h-12 w-full rounded-full">
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-center text-sm text-foreground/70">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-rose-500 hover:text-rose-600">
          Back to login
        </Link>
      </p>
    </form>
  );
}
