import { formatTemp, geocode, getForecast } from "./api";
import { printSeparator, prompt } from "./menu";
import { saveState } from "./storage";
import type { AppState, City, Unit } from "./types";

async function showWeather(city: City, state: AppState): Promise<void> {
  const forecast = await getForecast(city.latitude, city.longitude, state.unit);
  if (!forecast) {
    console.log(`  No se pudo obtener el clima de ${cityLabel(city)}.`);
    return;
  }
  const temp = formatTemp(forecast.current.temperature_2m, state.unit);
  console.log(`  ${cityLabel(city)}: ${temp}`);
}

function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

async function ensureDefault(state: AppState): Promise<boolean> {
  if (state.defaultCity) return true;
  console.log("  No hay ciudad default. Vamos a establecer una.");
  await searchAndSetDefault(state);
  return state.defaultCity !== null;
}

export async function optionDefaultWeather(state: AppState): Promise<void> {
  if (!(await ensureDefault(state))) {
    console.log("  Operación cancelada.");
    return;
  }
  const city = state.defaultCity;
  if (!city) return;
  printSeparator();
  await showWeather(city, state);
}

export async function optionAllCities(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log("  No hay ciudades registradas.");
    return;
  }
  printSeparator();
  for (const city of state.cities) {
    await showWeather(city, state);
  }
}

export async function optionAddCity(state: AppState): Promise<void> {
  const name = prompt("  Nombre de la ciudad a buscar: ");
  if (!name || name.trim() === "") {
    console.log("  Operación cancelada.");
    return;
  }
  const city = await geocode(name.trim());
  if (!city) {
    console.log(`  No se encontró "${name.trim()}".`);
    return;
  }
  const exists =
    state.cities.some((c) => c.id === city.id) ||
    state.defaultCity?.id === city.id;
  if (exists) {
    console.log(`  ${cityLabel(city)} ya está registrada.`);
    return;
  }
  state.cities.push(city);
  await saveState(state);
  console.log(`  Agregada: ${cityLabel(city)}`);
}

export async function optionRemoveCity(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log("  No hay ciudades registradas.");
    return;
  }
  printSeparator();
  state.cities.forEach((c, i) => {
    console.log(`  ${i + 1}. ${cityLabel(c)}`);
  });
  const input = prompt("  Número de la ciudad a eliminar: ");
  const idx = input ? Number.parseInt(input, 10) - 1 : NaN;
  if (Number.isNaN(idx) || idx < 0 || idx >= state.cities.length) {
    console.log("  Selección inválida.");
    return;
  }
  const removed = state.cities.splice(idx, 1)[0];
  if (!removed) {
    console.log("  Selección inválida.");
    return;
  }
  await saveState(state);
  console.log(`  Eliminada: ${cityLabel(removed)}`);
}

export async function searchAndSetDefault(state: AppState): Promise<void> {
  const name = prompt("  Nombre de la ciudad: ");
  if (!name || name.trim() === "") {
    console.log("  Operación cancelada.");
    return;
  }
  const city = await geocode(name.trim());
  if (!city) {
    console.log(`  No se encontró "${name.trim()}".`);
    return;
  }
  state.defaultCity = city;
  await saveState(state);
  console.log(`  Ciudad default: ${cityLabel(city)}`);
}

export async function optionSetDefault(state: AppState): Promise<void> {
  const all: City[] = [];
  if (state.defaultCity) all.push(state.defaultCity);
  for (const c of state.cities) {
    if (state.defaultCity?.id !== c.id) all.push(c);
  }
  if (all.length === 0) {
    await searchAndSetDefault(state);
    return;
  }
  printSeparator();
  all.forEach((c, i) => {
    const marker = state.defaultCity?.id === c.id ? " (actual)" : "";
    console.log(`  ${i + 1}. ${cityLabel(c)}${marker}`);
  });
  console.log(`  ${all.length + 1}. Buscar una nueva ciudad`);
  const input = prompt("  Selecciona una opción: ");
  const idx = input ? Number.parseInt(input, 10) - 1 : NaN;
  if (Number.isNaN(idx) || idx < 0 || idx > all.length) {
    console.log("  Selección inválida.");
    return;
  }
  if (idx === all.length) {
    await searchAndSetDefault(state);
    return;
  }
  const chosen = all[idx];
  if (!chosen) {
    console.log("  Selección inválida.");
    return;
  }
  state.defaultCity = chosen;
  await saveState(state);
  console.log(`  Ciudad default: ${cityLabel(chosen)}`);
}

export async function optionSettings(state: AppState): Promise<void> {
  const next: Unit = state.unit === "°C" ? "°F" : "°C";
  state.unit = next;
  await saveState(state);
  console.log(`  Unidad actual: ${next}`);
}

export function isExit(option: string): boolean {
  return option === "9";
}

export function isValidOption(option: string): boolean {
  return ["1", "2", "3", "4", "5", "8", "9"].includes(option);
}