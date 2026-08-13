import { printSeparator } from "../presentation/output";
import { prompt, readSelection } from "../presentation/input";
import { saveSettings } from "../storage";
import type { AppState, City } from "../types";
import { paint } from "../utils/colors";
import { cityLabel, searchCity } from "./shared";

export async function searchAndSetDefault(state: AppState): Promise<void> {
  const city = await searchCity();
  if (!city) return;
  await saveSettings(state, { defaultCity: city });
  console.log(paint(`  Ciudad default: ${cityLabel(city)}`, "green"));
}

export async function optionSetDefault(state: AppState): Promise<void> {
  const all: City[] = [];
  if (state.defaultCity) all.push(state.defaultCity);
  for (const c of state.cities) {
    if (state.defaultCity?.id !== c.id) all.push(c);
  }
  if (all.length === 0) {
    await searchAndSetDefault(state);
    return;
  }
  printSeparator();
  all.forEach((c, i) => {
    const marker = state.defaultCity?.id === c.id ? " (actual)" : "";
    console.log(`  ${i + 1}. ${cityLabel(c)}${marker}`);
  });
  console.log(`  ${all.length + 1}. Buscar una nueva ciudad`);
  const input = prompt("  Selecciona una opción: ");
  const idx = readSelection(input);
  if (Number.isNaN(idx) || idx < 0 || idx > all.length) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  if (idx === all.length) {
    await searchAndSetDefault(state);
    return;
  }
  const chosen = all[idx];
  if (!chosen) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  await saveSettings(state, { defaultCity: chosen });
  console.log(paint(`  Ciudad default: ${cityLabel(chosen)}`, "green"));
}