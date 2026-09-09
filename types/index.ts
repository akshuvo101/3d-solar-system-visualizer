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

  // ─────────────────────────────────────────────
  // Orbital motion
  // ─────────────────────────────────────────────

  orbitalPeriodDays: number;

  // ─────────────────────────────────────────────
  // Physical rotation
  // ─────────────────────────────────────────────

  /**
   * Sidereal rotation period in Earth hours.
   *
   * Example:
   * Earth ≈ 23.934 hours
   * Jupiter ≈ 9.925 hours
   */
  rotationPeriodHours: number;

  /**
   * Legacy/simple rotation direction.
   *
   *  1  = prograde
   * -1  = retrograde
   *
   * Kept for compatibility with the existing
   * simulation architecture.
   */
  rotationDirection?: 1 | -1;

  /**
   * Planetary axial tilt / obliquity in degrees.
   *
   * Examples:
   * Earth   ≈ 23.44°
   * Mars    ≈ 25.19°
   * Saturn  ≈ 26.73°
   * Uranus  ≈ 97.77°
   */
  axialTiltDeg?: number;

  /**
   * Absolute rotation angle at the J2000.0 epoch.
   *
   * J2000.0:
   * 2000-01-01 12:00:00 UTC
   *
   * This is used together with rotationRateDegPerDay
   * to calculate the planet's absolute rotational phase.
   */
  rotationPhaseAtJ2000Deg?: number;

  /**
   * Planetary rotation rate in degrees per Earth day.
   *
   * Positive  = prograde rotation
   * Negative  = retrograde rotation
   *
   * This allows the rotation phase to be calculated
   * directly from astronomical date/time.
   */
  rotationRateDegPerDay?: number;

  // ─────────────────────────────────────────────
  // Existing simulation speed values
  // ─────────────────────────────────────────────

  speed?: number;
  realSpeed?: number;

  // ─────────────────────────────────────────────
  // Visual / physical data
  // ─────────────────────────────────────────────

  texture: string;
  moons: number;

  moonSystem?: MoonSystemType[];

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

  /**
   * Absolute simulated date/time.
   *
   * This is the shared simulation clock used for
   * orbital position calculations.
   */
  simulationTimeRef: React.MutableRefObject<number>;

  /**
   * Exact simulated Earth-days elapsed during
   * the current animation frame.
   *
   * Shared by all planets so orbital motion and
   * axial rotation use the same simulation time.
   */
  simulationDeltaDaysRef: React.MutableRefObject<number>;

  setRef: (
    name: string,
    ref: React.RefObject<THREE.Group | null>
  ) => void;

  onClick: (
    planet: PlanetSelection
  ) => void;
};

export type CameraControllerProps = {
  selectedPlanet: string;

  refs: React.MutableRefObject<
    Record<
      string,
      React.RefObject<THREE.Group | null>
    >
  >;
};