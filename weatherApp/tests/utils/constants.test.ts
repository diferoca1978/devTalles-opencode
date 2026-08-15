import { describe, expect, test } from "bun:test";
import { EXIT_KEY, FORECAST_URL, GEO_COUNT, GEO_URL } from "../../src/utils/constants";

describe("constants", () => {
  test("defines the Open-Meteo endpoints and query defaults", () => {
    expect(GEO_URL).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(FORECAST_URL).toBe("https://api.open-meteo.com/v1/forecast");
    expect(GEO_COUNT).toBe(5);
    expect(EXIT_KEY).toBe("9");
  });
});
