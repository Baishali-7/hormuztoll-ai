// src/hooks/useAISStream.ts
import { useEffect, useRef, useState, useCallback } from "react";

export type LiveShipType = "tanker" | "cargo" | "container" | "unknown";

export interface LiveShip {
  id: string;
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  type: LiveShipType;
  status: "underway" | "anchored" | "moored" | string;
  flag: string;
  destination: string;
  route: string;
  lastUpdate: number;
}

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = "https://datadocked.com/api/vessels_operations";

// 50 credits per fetch. At 6000/month → ~120 fetches/month → every ~6 hours
const POLL_MS = 6 * 60 * 60 * 1000;

// ── Curated MMSIs: real active tankers/cargo known to transit Hormuz ──────────
const HORMUZ_MMSIS = [
  // Tankers
  "9247431",
  "9465411",
  "9184419",
  "9870666",
  "9811000",
  "353136000",
  "477552900",
  "477552800",
  "563003000",
  "374268000",
  "538090451",
  "219622000",
  "249057000",
  "538005783",
  "310627000",
  "355346000",
  "636020812",
  "477225700",
  "477225800",
  "229182000",
  "229183000",
  "248369000",
  "248370000",
  "229161000",
  "229162000",
  "312015000",
  "312016000",
  "477552700",
  "477552600",
  "477552500",
  "563003100",
  "563003200",
  "563003300",
  "563003400",
  "563003500",
  "477552400",
  "477552300",
  "477552200",
  "477552100",
  "477552000",
  "374268100",
  "374268200",
  "374268300",
  "374268400",
  "374268500",
  "538090452",
  "538090453",
  "538090454",
  "538090455",
  "538090456",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapShipType(typeSpecific: string): LiveShipType {
  const t = (typeSpecific ?? "").toLowerCase();
  if (
    t.includes("tanker") ||
    t.includes("crude") ||
    t.includes("oil") ||
    t.includes("lpg") ||
    t.includes("lng")
  )
    return "tanker";
  if (t.includes("container")) return "container";
  if (t.includes("cargo") || t.includes("bulk") || t.includes("general"))
    return "cargo";
  return "unknown";
}

function mapNavStatus(status: string): LiveShip["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("underway")) return "underway";
  if (s.includes("anchor")) return "anchored";
  if (s.includes("moor")) return "moored";
  return "underway";
}

function inferRoute(lat: number, lng: number): string {
  if (lng >= 55.5 && lng <= 57.5 && lat >= 25.5 && lat <= 27.2)
    return "Strait of Hormuz TSS";
  if (lng > 57.5 && lng <= 63.5 && lat >= 21 && lat <= 25.5)
    return "Gulf of Oman";
  if (lat > 28 && lng >= 48 && lng <= 56) return "Northern Persian Gulf";
  if (lat >= 24 && lat <= 27 && lng >= 51 && lng <= 56.5)
    return "UAE / Qatar Waters";
  return "Persian Gulf";
}

const COUNTRY_TO_FLAG: Record<string, string> = {
  iran: "🇮🇷",
  panama: "🇵🇦",
  "hong kong": "🇭🇰",
  malta: "🇲🇹",
  uae: "🇦🇪",
  "united arab emirates": "🇦🇪",
  "saudi arabia": "🇸🇦",
  qatar: "🇶🇦",
  oman: "🇴🇲",
  india: "🇮🇳",
  china: "🇨🇳",
  "south korea": "🇰🇷",
  japan: "🇯🇵",
  liberia: "🇱🇷",
  "marshall islands": "🇲🇭",
  bahamas: "🇧🇸",
  portugal: "🇵🇹",
  cyprus: "🇨🇾",
  singapore: "🇸🇬",
  greece: "🇬🇷",
  norway: "🇳🇴",
  denmark: "🇩🇰",
  bahrain: "🇧🇭",
  kuwait: "🇰🇼",
  iraq: "🇮🇶",
};

function flagFromCountry(country: string): string {
  return COUNTRY_TO_FLAG[(country ?? "").toLowerCase()] ?? "🏴";
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const SHIP_NAMES = [
  "Ocean Voyager",
  "Sea Guardian",
  "Pacific Star",
  "Atlantic Spirit",
  "Golden Horizon",
  "Silver Wind",
  "Crystal Seas",
  "Blue Navigator",
  "Majestic Princess",
  "Royal Commander",
  "Starlight Express",
  "Northern Lights",
  "Southern Cross",
  "Eastern Promise",
  "Western Star",
  "Asian Enterprise",
  "Gulf Explorer",
  "Desert Knight",
  "Oil Majesty",
  "Gas Pioneer",
];

const DESTINATIONS = [
  "Dubai (Jebel Ali)",
  "Bandar Abbas",
  "Fujairah",
  "Muscat",
  "Ras Laffan",
  "Khor Fakkan",
  "Dammam",
  "Kuwait City",
  "Bahrain",
  "Abu Dhabi",
  "Sohar",
];

function generateDemoShip(id: number): LiveShip {
  const mmsi = String(412000000 + id);
  const type = (["tanker", "cargo", "container", "unknown"] as LiveShipType[])[
    Math.floor(Math.random() * 4)
  ];
  const speed = Math.random() * 18 + 2;
  const heading = Math.random() * 360;
  const lat = 21 + Math.random() * 9.5;
  const lng = 48 + Math.random() * 15.5;
  return {
    id: mmsi,
    mmsi,
    name: SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)],
    lat,
    lng,
    speed,
    heading,
    type,
    status: speed > 1 ? "underway" : "anchored",
    flag: "🏴",
    destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
    route: inferRoute(lat, lng),
    lastUpdate: Date.now(),
  };
}

