import { geocode } from "../api/geocoding";
import { getForecast } from "../api/weather";
import { printSeparator } from "../presentation/output";
import { prompt, readSelection } from "../presentation/input";
import type { AppState, City } from "../types";
import { paint } from "../utils/colors";
import { formatTemp } from "../utils/format";
import { withLoading } from "../utils/loading";

export function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export async function showWeather(city: City, state: AppState): Promise<void> {
  const forecast = await withLoading("Obteniendo el clima…", () =>
    getForecast(city.latitude, city.longitude, state.unit),
  );
  if (!forecast) {
    console.log(paint(`  No se pudo obtener el clima de ${cityLabel(city)}.`, "red"));
    return;
  }
  const temp = formatTemp(forecast.current.temperature_2m, state.unit);
  console.log(`  ${cityLabel(city)}: ${paint(temp, "yellow")}`);
}

export async function pickCity(state: AppState): Promise<City | null> {
  const all: City[] = [];
  if (state.defaultCity) all.push(state.defaultCity);
  for (const c of state.cities) {
    if (state.defaultCity?.id !== c.id) all.push(c);
  }
  if (all.length === 0) {
    console.log(paint("  No hay ciudades registradas.", "red"));
    return null;
  }
  printSeparator();
  all.forEach((c, i) => {
    const marker = state.defaultCity?.id === c.id ? " (default)" : "";
    console.log(`  ${i + 1}. ${cityLabel(c)}${marker}`);
  });
  const input = prompt("  Selecciona una ciudad: ");
  const idx = readSelection(input);
  if (Number.isNaN(idx) || idx < 0 || idx >= all.length) {
    console.log(paint("  Selección inválida.", "red"));
    return null;
  }
  return all[idx] ?? null;
}

export async function searchCity(): Promise<City | null> {
  const name = prompt("  Nombre de la ciudad a buscar: ");
  if (!name || name.trim() === "") {
    console.log(paint("  Operación cancelada.", "red"));
    return null;
  }
  const results = await withLoading("Buscando ciudad…", () => geocode(name.trim()));
  if (results.length === 0) {
    console.log(paint(`  No se encontró "${name.trim()}".`, "red"));
    return null;
  }
  if (results.length === 1) return results[0] ?? null;
  printSeparator();
  results.forEach((c, i) => {
    console.log(`  ${i + 1}. ${cityLabel(c)}`);
  });
  const input = prompt("  Selecciona una opción: ");
  const idx = readSelection(input);
  if (Number.isNaN(idx) || idx < 0 || idx >= results.length) {
    console.log(paint("  Selección inválida.", "red"));
    return null;
  }
  return results[idx] ?? null;
}