export function isUniqueViolation(error: unknown): boolean {
  // Drizzle 0.45+ wraps pg errors in DrizzleQueryError; code is on .cause
  let e: any = error;
  for (let i = 0; i < 4 && e; i++) {
    if (e.code === "23505") return true;
    e = e.cause;
  }
  return false;
}
