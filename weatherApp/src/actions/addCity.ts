import { saveCities } from "../storage";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { cityLabel, searchCity } from "./shared";

export async function optionAddCity(state: AppState): Promise<void> {
  const city = await searchCity();
  if (!city) return;
  const exists =
    state.cities.some((c) => c.id === city.id) ||
    state.defaultCity?.id === city.id;
  if (exists) {
    console.log(paint(`  ${cityLabel(city)} ya está registrada.`, "red"));
    return;
  }
  state.cities.push(city);
  await saveCities(state, state.cities);
  console.log(paint(`  Agregada: ${cityLabel(city)}`, "green"));
}