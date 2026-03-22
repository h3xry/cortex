import path from "node:path";
import os from "node:os";

const ALLOWED_ROOT = process.env.ALLOWED_ROOT ?? os.homedir();

export function getAllowedRoot(): string {
  return path.resolve(ALLOWED_ROOT);
}

export function isPathWithinRoot(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  const root = getAllowedRoot();
  return resolved === root || resolved.startsWith(root + path.sep);
}
