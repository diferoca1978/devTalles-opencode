import { getDailyForecast } from "../api/weather";
import { printSeparator } from "../presentation/output";
import type { AppState } from "../types";
import { paint } from "../utils/colors";
import { describeWeatherCode, formatDay, formatTemp } from "../utils/format";
import { withLoading } from "../utils/loading";
import { cityLabel, pickCity } from "./shared";

export async function option7DayForecast(state: AppState): Promise<void> {
  const city = await pickCity(state);
  if (!city) return;
  const forecast = await withLoading("Obteniendo el pronóstico…", () =>
    getDailyForecast(city.latitude, city.longitude, state.unit),
  );
  if (!forecast) {
    console.log(paint(`  No se pudo obtener el pronóstico de ${cityLabel(city)}.`, "red"));
    return;
  }
  printSeparator();
  console.log(paint(`  Pronóstico 7 días: ${cityLabel(city)}`, "cyan"));
  const daily = forecast.daily;
  daily.time.forEach((iso, i) => {
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    const code = daily.weathercode[i];
    const desc = describeWeatherCode(code ?? 0);
    const maxTxt = max === undefined ? "?" : formatTemp(max, state.unit);
    const minTxt = min === undefined ? "?" : formatTemp(min, state.unit);
    console.log(
      `  ${formatDay(iso)}  ${desc.emoji} ${paint(desc.label, "yellow")}  ` +
        `${paint(maxTxt, "yellow")} / ${paint(minTxt, "yellow")}`,
    );
  });
}