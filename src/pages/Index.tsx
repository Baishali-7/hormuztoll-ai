// src/pages/Index.tsx
import React, { useState, useMemo } from "react";
import { useAISStream, LiveShip as Ship } from "../hooks/useAISStream";
import MaritimeMap from "../components/MaritimeMap";
import AnalyticsSidebar from "../components/AnalyticsSidebar";
import AIChatbot from "../components/AIChatbot";

const Waves = ({ className = "" }) => (
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
      d="M3.75 12h16.5M3.75 8.25h16.5M3.75 15.75h16.5"
    />
  </svg>
);

const WifiOff = ({ className = "" }) => (
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
      d="M9.172 16.172a4 4 0 015.656 0M3 3l18 18M10.584 10.587a5 5 0 016.828.685M6.343 6.343a9 9 0 00-.876 12.416M1.42 1.42A19.942 19.942 0 014.5 4.5"
    />
  </svg>
);

export default function Index() {
  // ── Live data from AISStream ─────────────────────────────────────────────
  const apiKey = import.meta.env.VITE_AISSTREAM_API_KEY ?? "";
  const { ships, connected, error, shipCount } = useAISStream(apiKey);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [showChokepoint, setShowChokepoint] = useState(false);

  // ── Derived filter options ───────────────────────────────────────────────
  const uniqueRoutes = useMemo(
    () => [...new Set(ships.map((s) => s.route))].sort(),
    [ships]
  );
  const uniqueDestinations = useMemo(
    () => [...new Set(ships.map((s) => s.destination).filter(Boolean))].sort(),
    [ships]
  );

  // ── Filtered ship list ───────────────────────────────────────────────────
  const filteredShips = useMemo(() => {
    return ships.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (routeFilter !== "all" && s.route !== routeFilter) return false;
      if (destinationFilter !== "all" && s.destination !== destinationFilter)
        return false;
      if (
        searchQuery &&
        !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.mmsi.includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [ships, searchQuery, typeFilter, routeFilter, destinationFilter]);

  // ── If selected ship is filtered out, deselect it ───────────────────────
  const safeSelected =
    selectedShip && filteredShips.find((s) => s.id === selectedShip.id)
      ? selectedShip
      : null;

  // ── No API key guard ─────────────────────────────────────────────────────
  if (!apiKey) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center space-y-3 max-w-sm px-6">
          <WifiOff className="w-10 h-10 text-yellow-400 mx-auto" />
          <h1 className="text-lg font-bold">AISStream API Key Missing</h1>
          <p className="text-sm text-gray-400">
            Add{" "}
            <code className="bg-gray-800 px-1 rounded">
              VITE_AISSTREAM_API_KEY
            </code>{" "}
            to your <code className="bg-gray-800 px-1 rounded">.env</code> file,
            then restart the dev server.
          </p>
          <p className="text-xs text-gray-500">
            Get a free key at{" "}
            <a
              href="https://aisstream.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              aisstream.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="h-11 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Hormuz AI Maritime Monitor
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          {connected ? (
            <span className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE · {shipCount} vessels
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-yellow-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              {error ?? "Connecting…"}
            </span>
          )}

          <span className="text-[10px] text-gray-600 dark:text-gray-400 hidden sm:block">
            {new Date().toUTCString().slice(0, -4)} UTC
          </span>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MaritimeMap
            filteredShips={filteredShips}
            selectedShip={safeSelected}
            onShipSelect={setSelectedShip}
            onChokepointClick={() => setShowChokepoint(true)}
          />

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 z-[500] shadow-sm">
            <div className="flex items-center gap-3 text-[10px] text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Tanker
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Cargo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Container
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Unknown
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Port
              </span>
            </div>
          </div>

          {/* Waiting for first data */}
          {connected && shipCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4 text-center shadow-lg">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Receiving live AIS data…
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Ships will appear as signals arrive
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <AnalyticsSidebar
          allShips={ships}
          filteredShips={filteredShips}
          selectedShip={safeSelected}
          onShipSelect={setSelectedShip}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          routeFilter={routeFilter}
          onRouteFilterChange={setRouteFilter}
          destinationFilter={destinationFilter}
          onDestinationFilterChange={setDestinationFilter}
          uniqueRoutes={uniqueRoutes}
          uniqueDestinations={uniqueDestinations}
          showChokepoint={showChokepoint}
          onCloseChokepoint={() => setShowChokepoint(false)}
          connected={connected}
        />
      </div>

      {/* Chatbot — passes live context */}
      <AIChatbot />
    </div>
  );
}
