export function makeOptimisticId(prefix: string) {
  return `optimistic-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
