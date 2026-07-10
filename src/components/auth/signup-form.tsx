"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useSupabase } from "@/hooks/use-supabase";
import {
  formatCooldown,
  getAuthEmailCooldown,
  rememberAuthEmailAttempt,
} from "@/lib/auth-cooldown";
import { avatarOptions, themeOptions } from "@/lib/constants";
import { signupSchema, type SignupValues } from "@/lib/schemas";
import { signUpWithProfile } from "@/services/auth-service";
import { isEmailRateLimitError, toErrorMessage } from "@/services/service-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
      emojiIdentity: "Food Goblin 🍜",
      avatarKey: avatarOptions[0].key,
      themePreference: themeOptions[0].value,
    },
  });

  const selectedAvatar = form.watch("avatarKey");
  const selectedTheme = form.watch("themePreference");

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    const cooldown = getAuthEmailCooldown("signup", values.email);

    if (cooldown) {
      toast.error(`Please wait ${formatCooldown(cooldown)} before creating another account with this email.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUpWithProfile(supabase, values);

      if (error) {
        if (isEmailRateLimitError(error)) {
          rememberAuthEmailAttempt("signup", values.email, {
            rateLimited: true,
          });
        }

        toast.error(toErrorMessage(error));
        return;
      }

      if (data.session) {
        toast.success("Your universe is ready.");
        router.replace("/space");
        router.refresh();
        return;
      }

      rememberAuthEmailAttempt("signup", values.email);
      toast.success("Account created. Check your email to confirm your magic link.");
      router.replace("/login");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nickname"
          error={form.formState.errors.nickname?.message}
          htmlFor="nickname"
        >
          <Input id="nickname" placeholder="Sleepy Panda" {...form.register("nickname")} />
        </Field>
        <Field
          label="Emoji identity"
          error={form.formState.errors.emojiIdentity?.message}
          htmlFor="emojiIdentity"
        >
          <Input
            id="emojiIdentity"
            placeholder="Movie Monster 🍿"
            {...form.register("emojiIdentity")}
          />
        </Field>
      </div>

      <Field label="Email" error={form.formState.errors.email?.message} htmlFor="email">
        <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Password"
          error={form.formState.errors.password?.message}
          htmlFor="password"
        >
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
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
          htmlFor="confirmPassword"
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
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground/82">Choose an avatar</Label>
        <div className="grid grid-cols-3 gap-3">
          {avatarOptions.map((avatar) => (
            <button
              key={avatar.key}
              type="button"
              onClick={() => form.setValue("avatarKey", avatar.key, { shouldValidate: true })}
              className={`rounded-[1.4rem] border p-3 text-left transition ${
                selectedAvatar === avatar.key
                  ? "border-rose-300 bg-white/85 shadow-[0_18px_45px_rgba(255,182,182,0.2)]"
                  : "border-white/70 bg-white/60"
              }`}
            >
              <div
                className={`mb-3 flex h-14 items-center justify-center rounded-[1.1rem] bg-gradient-to-br ${avatar.aura}`}
              >
                <span className="text-2xl">{avatar.emoji}</span>
              </div>
              <p className="text-sm font-semibold">{avatar.title}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground/82">Pick your universe palette</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {themeOptions.map((theme) => (
            <motion.button
              whileHover={{ y: -2 }}
              key={theme.value}
              type="button"
              onClick={() =>
                form.setValue("themePreference", theme.value, { shouldValidate: true })
              }
              className={`rounded-[1.5rem] border p-3 text-left transition ${
                selectedTheme === theme.value
                  ? `border-white/90 ring-2 ${theme.ring}`
                  : "border-white/70"
              }`}
            >
              <div
                className={`mb-3 h-20 rounded-[1.2rem] bg-gradient-to-br ${theme.gradient}`}
              />
              <p className="font-semibold">{theme.name}</p>
              <p className="mt-1 text-sm text-foreground/68">{theme.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <Button disabled={isSubmitting} type="submit" className="h-12 w-full rounded-full">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : "Create my universe"}
      </Button>

      <p className="text-center text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rose-500 hover:text-rose-600">
          Log in
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
