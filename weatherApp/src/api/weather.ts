import type { DailyForecastResponse, ForecastResponse, Unit } from "../types";
import { FORECAST_URL } from "../utils/constants";

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