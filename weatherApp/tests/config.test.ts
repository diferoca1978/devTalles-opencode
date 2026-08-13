import { describe, expect, test } from "bun:test";

const packageJson = JSON.parse(
  await Bun.file(new URL("../package.json", import.meta.url)).text(),
) as { scripts: Record<string, string> };

describe("test and build scripts", () => {
  test("runs the tests from the tests directory with Bun", () => {
    expect(packageJson.scripts.test).toMatch(/^bun test(?: --isolate tests)?$/);
  });

  test("runs tests before typechecking and compiling", () => {
    const build = packageJson.scripts.build ?? "";
    expect(build.startsWith("bun run test &&")).toBe(true);
    expect(build).toContain("bunx tsc --noEmit");
    expect(build).toContain("bun build --compile src/index.ts --outfile weather");
  });
});
