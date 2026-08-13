import { paint } from "./colors";
import { MENU_OPTIONS } from "./options";
import type { MenuOption } from "./options";
import type { AppState } from "./types";

const BAR = "═══════════════════════════════════════";
const WIDTH = BAR.length;

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