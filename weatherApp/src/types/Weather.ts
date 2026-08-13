export interface ForecastCurrent {
  time: string;
  interval: number;
  temperature_2m: number;
}

export interface ForecastDaily {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
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

export interface DailyForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  elevation?: number;
  daily_units?: {
    time: string;
    weathercode: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
  };
  daily: ForecastDaily;
}

export interface WeatherDescription {
  emoji: string;
  label: string;
}