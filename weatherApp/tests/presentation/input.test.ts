import { describe, expect, test } from "bun:test";
import { prompt, readSelection } from "../../src/presentation/input";
import { installPrompt } from "../support/fixtures";

describe("input", () => {
  test("delegates prompt messages to the global prompt implementation", () => {
    const prompts = installPrompt(["Madrid"]);
    try {
      expect(prompt("City: ")).toBe("Madrid");
      expect(prompts.messages).toEqual(["City: "]);
    } finally {
      prompts.restore();
    }
  });

  test("converts one-based selections to zero-based indexes", () => {
    expect(readSelection("1")).toBe(0);
    expect(readSelection("3")).toBe(2);
    expect(readSelection("0")).toBe(-1);
  });

  test("returns NaN for empty or cancelled selections", () => {
    expect(readSelection(null)).toBeNaN();
    expect(readSelection("")).toBeNaN();
  });
});
