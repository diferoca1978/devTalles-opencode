import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AppState } from "../types";

export interface StatePaths {
  stateDir: string;
  stateFile: string;
  legacyFile: string;
}

export function getStatePaths(
  xdgConfigHome = process.env.XDG_CONFIG_HOME,
  home = homedir(),
): StatePaths {
  const xdgConfig =
    xdgConfigHome && xdgConfigHome.trim() !== ""
      ? xdgConfigHome
      : join(home, ".config");
  const stateDir = join(xdgConfig, "weather-cli");

  return {
    stateDir,
    stateFile: join(stateDir, "state.json"),
    legacyFile: join(home, ".weather-cli", "state.json"),
  };
}

const DEFAULT_PATHS = getStatePaths();

export const STATE_DIR = DEFAULT_PATHS.stateDir;
export const STATE_FILE = DEFAULT_PATHS.stateFile;

async function migrateLegacy(paths: StatePaths): Promise<void> {
  try {
    const legacy = Bun.file(paths.legacyFile);
    if (!(await legacy.exists())) return;
    const text = legacy.size > 0 ? await legacy.text() : "";
    if (!text) return;
    const target = Bun.file(paths.stateFile);
    if (await target.exists()) return;
    await mkdir(paths.stateDir, { recursive: true });
    await Bun.write(paths.stateFile, text);
  } catch {
    // best-effort migration
  }
}

export async function readStateFile(paths: StatePaths = DEFAULT_PATHS): Promise<string> {
  await migrateLegacy(paths);
  const file = Bun.file(paths.stateFile);
  return file.size > 0 ? await file.text() : "";
}

export async function writeStateFile(
  state: AppState,
  paths: StatePaths = DEFAULT_PATHS,
): Promise<void> {
  await mkdir(paths.stateDir, { recursive: true });
  await Bun.write(paths.stateFile, JSON.stringify(state, null, 2));
}
