import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AppState } from "./types";

const xdg = process.env.XDG_CONFIG_HOME;
const XDG_CONFIG = xdg && xdg.trim() !== "" ? xdg : join(homedir(), ".config");
const STATE_DIR = join(XDG_CONFIG, "weather-cli");
const STATE_FILE = join(STATE_DIR, "state.json");

const LEGACY_FILE = join(homedir(), ".weather-cli", "state.json");

const DEFAULT_STATE: AppState = {
  defaultCity: null,
  cities: [],
  unit: "°C",
};

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

export async function loadState(): Promise<AppState> {
  await migrateLegacy();
  try {
    const file = Bun.file(STATE_FILE);
    const text = file.size > 0 ? await file.text() : "";
    if (!text) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(text) as Partial<AppState>;
    return {
      defaultCity: parsed.defaultCity ?? null,
      cities: Array.isArray(parsed.cities) ? parsed.cities : [],
      unit: parsed.unit === "°F" ? "°F" : "°C",
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}