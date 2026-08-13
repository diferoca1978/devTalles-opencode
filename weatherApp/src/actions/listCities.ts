import { printSeparator } from "../presentation/output";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { showWeather } from "./shared";

export async function optionAllCities(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log(paint("  No hay ciudades registradas.", "red"));
    return;
  }
  printSeparator();
  for (const city of state.cities) {
    await showWeather(city, state);
  }
}