// src/components/MaritimeMap.tsx
import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ports,
  shippingRoutes,
  hormuzChokepoint,
  chokepoints,
} from "../data/mockShips";
import { LiveShip as Ship } from "../hooks/useAISStream";

// Fix default icon paths (Leaflet + Vite issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;

// ── Ship marker — coloured dot with heading arrow ─────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  tanker: "#ef4444",
  cargo: "#3b82f6",
  container: "#22c55e",
  unknown: "#a855f7",
};

function createShipIcon(ship: Ship, isSelected: boolean) {
  const color = TYPE_COLOR[ship.type] ?? "#888";
  const size = isSelected ? 16 : 11;
  const border = isSelected
    ? `3px solid #facc15`
    : `2px solid rgba(255,255,255,0.55)`;
  const shadow = isSelected
    ? `0 0 12px ${color}, 0 0 4px ${color}`
    : `0 0 5px ${color}80`;

  // Arrow SVG showing heading — only if ship is underway and has a real heading
  const showArrow = ship.speed > 0.5 && ship.heading >= 0 && ship.heading < 360;
  const arrowLen = isSelected ? 22 : 16;
  const angleRad = ((ship.heading - 90) * Math.PI) / 180; // rotate so 0° = north
  const ax = Math.cos(angleRad) * arrowLen;
  const ay = Math.sin(angleRad) * arrowLen;
  const half = size / 2;

  const arrowSvg = showArrow
    ? `<line x1="${half}" y1="${half}" x2="${half + ax}" y2="${half + ay}"
         stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>`
    : "";

  const totalW = Math.abs(ax) + size + 4;
  const totalH = Math.abs(ay) + size + 4;
  const ox = ax < 0 ? Math.abs(ax) + 2 : 2;
  const oy = ay < 0 ? Math.abs(ay) + 2 : 2;

  const html = `<svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${ox + half}" cy="${oy + half}" r="${half}"
      fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="${
    isSelected ? 3 : 2
  }"
      style="filter:drop-shadow(0 0 ${isSelected ? 6 : 3}px ${color}80)" />
    ${
      showArrow
        ? `<line x1="${ox + half}" y1="${oy + half}" x2="${
            ox + half + ax
          }" y2="${oy + half + ay}"
           stroke="${color}" stroke-width="${
            isSelected ? 2 : 1.5
          }" stroke-linecap="round" opacity="0.9"/>`
        : ""
    }
  </svg>`;

  return L.divIcon({
    className: "",
    html,
    iconSize: [totalW, totalH],
    iconAnchor: [ox + half, oy + half],
  });
}

// ── Port marker — amber square ────────────────────────────────────────────────
const portIcon = L.divIcon({
  className: "",
  html: `<div style="width:8px;height:8px;background:#f59e0b;border-radius:2px;border:1px solid rgba(255,255,255,0.5);box-shadow:0 0 6px #f59e0b80;"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

// ── MapEvents: click on blank map → deselect ship ─────────────────────────────
function MapEvents({
  onShipSelect,
}: {
  onShipSelect: (s: Ship | null) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onShipSelect(null);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onShipSelect]);
  return null;
}

// ── FlyTo: animate to selected ship ──────────────────────────────────────────
function FlyToShip({ ship }: { ship: Ship | null }) {
  const map = useMap();
  useEffect(() => {
    if (ship)
      map.flyTo([ship.lat, ship.lng], Math.max(map.getZoom(), 9), {
        duration: 0.8,
      });
  }, [ship, map]);
  return null;
}

// ── Navigational status → label ───────────────────────────────────────────────
function statusDot(status: string) {
  if (status === "underway") return "🟢";
  if (status === "anchored") return "🟡";
  if (status === "moored") return "🔵";
  return "⚪";
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  filteredShips: Ship[];
  selectedShip: Ship | null;
  onShipSelect: (ship: Ship | null) => void;
  onChokepointClick: () => void;
}

export default function MaritimeMap({
  filteredShips,
  selectedShip,
  onShipSelect,
  onChokepointClick,
}: Props) {
  return (
    <MapContainer
      center={[26.0, 55.5] as L.LatLngExpression}
      zoom={7}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <MapEvents onShipSelect={onShipSelect} />
      <FlyToShip ship={selectedShip} />

      {/* ── Shipping lane overlays ─────────────────────────────────────── */}
      {shippingRoutes.map((route) => (
        <Polyline
          key={route.name}
          positions={route.points as L.LatLngExpression[]}
          pathOptions={{
            color: route.name.includes("Inbound")
              ? "#22d3ee66"
              : route.name.includes("Outbound")
              ? "#f97316aa"
              : "#0dd4b344",
            weight: route.name.includes("TSS") ? 2.5 : 1.5,
            dashArray: "8 6",
          }}
        />
      ))}

      {/* ── Secondary chokepoint circles ──────────────────────────────── */}
      {chokepoints.slice(1).map((cp) => (
        <Circle
          key={cp.name}
          center={[cp.lat, cp.lng] as L.LatLngExpression}
          radius={cp.radiusM}
          pathOptions={{
            color: "#94a3b8",
            fillColor: "#94a3b8",
            fillOpacity: 0.04,
            weight: 1,
            dashArray: "4 4",
          }}
        />
      ))}

      {/* ── Hormuz chokepoint (main, clickable) ───────────────────────── */}
      <Circle
        center={
          [hormuzChokepoint.lat, hormuzChokepoint.lng] as L.LatLngExpression
        }
        radius={22000}
        pathOptions={{
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.07,
          weight: 1.5,
          dashArray: "6 4",
        }}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            onChokepointClick();
          },
        }}
      />

      {/* ── Ports ─────────────────────────────────────────────────────── */}
      {ports.map((port) => (
        <Marker
          key={port.name}
          position={[port.lat, port.lng] as L.LatLngExpression}
          icon={portIcon}
        >
          <Popup>
            <div className="text-xs font-semibold text-gray-900">
              {port.name}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ── Live ships ────────────────────────────────────────────────── */}
      {filteredShips.map((ship) => (
        <Marker
          key={ship.id}
          position={[ship.lat, ship.lng] as L.LatLngExpression}
          icon={createShipIcon(ship, selectedShip?.id === ship.id)}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              onShipSelect(ship);
            },
          }}
        >
          <Popup>
            <div className="text-gray-900 rounded-lg min-w-[200px] space-y-1.5">
              <p className="font-bold text-sm border-b border-gray-200 pb-1 mb-1 flex items-center gap-1.5 text-gray-500">
                {statusDot(ship.status)}
                {ship.name}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500">MMSI</span>
                <span className="font-mono text-gray-500">{ship.mmsi}</span>

                <span className="text-gray-500">Type</span>
                <span className="capitalize font-medium text-gray-500">
                  {ship.type}
                </span>

                <span className="text-gray-500">Speed</span>
                <span className="text-gray-500">{ship.speed} kn</span>

                <span className="text-gray-500">Heading</span>
                <span className="text-gray-500">{ship.heading}°</span>

                <span className="text-gray-500">Status</span>
                <span className="capitalize text-gray-500">{ship.status}</span>

                <span className="text-gray-500">Route</span>
                <span className="text-gray-500">{ship.route}</span>

                <span className="text-gray-500">Destination</span>
                <span className="text-gray-500">{ship.destination}</span>

                <span className="text-gray-500">Flag / CS</span>
                <span className="text-gray-500">{ship.flag}</span>

                <span className="text-gray-500">Position</span>
                <span className="text-gray-500">
                  {ship.lat.toFixed(4)}°N {ship.lng.toFixed(4)}°E
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
