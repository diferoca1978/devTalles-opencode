# AGENTS.md

Repo-specific guidance for OpenCode sessions working in `weatherApp/`.

## Runtime & toolchain

- Runtime is **Bun** (not Node). See `bun-instructions.md` for Bun-vs-Node command mapping — do not duplicate that here.
- Git repo root is the **parent** `devtalles/` directory, not `weatherApp/`. Run git commands from there.
- Bun automatically loads `.env` — do not add `dotenv`.

## Commands

Scripts in `package.json`:

- Run the app: `bun run start` (or `bun run index.ts`)
- Dev/watch mode: `bun run dev`
- Build the standalone binary (project end goal): `bun run build` (compiles `index.ts` → `weather`)

Typecheck: `bunx tsc --noEmit` (tsconfig has `noEmit: true`, strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).

Tests: `bun test path/to/file.test.ts` (test framework is `bun:test`; none exist yet).

There is no lint or formatter configured.

## Architecture

This is a **console weather CLI** built against the free OpenMeteo APIs (no API key). Flow is always two HTTP calls:

1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m&temperature_unit=<celsius|fahrenheit>` (current temp) or `...&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=7&timezone=auto&temperature_unit=<...>` (7-day forecast)

Menu options (numbered output in the terminal — see README mock for the layout):

1. Clima de ciudad default
2. Clima de todas las ciudades (N)
3. Buscar y agregar ciudad
4. Eliminar ciudad
5. Establecer ciudad default
6. Pronóstico 7 días (picker over default + extra cities)
8. Ajustes (°C/°F)
9. Salir

Output is colored (ANSI, zero deps): cyan = menu, yellow = temps, green = success, red = errors. Colors auto-disable when stdout is not a TTY (`NO_COLOR` also respected).

## File layout

- `index.ts` — entrypoint; main loop + `dispatch()` that routes a menu option to a handler.
- `src/menu.ts` — menu rendering (`renderMenu`/`printMenu`), separator, and `prompt()` (uses `globalThis.prompt`).
- `src/handlers.ts` — one exported async handler per menu option plus shared helpers (`ensureDefault`, `pickCity`, `cityLabel`).
- `src/api.ts` — `geocode`, `getForecast`, `getDailyForecast`, `formatTemp`, `describeWeatherCode` (WMO→emoji+Spanish label).
- `src/storage.ts` — load/save `AppState` to `~/.weather-cli/state.json` (Bun.file / Bun.write).
- `src/types.ts` — shared types (`Unit`, `City`, `AppState`, OpenMeteo response shapes).
- `src/colors.ts` — ANSI color helpers (`paint(text, color)`); auto-disabled off-TTY.

State (`AppState`) lives in `~/.weather-cli/state.json`: `defaultCity`, `cities[]`, `unit`.