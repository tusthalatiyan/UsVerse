import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const fallbackAppUrl = "http://localhost:3000";

export const appEnv = {
  appUrl:
    parsed.success && parsed.data.NEXT_PUBLIC_APP_URL
      ? parsed.data.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : fallbackAppUrl,
  supabaseUrl:
    parsed.success && parsed.data.NEXT_PUBLIC_SUPABASE_URL
      ? parsed.data.NEXT_PUBLIC_SUPABASE_URL
      : "",
  supabaseAnonKey:
    parsed.success && parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "",
};

export const hasSupabaseConfig = Boolean(
  appEnv.supabaseUrl && appEnv.supabaseAnonKey,
);

export function assertSupabaseConfigured() {
  if (!hasSupabaseConfig) {
    throw new Error(
      "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}
