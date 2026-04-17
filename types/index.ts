
import * as THREE from "three";

export type PlasmaColors = {
  a: string;
  b: string;
  c: string;
};

export type PlanetType = {
  name: string;
  size: number;
  distance: number;
  speed: number;
  realSpeed?: number;
  texture: string;
  moons: number;

  // ✅ NEW FIELDS
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

  // ✅ ADD THESE
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
  speed: number;
  setRef: (name: string, ref: React.RefObject<THREE.Group | null>) => void;
  onClick: (planet: PlanetSelection) => void;
};

export type CameraControllerProps = {
  selectedPlanet: string;
  refs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;
};