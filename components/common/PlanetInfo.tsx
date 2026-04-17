

"use client";

type PlanetInfoData = {
  name: string;
  distance?: number;
  speed?: number;
  realSpeed?: number;
  fact?: string;

  type?: string;
  radius?: number;
  mass?: number;
  gravity?: number;
  temperature?: string;
  dayLength?: string;
  yearLength?: string;
  moons?: number;
  gravityNote?: string;
};

type PlanetInfoProps = {
  planet: PlanetInfoData | null;
  onClose: () => void;
};

export default function PlanetInfo({ planet, onClose }: PlanetInfoProps) {
  if (!planet) return null;

  return (
    <div className="fixed right-4 bottom-4 bg-black/80 p-4 rounded w-72 z-30 text-white backdrop-blur shadow-lg">
      
      {/* 🌍 Title */}
      <h2 className="font-bold text-lg mb-2 text-pink-400">
        {planet.name}
      </h2>

      {/* 🧠 Fact */}
      {planet.fact && (
        <p className="mb-2 text-sm text-gray-300">
          {planet.fact}
        </p>
      )}

      {/* 🎮 Simulation Info */}
      <div className="mt-2">
        <h3 className="text-xs text-gray-400 mb-1">Simulation</h3>
        <p>🪐 Orbit Radius: {planet.distance ?? "N/A"}</p>
        <p>⚡ Animation Speed: {planet.speed ?? "N/A"}</p>
      </div>

      {/* 🌍 Real Data */}
      <div className="mt-3">
        <h3 className="text-xs text-gray-400 mb-1">Real Planet Data</h3>

        <p>🌍 Type: {planet.type ?? "N/A"}</p>
        <p>📏 Radius: {planet.radius ?? "N/A"} km</p>
        <p>⚖️ Mass: {planet.mass ?? "N/A"} kg</p>
        <p>🧲 Gravity: {planet.gravity ?? "N/A"} m/s²</p>

        <p>🌡️ Temp: {planet.temperature ?? "N/A"}</p>
        <p>🕒 Day: {planet.dayLength ?? "N/A"}</p>
        <p>📅 Year: {planet.yearLength ?? "N/A"}</p>

        <p>🌙 Moons: {planet.moons ?? "N/A"}</p>
        <p>🚀 Orbit Speed: {planet.realSpeed ?? "N/A"} km/h</p>
      </div>

      {/* 💡 Gravity Note */}
      {planet.gravityNote && (
        <p className="text-xs mt-2 text-green-400">
          {planet.gravityNote}
        </p>
      )}

      {/* ❌ Close Button */}
      <button
        onClick={onClose}
        className="mt-3 text-red-400 hover:text-red-600 text-sm"
      >
        Close
      </button>
    </div>
  );
}
