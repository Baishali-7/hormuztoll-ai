// src/data/mockShips.ts
// ─────────────────────────────────────────────────────────────────────────────
// Static geographic reference data only.
// Live ship data is now streamed from AISStream — see src/hooks/useAISStream.ts
// ─────────────────────────────────────────────────────────────────────────────

// Re-export LiveShip as Ship so existing components keep working with one import
export type { LiveShip as Ship } from "../hooks/useAISStream";

// ── Ports ─────────────────────────────────────────────────────────────────────
export interface Port {
  name: string;
  lat: number;
  lng: number;
}

export const ports: Port[] = [
  { name: "Dubai (Jebel Ali)", lat: 25.0, lng: 55.06 },
  { name: "Bandar Abbas", lat: 27.18, lng: 56.27 },
  { name: "Fujairah", lat: 25.12, lng: 56.34 },
  { name: "Muscat", lat: 23.61, lng: 58.54 },
  { name: "Ras Laffan", lat: 25.93, lng: 51.53 },
  { name: "Khor Fakkan", lat: 25.35, lng: 56.36 },
  { name: "Dammam", lat: 26.43, lng: 50.1 },
  { name: "Kuwait City", lat: 29.37, lng: 47.97 },
  { name: "Bahrain", lat: 26.23, lng: 50.55 },
  { name: "Abu Dhabi", lat: 24.45, lng: 54.65 },
  { name: "Sohar", lat: 24.35, lng: 56.74 },
  { name: "Salalah", lat: 16.94, lng: 54.0 },
];

// ── Shipping lane overlays (TSS + major corridors) ───────────────────────────
export interface ShippingRoute {
  name: string;
  points: [number, number][];
}

export const shippingRoutes: ShippingRoute[] = [
  {
    name: "Hormuz Inbound TSS",
    points: [
      [25.1, 58.0],
      [25.5, 57.6],
      [25.9, 57.1],
      [26.2, 56.8],
      [26.45, 56.4],
      [26.65, 56.15],
      [26.95, 55.85],
    ],
  },
  {
    name: "Hormuz Outbound TSS",
    points: [
      [26.95, 55.6],
      [26.65, 55.9],
      [26.35, 56.2],
      [26.05, 56.65],
      [25.7, 57.0],
      [25.3, 57.5],
      [25.0, 58.0],
    ],
  },
  {
    name: "Gulf Main Corridor (N↔S)",
    points: [
      [26.95, 55.8],
      [27.1, 54.8],
      [27.05, 53.5],
      [26.7, 52.5],
      [26.5, 51.8],
      [26.43, 50.5],
      [28.5, 48.5],
      [29.37, 47.97],
    ],
  },
  {
    name: "UAE Coast Corridor",
    points: [
      [24.45, 54.65],
      [24.8, 55.0],
      [25.0, 55.06],
      [25.15, 55.4],
      [25.35, 56.0],
      [25.35, 56.36],
    ],
  },
  {
    name: "Fujairah Approach",
    points: [
      [25.1, 58.0],
      [25.12, 57.5],
      [25.12, 56.34],
    ],
  },
  {
    name: "Qatar–Hormuz LNG Route",
    points: [
      [25.93, 51.53],
      [25.6, 52.5],
      [25.8, 53.8],
      [26.2, 55.0],
      [26.45, 56.2],
    ],
  },
];

// ── Chokepoint metadata ───────────────────────────────────────────────────────
export const hormuzChokepoint = {
  lat: 26.56,
  lng: 56.25,
  name: "Strait of Hormuz",
  widthKm: 39, // narrowest navigable point
  congestionLevel: "Moderate" as const,
  riskLevel: "Elevated" as const,
  transitCount24h: 42,
  avgTransitTime: "2.5 hours",
  alerts: [
    {
      type: "warning" as const,
      message: "Moderate traffic density — expect minor delays",
    },
    {
      type: "info" as const,
      message: "Northbound lane (TSS) operating normally",
    },
    {
      type: "info" as const,
      message: "Weather: Visibility good, seas calm, NW 8–12 kn",
    },
  ],
};

// ── Secondary chokepoints ─────────────────────────────────────────────────────
export const chokepoints = [
  {
    name: "Strait of Hormuz",
    lat: 26.56,
    lng: 56.25,
    radiusM: 22000,
    risk: "Elevated",
  },
  {
    name: "Fujairah Anchorage",
    lat: 25.12,
    lng: 56.34,
    radiusM: 12000,
    risk: "Low",
  },
  {
    name: "Khor Fakkan Roads",
    lat: 25.35,
    lng: 56.36,
    radiusM: 8000,
    risk: "Low",
  },
];
