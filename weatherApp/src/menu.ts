import type { AppState } from "./types";

const BAR = "═══════════════════════════════════════";
const WIDTH = BAR.length;

function pad(line: string): string {
  const len = [...line].length;
  const left = Math.floor((WIDTH - len) / 2);
  const right = WIDTH - len - left;
  return `${" ".repeat(Math.max(left, 0))}${line}${" ".repeat(Math.max(right, 0))}`;
}

export function renderMenu(state: AppState): string {
  const citiesCount = state.cities.length;
  const unitLabel = state.unit;
  const lines = [
    BAR,
    pad("WEATHER CLI"),
    BAR,
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${citiesCount})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    `  8. Ajustes (${unitLabel})`,
    "  9. Salir",
    BAR,
  ];
  return lines.join("\n");
}

export function printMenu(state: AppState): void {
  console.log(renderMenu(state));
}

export function printSeparator(): void {
  console.log("\n─────────────────────────────────────\n");
}

export function prompt(message: string): string | null {
  return globalThis.prompt(message);
}