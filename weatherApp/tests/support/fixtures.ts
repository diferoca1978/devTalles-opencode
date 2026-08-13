import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  AppState,
  City,
  DailyForecastResponse,
  ForecastResponse,
} from "../../src/types";
import { getStatePaths, type StatePaths } from "../../src/storage/stateFile";

export const madrid: City = {
  id: 3117735,
  name: "Madrid",
  latitude: 40.4168,
  longitude: -3.7038,
  country: "España",
  admin1: "Madrid",
  timezone: "Europe/Madrid",
};

export const cordoba: City = {
  id: 3860259,
  name: "Córdoba",
  latitude: -31.4173,
  longitude: -64.1833,
  country: "Argentina",
  admin1: "Córdoba",
};

export const ottawa: City = {
  id: 6094817,
  name: "Ottawa",
  latitude: 45.4247,
  longitude: -75.695,
  country: "Canada",
  admin1: "Ontario",
};

export function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    defaultCity: null,
    cities: [],
    unit: "°C",
    ...overrides,
  };
}

export function makeForecast(
  temperature = 21.234,
): ForecastResponse {
  return {
    latitude: madrid.latitude,
    longitude: madrid.longitude,
    current_units: {
      time: "iso8601",
      interval: "seconds",
      temperature_2m: "°C",
    },
    current: {
      time: "2026-08-13T12:00",
      interval: 900,
      temperature_2m: temperature,
    },
  };
}

export function makeDailyForecast(
  overrides: Partial<DailyForecastResponse["daily"]> = {},
): DailyForecastResponse {
  return {
    latitude: madrid.latitude,
    longitude: madrid.longitude,
    daily: {
      time: ["2026-08-13", "2026-08-14", "2026-08-15"],
      weathercode: [0, 63, 999],
      temperature_2m_max: [30, 28, 25],
      temperature_2m_min: [18, 17, 16],
      ...overrides,
    },
  };
}

export function installPrompt(values: readonly (string | null)[]) {
  const previous = globalThis.prompt;
  const messages: string[] = [];
  let index = 0;

  globalThis.prompt = ((message?: string) => {
    messages.push(message ?? "");
    const value = values[index];
    index += 1;
    return value === undefined ? null : value;
  }) as typeof globalThis.prompt;

  return {
    messages,
    restore() {
      globalThis.prompt = previous;
    },
  };
}

export function captureLogs() {
  const previous = console.log;
  const logs: string[] = [];

  console.log = ((...messages: unknown[]) => {
    logs.push(messages.map(String).join(" "));
  }) as typeof console.log;

  return {
    logs,
    restore() {
      console.log = previous;
    },
  };
}

export function installFetch(
  implementation: (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => Promise<Response>,
) {
  const previous = globalThis.fetch;
  const calls: Array<{
    input: Parameters<typeof fetch>[0];
    init?: Parameters<typeof fetch>[1];
  }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return implementation(input, init);
  }) as typeof globalThis.fetch;

  return {
    calls,
    restore() {
      globalThis.fetch = previous;
    },
  };
}

export function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function createTemporaryStorage(): Promise<{
  root: string;
  paths: StatePaths;
  cleanup: () => Promise<void>;
}> {
  const root = await mkdtemp(join(tmpdir(), "weather-cli-tests-"));
  const paths = getStatePaths(join(root, "config"), join(root, "home"));

  return {
    root,
    paths,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
