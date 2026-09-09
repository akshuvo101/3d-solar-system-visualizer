"use client";

import { useState } from "react";
import SolarSystem3D from "@/components/solar/SolarSystem3D";
import Sidebar from "@/components/layout/Sidebar";
import AudioPlayer from "@/components/common/AudioPlayer";
import PlanetInfo from "@/components/common/PlanetInfo";
import LiveTime from "@/components/common/LiveTime";
import { planetData } from "@/lib/planetData";
import {
  SIMULATION_MODES,
  PLAYBACK_SPEEDS,
  DEFAULT_PLAYBACK_SPEED,
  type SimulationMode,
  type PlaybackSpeed,
} from "@/lib/simulationTime";

type PlanetSelection = {
  name: string;
  distance?: number;
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

/*
 * --------------------------------------------------
 * Planet Audio Map
 * --------------------------------------------------
 */

const getPlanetAudioUrl = (
  name: string,
): string | undefined => {
  const audioMap: Record<string, string> = {
    Sun: "/audio/sun.mp3",
    Mercury: "/audio/mercury.mp3",
    Venus: "/audio/venus.mp3",
    Earth: "/audio/earth.mp3",
    Mars: "/audio/mars.mp3",
    Jupiter: "/audio/jupiter.mp3",
    Saturn: "/audio/saturn.mp3",
    Uranus: "/audio/uranus.mp3",
    Neptune: "/audio/neptune.mp3",
  };

  return audioMap[name];
};

export default function SimulationPage() {
  /*
   * --------------------------------------------------
   * Simulation Mode
   * --------------------------------------------------
   */

  const [simulationMode, setSimulationMode] =
    useState<SimulationMode>("year");

  /*
   * --------------------------------------------------
   * Playback Speed
   * --------------------------------------------------
   *
   * Controls simulation speed independently
   * from the selected simulation mode.
   *
   * Example:
   * Year ×1  = 1 Earth year / 1 real hour
   * Year ×2  = 1 Earth year / 30 minutes
   * Year ×5  = 1 Earth year / 12 minutes
   * Year ×10 = 1 Earth year / 6 minutes
   */

  const [playbackSpeed, setPlaybackSpeed] =
    useState<PlaybackSpeed>(
      DEFAULT_PLAYBACK_SPEED,
    );

  /*
   * --------------------------------------------------
   * Selected Planet
   * --------------------------------------------------
   */

  const [selectedPlanet, setSelectedPlanet] =
    useState("Sun");

  /*
   * --------------------------------------------------
   * Planet Information
   * --------------------------------------------------
   */

  const [planetInfo, setPlanetInfo] =
    useState<PlanetSelection | null>(null);

  /*
   * --------------------------------------------------
   * Music State
   * --------------------------------------------------
   *
   * Background music is ON by default.
   */

  const [musicOn, setMusicOn] = useState(true);

  /*
   * --------------------------------------------------
   * Description Audio State
   * --------------------------------------------------
   *
   * Controls the selected planet narration.
   */

  const [descriptionAudioOn, setDescriptionAudioOn] =
    useState(true);

  /*
   * --------------------------------------------------
   * Planet Audio
   * --------------------------------------------------
   *
   * Starts only after the user selects/clicks
   * a planet.
   */

  const [planetAudio, setPlanetAudio] =
    useState<string | undefined>(undefined);

  /*
   * --------------------------------------------------
   * Background Music
   * --------------------------------------------------
   */

  const backgroundAudioUrl =
    "/audio/background.mp4";

  /*
   * --------------------------------------------------
   * Sidebar Planet Selection
   * --------------------------------------------------
   */

  const handlePlanetSelect = (name: string) => {
    setSelectedPlanet(name);
    setPlanetInfo(null);

    /*
     * Play selected planet's narration
     */

    setPlanetAudio(
      getPlanetAudioUrl(name),
    );

    /*
     * --------------------------------------------------
     * Sun special data
     * --------------------------------------------------
     */

    if (name === "Sun") {
      setPlanetInfo({
        name: "Sun",
        fact:
          "The Sun is the star at the center of our Solar System. Its enormous gravity keeps the planets, dwarf planets, asteroids, and many other objects bound in orbit.",
        type: "G-type Main Sequence Star",
        radius: 696340,
        mass: 1.989e30,
        gravity: 274,
        temperature:
          "About 5,500°C at the visible surface and millions of degrees in the core",
        dayLength:
          "About 25–35 Earth days",
        yearLength:
          "About 225–250 million years around the Milky Way",
        moons: 0,
        realSpeed: 0,
        gravityNote:
          "The Sun contains about 99.8% of the total mass of the Solar System.",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Other Planet Data
     * --------------------------------------------------
     */

    const selectedPlanetData =
      planetData.find(
        (planet) => planet.name === name,
      );

    if (selectedPlanetData) {
      setPlanetInfo(selectedPlanetData);
    }
  };

  /*
   * --------------------------------------------------
   * 3D Planet Click
   * --------------------------------------------------
   */

  const handlePlanetClick = (
    planet: PlanetSelection,
  ) => {
    setPlanetInfo(planet);
    setSelectedPlanet(planet.name);

    /*
     * Play selected planet's narration
     */

    setPlanetAudio(
      getPlanetAudioUrl(planet.name),
    );
  };

  return (
    <main
      className="relative h-screen w-full overflow-hidden bg-black"
      aria-label="Solar system simulation"
    >
      {/* ================================================== */}
      {/* Sidebar */}
      {/* ================================================== */}

      <Sidebar
        onSelect={handlePlanetSelect}
        selectedPlanet={selectedPlanet}
      />

      {/* ================================================== */}
      {/* Audio Player */}
      {/* ================================================== */}

      <AudioPlayer
        backgroundUrl={backgroundAudioUrl}
        planetUrl={
          descriptionAudioOn
            ? planetAudio
            : undefined
        }
        isEnabled={musicOn}
      />

      {/* ================================================== */}
      {/* Live Time + Audio Controls */}
      {/* ================================================== */}

      <div className="fixed right-3 top-3 z-50 flex flex-col items-end gap-1.5 sm:right-4 sm:top-4">
        <div className="text-right text-white">
          <LiveTime />
        </div>

        <div className="flex flex-col items-end gap-1.5 text-[10px] font-medium sm:text-[11px]">
          {/* Music */}

          <button
            type="button"
            onClick={() =>
              setMusicOn((prev) => !prev)
            }
            className={`flex min-h-10 items-center gap-1.5 text-left transition-all duration-300 ${musicOn
                ? "text-white hover:text-white/80"
                : "text-white/60 hover:text-white/80"
              }`}
            aria-label={
              musicOn
                ? "Turn music off"
                : "Turn music on"
            }
            aria-pressed={musicOn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              {musicOn ? (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5 6 9H3v6h3l5 4V5Z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.5 8.5a5 5 0 0 1 0 7"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 5.5a9 9 0 0 1 0 13"
                  />
                </>
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5 6 9H3v6h3l5 4V5Z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m17 9 4 4m0-4-4 4"
                  />
                </>
              )}
            </svg>

            <span>
              {musicOn
                ? "Music ON"
                : "Music OFF"}
            </span>
          </button>

          {/* Description */}

          <button
            type="button"
            onClick={() =>
              setDescriptionAudioOn(
                (prev) => !prev,
              )
            }
            disabled={!musicOn}
            className={`min-h-10 text-left transition-all duration-300 ${musicOn
                ? descriptionAudioOn
                  ? "text-pink-100 hover:text-pink-50"
                  : "text-white/60 hover:text-white/80"
                : "cursor-not-allowed text-white/35"
              }`}
            aria-label={
              descriptionAudioOn
                ? "Turn description audio off"
                : "Turn description audio on"
            }
            aria-pressed={
              descriptionAudioOn
            }
          >
            {musicOn
              ? descriptionAudioOn
                ? "Description ON"
                : "Description OFF"
              : "Description OFF"}
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* Planet Information */}
      {/* ================================================== */}

      <PlanetInfo planet={planetInfo} />

      {/* ================================================== */}
      {/* 3D Solar System */}
      {/* ================================================== */}

      <SolarSystem3D
        simulationMode={simulationMode}
        playbackSpeed={playbackSpeed}
        selectedPlanet={selectedPlanet}
        onPlanetClick={handlePlanetClick}
      />

      {/* ================================================== */}
      {/* Simulation Controls */}
      {/* ================================================== */}

      <div className="fixed bottom-4 right-3 z-20 sm:right-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-black/40 p-1.5 backdrop-blur-sm">
          {(
            Object.keys(
              SIMULATION_MODES,
            ) as SimulationMode[]
          ).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                setSimulationMode(mode)
              }
              className={`rounded-lg px-2 py-1.5 text-[9px] font-medium transition-all duration-200 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm ${simulationMode === mode
                  ? "bg-white text-black"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
            >
              {SIMULATION_MODES[mode].label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================== */}
      {/* Playback Speed — Right Side Column */}
      {/* ================================================== */}

      <div className="fixed right-3 top-1/2 z-20 -translate-y-1/2 sm:right-4">
        <div className="flex flex-col items-center gap-1.5 rounded-xl bg-black/40 p-1.5 backdrop-blur-sm sm:gap-2 sm:p-2">
          {/* Speed Label */}

          <span className="mb-0.5 text-[8px] font-medium uppercase tracking-wider text-white/40 sm:text-[9px]">
            Speed
          </span>

          {/* Speed Buttons */}

          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() =>
                setPlaybackSpeed(speed)
              }
              className={`flex h-7 w-8 items-center justify-center rounded-lg text-[9px] font-medium transition-all duration-200 sm:h-8 sm:w-9 sm:text-[10px] md:h-9 md:w-10 md:text-xs ${playbackSpeed === speed
                  ? "bg-white text-black shadow-lg shadow-white/10"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              aria-label={`Set playback speed to ${speed}x`}
              aria-pressed={
                playbackSpeed === speed
              }
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}