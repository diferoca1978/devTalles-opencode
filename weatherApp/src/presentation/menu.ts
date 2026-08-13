import {
  option7DayForecast,
  optionAddCity,
  optionAllCities,
  optionDefaultWeather,
  optionRemoveCity,
  optionSetDefault,
  optionSettings,
} from "../actions";
import type { AppState, MenuOption } from "../types";
import { EXIT_KEY } from "../utils/constants";
import { paint } from "../utils/colors";

const BAR = "═══════════════════════════════════════";
const WIDTH = BAR.length;

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

function pad(line: string): string {
  const len = [...line].length;
  const left = Math.floor((WIDTH - len) / 2);
  const right = WIDTH - len - left;
  return `${" ".repeat(Math.max(left, 0))}${line}${" ".repeat(Math.max(right, 0))}`;
}

function optionLine(option: MenuOption, state: AppState): string {
  const label = typeof option.label === "function" ? option.label(state) : option.label;
  return `  ${option.key}. ${label}`;
}

export function renderMenu(state: AppState): string {
  const lines = [
    paint(BAR, "cyan"),
    paint(pad("WEATHER CLI"), "cyan"),
    paint(BAR, "cyan"),
    ...MENU_OPTIONS.map((o) => paint(optionLine(o, state), "cyan")),
    paint(BAR, "cyan"),
  ];
  return lines.join("\n");
}

export function printMenu(state: AppState): void {
  console.log(renderMenu(state));
}