# AGENTS.md

Repo-specific guidance for OpenCode sessions working in `weatherApp/`.

## Runtime & toolchain

- Runtime is **Bun** (not Node). See `bun-instructions.md` for Bun-vs-Node command mapping — do not duplicate that here.
- Git repo root is the **parent** `devtalles/` directory, not `weatherApp/`. Run git commands from there.
- Bun automatically loads `.env` — do not add `dotenv`.

## Commands

No scripts are defined in `package.json` yet. Use Bun directly:

- Run the app: `bun run index.ts`
- Typecheck: `bunx tsc --noEmit` (tsconfig has `noEmit: true`, strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- Run a test file: `bun test path/to/file.test.ts` (test framework is `bun:test`; no tests exist yet)
- Build the standalone binary (project end goal): `bun build --compile ./index.ts --outfile weather`

There is no lint or formatter configured.

## Architecture

This is a **console weather CLI** built against the free OpenMeteo APIs (no API key). Flow is always two HTTP calls:

1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`

Intended features (per `README.md`): default city, list of extra cities, add/remove city, settings (units), exit. Output is a numbered menu in the terminal — see the README mock for the exact layout to match.

## State

Only `index.ts` exists so far (`console.log("Hello via Bun!")`). The CLI is not yet implemented — treat that file as the entrypoint and build from there.