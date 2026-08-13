import { printMenu } from "./src/menu";
import { getHandler, isExit, isValidOption } from "./src/options";
import { printSeparator, prompt } from "./src/ui";
import { loadState } from "./src/storage";
import type { AppState } from "./src/types";

async function dispatch(option: string, state: AppState): Promise<void> {
  const run = getHandler(option);
  if (run) await run(state);
}

async function main(): Promise<void> {
  const state = await loadState();

  while (true) {
    printMenu(state);
    const raw = prompt("  Selecciona una opción: ");
    const option = raw === null ? "" : raw.trim();
    console.log();
    if (raw === null) {
      console.log("  ¡Hasta luego!");
      process.exit(0);
    }
    if (isExit(option)) {
      console.log("  ¡Hasta luego!");
      process.exit(0);
    }
    if (!isValidOption(option)) {
      console.log("  Opción inválida. Intenta de nuevo.");
      printSeparator();
      continue;
    }
    await dispatch(option, state);
    printSeparator();
  }
}

main();