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
- Build the standalone binary (project end goal): `bun run build` (compiles `src/index.ts` → `weather`)

Typecheck: `bunx tsc --noEmit` (tsconfig has `noEmit: true`, strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).

Tests: `bun test path/to/file.test.ts` (test framework is `bun:test`; none exist yet).

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

Output is colored (ANSI, zero deps): cyan = menu, yellow = temps, green = success, red = errors. Colors auto-disable when stdout is not a TTY (`NO_COLOR` also respected). Async network fetches show an animated braille spinner (`src/utils/loading.ts`) that auto-disables off-TTY.

## File layout

`src/` is organized by domain (per `references/file-system.md`):

- `src/index.ts` — entrypoint; main loop + `dispatch()` that resolves an option to its handler via `getHandler()` from `src/presentation/menu.ts`.
- `src/actions/` — one module per menu option plus `shared.ts`: `getWeather.ts` (`optionDefaultWeather` + local `ensureDefault`), `listCities.ts` (`optionAllCities`), `addCity.ts` (`optionAddCity`), `removeCity.ts` (`optionRemoveCity`), `setDefaultCity.ts` (`optionSetDefault` + `searchAndSetDefault`), `forecast.ts` (`option7DayForecast`), `settings.ts` (`optionSettings`), `shared.ts` (`cityLabel`, `showWeather`, `pickCity`, `searchCity`). Barrel `index.ts` re-exports handlers + helpers.
- `src/api/` — `geocoding.ts` (`geocode`, returns `City[]`, up to `GEO_COUNT=5` candidates, `[]` on error/not-found), `weather.ts` (`getForecast`, `getDailyForecast`).
- `src/presentation/` — `menu.ts` (the single `MENU_OPTIONS` registry `{ key, label, run }[]`; `label` is a string or `(state) => string`; also hosts `renderMenu`/`printMenu`, `isExit`, `isValidOption`, `getHandler`), `input.ts` (`prompt()` via `globalThis.prompt`, `readSelection`), `output.ts` (`printSeparator`). Separated from actions so handlers can import I/O without a circular import.
- `src/storage/` — `stateFile.ts` (`STATE_DIR`/`STATE_FILE`, `readStateFile`, `writeStateFile`; legacy `~/.weather-cli/state.json` auto-migrated on first read), `citiesStorage.ts` (`loadCities`, `saveCities`), `settingsStorage.ts` (`Settings`, `loadSettings`, `saveSettings`), `index.ts` (`loadState` composes the above, `saveState`, re-exports `saveCities`/`saveSettings`).
- `src/types/` — per-domain type files + barrel `index.ts`: `AppState.ts` (`AppState`, `Unit`), `City.ts` (`City`, `GeoResult`, `GeoResponse`), `Weather.ts` (OpenMeteo response shapes, `WeatherDescription`), `MenuOption.ts`.
- `src/utils/` — `constants.ts` (`GEO_URL`, `FORECAST_URL`, `GEO_COUNT=5`, `EXIT_KEY`), `colors.ts` (`paint(text, color)`; auto-disabled off-TTY), `loading.ts` (`withLoading` braille spinner; auto-disables off-TTY), `format.ts` (`formatTemp`, `formatDay`, `describeWeatherCode` WMO→emoji+Spanish label).

State (`AppState`) lives in `$XDG_CONFIG_HOME/weather-cli/state.json` (default `~/.config/weather-cli/state.json`): `defaultCity`, `cities[]`, `unit`. Actions persist mutations via `saveCities(state, state.cities)` or `saveSettings(state, { … })` from `src/storage`.

## Extending the CLI

To add a menu option:

1. Implement `export async function optionX(state: AppState)` in a new file under `src/actions/` (reuse helpers from `src/actions/shared.ts`) and export it from `src/actions/index.ts`.
2. Add one entry to `MENU_OPTIONS` in `src/presentation/menu.ts`: `{ key: "N", label: "…", run: optionX }` (`label` may be a string or `(state) => string` for dynamic labels like the cities count or unit).

`renderMenu`, `dispatch` (via `getHandler`), and `isValidOption` pick it up automatically — no edits to `src/index.ts` or `src/presentation/menu.ts` beyond the registry. Option `9` ("Salir") is special-cased: it has a label but no `run`, and the main loop calls `process.exit(0)` from `isExit()` before dispatch reaches it.

## Review checklist

- `check-ideas.md` — open review items for the CLI (colors, AGENTS.md accuracy, geocoding, tests, binary storage, scalability, loading state, 7-day forecast). Items get ticked off as they're implemented.

## Git workflow

Repo root is the **parent** `devtalles/` directory (see Runtime & toolchain). Follow this convention for commits/pushes:

- Allowed branches: `main`, `dev`, `feature/*`, `fix/*`, `hotfix/*`, `refactor/*`, `chore/*`.
- Feature work goes on a `feature/*` branch; do not commit directly to `main`.
- Remote `origin` is HTTPS (no SSH); push the branch and open a PR with `gh pr create --base dev` (feature branches target `dev`; `dev`/refactor branches target `main`).
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, etc.) — no tool/assistant references.
- Never force-push.