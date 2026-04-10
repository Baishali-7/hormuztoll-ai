// src/components/AnalyticsSidebar.tsx
import React, { useState, useRef, useCallback } from "react";
import { LiveShip as Ship } from "../hooks/useAISStream";
import { hormuzChokepoint } from "../data/mockShips";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Search = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);
const Anchor = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
    />
  </svg>
);
const Activity = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
const Clock = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const ShipStat = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);
const AlertTriangle = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
const ChevronRight = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
const ChevronDown = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);
const X = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const MapPin = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const Navigation = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  </svg>
);
const Wifi = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
    />
  </svg>
);
const List = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  allShips: Ship[];
  filteredShips: Ship[];
  selectedShip: Ship | null;
  onShipSelect: (ship: Ship | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (t: string) => void;
  routeFilter: string;
  onRouteFilterChange: (r: string) => void;
  destinationFilter: string;
  onDestinationFilterChange: (d: string) => void;
  uniqueRoutes: string[];
  uniqueDestinations: string[];
  showChokepoint: boolean;
  onCloseChokepoint: () => void;
  connected: boolean;
  usingDemoData?: boolean;
}

const TYPE_DOT: Record<string, string> = {
  tanker: "bg-red-500",
  cargo: "bg-blue-500",
  container: "bg-green-500",
  unknown: "bg-purple-400",
};

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Shared inner content ──────────────────────────────────────────────────────
function SidebarContent({
  allShips,
  filteredShips,
  selectedShip,
  onShipSelect,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  routeFilter,
  onRouteFilterChange,
  destinationFilter,
  onDestinationFilterChange,
  uniqueRoutes,
  uniqueDestinations,
  showChokepoint,
  onCloseChokepoint,
  connected,
  onClose,
  usingDemoData,
  isMobile = false,
}: Props & { onClose?: () => void; isMobile?: boolean }) {
  const tankers = allShips.filter((s) => s.type === "tanker").length;
  const cargo = allShips.filter((s) => s.type === "cargo").length;
  const containers = allShips.filter((s) => s.type === "container").length;
  const underway = allShips.filter((s) => s.status === "underway").length;
  const density =
    allShips.length > 30 ? "High" : allShips.length > 15 ? "Medium" : "Low";
  const densityColor =
    density === "High"
      ? "text-red-600 dark:text-red-400"
      : density === "Medium"
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-green-600 dark:text-green-400";

  const selectClass =
    "w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs px-2.5 py-2 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none";

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wide uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Maritime Intelligence
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-[10px] ${
              connected ? "text-green-500" : "text-yellow-500"
            }`}
          >
            <Wifi className="w-3 h-3" />
            {connected ? "AIS LIVE" : "Offline"}
          </span>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close panel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* ADD THIS: Demo Mode Indicator */}
      {usingDemoData && (
        <div className="mx-4 mt-3 p-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-400 font-medium">DEMO MODE ACTIVE</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 text-[10px]">
              Ships moving in real-time
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            ⚡ Live AIS connection unavailable. Showing simulated vessel
            movements.
          </p>
        </div>
      )}

      {/* ADD THIS: Connection Issue Warning (when not connected and not in demo mode) */}
      {!connected && !usingDemoData && (
        <div className="mx-4 mt-3 p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-yellow-400 font-medium">RECONNECTING</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 text-[10px]">
              Attempting to restore connection
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Will automatically switch to demo mode if connection fails.
          </p>
        </div>
      )}
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Stats Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-200 dark:border-gray-800">
          <StatCard
            icon={<Anchor className="w-3.5 h-3.5" />}
            label="Live Vessels"
            value={allShips.length}
          />
          <StatCard
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Density"
            value={density}
            valueClass={densityColor}
          />
          <StatCard
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Avg Transit"
            value={hormuzChokepoint.avgTransitTime}
          />
          <StatCard
            icon={<ShipStat className="w-3.5 h-3.5" />}
            label="Underway"
            value={underway}
          />
        </div>

        {/* Fleet Composition */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
            Fleet Composition
          </p>
          <div className="flex gap-3 flex-wrap">
            <TypeBadge label="Tanker" count={tankers} color="bg-red-500" />
            <TypeBadge label="Cargo" count={cargo} color="bg-blue-500" />
            <TypeBadge
              label="Container"
              count={containers}
              color="bg-green-500"
            />
            <TypeBadge
              label="Other"
              count={allShips.length - tankers - cargo - containers}
              color="bg-purple-400"
            />
          </div>
          {allShips.length > 0 && (
            <div className="mt-2 flex h-1.5 rounded-full overflow-hidden gap-px">
              {tankers > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${(tankers / allShips.length) * 100}%` }}
                />
              )}
              {cargo > 0 && (
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${(cargo / allShips.length) * 100}%` }}
                />
              )}
              {containers > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(containers / allShips.length) * 100}%` }}
                />
              )}
              <div className="bg-purple-400 flex-1 transition-all" />
            </div>
          )}
        </div>

        {/* Chokepoint Alert Panel */}
        {showChokepoint && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-yellow-50/50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Strait of Hormuz
              </h3>
              <button
                onClick={onCloseChokepoint}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Congestion
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {hormuzChokepoint.congestionLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Risk Level
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {hormuzChokepoint.riskLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Avg Transit
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {hormuzChokepoint.avgTransitTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Transits/24h
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {hormuzChokepoint.transitCount24h}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {hormuzChokepoint.alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1.5 rounded ${
                      a.type === "warning"
                        ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search name or MMSI…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs pl-8 pr-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Type filter — wraps naturally on small screens */}
          <div className="flex gap-1.5 flex-wrap">
            {["all", "tanker", "cargo", "container", "unknown"].map((t) => (
              <button
                key={t}
                onClick={() => onTypeFilterChange(t)}
                className={`text-xs px-3 py-1.5 rounded-md capitalize transition-colors min-h-[32px] ${
                  typeFilter === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <select
              value={routeFilter}
              onChange={(e) => onRouteFilterChange(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Routes</option>
              {uniqueRoutes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <select
              value={destinationFilter}
              onChange={(e) => onDestinationFilterChange(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Destinations</option>
              {uniqueDestinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-500 text-right">
            Showing {filteredShips.length} of {allShips.length} vessels
          </p>
        </div>

        {/* Ship List */}
        <div>
          {filteredShips.length === 0 ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 p-4 text-center">
              {allShips.length === 0
                ? "Waiting for AIS data…"
                : "No vessels match filters"}
            </p>
          ) : (
            filteredShips.map((ship) => (
              <button
                key={ship.id}
                onClick={() => {
                  onShipSelect(ship);
                  if (isMobile && onClose) onClose();
                }}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3 min-h-[56px] ${
                  selectedShip?.id === ship.id
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500"
                    : ""
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    TYPE_DOT[ship.type] ?? "bg-gray-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {ship.name}
                  </p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                    {ship.route}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    {ship.speed} kn
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500">
                    {ago(ship.lastUpdate)}
                  </p>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              </button>
            ))
          )}
          {/* Bottom padding so last item clears the mobile FAB */}
          <div className="h-4 md:h-0" />
        </div>
      </div>

      {/* Footer — desktop only */}
      <div className="hidden md:block p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        <p className="text-[10px] text-blue-600 dark:text-blue-400 animate-pulse">
          ● Live AIS feed · Strait of Hormuz · {allShips.length} vessels tracked
        </p>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AnalyticsSidebar(props: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close sheet when tapping the backdrop
  const handleBackdropClick = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ── Desktop sidebar (md+) ──────────────────────────────────────── */}
      <aside className="hidden md:flex w-80 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-col h-full overflow-hidden">
        <SidebarContent {...props} />
      </aside>

      {/* ── Mobile: floating action bar ────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] pointer-events-none">
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 pointer-events-auto"
            onClick={handleBackdropClick}
          />
        )}

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className={`pointer-events-auto relative bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-out ${
            mobileOpen ? "h-[80vh]" : "h-0"
          } overflow-hidden`}
        >
          {mobileOpen && (
            <SidebarContent
              {...props}
              isMobile
              onClose={() => setMobileOpen(false)}
            />
          )}
        </div>

        {/* FAB strip — always visible */}
        <div className="pointer-events-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                props.connected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              {props.allShips.length} vessels tracked
            </span>
            {props.filteredShips.length !== props.allShips.length && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                ({props.filteredShips.length} shown)
              </span>
            )}
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 active:scale-95 transition-transform"
          >
            <List className="w-3.5 h-3.5" />
            {mobileOpen ? "Close" : "Vessels"}
            {!mobileOpen && <ChevronRight className="w-3 h-3 -rotate-90" />}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  valueClass = "text-gray-900 dark:text-gray-100",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function TypeBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {count}
      </span>
    </div>
  );
}
