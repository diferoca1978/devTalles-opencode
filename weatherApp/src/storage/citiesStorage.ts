import type { AppState, City } from "../types";
import { writeStateFile } from "./stateFile";

export function loadCities(raw: Partial<AppState>): City[] {
  return Array.isArray(raw.cities) ? raw.cities : [];
}

export async function saveCities(state: AppState, cities: City[]): Promise<void> {
  state.cities = cities;
  await writeStateFile(state);
}