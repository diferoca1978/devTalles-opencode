import { printSeparator } from "../presentation/output";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { searchAndSetDefault } from "./setDefaultCity";
import { showWeather } from "./shared";

async function ensureDefault(state: AppState): Promise<boolean> {
  if (state.defaultCity) return true;
  console.log(paint("  No hay ciudad default. Vamos a establecer una.", "red"));
  await searchAndSetDefault(state);
  return state.defaultCity !== null;
}

export async function optionDefaultWeather(state: AppState): Promise<void> {
  if (!(await ensureDefault(state))) {
    console.log(paint("  Operación cancelada.", "red"));
    return;
  }
  const city = state.defaultCity;
  if (!city) return;
  printSeparator();
  await showWeather(city, state);
}