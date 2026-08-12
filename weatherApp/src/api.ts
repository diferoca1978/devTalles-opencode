import type {
  City,
  DailyForecastResponse,
  ForecastResponse,
  GeoResponse,
  GeoResult,
  Unit,
} from "./types";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_COUNT = 5;

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

export async function geocode(name: string): Promise<City[]> {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=${GEO_COUNT}&language=es&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as GeoResponse;
    return (data.results ?? []).map(toCity);
  } catch {
    return [];
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

export async function getDailyForecast(
  latitude: number,
  longitude: number,
  unit: Unit,
  days = 7,
): Promise<DailyForecastResponse | null> {
  const temperatureUnit = unit === "°F" ? "fahrenheit" : "celsius";
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&forecast_days=${days}&timezone=auto&temperature_unit=${temperatureUnit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as DailyForecastResponse;
  } catch {
    return null;
  }
}

export function formatTemp(value: number, unitLabel: string): string {
  return `${value.toFixed(1)}${unitLabel}`;
}

export interface WeatherDescription {
  emoji: string;
  label: string;
}

export function describeWeatherCode(code: number): WeatherDescription {
  switch (code) {
    case 0:
      return { emoji: "☀️", label: "Despejado" };
    case 1:
      return { emoji: "🌤️", label: "Mayormente despejado" };
    case 2:
      return { emoji: "⛅", label: "Parcialmente nublado" };
    case 3:
      return { emoji: "☁️", label: "Nublado" };
    case 45:
      return { emoji: "🌫️", label: "Niebla" };
    case 48:
      return { emoji: "🌫️", label: "Niebla con escarcha" };
    case 51:
    case 53:
    case 55:
      return { emoji: "🌦️", label: "Llovizna" };
    case 56:
    case 57:
      return { emoji: "🌧️", label: "Llovizna helada" };
    case 61:
    case 63:
    case 65:
      return { emoji: "🌧️", label: "Lluvia" };
    case 66:
    case 67:
      return { emoji: "🌧️", label: "Lluvia helada" };
    case 71:
    case 73:
    case 75:
      return { emoji: "❄️", label: "Nieve" };
    case 77:
      return { emoji: "❄️", label: "Células de nieve" };
    case 80:
    case 81:
    case 82:
      return { emoji: "🌦️", label: "Chubascos" };
    case 85:
    case 86:
      return { emoji: "🌨️", label: "Chubascos de nieve" };
    case 95:
      return { emoji: "⛈️", label: "Tormenta" };
    case 96:
    case 99:
      return { emoji: "⛈️", label: "Tormenta con granizo" };
    default:
      return { emoji: "❓", label: `Código ${code}` };
  }
}