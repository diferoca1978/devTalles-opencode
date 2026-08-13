import type { AppState, City, Unit } from "../types";
import { writeStateFile } from "./stateFile";

export interface Settings {
  defaultCity: City | null;
  unit: Unit;
}

export function loadSettings(raw: Partial<AppState>): Settings {
  return {
    defaultCity: raw.defaultCity ?? null,
    unit: raw.unit === "°F" ? "°F" : "°C",
  };
}

export async function saveSettings(
  state: AppState,
  settings: Partial<Settings>,
): Promise<void> {
  if (settings.defaultCity !== undefined) state.defaultCity = settings.defaultCity;
  if (settings.unit !== undefined) state.unit = settings.unit;
  await writeStateFile(state);
}