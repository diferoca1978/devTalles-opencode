# AGENTS.md

Repo-specific guidance for OpenCode sessions working in `weatherApp/`.

## Runtime & toolchain

- Runtime is **Bun** (not Node). See `bun-instructions.md` for Bun-vs-Node command mapping — do not duplicate that here.
- Git repo root is the **parent** `devtalles/` directory, not `weatherApp/`. Run git commands from there.
- Bun automatically loads `.env` — do not add `dotenv`.

## Commands

Scripts in `package.json`:

- Run the app: `bun run start` (or `bun run src/index.ts`)
- Dev/watch mode: `bun run dev`
- Tests: `bun run test` (or `bun test`; test framework is `bun:test`; 93 tests across 14 files under `tests/`)
- Test watch mode: `bun run test:watch`
- Build the standalone binary (project end goal): `bun run build` — runs `bun run test && bunx tsc --noEmit && bun build --compile src/index.ts --outfile weather`; compilation is blocked if any test or typecheck fails

Typecheck: `bunx tsc --noEmit` (tsconfig has `noEmit: true`, strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).

`bunfig.toml` preloads `tests/support/setup.ts` (sets `NO_COLOR=1`) before any test module loads, ensuring deterministic plain-text output assertions.

There is no lint or formatter configured.

## Architecture

This is a **console weather CLI** built against the free OpenMeteo APIs (no API key). Flow is always two HTTP calls:

