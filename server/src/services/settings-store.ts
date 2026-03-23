import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const STORE_DIR = path.join(os.homedir(), ".cc-monitor");
const SETTINGS_FILE = path.join(STORE_DIR, "settings.json");

interface Settings {
  privatePasswordHash: string | null;
}

let settings: Settings = { privatePasswordHash: null };
let loaded = false;

async function ensureStoreDir(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
}

async function loadSettings(): Promise<void> {
  if (loaded) return;
  try {
    await ensureStoreDir();
    const data = await readFile(SETTINGS_FILE, "utf-8");
    settings = JSON.parse(data);
  } catch {
    settings = { privatePasswordHash: null };
  }
  loaded = true;
}

async function saveSettings(): Promise<void> {
  await ensureStoreDir();
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function getPasswordHash(): Promise<string | null> {
  await loadSettings();
  return settings.privatePasswordHash;
}

export async function setPasswordHash(hash: string): Promise<void> {
  await loadSettings();
  settings.privatePasswordHash = hash;
  await saveSettings();
}

export async function hasPassword(): Promise<boolean> {
  await loadSettings();
  return settings.privatePasswordHash !== null;
}
