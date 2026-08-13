import { describe, expect, test } from "bun:test";
import { getDailyForecast, getForecast } from "../../src/api/weather";
import { installFetch, jsonResponse, makeDailyForecast, makeForecast } from "../support/fixtures";

describe("weather API", () => {
  test("requests the current temperature in Celsius", async () => {
    const forecast = makeForecast();
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("latitude")).toBe("40.4168");
      expect(url.searchParams.get("longitude")).toBe("-3.7038");
      expect(url.searchParams.get("current")).toBe("temperature_2m");
      expect(url.searchParams.get("temperature_unit")).toBe("celsius");
      return jsonResponse(forecast);
    });

    try {
      await expect(getForecast(40.4168, -3.7038, "°C")).resolves.toEqual(forecast);
    } finally {
      fetcher.restore();
    }
  });

  test("requests the current temperature in Fahrenheit", async () => {
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
      return jsonResponse(makeForecast(70));
    });

    try {
      await expect(getForecast(1, 2, "°F")).resolves.toHaveProperty("current.temperature_2m", 70);
    } finally {
      fetcher.restore();
    }
  });

  test("requests daily data with seven days by default", async () => {
    const daily = makeDailyForecast();
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("daily")).toBe("temperature_2m_max,temperature_2m_min,weathercode");
      expect(url.searchParams.get("forecast_days")).toBe("7");
      expect(url.searchParams.get("timezone")).toBe("auto");
      expect(url.searchParams.get("temperature_unit")).toBe("celsius");
      return jsonResponse(daily);
    });

    try {
      await expect(getDailyForecast(1, 2, "°C")).resolves.toEqual(daily);
    } finally {
      fetcher.restore();
    }
  });

  test("supports a custom daily forecast length and Fahrenheit", async () => {
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("forecast_days")).toBe("3");
      expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
      return jsonResponse(makeDailyForecast());
    });

    try {
      await expect(getDailyForecast(1, 2, "°F", 3)).resolves.toBeDefined();
    } finally {
      fetcher.restore();
    }
  });

  test("returns null for HTTP, network, and JSON failures", async () => {
    const http = installFetch(async () => jsonResponse({}, 500));
    try {
      await expect(getForecast(1, 2, "°C")).resolves.toBeNull();
    } finally {
      http.restore();
    }

    const network = installFetch(async () => {
      throw new Error("offline");
    });
    try {
      await expect(getDailyForecast(1, 2, "°C")).resolves.toBeNull();
    } finally {
      network.restore();
    }

    const invalidJson = installFetch(async () => new Response("not json"));
    try {
      await expect(getForecast(1, 2, "°C")).resolves.toBeNull();
    } finally {
      invalidJson.restore();
    }
  });
});
