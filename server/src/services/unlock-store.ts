import { randomUUID } from "node:crypto";

const tokens = new Set<string>();

export function addToken(): string {
  const token = randomUUID();
  tokens.add(token);
  return token;
}

export function isValidToken(token: string): boolean {
  return tokens.has(token);
}

export function removeToken(token: string): void {
  tokens.delete(token);
}

/** Check if request has a valid unlock token in X-Unlock-Token header */
export function isUnlockedHeader(
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const token = headers["x-unlock-token"];
  if (typeof token !== "string") return false;
  return isValidToken(token);
}
