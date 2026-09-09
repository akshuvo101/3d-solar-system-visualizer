import { daysSinceJ2000 } from "./julianDate";
import type { PlanetType } from "@/types";

const FULL_ROTATION_DEGREES = 360;

/**
 * Normalize an angle into the 0°–360° range.
 *
 * Use this only when a bounded angle is actually required.
 */
export function normalizeRotationDegrees(
  angleDeg: number,
): number {
  const normalized =
    angleDeg % FULL_ROTATION_DEGREES;

  return normalized < 0
    ? normalized + FULL_ROTATION_DEGREES
    : normalized;
}

/**
 * Calculate the planet's absolute rotation angle.
 *
 * IMPORTANT:
 * This function intentionally DOES NOT normalize the result.
 *
 * Example:
 *
 * 359°
 * 360°
 * 361°
 * 362°
 * ...
 * 719°
 * 720°
 *
 * This keeps the rotation mathematically continuous instead of
 * resetting the angle back to 0° after every revolution.
 */
export function getPlanetRotationPhaseDeg(
  planet: PlanetType,
  date: Date,
): number {
  const rotationPhaseAtJ2000 =
    planet.rotationPhaseAtJ2000Deg ?? 0;

  /*
   * Prefer the astronomical rotation rate when available.
   *
   * Positive  = prograde
   * Negative  = retrograde
   */
  const rotationRate =
    planet.rotationRateDegPerDay ??
    (
      (FULL_ROTATION_DEGREES * 24) /
      planet.rotationPeriodHours
    ) *
      (planet.rotationDirection ?? 1);

  /*
   * Number of simulated days since J2000.0.
   */
  const daysFromJ2000 =
    daysSinceJ2000(date);

  /*
   * Continuous absolute rotation angle.
   *
   * DO NOT apply modulo here.
   */
  const rotationAngle =
    rotationPhaseAtJ2000 +
    rotationRate *
      daysFromJ2000;

  return rotationAngle;
}

/**
 * Convert degrees to radians.
 */
export function rotationDegreesToRadians(
  degrees: number,
): number {
  return (
    degrees *
    (Math.PI / FULL_ROTATION_DEGREES)
  );
}

/**
 * Get continuous absolute rotation phase in radians.
 *
 * The returned value is intentionally allowed to exceed
 * 2π so the rotation remains continuous.
 */
export function getPlanetRotationPhaseRadians(
  planet: PlanetType,
  date: Date,
): number {
  return rotationDegreesToRadians(
    getPlanetRotationPhaseDeg(
      planet,
      date,
    ),
  );
}

/**
 * Get the planet's axial tilt in radians.
 */
export function getPlanetAxialTiltRadians(
  planet: PlanetType,
): number {
  const axialTiltDeg =
    planet.axialTiltDeg ?? 0;

  return rotationDegreesToRadians(
    axialTiltDeg,
  );
}