import type { AppState } from "../types";
import { loadCities } from "./citiesStorage";
import { loadSettings } from "./settingsStorage";
import { readStateFile, writeStateFile } from "./stateFile";

const DEFAULT_STATE: AppState = {
  defaultCity: null,
  cities: [],
  unit: "°C",
};

export async function loadState(): Promise<AppState> {
  try {
    const text = await readStateFile();
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

export async function saveState(state: AppState): Promise<void> {
  await writeStateFile(state);
}

export { saveCities } from "./citiesStorage";
export { saveSettings } from "./settingsStorage";