1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=5&language=es&format=json` (returns up to 5 candidates; a numbered picker disambiguates ambiguous names such as "Córdoba")
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

Output is colored (ANSI, zero deps): cyan = menu, yellow = temps, green = success, red = errors. `src/utils/colors.ts` evaluates TTY/`NO_COLOR` status at call time (not import time), so colors auto-disable when stdout is not a TTY or `NO_COLOR` is set. Async network fetches show an animated braille spinner (`src/utils/loading.ts`) that auto-disables off-TTY.

## File layout

`src/` is organized by domain (per `references/file-system.md`):

- `src/index.ts` — entrypoint; exports `main(deps?)`, `dispatch(option, state, resolveHandler?)`, and `CliDependencies` interface for testability. Guarded by `import.meta.main` (not immediate execution). The main loop returns on exit/cancel instead of calling `process.exit`.
- `src/actions/` — one module per menu option plus `shared.ts`: `getWeather.ts` (`optionDefaultWeather` + local `ensureDefault`), `listCities.ts` (`optionAllCities`), `addCity.ts` (`optionAddCity`), `removeCity.ts` (`optionRemoveCity`), `setDefaultCity.ts` (`optionSetDefault` + `searchAndSetDefault`), `forecast.ts` (`option7DayForecast`), `settings.ts` (`optionSettings`), `shared.ts` (`cityLabel`, `showWeather`, `pickCity`, `searchCity`). Barrel `index.ts` re-exports handlers + helpers. Action handlers accept an optional `persist` callback (defaults to the real `saveCities`/`saveSettings`) for unit-test isolation.
- `src/api/` — `geocoding.ts` (`geocode`, returns `City[]`, up to `GEO_COUNT=5` candidates, `[]` on error/not-found), `weather.ts` (`getForecast`, `getDailyForecast`).
- `src/presentation/` — `menu.ts` (the single `MENU_OPTIONS` registry `{ key, label, run }[]`; `label` is a string or `(state) => string`; also hosts `renderMenu`/`printMenu`, `isExit`, `isValidOption`, `getHandler`), `input.ts` (`prompt()` via `globalThis.prompt`, `readSelection`), `output.ts` (`printSeparator`). Separated from actions so handlers can import I/O without a circular import.
- `src/storage/` — `stateFile.ts` (`StatePaths` interface, `getStatePaths()`, `STATE_DIR`/`STATE_FILE`, `readStateFile(paths?)`, `writeStateFile(state, paths?)`; legacy `~/.weather-cli/state.json` auto-migrated on first read), `citiesStorage.ts` (`loadCities`, `saveCities(state, cities, paths?)`), `settingsStorage.ts` (`Settings`, `loadSettings`, `saveSettings(state, settings, paths?)`), `index.ts` (`loadState(paths?)` composes the above, `saveState(state, paths?)`, re-exports `saveCities`/`saveSettings`).
- `src/types/` — per-domain type files + barrel `index.ts`: `AppState.ts` (`AppState`, `Unit`), `City.ts` (`City`, `GeoResult`, `GeoResponse`), `Weather.ts` (OpenMeteo response shapes, `WeatherDescription`), `MenuOption.ts`.
- `src/utils/` — `constants.ts` (`GEO_URL`, `FORECAST_URL`, `GEO_COUNT=5`, `EXIT_KEY`), `colors.ts` (`paint(text, color)`; call-time `isColorEnabled()` check), `loading.ts` (`withLoading` braille spinner; auto-disables off-TTY), `format.ts` (`formatTemp`, `formatDay`, `describeWeatherCode` WMO→emoji+Spanish label).

`tests/` mirrors the source structure for deterministic, hermetic Bun tests:

- `tests/support/fixtures.ts` — reusable cities, states, forecast payloads, `installPrompt`, `captureLogs`, `installFetch`, `createTemporaryStorage` (temp `StatePaths`).
- `tests/support/setup.ts` — sets `NO_COLOR=1` (preloaded via `bunfig.toml`).
- `tests/utils/`, `tests/presentation/`, `tests/api/`, `tests/storage/`, `tests/actions/`, `tests/cli.test.ts`, `tests/config.test.ts` — 93 tests across 14 files. APIs are tested with mocked `fetch`; storage uses temporary directories; actions use injected persistence callbacks; CLI uses `CliDependencies` injection.

State (`AppState`) lives in `$XDG_CONFIG_HOME/weather-cli/state.json` (default `~/.config/weather-cli/state.json`): `defaultCity`, `cities[]`, `unit`. Actions persist mutations via `saveCities(state, state.cities)` or `saveSettings(state, { … })` from `src/storage`. All storage functions accept an optional `StatePaths` parameter for test isolation; production calls use the default paths derived from `XDG_CONFIG_HOME`/`HOME`.

## Extending the CLI

To add a menu option:

1. Implement `export async function optionX(state: AppState, persist?)` in a new file under `src/actions/` (reuse helpers from `src/actions/shared.ts`) and export it from `src/actions/index.ts`. The optional `persist` callback defaults to the real `saveCities`/`saveSettings` and is only overridden in tests.
2. Add one entry to `MENU_OPTIONS` in `src/presentation/menu.ts`: `{ key: "N", label: "…", run: optionX }` (`label` may be a string or `(state) => string` for dynamic labels like the cities count or unit).

`renderMenu`, `dispatch` (via `getHandler`), and `isValidOption` pick it up automatically — no edits to `src/index.ts` or `src/presentation/menu.ts` beyond the registry. Option `9` ("Salir") is special-cased: it has a label but no `run`, and the main loop returns from `main()` via `isExit()` before dispatch reaches it.

## Review checklist

- `check-ideas.md` — open review items for the CLI (colors, AGENTS.md accuracy, geocoding, tests, binary storage, scalability, loading state, 7-day forecast). Items get ticked off as they're implemented. The tests item is complete.

## Git workflow

Repo root is the **parent** `devtalles/` directory (see Runtime & toolchain). Follow this convention for commits/pushes:

- Allowed branches: `main`, `dev`, `feature/*`, `fix/*`, `hotfix/*`, `refactor/*`, `chore/*`.
- Feature work goes on a `feature/*` branch; do not commit directly to `main`.
- Remote `origin` is HTTPS (no SSH); push the branch and open a PR with `gh pr create --base dev` (feature branches target `dev`; `dev`/refactor branches target `main`).
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, etc.) — no tool/assistant references.
- Never force-push.
