export type Unit = "°C" | "°F";

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}

export interface AppState {
  defaultCity: City | null;
  cities: City[];
  unit: Unit;
}

export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  timezone?: string;
  population?: number;
}

export interface GeoResponse {
  results?: GeoResult[];
  generationtime_ms?: number;
}

export interface ForecastCurrent {
  time: string;
  interval: number;
  temperature_2m: number;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  elevation?: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: ForecastCurrent;
}