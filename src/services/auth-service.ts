"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { appEnv } from "@/lib/env";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type ResetPasswordValues,
  type SignupValues,
} from "@/lib/schemas";
import type { Database } from "@/types/database";

function toAuthRequestError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error("Unable to complete the auth request. Please try again.");
}

export async function signUpWithProfile(
  supabase: SupabaseClient<Database>,
  values: SignupValues,
) {
  const parsed = signupSchema.parse(values);

  try {
    return await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        emailRedirectTo: `${appEnv.appUrl}/auth/callback`,
        data: {
          nickname: parsed.nickname,
          emojiIdentity: parsed.emojiIdentity,
          avatarKey: parsed.avatarKey,
          themePreference: parsed.themePreference,
        },
      },
    });
  } catch (error) {
    return {
      data: {
        user: null,
        session: null,
      },
      error: toAuthRequestError(error),
    };
  }
}

export async function loginWithPassword(
  supabase: SupabaseClient<Database>,
  values: LoginValues,
) {
  const parsed = loginSchema.parse(values);

  try {
    return await supabase.auth.signInWithPassword(parsed);
  } catch (error) {
    return {
      data: {
        user: null,
        session: null,
      },
      error: toAuthRequestError(error),
    };
  }
}

export async function requestPasswordReset(
  supabase: SupabaseClient<Database>,
  values: ForgotPasswordValues,
) {
  const parsed = forgotPasswordSchema.parse(values);

  try {
    return await supabase.auth.resetPasswordForEmail(parsed.email, {
      redirectTo: `${appEnv.appUrl}/auth/reset-password`,
    });
  } catch (error) {
    return {
      data: {},
      error: toAuthRequestError(error),
    };
  }
}

export async function updatePassword(
  supabase: SupabaseClient<Database>,
  values: ResetPasswordValues,
) {
  const parsed = resetPasswordSchema.parse(values);

  try {
    return await supabase.auth.updateUser({
      password: parsed.password,
    });
  } catch (error) {
    return {
      data: {
        user: null,
      },
      error: toAuthRequestError(error),
    };
  }
}

export async function logout(
  supabase: SupabaseClient<Database>,
) {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    return {
      error: toAuthRequestError(error),
    };
  }
}
