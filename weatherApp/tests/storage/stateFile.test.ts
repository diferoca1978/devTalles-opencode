import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  getStatePaths,
  readStateFile,
  writeStateFile,
} from "../../src/storage/stateFile";
import { createTemporaryStorage, makeState, madrid } from "../support/fixtures";

describe("state file storage", () => {
  test("returns an empty string when no state file exists", async () => {
    const temporary = await createTemporaryStorage();
    try {
      await expect(readStateFile(temporary.paths)).resolves.toBe("");
    } finally {
      await temporary.cleanup();
    }
  });

  test("creates the state directory and writes readable pretty JSON", async () => {
    const temporary = await createTemporaryStorage();
    const state = makeState({ defaultCity: madrid, cities: [madrid] });
    try {
      await writeStateFile(state, temporary.paths);

      expect(await Bun.file(temporary.paths.stateFile).exists()).toBe(true);
      expect(await Bun.file(temporary.paths.stateFile).text()).toBe(
        JSON.stringify(state, null, 2),
      );
      await expect(readStateFile(temporary.paths)).resolves.toBe(
        JSON.stringify(state, null, 2),
      );
    } finally {
      await temporary.cleanup();
    }
  });

  test("migrates a non-empty legacy state file when the new file is absent", async () => {
    const temporary = await createTemporaryStorage();
    const legacyText = JSON.stringify(makeState({ defaultCity: madrid }));
    try {
      await mkdir(join(temporary.root, "home", ".weather-cli"), { recursive: true });
      await Bun.write(temporary.paths.legacyFile, legacyText);

      await expect(readStateFile(temporary.paths)).resolves.toBe(legacyText);
      expect(await Bun.file(temporary.paths.stateFile).text()).toBe(legacyText);
    } finally {
      await temporary.cleanup();
    }
  });

  test("does not overwrite an existing new state file during migration", async () => {
    const temporary = await createTemporaryStorage();
    try {
      await mkdir(join(temporary.root, "home", ".weather-cli"), { recursive: true });
      await mkdir(temporary.paths.stateDir, { recursive: true });
      await Bun.write(temporary.paths.legacyFile, "legacy");
      await Bun.write(temporary.paths.stateFile, "current");

      await expect(readStateFile(temporary.paths)).resolves.toBe("current");
    } finally {
      await temporary.cleanup();
    }
  });

  test("ignores an empty legacy file", async () => {
    const temporary = await createTemporaryStorage();
    try {
      await mkdir(join(temporary.root, "home", ".weather-cli"), { recursive: true });
      await Bun.write(temporary.paths.legacyFile, "");

      await expect(readStateFile(temporary.paths)).resolves.toBe("");
      expect(await Bun.file(temporary.paths.stateFile).exists()).toBe(false);
    } finally {
      await temporary.cleanup();
    }
  });

  test("derives isolated XDG and legacy paths", () => {
    expect(getStatePaths("/tmp/config", "/tmp/home")).toEqual({
      stateDir: "/tmp/config/weather-cli",
      stateFile: "/tmp/config/weather-cli/state.json",
      legacyFile: "/tmp/home/.weather-cli/state.json",
    });
  });
});
