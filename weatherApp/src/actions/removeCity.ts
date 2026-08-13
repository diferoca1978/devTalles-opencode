import { printSeparator } from "../presentation/output";
import { prompt, readSelection } from "../presentation/input";
import { saveCities } from "../storage";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { cityLabel } from "./shared";

export async function optionRemoveCity(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log(paint("  No hay ciudades registradas.", "red"));
    return;
  }
  printSeparator();
  state.cities.forEach((c, i) => {
    console.log(`  ${i + 1}. ${cityLabel(c)}`);
  });
  const input = prompt("  Número de la ciudad a eliminar: ");
  const idx = readSelection(input);
  if (Number.isNaN(idx) || idx < 0 || idx >= state.cities.length) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  const removed = state.cities.splice(idx, 1)[0];
  if (!removed) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  await saveCities(state, state.cities);
  console.log(paint(`  Eliminada: ${cityLabel(removed)}`, "green"));
}