import { homedir } from "node:os";
import { join } from "node:path";
import type { AppState } from "./types";

const STATE_DIR = join(homedir(), ".weather-cli");
const STATE_FILE = join(STATE_DIR, "state.json");

const DEFAULT_STATE: AppState = {
  defaultCity: null,
  cities: [],
  unit: "°C",
};

export async function loadState(): Promise<AppState> {
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
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}