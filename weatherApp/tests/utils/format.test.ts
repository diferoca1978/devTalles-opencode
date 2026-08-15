import { describe, expect, test } from "bun:test";
import { describeWeatherCode, formatDay, formatTemp } from "../../src/utils/format";

describe("format utilities", () => {
  test("formats temperatures to one decimal place", () => {
    expect(formatTemp(21.234, "°C")).toBe("21.2°C");
    expect(formatTemp(-3, "°F")).toBe("-3.0°F");
  });

  test("formats ISO dates with Spanish weekday abbreviations", () => {
    expect(formatDay("2026-08-13")).toBe("Jue 13");
    expect(formatDay("2026-08-16")).toBe("Dom 16");
  });

  test.each([
    [0, "☀️", "Despejado"],
    [1, "🌤️", "Mayormente despejado"],
    [2, "⛅", "Parcialmente nublado"],
    [3, "☁️", "Nublado"],
    [45, "🌫️", "Niebla"],
    [48, "🌫️", "Niebla con escarcha"],
    [51, "🌦️", "Llovizna"],
    [53, "🌦️", "Llovizna"],
    [55, "🌦️", "Llovizna"],
    [56, "🌧️", "Llovizna helada"],
    [57, "🌧️", "Llovizna helada"],
    [61, "🌧️", "Lluvia"],
    [63, "🌧️", "Lluvia"],
    [65, "🌧️", "Lluvia"],
    [66, "🌧️", "Lluvia helada"],
    [67, "🌧️", "Lluvia helada"],
    [71, "❄️", "Nieve"],
    [73, "❄️", "Nieve"],
    [75, "❄️", "Nieve"],
    [77, "❄️", "Células de nieve"],
    [80, "🌦️", "Chubascos"],
    [81, "🌦️", "Chubascos"],
    [82, "🌦️", "Chubascos"],
    [85, "🌨️", "Chubascos de nieve"],
    [86, "🌨️", "Chubascos de nieve"],
    [95, "⛈️", "Tormenta"],
    [96, "⛈️", "Tormenta con granizo"],
    [99, "⛈️", "Tormenta con granizo"],
  ])("describes WMO code %i", (code, emoji, label) => {
    expect(describeWeatherCode(code)).toEqual({ emoji, label });
  });

  test("describes unknown weather codes without throwing", () => {
    expect(describeWeatherCode(123)).toEqual({ emoji: "❓", label: "Código 123" });
  });
});
