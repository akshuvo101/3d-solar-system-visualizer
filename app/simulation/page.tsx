"use client";

import { useState } from "react";
import SolarSystem3D from "@/components/solar/SolarSystem3D";
import Sidebar from "@/components/layout/Sidebar";
import AudioPlayer from "@/components/common/AudioPlayer";
import PlanetInfo from "@/components/common/PlanetInfo";

type PlanetSelection = {
  name: string;
  distance?: number;
  speed?: number;
};

export default function SimulationPage() {
  const [speed, setSpeed] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState("Earth");
  const [planetInfo, setPlanetInfo] = useState<PlanetSelection | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  // YouTube music URL
  const backgroundAudioUrl = "https://youtu.be/sleMoipHT8k?si=MqsrZuZwI-akxqjh";

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar onSelect={(name: string) => setSelectedPlanet(name)} />

      {/* Space Sound */}
      <AudioPlayer sourceUrl={backgroundAudioUrl} isEnabled={musicOn} />

      {/* Music Toggle */}
      <button
        onClick={() => setMusicOn((prev) => !prev)}
        className="fixed top-4 right-4 z-30 px-3 py-2 rounded bg-pink-500/80 hover:bg-pink-400 text-white text-sm backdrop-blur"
      >
        {musicOn ? "Music: ON" : "Music: OFF"}
      </button>

      {/* 3D Scene */}
      <SolarSystem3D
        speed={speed}
        selectedPlanet={selectedPlanet}
        onPlanetClick={(planet: PlanetSelection) => {
          setPlanetInfo(planet);
          setSelectedPlanet(planet.name);
        }}
      />

      {/* Planet Info UI */}
      <PlanetInfo planet={planetInfo} onClose={() => setPlanetInfo(null)} />

      {/* Speed Control */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
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
  );
}
