import { describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { loadCities, saveCities } from "../../src/storage/citiesStorage";
import { loadState, saveState } from "../../src/storage";
import {
  loadSettings,
  saveSettings,
} from "../../src/storage/settingsStorage";
import { createTemporaryStorage, cordoba, makeState, madrid } from "../support/fixtures";

describe("storage composition", () => {
  test("normalizes missing cities and settings to the defaults", () => {
    expect(loadCities({})).toEqual([]);
    expect(loadSettings({})).toEqual({ defaultCity: null, unit: "°C" });
    expect(loadSettings({ unit: "invalid" as never })).toEqual({
      defaultCity: null,
      unit: "°C",
    });
  });

  test("preserves valid cities, default city, and unit when loading settings", () => {
    expect(loadCities({ cities: [madrid] })).toEqual([madrid]);
    expect(loadSettings({ defaultCity: madrid, unit: "°F" })).toEqual({
      defaultCity: madrid,
      unit: "°F",
    });
  });

  test("loads the default state when the file is missing or malformed", async () => {
    const missing = await createTemporaryStorage();
    try {
      await expect(loadState(missing.paths)).resolves.toEqual(makeState());
    } finally {
      await missing.cleanup();
    }

    const malformed = await createTemporaryStorage();
    try {
      await mkdir(malformed.paths.stateDir, { recursive: true });
      await Bun.write(malformed.paths.stateFile, "not-json");
      await expect(loadState(malformed.paths)).resolves.toEqual(makeState());
    } finally {
      await malformed.cleanup();
    }
  });

  test("loads a valid state and normalizes an unsupported unit", async () => {
    const temporary = await createTemporaryStorage();
    try {
      await mkdir(temporary.paths.stateDir, { recursive: true });
      await Bun.write(
        temporary.paths.stateFile,
        JSON.stringify({ defaultCity: madrid, cities: [cordoba], unit: "kelvin" }),
      );

      await expect(loadState(temporary.paths)).resolves.toEqual({
        defaultCity: madrid,
        cities: [cordoba],
        unit: "°C",
      });
    } finally {
      await temporary.cleanup();
    }
  });

  test("persists a complete state and reloads it", async () => {
    const temporary = await createTemporaryStorage();
    const state = makeState({ defaultCity: madrid, cities: [cordoba], unit: "°F" });
    try {
      await saveState(state, temporary.paths);
      await expect(loadState(temporary.paths)).resolves.toEqual(state);
    } finally {
      await temporary.cleanup();
    }
  });

  test("saveCities mutates and persists the supplied city list", async () => {
    const temporary = await createTemporaryStorage();
    const state = makeState();
    try {
      await saveCities(state, [madrid, cordoba], temporary.paths);

      expect(state.cities).toEqual([madrid, cordoba]);
      await expect(loadState(temporary.paths)).resolves.toEqual({
        ...state,
        cities: [madrid, cordoba],
      });
    } finally {
      await temporary.cleanup();
    }
  });

  test("saveSettings updates only supplied settings and persists them", async () => {
    const temporary = await createTemporaryStorage();
    const state = makeState({ defaultCity: madrid, cities: [cordoba] });
    try {
      await saveSettings(state, { unit: "°F" }, temporary.paths);
      expect(state).toEqual({ defaultCity: madrid, cities: [cordoba], unit: "°F" });

      await saveSettings(state, { defaultCity: null }, temporary.paths);
      expect(state.defaultCity).toBeNull();
      await expect(loadState(temporary.paths)).resolves.toEqual(state);
    } finally {
      await temporary.cleanup();
    }
  });
});
