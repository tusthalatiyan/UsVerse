"use client";

type AuthEmailAction = "signup" | "password-reset";

const cooldownMsByAction: Record<AuthEmailAction, number> = {
  signup: 2 * 60 * 1000,
  "password-reset": 2 * 60 * 1000,
};

const rateLimitCooldownMs = 5 * 60 * 1000;

function keyFor(action: AuthEmailAction, email: string) {
  return `usverse-auth-cooldown:${action}:${email.trim().toLowerCase()}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAuthEmailCooldown(action: AuthEmailAction, email: string) {
  if (!canUseStorage()) {
    return 0;
  }

  const expiresAt = Number(window.localStorage.getItem(keyFor(action, email)) ?? 0);
  const remainingMs = expiresAt - Date.now();

  return remainingMs > 0 ? remainingMs : 0;
}

export function rememberAuthEmailAttempt(
  action: AuthEmailAction,
  email: string,
  options?: {
    rateLimited?: boolean;
  },
) {
  if (!canUseStorage()) {
    return;
  }

  const cooldownMs = options?.rateLimited
    ? rateLimitCooldownMs
    : cooldownMsByAction[action];

  window.localStorage.setItem(
    keyFor(action, email),
    String(Date.now() + cooldownMs),
  );
}

export function formatCooldown(remainingMs: number) {
  const seconds = Math.ceil(remainingMs / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} min`;
}
