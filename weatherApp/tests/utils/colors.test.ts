import { describe, expect, test } from "bun:test";
import { paint } from "../../src/utils/colors";

describe("paint", () => {
  test("returns plain text when colors are disabled in the test process", () => {
    expect(paint("menu", "cyan")).toBe("menu");
    expect(paint("temperature", "yellow")).toBe("temperature");
    expect(paint("success", "green")).toBe("success");
    expect(paint("error", "red")).toBe("error");
    expect(paint("title", "bold")).toBe("title");
  });
});
