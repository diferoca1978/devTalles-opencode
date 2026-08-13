import type { AppState } from "../types";
import { loadCities } from "./citiesStorage";
import { loadSettings } from "./settingsStorage";
import { readStateFile, writeStateFile, type StatePaths } from "./stateFile";

const DEFAULT_STATE: AppState = {
  defaultCity: null,
  cities: [],
  unit: "°C",
};

export async function loadState(paths?: StatePaths): Promise<AppState> {
  try {
    const text = await readStateFile(paths);
    if (!text) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(text) as Partial<AppState>;
    return {
      ...loadSettings(parsed),
      cities: loadCities(parsed),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: AppState, paths?: StatePaths): Promise<void> {
  await writeStateFile(state, paths);
}

export { saveCities } from "./citiesStorage";
export { saveSettings } from "./settingsStorage";
