import type { AppState, City } from "../types";
import { writeStateFile, type StatePaths } from "./stateFile";

export function loadCities(raw: Partial<AppState>): City[] {
  return Array.isArray(raw.cities) ? raw.cities : [];
}

export async function saveCities(
  state: AppState,
  cities: City[],
  paths?: StatePaths,
): Promise<void> {
  state.cities = cities;
  await writeStateFile(state, paths);
}
