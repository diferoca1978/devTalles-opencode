import { describe, expect, test } from "bun:test";
import { captureLogs } from "../support/fixtures";
import { printSeparator } from "../../src/presentation/output";

describe("output", () => {
  test("prints the standard separator", () => {
    const output = captureLogs();
    try {
      printSeparator();
      expect(output.logs).toEqual(["\n─────────────────────────────────────\n"]);
    } finally {
      output.restore();
    }
  });
});
