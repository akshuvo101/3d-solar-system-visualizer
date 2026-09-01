"use client";

import { useState } from "react";
import SolarSystem3D from "@/components/solar/SolarSystem3D";
import Sidebar from "@/components/layout/Sidebar";
import AudioPlayer from "@/components/common/AudioPlayer";
import PlanetInfo from "@/components/common/PlanetInfo";
import { planetData } from "@/lib/planetData";

type PlanetSelection = {
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

export default function SimulationPage() {
  const [speed, setSpeed] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState("Sun");

  const [planetInfo, setPlanetInfo] =
    useState<PlanetSelection | null>(null);

  const [musicOn, setMusicOn] = useState(true);

  const backgroundAudioUrl =
    "https://youtu.be/sleMoipHT8k?si=MqsrZuZwI-akxqjh";

  const handlePlanetSelect = (name: string) => {
    setSelectedPlanet(name);

    // পুরনো information immediately remove
    setPlanetInfo(null);

    // ☀️ Sun-এর special data
    if (name === "Sun") {
      setPlanetInfo({
        name: "Sun",
        fact: "The Sun is the star at the center of our Solar System. Its enormous gravity keeps the planets, dwarf planets, asteroids, and many other objects bound in orbit.",
        type: "G-type Main Sequence Star",
        radius: 696340,
        mass: 1.989e30,
        gravity: 274,
        temperature: "About 5,500°C at the visible surface and millions of degrees in the core",
        dayLength: "About 25–35 Earth days",
        yearLength: "About 225–250 million years around the Milky Way",
        moons: 0,
        realSpeed: 0,
        gravityNote:
          "The Sun contains about 99.8% of the total mass of the Solar System.",
      });

      return;
    }

    const selectedPlanetData = planetData.find(
      (planet) => planet.name === name
    );

    if (selectedPlanetData) {
      setPlanetInfo(selectedPlanetData);
    }
  };

  const handlePlanetClick = (planet: PlanetSelection) => {
    setPlanetInfo(planet);
    setSelectedPlanet(planet.name);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">

      {/* Sidebar / Mobile Navigation */}
      <Sidebar
        onSelect={handlePlanetSelect}
        selectedPlanet={selectedPlanet}
      />

      {/* Background Music */}
      <AudioPlayer
        sourceUrl={backgroundAudioUrl}
        isEnabled={musicOn}
      />

      {/* Music Toggle */}
      <button
        onClick={() => setMusicOn((prev) => !prev)}
        className="fixed right-4 top-4 z-50 rounded bg-pink-500/80 px-3 py-2 text-sm text-white backdrop-blur transition hover:bg-pink-400"
      >
        {musicOn ? "Music: ON" : "Music: OFF"}
      </button>

      {/* Planet Information System */}
      <PlanetInfo
        planet={planetInfo}
        // onClose={() => setPlanetInfo(null)}
      />

      {/* 3D Solar System */}
      <SolarSystem3D
        speed={speed}
        selectedPlanet={selectedPlanet}
        onPlanetClick={handlePlanetClick}
      />

      {/* Simulation Speed Control */}
      <div className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2">
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}