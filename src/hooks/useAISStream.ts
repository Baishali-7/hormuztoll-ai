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

// ── DEMO DATA GENERATION ─────────────────────────────────────────────────────
// Generate random ship names
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

// Generate a random ship
function generateDemoShip(id: number): LiveShip {
  const mmsi = String(412000000 + id);
  const type: LiveShipType = ["tanker", "cargo", "container", "unknown"][
    Math.floor(Math.random() * 4)
  ] as LiveShipType;
  const speed = Math.random() * 18 + 2; // 2-20 knots
  const heading = Math.random() * 360;

  // Random positions in Persian Gulf area
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
    status:
      speed > 1 ? "underway" : Math.random() > 0.7 ? "anchored" : "underway",
    flag: flagFromMMSI(mmsi),
    destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
    route: inferRoute(lat, lng),
    lastUpdate: Date.now(),
  };
}

// Update ship position based on speed and heading
function updateShipPosition(ship: LiveShip): LiveShip {
  if (ship.speed < 0.5) return ship; // Anchored or very slow ships don't move much

  // Convert speed from knots to degrees (approx: 1 knot = 0.0003 degrees per second)
  // For demo purposes, we'll move them a bit more dramatically
  const moveDistance = (ship.speed / 1000) * (Math.random() * 0.5 + 0.5);

  // Convert heading to radians
  const headingRad = (ship.heading * Math.PI) / 180;

  // Calculate new position
  let newLat = ship.lat + Math.cos(headingRad) * moveDistance;
  let newLng = ship.lng + Math.sin(headingRad) * moveDistance;

  // Keep within bounds (Persian Gulf area)
  newLat = Math.max(21, Math.min(30.5, newLat));
  newLng = Math.max(48, Math.min(63.5, newLng));

  // Occasionally change heading to simulate realistic movement
  let newHeading = ship.heading;
  if (Math.random() < 0.05) {
    // 5% chance to change heading
    newHeading = (ship.heading + (Math.random() - 0.5) * 30 + 360) % 360;
  }

  // Occasionally change speed
  let newSpeed = ship.speed;
  if (Math.random() < 0.03) {
    // 3% chance to change speed
    newSpeed = Math.max(
      0.5,
      Math.min(25, ship.speed + (Math.random() - 0.5) * 3)
    );
  }

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

// Generate initial demo ships
function generateDemoShips(): Map<string, LiveShip> {
  const ships = new Map<string, LiveShip>();
  for (let i = 1; i <= 25; i++) {
    const ship = generateDemoShip(i);
    ships.set(ship.id, ship);
  }
  return ships;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAISStream(apiKey: string) {
  const [ships, setShips] = useState<Map<string, LiveShip>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Separate ref for static data (name, type, destination) so we don't need to
  // re-render on every ShipStaticData message
  const staticRef = useRef<Map<string, Partial<LiveShip>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const mountedRef = useRef(true);
  const connectionAttemptRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  console.log("API KEY:", apiKey);

  // Function to start demo data
  const startDemoData = useCallback(() => {
    if (demoIntervalRef.current) return;

    setUsingDemoData(true);
    setError(null);

    // Initialize with demo ships if empty
    setShips((prev) => {
      if (prev.size === 0) {
        return generateDemoShips();
      }
      return prev;
    });

    // Update ship positions periodically
    demoIntervalRef.current = setInterval(() => {
      setShips((prev) => {
        const next = new Map(prev);
        for (const [id, ship] of next) {
          next.set(id, updateShipPosition(ship));
        }
        return next;
      });
    }, 3000); // Update every 3 seconds for smooth movement

    console.log("Demo data mode activated with moving ships");
  }, []);

  const stopDemoData = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = undefined;
    }
    setUsingDemoData(false);
  }, []);

  // Function to attempt connection with timeout
  const connect = useCallback(() => {
    if (!apiKey) {
      // No API key, use demo data immediately
      console.log("No API key provided, using demo data");
      setConnected(false);
      startDemoData();
      return;
    }

    let alive = true;
    let connectionTimeout: ReturnType<typeof setTimeout>;

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    wsRef.current = ws;

    // Set connection timeout (15 seconds)
    connectionTimeout = setTimeout(() => {
      if (alive && ws.readyState !== WebSocket.OPEN) {
        console.log("Connection timeout, falling back to demo data");
        ws.close();
        setConnected(false);
        setError("Connection timeout — using demo data");
        startDemoData();
      }
    }, 15000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      if (!alive) {
        ws.close();
        return;
      }
      console.log("WebSocket connected successfully");
      setConnected(true);
      setError(null);
      stopDemoData(); // Stop demo data if it was running

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
        const messageType = msg.MessageType;

        if (messageType === "PositionReport") {
          const meta = msg.MetaData;
          const position = msg.Message.PositionReport;
          const mmsi = meta.MMSI;
          const shipName =
            staticRef.current.get(mmsi)?.name || `Ship ${mmsi.slice(-4)}`;

          const newShip: LiveShip = {
            id: mmsi,
            mmsi: mmsi,
            name: shipName,
            lat: position.Latitude,
            lng: position.Longitude,
            speed: position.Sog,
            heading: position.Cog,
            type: staticRef.current.get(mmsi)?.type || "unknown",
            status: NAV_STATUS[position.NavigationalStatus] ?? "underway",
            flag: flagFromMMSI(mmsi),
            destination: staticRef.current.get(mmsi)?.destination || "Unknown",
            route: inferRoute(position.Latitude, position.Longitude),
            lastUpdate: Date.now(),
          };

          setShips((prev) => {
            const next = new Map(prev);
            next.set(mmsi, newShip);
            return next;
          });
        } else if (messageType === "ShipStaticData") {
          const meta = msg.MetaData;
          const staticData = msg.Message.ShipStaticData;
          staticRef.current.set(meta.MMSI, {
            name: staticData.Name || `Ship ${meta.MMSI.slice(-4)}`,
            type: mapShipType(staticData.ShipType),
            destination: staticData.Destination || "Unknown",
          });
        }
      } catch (e) {
        console.error("Error parsing AIS message:", e);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      if (alive) {
        console.error("WebSocket error:", error);
        setError("Connection error — using demo data");
        startDemoData();
      }
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      if (!alive) return;

      console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
      setConnected(false);

      // Only start demo data if not intentionally closed and connection wasn't successful
      if (!usingDemoData) {
        setError("Connection closed — using demo data");
        startDemoData();
      }

      // Attempt to reconnect after 30 seconds
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current && !usingDemoData) {
          connect();
        }
      }, 30000);
    };

    return () => {
      alive = false;
      clearTimeout(connectionTimeout);
      clearTimeout(reconnectRef.current);
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [apiKey, startDemoData, stopDemoData, usingDemoData]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      mountedRef.current = false;
      cleanup?.();
      stopDemoData();
      clearTimeout(connectionAttemptRef.current);
    };
  }, [connect, stopDemoData]);

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
    usingDemoData, // Export this to show status in UI
  };
}
