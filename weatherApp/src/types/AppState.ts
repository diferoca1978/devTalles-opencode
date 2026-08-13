import type { City } from "./City";

export type Unit = "°C" | "°F";

export interface AppState {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
}