import { describeWeatherCode, formatTemp, geocode, getDailyForecast, getForecast } from "./api";
import { paint } from "./colors";
import { withLoading } from "./loading";
import { printSeparator, prompt } from "./ui";
import { saveState } from "./storage";
import type { AppState, City, Unit } from "./types";

async function showWeather(city: City, state: AppState): Promise<void> {
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

function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

async function ensureDefault(state: AppState): Promise<boolean> {
  if (state.defaultCity) return true;
  console.log(paint("  No hay ciudad default. Vamos a establecer una.", "red"));
  await searchAndSetDefault(state);
  return state.defaultCity !== null;
}

export async function optionDefaultWeather(state: AppState): Promise<void> {
  if (!(await ensureDefault(state))) {
    console.log(paint("  Operación cancelada.", "red"));
    return;
  }
  const city = state.defaultCity;
  if (!city) return;
  printSeparator();
  await showWeather(city, state);
}

export async function optionAllCities(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log(paint("  No hay ciudades registradas.", "red"));
    return;
  }
  printSeparator();
  for (const city of state.cities) {
    await showWeather(city, state);
  }
}

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const weekday = WEEKDAYS[date.getDay()];
  const day =
    weekday === undefined
      ? isoDate.slice(8)
      : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1, 3)}`;
  return `${day} ${isoDate.slice(8)}`;
}

async function pickCity(state: AppState): Promise<City | null> {
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
  const idx = input ? Number.parseInt(input, 10) - 1 : NaN;
  if (Number.isNaN(idx) || idx < 0 || idx >= all.length) {
    console.log(paint("  Selección inválida.", "red"));
    return null;
  }
  return all[idx] ?? null;
}

export async function option7DayForecast(state: AppState): Promise<void> {
  const city = await pickCity(state);
  if (!city) return;
  const forecast = await withLoading("Obteniendo el pronóstico…", () =>
    getDailyForecast(city.latitude, city.longitude, state.unit),
  );
  if (!forecast) {
    console.log(paint(`  No se pudo obtener el pronóstico de ${cityLabel(city)}.`, "red"));
    return;
  }
  printSeparator();
  console.log(paint(`  Pronóstico 7 días: ${cityLabel(city)}`, "cyan"));
  const daily = forecast.daily;
  daily.time.forEach((iso, i) => {
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    const code = daily.weathercode[i];
    const desc = describeWeatherCode(code ?? 0);
    const maxTxt = max === undefined ? "?" : formatTemp(max, state.unit);
    const minTxt = min === undefined ? "?" : formatTemp(min, state.unit);
    console.log(
      `  ${formatDay(iso)}  ${desc.emoji} ${paint(desc.label, "yellow")}  ` +
        `${paint(maxTxt, "yellow")} / ${paint(minTxt, "yellow")}`,
    );
  });
}

async function searchCity(): Promise<City | null> {
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
  const idx = input ? Number.parseInt(input, 10) - 1 : NaN;
  if (Number.isNaN(idx) || idx < 0 || idx >= results.length) {
    console.log(paint("  Selección inválida.", "red"));
    return null;
  }
  return results[idx] ?? null;
}

export async function optionAddCity(state: AppState): Promise<void> {
  const city = await searchCity();
  if (!city) return;
  const exists =
    state.cities.some((c) => c.id === city.id) ||
    state.defaultCity?.id === city.id;
  if (exists) {
    console.log(paint(`  ${cityLabel(city)} ya está registrada.`, "red"));
    return;
  }
  state.cities.push(city);
  await saveState(state);
  console.log(paint(`  Agregada: ${cityLabel(city)}`, "green"));
}

export async function optionRemoveCity(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log(paint("  No hay ciudades registradas.", "red"));
    return;
  }
  printSeparator();
  state.cities.forEach((c, i) => {
    console.log(`  ${i + 1}. ${cityLabel(c)}`);
  });
  const input = prompt("  Número de la ciudad a eliminar: ");
  const idx = input ? Number.parseInt(input, 10) - 1 : NaN;
  if (Number.isNaN(idx) || idx < 0 || idx >= state.cities.length) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  const removed = state.cities.splice(idx, 1)[0];
  if (!removed) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  await saveState(state);
  console.log(paint(`  Eliminada: ${cityLabel(removed)}`, "green"));
}

export async function searchAndSetDefault(state: AppState): Promise<void> {
  const city = await searchCity();
  if (!city) return;
  state.defaultCity = city;
  await saveState(state);
  console.log(paint(`  Ciudad default: ${cityLabel(city)}`, "green"));
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
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  if (idx === all.length) {
    await searchAndSetDefault(state);
    return;
  }
  const chosen = all[idx];
  if (!chosen) {
    console.log(paint("  Selección inválida.", "red"));
    return;
  }
  state.defaultCity = chosen;
  await saveState(state);
  console.log(paint(`  Ciudad default: ${cityLabel(chosen)}`, "green"));
}

export async function optionSettings(state: AppState): Promise<void> {
  const next: Unit = state.unit === "°C" ? "°F" : "°C";
  state.unit = next;
  await saveState(state);
  console.log(paint(`  Unidad actual: ${next}`, "green"));
}