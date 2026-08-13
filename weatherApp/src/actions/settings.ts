import { saveSettings } from "../storage";
import type { AppState, Unit } from "../types";
import { paint } from "../utils/colors";

export async function optionSettings(
  state: AppState,
  persist = saveSettings,
): Promise<void> {
  const next: Unit = state.unit === "°C" ? "°F" : "°C";
  await persist(state, { unit: next });
  console.log(paint(`  Unidad actual: ${next}`, "green"));
}
