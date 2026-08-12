import { isExit, isValidOption, optionAddCity, optionAllCities, option7DayForecast, optionDefaultWeather, optionRemoveCity, optionSetDefault, optionSettings } from "./src/handlers";
import { printMenu, printSeparator, prompt } from "./src/menu";
import { loadState } from "./src/storage";
import type { AppState } from "./src/types";

async function dispatch(option: string, state: AppState): Promise<void> {
  switch (option) {
    case "1":
      await optionDefaultWeather(state);
      break;
    case "2":
      await optionAllCities(state);
      break;
    case "3":
      await optionAddCity(state);
      break;
    case "4":
      await optionRemoveCity(state);
      break;
    case "5":
      await optionSetDefault(state);
      break;
    case "6":
      await option7DayForecast(state);
      break;
    case "8":
      await optionSettings(state);
      break;
    case "9":
      return;
  }
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