import { describe, expect, mock, test } from "bun:test";
import type { AppState, City, Unit } from "../../src/types";
import type { Settings } from "../../src/storage/settingsStorage";
import {
  captureLogs,
  cordoba,
  installFetch,
  installPrompt,
  jsonResponse,
  makeDailyForecast,
  makeForecast,
  makeState,
  madrid,
  ottawa,
} from "../support/fixtures";

const saveCities = mock(async (state: AppState, cities: City[]) => {
  state.cities = cities;
});

const saveSettings = mock(async (state: AppState, settings: Partial<Settings>) => {
  if (settings.defaultCity !== undefined) state.defaultCity = settings.defaultCity;
  if (settings.unit !== undefined) state.unit = settings.unit;
});

const {
  cityLabel,
  option7DayForecast,
  optionAddCity,
  optionAllCities,
  optionDefaultWeather,
  optionRemoveCity,
  optionSetDefault,
  optionSettings,
  pickCity,
  searchCity,
  showWeather,
} = await import("../../src/actions");

function cityResult(city: City) {
  return {
    id: city.id,
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    country: city.country,
    admin1: city.admin1,
    timezone: city.timezone,
  };
}

function resetPersistenceMocks() {
  saveCities.mockClear();
  saveSettings.mockClear();
}

describe("shared actions", () => {
  test("builds a readable city label and omits missing parts", () => {
    expect(cityLabel(madrid)).toBe("Madrid, Madrid, España");
    expect(cityLabel({ ...ottawa, admin1: undefined })).toBe("Ottawa, Canada");
  });

  test("shows current weather for a city", async () => {
    const fetcher = installFetch(async () => jsonResponse(makeForecast(21.234)));
    const output = captureLogs();
    try {
      await showWeather(madrid, makeState());
      expect(output.logs).toContain("  Madrid, Madrid, España: 21.2°C");
      expect(fetcher.calls).toHaveLength(1);
    } finally {
      fetcher.restore();
      output.restore();
    }
  });

  test("prints an error when current weather cannot be fetched", async () => {
    const fetcher = installFetch(async () => jsonResponse({}, 503));
    const output = captureLogs();
    try {
      await showWeather(madrid, makeState());
      expect(output.logs).toContain("  No se pudo obtener el clima de Madrid, Madrid, España.");
    } finally {
      fetcher.restore();
      output.restore();
    }
  });

  test("picks the default first and removes duplicate city entries", async () => {
    const prompts = installPrompt(["2"]);
    const output = captureLogs();
    try {
      const state = makeState({ defaultCity: madrid, cities: [madrid, cordoba, ottawa] });
      await expect(pickCity(state)).resolves.toEqual(cordoba);
      expect(output.logs.join("\n")).toContain("1. Madrid, Madrid, España (default)");
      expect(output.logs.join("\n")).toContain("2. Córdoba, Córdoba, Argentina");
      expect(prompts.messages).toEqual(["  Selecciona una ciudad: "]);
    } finally {
      prompts.restore();
      output.restore();
    }
  });

  test("rejects city picking when there are no cities or the selection is invalid", async () => {
    const output = captureLogs();
    try {
      await expect(pickCity(makeState())).resolves.toBeNull();
      expect(output.logs).toContain("  No hay ciudades registradas.");
    } finally {
      output.restore();
    }

    const prompts = installPrompt(["99"]);
    const invalidOutput = captureLogs();
    try {
      await expect(pickCity(makeState({ cities: [madrid] }))).resolves.toBeNull();
      expect(invalidOutput.logs).toContain("  Selección inválida.");
    } finally {
      prompts.restore();
      invalidOutput.restore();
    }
  });

  test("cancels a city search without calling geocoding", async () => {
    const prompts = installPrompt(["  "]);
    const fetcher = installFetch(async () => jsonResponse({ results: [] }));
    const output = captureLogs();
    try {
      await expect(searchCity()).resolves.toBeNull();
      expect(fetcher.calls).toHaveLength(0);
      expect(output.logs).toContain("  Operación cancelada.");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("returns a single geocoding result", async () => {
    const prompts = installPrompt([" Madrid "]);
    const fetcher = installFetch(async (input) => {
      expect(new URL(String(input)).searchParams.get("name")).toBe("Madrid");
      return jsonResponse({ results: [cityResult(madrid)] });
    });
    try {
      await expect(searchCity()).resolves.toEqual(madrid);
    } finally {
      prompts.restore();
      fetcher.restore();
    }
  });

  test("disambiguates multiple geocoding results", async () => {
    const prompts = installPrompt(["Córdoba", "2"]);
    const fetcher = installFetch(async () =>
      jsonResponse({ results: [cityResult(madrid), cityResult(cordoba)] }),
    );
    const output = captureLogs();
    try {
      await expect(searchCity()).resolves.toEqual(cordoba);
      expect(output.logs.join("\n")).toContain("1. Madrid, Madrid, España");
      expect(output.logs.join("\n")).toContain("2. Córdoba, Córdoba, Argentina");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("reports not-found and invalid search selections", async () => {
    const prompts = installPrompt(["Atlantis"]);
    const fetcher = installFetch(async () => jsonResponse({ results: [] }));
    const output = captureLogs();
    try {
      await expect(searchCity()).resolves.toBeNull();
      expect(output.logs).toContain('  No se encontró "Atlantis".');
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }

    const invalidPrompts = installPrompt(["Córdoba", "0"]);
    const invalidFetcher = installFetch(async () =>
      jsonResponse({ results: [cityResult(madrid), cityResult(cordoba)] }),
    );
    const invalidOutput = captureLogs();
    try {
      await expect(searchCity()).resolves.toBeNull();
      expect(invalidOutput.logs).toContain("  Selección inválida.");
    } finally {
      invalidPrompts.restore();
      invalidFetcher.restore();
      invalidOutput.restore();
    }
  });
});

describe("city actions", () => {
  test("adds a searched city and persists it", async () => {
    resetPersistenceMocks();
    const state = makeState();
    const prompts = installPrompt(["Madrid"]);
    const fetcher = installFetch(async () => jsonResponse({ results: [cityResult(madrid)] }));
    const output = captureLogs();
    try {
      await optionAddCity(state, saveCities);
      expect(state.cities).toEqual([madrid]);
      expect(saveCities).toHaveBeenCalledWith(state, state.cities);
      expect(output.logs).toContain("  Agregada: Madrid, Madrid, España");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("does not add a city that is already default or saved", async () => {
    resetPersistenceMocks();
    const state = makeState({ defaultCity: madrid, cities: [cordoba] });
    const prompts = installPrompt(["Madrid"]);
    const fetcher = installFetch(async () => jsonResponse({ results: [cityResult(madrid)] }));
    const output = captureLogs();
    try {
      await optionAddCity(state, saveCities);
      expect(state.cities).toEqual([cordoba]);
      expect(saveCities).not.toHaveBeenCalled();
      expect(output.logs).toContain("  Madrid, Madrid, España ya está registrada.");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("removes the selected saved city and persists the result", async () => {
    resetPersistenceMocks();
    const state = makeState({ cities: [madrid, cordoba] });
    const prompts = installPrompt(["2"]);
    const output = captureLogs();
    try {
      await optionRemoveCity(state, saveCities);
      expect(state.cities).toEqual([madrid]);
      expect(saveCities).toHaveBeenCalledWith(state, [madrid]);
      expect(output.logs).toContain("  Eliminada: Córdoba, Córdoba, Argentina");
    } finally {
      prompts.restore();
      output.restore();
    }
  });

  test("does not remove a city for an invalid selection", async () => {
    resetPersistenceMocks();
    const state = makeState({ cities: [madrid] });
    const prompts = installPrompt(["2"]);
    const output = captureLogs();
    try {
      await optionRemoveCity(state, saveCities);
      expect(state.cities).toEqual([madrid]);
      expect(saveCities).not.toHaveBeenCalled();
      expect(output.logs).toContain("  Selección inválida.");
    } finally {
      prompts.restore();
      output.restore();
    }
  });

  test("sets an existing city as default", async () => {
    resetPersistenceMocks();
    const state = makeState({ cities: [madrid, cordoba] });
    const prompts = installPrompt(["2"]);
    const output = captureLogs();
    try {
      await optionSetDefault(state, saveSettings);
      expect(state.defaultCity).toEqual(cordoba);
      expect(saveSettings).toHaveBeenCalledWith(state, { defaultCity: cordoba });
      expect(output.logs).toContain("  Ciudad default: Córdoba, Córdoba, Argentina");
    } finally {
      prompts.restore();
      output.restore();
    }
  });

  test("searches for a new default city when the sentinel option is selected", async () => {
    resetPersistenceMocks();
    const state = makeState({ cities: [madrid] });
    const prompts = installPrompt(["2", "Ottawa"]);
    const fetcher = installFetch(async () => jsonResponse({ results: [cityResult(ottawa)] }));
    const output = captureLogs();
    try {
      await optionSetDefault(state, saveSettings);
      expect(state.defaultCity).toEqual(ottawa);
      expect(saveSettings).toHaveBeenCalledWith(state, { defaultCity: ottawa });
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("toggles the temperature unit and persists it", async () => {
    resetPersistenceMocks();
    const state = makeState({ unit: "°C" });
    const output = captureLogs();
    try {
      await optionSettings(state, saveSettings);
      expect(state.unit).toBe("°F");
      expect(saveSettings).toHaveBeenCalledWith(state, { unit: "°F" });
      expect(output.logs).toContain("  Unidad actual: °F");
    } finally {
      output.restore();
    }
  });
});

describe("weather actions", () => {
  test("gets weather for the default city", async () => {
    const state = makeState({ defaultCity: madrid });
    const fetcher = installFetch(async () => jsonResponse(makeForecast(19.5)));
    const output = captureLogs();
    try {
      await optionDefaultWeather(state, saveSettings);
      expect(output.logs).toContain("  Madrid, Madrid, España: 19.5°C");
    } finally {
      fetcher.restore();
      output.restore();
    }
  });

  test("establishes a default city before showing its weather", async () => {
    resetPersistenceMocks();
    const state = makeState();
    const prompts = installPrompt(["Madrid"]);
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      if (url.searchParams.has("name")) {
        return jsonResponse({ results: [cityResult(madrid)] });
      }
      return jsonResponse(makeForecast(20));
    });
    const output = captureLogs();
    try {
      await optionDefaultWeather(state, saveSettings);
      expect(state.defaultCity).toEqual(madrid);
      expect(saveSettings).toHaveBeenCalledWith(state, { defaultCity: madrid });
      expect(output.logs).toContain("  Madrid, Madrid, España: 20.0°C");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("shows weather for every saved city in order", async () => {
    const state = makeState({ cities: [madrid, cordoba] });
    const fetcher = installFetch(async (input) => {
      const latitude = new URL(String(input)).searchParams.get("latitude");
      return jsonResponse(makeForecast(latitude === String(madrid.latitude) ? 20 : 24));
    });
    const output = captureLogs();
    try {
      await optionAllCities(state);
      expect(output.logs).toContain("  Madrid, Madrid, España: 20.0°C");
      expect(output.logs).toContain("  Córdoba, Córdoba, Argentina: 24.0°C");
    } finally {
      fetcher.restore();
      output.restore();
    }
  });

  test("reports when there are no saved cities", async () => {
    const output = captureLogs();
    try {
      await optionAllCities(makeState());
      expect(output.logs).toContain("  No hay ciudades registradas.");
    } finally {
      output.restore();
    }
  });

  test("renders the selected seven-day forecast, including missing values and unknown codes", async () => {
    const state = makeState({ defaultCity: madrid });
    const prompts = installPrompt(["1"]);
    const daily = makeDailyForecast({
      time: ["2026-08-13", "2026-08-14"],
      weathercode: [0],
      temperature_2m_max: [30],
      temperature_2m_min: [],
    });
    const fetcher = installFetch(async () => jsonResponse(daily));
    const output = captureLogs();
    try {
      await option7DayForecast(state);
      expect(output.logs).toContain("  Pronóstico 7 días: Madrid, Madrid, España");
      expect(output.logs).toContain("  Jue 13  ☀️ Despejado  30.0°C / ?");
      expect(output.logs).toContain("  Vie 14  ☀️ Despejado  ? / ?");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });

  test("reports daily forecast failures", async () => {
    const state = makeState({ defaultCity: madrid });
    const prompts = installPrompt(["1"]);
    const fetcher = installFetch(async () => jsonResponse({}, 500));
    const output = captureLogs();
    try {
      await option7DayForecast(state);
      expect(output.logs).toContain("  No se pudo obtener el pronóstico de Madrid, Madrid, España.");
    } finally {
      prompts.restore();
      fetcher.restore();
      output.restore();
    }
  });
});