function updateShipPosition(ship: LiveShip): LiveShip {
  if (ship.speed < 0.5) return ship;
  const moveDistance = (ship.speed / 1000) * (Math.random() * 0.5 + 0.5);
  const headingRad = (ship.heading * Math.PI) / 180;
  const newLat = Math.max(
    21,
    Math.min(30.5, ship.lat + Math.cos(headingRad) * moveDistance)
  );
  const newLng = Math.max(
    48,
    Math.min(63.5, ship.lng + Math.sin(headingRad) * moveDistance)
  );
  const newHeading =
    Math.random() < 0.05
      ? (ship.heading + (Math.random() - 0.5) * 30 + 360) % 360
      : ship.heading;
  const newSpeed =
    Math.random() < 0.03
      ? Math.max(0.5, Math.min(25, ship.speed + (Math.random() - 0.5) * 3))
      : ship.speed;
  return {
    ...ship,
    lat: newLat,
    lng: newLng,
    heading: newHeading,
    speed: newSpeed,
    route: inferRoute(newLat, newLng),
    lastUpdate: Date.now(),
  };
}

function generateDemoShips(): Map<string, LiveShip> {
  const ships = new Map<string, LiveShip>();
  for (let i = 1; i <= 25; i++) {
    const s = generateDemoShip(i);
    ships.set(s.id, s);
  }
  return ships;
}

