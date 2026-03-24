// Module-level token variable — lost on page refresh (by design)
let unlockToken: string | null = null;

export function getUnlockToken(): string | null {
  return unlockToken;
}

export function setUnlockToken(token: string): void {
  unlockToken = token;
}

export function clearUnlockToken(): void {
  unlockToken = null;
}

/** Headers to include in fetch() calls that need unlock token */
export function getAuthHeaders(): Record<string, string> {
  if (!unlockToken) return {};
  return { "X-Unlock-Token": unlockToken };
}
