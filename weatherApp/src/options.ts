import {
  option7DayForecast,
  optionAddCity,
  optionAllCities,
  optionDefaultWeather,
  optionRemoveCity,
  optionSetDefault,
  optionSettings,
} from "./handlers";
import type { AppState } from "./types";

export const EXIT_KEY = "9";

export interface MenuOption {
  key: string;
  label: string | ((state: AppState) => string);
  run?: (state: AppState) => Promise<void>;
}

export const MENU_OPTIONS: readonly MenuOption[] = [
  { key: "1", label: "Clima de ciudad default", run: optionDefaultWeather },
  { key: "2", label: (s) => `Clima de todas las ciudades (${s.cities.length})`, run: optionAllCities },
  { key: "3", label: "Buscar y agregar ciudad", run: optionAddCity },
  { key: "4", label: "Eliminar ciudad", run: optionRemoveCity },
  { key: "5", label: "Establecer ciudad default", run: optionSetDefault },
  { key: "6", label: "Pronóstico 7 días", run: option7DayForecast },
  { key: "8", label: (s) => `Ajustes (${s.unit})`, run: optionSettings },
  { key: "9", label: "Salir" },
];

export function isExit(option: string): boolean {
  return option === EXIT_KEY;
}

export function isValidOption(option: string): boolean {
  return MENU_OPTIONS.some((o) => o.key === option);
}

export function getHandler(option: string): ((state: AppState) => Promise<void>) | undefined {
  return MENU_OPTIONS.find((o) => o.key === option)?.run;
}