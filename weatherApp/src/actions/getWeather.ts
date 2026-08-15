import { printSeparator } from "../presentation/output";
import { saveSettings } from "../storage";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { searchAndSetDefault } from "./setDefaultCity";
import { showWeather } from "./shared";

async function ensureDefault(
  state: AppState,
  persist: typeof saveSettings,
): Promise<boolean> {
  if (state.defaultCity) return true;
  console.log(paint("  No hay ciudad default. Vamos a establecer una.", "red"));
  await searchAndSetDefault(state, persist);
  return state.defaultCity !== null;
}

export async function optionDefaultWeather(
  state: AppState,
  persist = saveSettings,
): Promise<void> {
  if (!(await ensureDefault(state, persist))) {
    console.log(paint("  Operación cancelada.", "red"));
    return;
  }
  const city = state.defaultCity;
  if (!city) return;
  printSeparator();
  await showWeather(city, state);
}
