// src/hooks/useAISStream.ts
import { useEffect, useRef, useState, useCallback } from "react";

export type LiveShipType = "tanker" | "cargo" | "container" | "unknown";

export interface LiveShip {
  id: string; // MMSI as string
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  speed: number; // knots (from Sog)
  heading: number; // degrees (TrueHeading or Cog)
  type: LiveShipType;
  status: "underway" | "anchored" | "moored" | string;
  flag: string; // CallSign used as proxy
  destination: string;
  route: string; // inferred from position
  lastUpdate: number; // ms timestamp
}

// ── Bounding boxes ──────────────────────────────────────────────────────────
// Persian Gulf + Strait of Hormuz + Gulf of Oman
const BBOX: [[number, number], [number, number]] = [
  [21.0, 48.0],
  [30.5, 63.5],
];

// ── AIS navigational status codes → readable strings ────────────────────────
const NAV_STATUS: Record<number, LiveShip["status"]> = {
  0: "underway",
  1: "anchored",
  2: "underway", // not under command — still moving
  3: "underway", // restricted
  5: "moored",
  8: "underway", // sailing
};

// ── AIS ship type codes (ITU-R M.1371) → simplified buckets ─────────────────
function mapShipType(code: number): LiveShipType {
  if (code >= 80 && code <= 89) return "tanker";
  if (code === 70 || code === 79) return "cargo";
  if (code >= 71 && code <= 76) return "container"; // general cargo subtypes
  if (code >= 60 && code <= 69) return "cargo"; // passenger — map to cargo
  return "unknown";
}

// ── Route inference from lat/lng quadrant ───────────────────────────────────
function inferRoute(lat: number, lng: number): string {
  // Strait of Hormuz corridor
  if (lng >= 55.5 && lng <= 57.5 && lat >= 25.5 && lat <= 27.2)
    return "Strait of Hormuz TSS";
  // Gulf of Oman
  if (lng > 57.5 && lng <= 63.5 && lat >= 21 && lat <= 25.5)
    return "Gulf of Oman";
  // Northern Persian Gulf (Kuwait / Iraq / Iran)
  if (lat > 28 && lng >= 48 && lng <= 56) return "Northern Persian Gulf";
  // UAE / Qatar coast
  if (lat >= 24 && lat <= 27 && lng >= 51 && lng <= 56.5)
    return "UAE / Qatar Waters";
  // General Persian Gulf
  return "Persian Gulf";
}

// ── Flag emoji from MMSI prefix (leading 3 digits = MID country code) ───────
const MID_TO_FLAG: Record<string, string> = {
  "422": "🇮🇷",
  "370": "🇵🇦",
  "477": "🇭🇰",
  "229": "🇲🇹",
  "248": "🇲🇹",
  "470": "🇦🇪",
  "461": "🇸🇦",
  "466": "🇸🇦",
  "451": "🇶🇦",
  "462": "🇴🇲",
  "463": "🇴🇲",
  "419": "🇮🇳",

  "416": "🇨🇳",
  "412": "🇨🇳",
  "440": "🇰🇷",
  "441": "🇰🇷",
  "432": "🇯🇵",
  "431": "🇯🇵",
  "636": "🇱🇷",
  "538": "🇲🇭",
  "311": "🇧🇸",
  "255": "🇵🇹",
  "212": "🇨🇾",
  "209": "🇨🇾",
};

function flagFromMMSI(mmsi: string): string {
  const prefix = mmsi.slice(0, 3);
  return MID_TO_FLAG[prefix] ?? "🏴";
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAISStream(apiKey: string) {
  const [ships, setShips] = useState<Map<string, LiveShip>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate ref for static data (name, type, destination) so we don't need to
  // re-render on every ShipStaticData message
  const staticRef = useRef<Map<string, Partial<LiveShip>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);
  console.log("API KEY:", apiKey);
  // Replace your connect function with this:
  const connect = useCallback(() => {
    if (!apiKey) return;

    let alive = true;

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    wsRef.current = ws;

    ws.onopen = () => {
      if (!alive) {
        ws.close();
        return;
      }
      setConnected(true);
      setError(null);
      ws.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [BBOX],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        })
      );
    };

    ws.onmessage = (evt: MessageEvent) => {
      if (!alive) return;
      try {
        const msg = JSON.parse(evt.data as string);
        // ... rest of your message handling unchanged
      } catch (e) {}
    };

    ws.onerror = () => {
      if (alive) setError("Connection error — retrying…");
    };

    ws.onclose = () => {
      if (!alive) return; // ← killed intentionally, do NOT reconnect
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 5000);
    };

    return () => {
      alive = false;
      clearTimeout(reconnectRef.current);
      // ✅ Only close if not already closing/closed
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [apiKey]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
    };
  }, [connect]);
  // Evict stale ships (not seen in 15 minutes)
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - 15 * 60 * 1000;
      setShips((prev) => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (v.lastUpdate < cutoff) next.delete(k);
        }
        return next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return {
    ships: Array.from(ships.values()),
    connected,
    error,
    shipCount: ships.size,
  };
}