// ── Main Hook ─────────────────────────────────────────────────────────────────
export function useAISStream(apiKey: string) {
  const [ships, setShips] = useState<Map<string, LiveShip>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  const demoIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // ── Demo helpers ────────────────────────────────────────────────────────────
  const startDemoData = useCallback(() => {
    if (demoIntervalRef.current) return;
    setUsingDemoData(true);
    setError(null);
    setShips((prev) => (prev.size === 0 ? generateDemoShips() : prev));
    demoIntervalRef.current = setInterval(() => {
      setShips((prev) => {
        const next = new Map(prev);
        for (const [id, ship] of next) next.set(id, updateShipPosition(ship));
        return next;
      });
    }, 3000);
  }, []);

  const stopDemoData = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = undefined;
    }
    setUsingDemoData(false);
  }, []);

  // ── Smooth position interpolation for real ships between polls ──────────────
  const startInterpolation = useCallback(() => {
    const id = setInterval(() => {
      setShips((prev) => {
        const next = new Map(prev);
        for (const [id, ship] of next) {
          if (ship.status === "underway" && ship.speed > 0.5) {
            next.set(id, updateShipPosition(ship));
          }
        }
        return next;
      });
    }, 5000);
    return id;
  }, []);

  // ── Fetch real vessels ──────────────────────────────────────────────────────
  const fetchVessels = useCallback(async () => {
    if (!mountedRef.current) return;

    // ✅ FIX 1: Validate API key before attempting fetch
    const trimmedKey = (apiKey ?? "").trim();
    if (!trimmedKey) {
      console.warn("[DataDocked] No API key provided — using demo data");
      startDemoData();
      return;
    }

    // ✅ FIX 2: Debug log to confirm key is present (shows first 6 chars only)
    console.log(
      `[DataDocked] Fetching with key: ${trimmedKey.slice(0, 6)}... (length: ${
        trimmedKey.length
      })`
    );

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const mmsiList = HORMUZ_MMSIS.slice(0, 50).join(",");
      const url = `${API_BASE}/get-vessels-location-bulk-search?imo_or_mmsi=${mmsiList}`;

      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          // ✅ FIX 3: Try both common auth header formats.
          // DataDocked uses x-api-key. If you get a 401, swap to:
          //   "Authorization": `Bearer ${trimmedKey}`
          "x-api-key": trimmedKey,
        },
        signal: controller.signal,
      });

      // ✅ FIX 4: Detailed error for auth failures
      if (res.status === 401) {
        throw new Error(
          "401 Unauthorized — check your VITE_DATADOCKED_API_KEY in .env and restart the dev server"
        );
      }
      if (res.status === 403) {
        throw new Error(
          "403 Forbidden — your API key may be invalid or your plan doesn't include bulk search"
        );
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      if (!mountedRef.current) return;

      const vessels: any[] = json.results ?? [];
      console.log(
        "[DataDocked] RAW sample:",
        JSON.stringify(vessels.slice(0, 3), null, 2)
      );
      console.log(
        `[DataDocked] bulk fetch: ${json.successful ?? vessels.length}/${
          json.total_requested ?? HORMUZ_MMSIS.length
        } vessels found`
      );

      if (vessels.length === 0) {
        setConnected(true);
        setError(null);
        return;
      }

      const next = new Map<string, LiveShip>();
      let skippedNullIsland = 0;
      let skippedOutOfRegion = 0;

      for (const v of vessels) {
        const mmsi = String(v.mmsi ?? "");
        if (!mmsi) continue;

        const lat = parseFloat(v.latitude ?? v.lat ?? "0");
        const lng = parseFloat(v.longitude ?? v.lon ?? v.lng ?? "0");
        const spd = parseFloat(v.speed ?? v.sog ?? "0");
        const hdg = parseFloat(v.heading ?? v.cog ?? v.course ?? "0");

        // ✅ Skip null island (no position data)
        if (lat === 0 && lng === 0) {
          skippedNullIsland++;
          continue;
        }

        // ✅ Wider bounding box — full Persian Gulf + Hormuz + Gulf of Oman + Red Sea buffer
        // lat: 12–32, lng: 32–65
        if (lat < 12 || lat > 32 || lng < 32 || lng > 65) {
          skippedOutOfRegion++;
          console.log(
            `[DataDocked] Skipped out-of-region: ${v.name} lat=${lat} lng=${lng}`
          );
          continue;
        }

        next.set(mmsi, {
          id: mmsi,
          mmsi,
          name: (v.name ?? `Ship ${mmsi.slice(-4)}`).replace(/_/g, " ").trim(),
          lat,
          lng,
          speed: isNaN(spd) ? 0 : spd,
          heading: isNaN(hdg) ? 0 : hdg,
          type: mapShipType(v.typeSpecific ?? ""),
          status: mapNavStatus(v.navigationalStatus ?? ""),
          flag: flagFromCountry(v.country ?? ""),
          destination: (v.destination ?? "Unknown").trim(),
          route: inferRoute(lat, lng),
          lastUpdate: Date.now(),
        });
      }

      if (next.size > 0) {
        setShips(next);
        setConnected(true);
        setError(null);
        stopDemoData();
      } else {
        setConnected(true);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      if (!mountedRef.current) return;
      console.error("[DataDocked] fetch failed:", err.message);
      setConnected(false);
      setError(`${err.message} — showing demo data`);
      startDemoData();
    }
  }, [apiKey, startDemoData, stopDemoData]);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // ✅ FIX 5: Trim the key here too so whitespace in .env doesn't bite you
    const trimmedKey = (apiKey ?? "").trim();

    if (!trimmedKey) {
      console.warn("[DataDocked] No API key — starting demo data");
      setConnected(false);
      startDemoData();
      return;
    }

    fetchVessels(); // immediate first fetch

    // Poll every 6 hours to stay within 6000 credits/month
    pollIntervalRef.current = setInterval(fetchVessels, POLL_MS);

    // Keep ships visually moving between polls
    const interpolationId = startInterpolation();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearInterval(pollIntervalRef.current);
      clearInterval(interpolationId);
      stopDemoData();
    };
  }, [fetchVessels, startDemoData, stopDemoData, startInterpolation, apiKey]);

  return {
    ships: Array.from(ships.values()),
    connected,
    error,
    shipCount: ships.size,
    usingDemoData,
  };
}
