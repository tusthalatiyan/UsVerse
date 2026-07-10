import type { PostgrestError } from "@supabase/supabase-js";

export function isEmailRateLimitError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";

  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("email rate limit") ||
    (normalizedMessage.includes("rate limit") &&
      (normalizedMessage.includes("email") || normalizedMessage.includes("mail")))
  );
}

export function isStaleAuthSessionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";
  const code =
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";
  const normalizedMessage = message.toLowerCase();

  return (
    code === "refresh_token_not_found" ||
    normalizedMessage.includes("invalid refresh token") ||
    normalizedMessage.includes("refresh token not found")
  );
}

export function toErrorMessage(error: PostgrestError | Error | null | unknown) {
  if (!error) {
    return "Something went sideways. Please try again.";
  }

  if (error instanceof Error) {
    if (isEmailRateLimitError(error)) {
      return "Supabase is limiting auth emails right now. Please wait a few minutes before trying again.";
    }

    if (error.message.toLowerCase().includes("failed to fetch")) {
      return "Could not reach Supabase. Check your internet connection and Supabase settings, then try again.";
    }

    return error.message || "Something went sideways. Please try again.";
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    if (isEmailRateLimitError(error)) {
      return "Supabase is limiting auth emails right now. Please wait a few minutes before trying again.";
    }

    return error.message;
  }

  return "Something went sideways. Please try again.";
}
