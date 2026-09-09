import {
  SimulationMode,
  PlaybackSpeed,
} from "@/lib/simulationTime";
import * as THREE from "three";

export type PlasmaColors = {
  a: string;
  b: string;
  c: string;
};

// 🌙 Visual Moon Configuration
export type MoonSystemType = {
  name: string;
  size: number;
  distance: number;
  speed: number;
  inclination?: number;
  angle?: number;
  color?: string;
};

export type PlanetType = {
  name: string;
  size: number;
  distance: number;

  // 🪐 Real orbital period
  orbitalPeriodDays: number;

  // 🔄 Axial rotation
  rotationPeriodHours: number;
  rotationDirection?: 1 | -1;

  // Legacy / informational
  speed?: number;
  realSpeed?: number;

  texture: string;
  moons: number;

  // 🌙 Major moons rendered visually
  moonSystem?: MoonSystemType[];

  // Planet information
  type?: string;
  radius?: number;
  mass?: number;
  gravity?: number;
  temperature?: string;
  dayLength?: string;
  yearLength?: string;
  gravityNote?: string;

  plasmaColors?: PlasmaColors;
  plasmaSpeed?: number;
  fact?: string;
};

export type PlanetSelection = {
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

export type PlanetComponentProps = {
  planet: PlanetType;
  simulationMode: SimulationMode;
  playbackSpeed: PlaybackSpeed;
  selectedPlanet: string;
  setRef: (
    name: string,
    ref: React.RefObject<THREE.Group | null>
  ) => void;
  onClick: (planet: PlanetSelection) => void;
};

export type CameraControllerProps = {
  selectedPlanet: string;
  refs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;
};