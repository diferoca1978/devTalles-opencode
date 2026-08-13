import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AppState } from "../types";

const xdg = process.env.XDG_CONFIG_HOME;
const XDG_CONFIG = xdg && xdg.trim() !== "" ? xdg : join(homedir(), ".config");

export const STATE_DIR = join(XDG_CONFIG, "weather-cli");
export const STATE_FILE = join(STATE_DIR, "state.json");

const LEGACY_FILE = join(homedir(), ".weather-cli", "state.json");

async function migrateLegacy(): Promise<void> {
  try {
    const legacy = Bun.file(LEGACY_FILE);
    if (!(await legacy.exists())) return;
    const text = legacy.size > 0 ? await legacy.text() : "";
    if (!text) return;
    const target = Bun.file(STATE_FILE);
    if (await target.exists()) return;
    await mkdir(STATE_DIR, { recursive: true });
    await Bun.write(STATE_FILE, text);
  } catch {
    // best-effort migration
  }
}

export async function readStateFile(): Promise<string> {
  await migrateLegacy();
  const file = Bun.file(STATE_FILE);
  return file.size > 0 ? await file.text() : "";
}

export async function writeStateFile(state: AppState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}