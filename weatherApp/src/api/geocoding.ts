import type { City, GeoResponse, GeoResult } from "../types";
import { GEO_COUNT, GEO_URL } from "../utils/constants";

function toCity(r: GeoResult): City {
  return {
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country ?? r.country_code ?? "",
    admin1: r.admin1,
    timezone: r.timezone,
  };
}

export async function geocode(name: string): Promise<City[]> {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=${GEO_COUNT}&language=es&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as GeoResponse;
    return (data.results ?? []).map(toCity);
  } catch {
    return [];
  }
}