const STORAGE_KEY = "cortex-unlock-token";

function readToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getUnlockToken(): string | null {
  return readToken();
}

export function setUnlockToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore — fallback to no persistence
  }
}

export function clearUnlockToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Headers to include in fetch() calls that need unlock token */
export function getAuthHeaders(): Record<string, string> {
  const token = readToken();
  if (!token) return {};
  return { "X-Unlock-Token": token };
}
