"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useSupabase } from "@/hooks/use-supabase";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { loginWithPassword } from "@/services/auth-service";
import { toErrorMessage } from "@/services/service-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await loginWithPassword(supabase, values);

      if (error) {
        toast.error(toErrorMessage(error));
        return;
      }

      toast.success("Welcome back.");
      router.replace("/space");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Email" error={form.formState.errors.email?.message} htmlFor="email">
        <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
      </Field>

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

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-rose-500 hover:text-rose-600">
          Forgot password?
        </Link>
      </div>

      <Button disabled={isSubmitting} type="submit" className="h-12 w-full rounded-full">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : "Log in"}
      </Button>

      <p className="text-center text-sm text-foreground/70">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-rose-500 hover:text-rose-600">
          Create an account
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
