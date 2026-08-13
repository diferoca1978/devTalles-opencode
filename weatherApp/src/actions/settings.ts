import { saveSettings } from "../storage";
import type { AppState, Unit } from "../types";
import { paint } from "../utils/colors";

export async function optionSettings(state: AppState): Promise<void> {
  const next: Unit = state.unit === "°C" ? "°F" : "°C";
  await saveSettings(state, { unit: next });
  console.log(paint(`  Unidad actual: ${next}`, "green"));
}