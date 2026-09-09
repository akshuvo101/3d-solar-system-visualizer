import {
  daysSinceJ2000,
  dateToJulianDate,
} from "./julianDate";

import {
  ORBITAL_ELEMENTS,
  type OrbitalElements,
} from "./orbitalElements";

import {
  calculateOrbitalRadius,
  degreesToRadians,
  eccentricToTrueAnomaly,
  solveKeplersEquation,
  normalizeAngleRadians,
} from "./kepler";

const TWO_PI = Math.PI * 2;

/**
 * Heliocentric position in the J2000 ecliptic coordinate system.
 *
 * Units:
 * - x, y, z -> Astronomical Units (AU)
 *
 * Coordinate system:
 * - X/Y -> J2000 ecliptic plane
 * - Z   -> perpendicular to the ecliptic plane
 */
export type HeliocentricPosition = {
  x: number;
  y: number;
  z: number;
  distanceAU: number;
  trueAnomalyRadians: number;
  meanAnomalyRadians: number;
  julianDate: number;
};

/**
 * Normalize a planet name so the lookup remains predictable.
 */
function normalizePlanetName(
  planetName: string,
): string {
  return planetName.trim();
}

/**
 * Get orbital elements for a planet.
 */
function getOrbitalElements(
  planetName: string,
): OrbitalElements {
  const normalizedName =
    normalizePlanetName(planetName);

  const elements =
    ORBITAL_ELEMENTS[normalizedName];

  if (!elements) {
    throw new Error(
      `No orbital elements found for planet: ${planetName}`,
    );
  }

  return elements;
}

/**
 * Calculate the mean anomaly of a planet at a given date.
 *
 * Mean anomaly describes the planet's progress around
 * its elliptical orbit measured from perihelion.
 *
 * Formula:
 *
 *   M = M0 + n * Δt
 *
 * where:
 *
 *   M0 = mean anomaly at J2000
 *   n  = mean motion
 *   Δt = days since J2000
 */
function calculateMeanAnomaly(
  elements: OrbitalElements,
  daysFromJ2000: number,
): number {
  const initialMeanAnomaly =
    degreesToRadians(
      elements.meanAnomalyDeg,
    );

  const meanMotion =
    TWO_PI /
    elements.orbitalPeriodDays;

  const meanAnomaly =
    initialMeanAnomaly +
    meanMotion * daysFromJ2000;

  return normalizeAngleRadians(
    meanAnomaly,
  );
}

/**
 * Convert orbital-plane coordinates into
 * heliocentric ecliptic coordinates.
 *
 * Orbital-plane coordinates:
 *
 *   x' = r cos(ν)
 *   y' = r sin(ν)
 *   z' = 0
 *
 * Then rotate using:
 *
 *   Ω = longitude of ascending node
 *   i = orbital inclination
 *   ω = argument of periapsis
 */
function orbitalPlaneToEcliptic(
  radiusAU: number,
  trueAnomalyRadians: number,
  elements: OrbitalElements,
): {
  x: number;
  y: number;
  z: number;
} {
  const inclination =
    degreesToRadians(
      elements.inclinationDeg,
    );

  const longitudeOfAscendingNode =
    degreesToRadians(
      elements.longitudeOfAscendingNodeDeg,
    );

  const argumentOfPeriapsis =
    degreesToRadians(
      elements.argumentOfPeriapsisDeg,
    );

  /**
   * Argument of latitude:
   *
   *   u = ω + ν
   */
  const argumentOfLatitude =
    argumentOfPeriapsis +
    trueAnomalyRadians;

  const cosOmega = Math.cos(
    longitudeOfAscendingNode,
  );

  const sinOmega = Math.sin(
    longitudeOfAscendingNode,
  );

  const cosInclination = Math.cos(
    inclination,
  );

  const sinInclination = Math.sin(
    inclination,
  );

  const cosU = Math.cos(
    argumentOfLatitude,
  );

  const sinU = Math.sin(
    argumentOfLatitude,
  );

  /**
   * Rotation from perifocal/orbital coordinates
   * to heliocentric ecliptic coordinates.
   */
  const x =
    radiusAU *
    (
      cosOmega * cosU -
      sinOmega * sinU * cosInclination
    );

  const y =
    radiusAU *
    (
      sinOmega * cosU +
      cosOmega * sinU * cosInclination
    );

  const z =
    radiusAU *
    (
      sinU * sinInclination
    );

  return {
    x,
    y,
    z,
  };
}

/**
 * Calculate the heliocentric position of a planet
 * for a specific date.
 *
 * This is the main function used by the simulation.
 *
 * @param planetName - Mercury, Venus, Earth, etc.
 * @param date - Date/time used as the astronomical simulation time
 *
 * @returns Heliocentric position in AU
 */
export function getPlanetHeliocentricPosition(
  planetName: string,
  date: Date,
): HeliocentricPosition {
  const elements =
    getOrbitalElements(planetName);

  /**
   * Step 1:
   * Calculate elapsed time since J2000.
   */
  const daysFromJ2000 =
    daysSinceJ2000(date);

  /**
   * Step 2:
   * Calculate mean anomaly.
   */
  const meanAnomalyRadians =
    calculateMeanAnomaly(
      elements,
      daysFromJ2000,
    );

  /**
   * Step 3:
   * Solve Kepler's equation:
   *
   * M = E - e sin(E)
   */
  const eccentricAnomalyRadians =
    solveKeplersEquation(
      meanAnomalyRadians,
      elements.eccentricity,
    );

  /**
   * Step 4:
   * Convert eccentric anomaly into
   * true anomaly.
   */
  const trueAnomalyRadians =
    eccentricToTrueAnomaly(
      eccentricAnomalyRadians,
      elements.eccentricity,
    );

  /**
   * Step 5:
   * Calculate actual heliocentric
   * distance from the Sun.
   */
  const distanceAU =
    calculateOrbitalRadius(
      elements.semiMajorAxisAU,
      elements.eccentricity,
      eccentricAnomalyRadians,
    );

  /**
   * Step 6:
   * Convert the orbital-plane position
   * into 3D heliocentric ecliptic coordinates.
   */
  const position =
    orbitalPlaneToEcliptic(
      distanceAU,
      trueAnomalyRadians,
      elements,
    );

  return {
    ...position,
    distanceAU,
    trueAnomalyRadians,
    meanAnomalyRadians,
    julianDate:
      dateToJulianDate(date),
  };
}