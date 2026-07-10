import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { appEnv, hasSupabaseConfig } from "@/lib/env";
import { isStaleAuthSessionError } from "@/services/service-utils";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!hasSupabaseConfig) {
    return response;
  }

  const supabase = createServerClient<Database>(
    appEnv.supabaseUrl,
    appEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.getUser();

  if (isStaleAuthSessionError(error)) {
    request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith("sb-"))
      .forEach((cookie) => {
        response.cookies.delete(cookie.name);
      });
  }

  return response;
}
