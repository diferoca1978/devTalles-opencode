import { describe, expect, test } from "bun:test";
import { withLoading } from "../../src/utils/loading";

describe("withLoading", () => {
  test("returns the task result and invokes the task once", async () => {
    let calls = 0;
    const result = await withLoading("Loading", async () => {
      calls += 1;
      return "complete";
    });

    expect(result).toBe("complete");
    expect(calls).toBe(1);
  });

  test("propagates task failures", async () => {
    const failure = new Error("network unavailable");

    await expect(withLoading("Loading", async () => {
      throw failure;
    })).rejects.toBe(failure);
  });
});
