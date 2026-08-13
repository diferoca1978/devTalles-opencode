import { printSeparator } from "./presentation/output";
import { printMenu, getHandler, isExit, isValidOption } from "./presentation/menu";
import { prompt } from "./presentation/input";
import { loadState } from "./storage";
import type { AppState } from "./types";

export interface CliDependencies {
  loadState: typeof loadState;
  printMenu: typeof printMenu;
  prompt: typeof prompt;
  isExit: typeof isExit;
  isValidOption: typeof isValidOption;
  getHandler: typeof getHandler;
  printSeparator: typeof printSeparator;
  log: (...messages: string[]) => void;
}

const defaultDependencies: CliDependencies = {
  loadState,
  printMenu,
  prompt,
  isExit,
  isValidOption,
  getHandler,
  printSeparator,
  log: (...messages) => console.log(...messages),
};

export async function dispatch(
  option: string,
  state: AppState,
  resolveHandler: typeof getHandler = getHandler,
): Promise<void> {
  const run = resolveHandler(option);
  if (run) await run(state);
}

export async function main(deps: CliDependencies = defaultDependencies): Promise<void> {
  const state = await deps.loadState();

  while (true) {
    deps.printMenu(state);
    const raw = deps.prompt("  Selecciona una opción: ");
    const option = raw === null ? "" : raw.trim();
    deps.log();
    if (raw === null) {
      deps.log("  ¡Hasta luego!");
      return;
    }
    if (deps.isExit(option)) {
      deps.log("  ¡Hasta luego!");
      return;
    }
    if (!deps.isValidOption(option)) {
      deps.log("  Opción inválida. Intenta de nuevo.");
      deps.printSeparator();
      continue;
    }
    await dispatch(option, state, deps.getHandler);
    deps.printSeparator();
  }
}

if (import.meta.main) {
  await main();
}
