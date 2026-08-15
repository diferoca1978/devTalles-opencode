import { describe, expect, test } from "bun:test";
import { geocode } from "../../src/api/geocoding";
import { installFetch, jsonResponse } from "../support/fixtures";

describe("geocode", () => {
  test("encodes the search and maps API results", async () => {
    const fetcher = installFetch(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("name")).toBe("Córdoba & Co");
      expect(url.searchParams.get("count")).toBe("5");
      expect(url.searchParams.get("language")).toBe("es");
      expect(url.searchParams.get("format")).toBe("json");
      return jsonResponse({
        results: [
          {
            id: 1,
            name: "Córdoba",
            latitude: 10,
            longitude: 20,
            country_code: "AR",
            admin1: "Córdoba",
            timezone: "America/Argentina/Cordoba",
          },
        ],
      });
    });

    try {
      await expect(geocode("Córdoba & Co")).resolves.toEqual([
        {
          id: 1,
          name: "Córdoba",
          latitude: 10,
          longitude: 20,
          country: "AR",
          admin1: "Córdoba",
          timezone: "America/Argentina/Cordoba",
        },
      ]);
      expect(fetcher.calls).toHaveLength(1);
    } finally {
      fetcher.restore();
    }
  });

  test("prefers the full country name over the country code", async () => {
    const fetcher = installFetch(async () =>
      jsonResponse({
        results: [
          { id: 2, name: "Madrid", latitude: 1, longitude: 2, country: "España", country_code: "ES" },
        ],
      }),
    );

    try {
      await expect(geocode("Madrid")).resolves.toEqual([
        { id: 2, name: "Madrid", latitude: 1, longitude: 2, country: "España" },
      ]);
    } finally {
      fetcher.restore();
    }
  });

  test("returns an empty list for missing results and HTTP failures", async () => {
    const fetcher = installFetch(async (_input, _init) => jsonResponse({}, 200));
    try {
      await expect(geocode("Unknown")).resolves.toEqual([]);
    } finally {
      fetcher.restore();
    }

    const failedFetcher = installFetch(async () => jsonResponse({}, 503));
    try {
      await expect(geocode("Unknown")).resolves.toEqual([]);
    } finally {
      failedFetcher.restore();
    }
  });

  test("returns an empty list for network and JSON failures", async () => {
    const network = installFetch(async () => {
      throw new Error("offline");
    });
    try {
      await expect(geocode("Madrid")).resolves.toEqual([]);
    } finally {
      network.restore();
    }

    const invalidJson = installFetch(async () => new Response("not json"));
    try {
      await expect(geocode("Madrid")).resolves.toEqual([]);
    } finally {
      invalidJson.restore();
    }
  });
});
