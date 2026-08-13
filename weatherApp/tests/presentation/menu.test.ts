import { describe, expect, test } from "bun:test";
import {
  MENU_OPTIONS,
  getHandler,
  isExit,
  isValidOption,
  printMenu,
  renderMenu,
} from "../../src/presentation/menu";
import { captureLogs, madrid, makeState } from "../support/fixtures";

describe("menu", () => {
  test("registers every menu key in display order", () => {
    expect(MENU_OPTIONS.map((option) => option.key)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "8",
      "9",
    ]);
    expect(getHandler("9")).toBeUndefined();
    expect(getHandler("1")).toBeFunction();
  });

  test("renders dynamic city and unit labels", () => {
    const menu = renderMenu(makeState({ cities: [madrid], unit: "°F" }));

    expect(menu).toContain("Clima de todas las ciudades (1)");
    expect(menu).toContain("Ajustes (°F)");
    expect(menu).toContain("6. Pronóstico 7 días");
  });

  test("prints rendered menu output", () => {
    const output = captureLogs();
    try {
      printMenu(makeState());
      expect(output.logs).toHaveLength(1);
      expect(output.logs[0]).toContain("WEATHER CLI");
    } finally {
      output.restore();
    }
  });

  test("validates registered options and the exit key", () => {
    expect(isValidOption("1")).toBe(true);
    expect(isValidOption("9")).toBe(true);
    expect(isValidOption("7")).toBe(false);
    expect(isValidOption("invalid")).toBe(false);
    expect(isExit("9")).toBe(true);
    expect(isExit("1")).toBe(false);
  });
});
