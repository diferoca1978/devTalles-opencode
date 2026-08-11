import type {
  City,
  ForecastResponse,
  GeoResponse,
  GeoResult,
  Unit,
} from "./types";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function toCity(r: GeoResult): City {
  return {
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country ?? r.country_code ?? "",
    admin1: r.admin1,
    timezone: r.timezone,
  };
}

export async function geocode(name: string): Promise<City | null> {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=es&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as GeoResponse;
    const result = data.results?.[0];
    return result ? toCity(result) : null;
  } catch {
    return null;
  }
}

export async function getForecast(
  latitude: number,
  longitude: number,
  unit: Unit,
): Promise<ForecastResponse | null> {
  const temperatureUnit = unit === "°F" ? "fahrenheit" : "celsius";
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m&temperature_unit=${temperatureUnit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as ForecastResponse;
  } catch {
    return null;
  }
}

export function formatTemp(value: number, unitLabel: string): string {
  return `${value.toFixed(1)}${unitLabel}`;
}