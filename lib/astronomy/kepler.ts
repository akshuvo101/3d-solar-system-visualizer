/**
 * Kepler's Equation utilities.
 *
 * Kepler's equation:
 *
 *   M = E - e * sin(E)
 *
 * Where:
 * - M = Mean Anomaly
 * - E = Eccentric Anomaly
 * - e = Orbital Eccentricity
 *
 * Because E cannot be isolated algebraically, we solve it
 * numerically using the Newton-Raphson method.
 */

const TWO_PI = Math.PI * 2;

/**
 * Normalize an angle in radians to the range [0, 2π).
 */
export function normalizeAngleRadians(angle: number): number {
  const normalized = angle % TWO_PI;

  return normalized < 0
    ? normalized + TWO_PI
    : normalized;
}

/**
 * Normalize an angle in radians to the range [-π, π).
 *
 * This is useful for numerical solving because it keeps
 * the value close to the region we are solving around.
 */
export function normalizeAngleSignedRadians(
  angle: number,
): number {
  let normalized = angle % TWO_PI;

  if (normalized >= Math.PI) {
    normalized -= TWO_PI;
  }

  if (normalized < -Math.PI) {
    normalized += TWO_PI;
  }

  return normalized;
}

/**
 * Convert degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Solve Kepler's equation using Newton-Raphson iteration.
 *
 * Equation:
 *
 *   E - e * sin(E) - M = 0
 *
 * Newton-Raphson:
 *
 *   E(next) = E - f(E) / f'(E)
 *
 * Where:
 *
 *   f(E)  = E - e * sin(E) - M
 *   f'(E) = 1 - e * cos(E)
 *
 * @param meanAnomalyRadians - Mean anomaly in radians
 * @param eccentricity - Orbital eccentricity
 * @param tolerance - Numerical convergence tolerance
 * @param maxIterations - Maximum number of iterations
 *
 * @returns Eccentric anomaly in radians
 */
export function solveKeplersEquation(
  meanAnomalyRadians: number,
  eccentricity: number,
  tolerance = 1e-10,
  maxIterations = 20,
): number {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error(
      `Kepler solver expects 0 <= eccentricity < 1. Received: ${eccentricity}`,
    );
  }

  const M = normalizeAngleSignedRadians(meanAnomalyRadians);

  /**
   * Initial guess.
   *
   * For low-eccentricity planetary orbits, using M is
   * already an excellent starting point.
   *
   * For higher eccentricity, π provides a more stable
   * initial estimate.
   */
  let eccentricAnomaly =
    eccentricity < 0.8
      ? M
      : Math.PI;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const sinE = Math.sin(eccentricAnomaly);
    const cosE = Math.cos(eccentricAnomaly);

    const functionValue =
      eccentricAnomaly -
      eccentricity * sinE -
      M;

    const derivative =
      1 -
      eccentricity * cosE;

    const correction =
      functionValue / derivative;

    eccentricAnomaly -= correction;

    if (Math.abs(correction) < tolerance) {
      return normalizeAngleRadians(
        eccentricAnomaly,
      );
    }
  }

  /**
   * Returning the latest approximation is preferable
   * to silently producing an invalid orbital position.
   *
   * The planetary eccentricities used in this project
   * are well within the normal range for this solver.
   */
  return normalizeAngleRadians(
    eccentricAnomaly,
  );
}

/**
 * Calculate the true anomaly from eccentric anomaly.
 *
 * Formula:
 *
 *   ν = 2 atan2(
 *         √(1+e) sin(E/2),
 *         √(1-e) cos(E/2)
 *       )
 *
 * @param eccentricAnomalyRadians - Eccentric anomaly
 * @param eccentricity - Orbital eccentricity
 *
 * @returns True anomaly in radians
 */
export function eccentricToTrueAnomaly(
  eccentricAnomalyRadians: number,
  eccentricity: number,
): number {
  const sinHalfE = Math.sin(
    eccentricAnomalyRadians / 2,
  );

  const cosHalfE = Math.cos(
    eccentricAnomalyRadians / 2,
  );

  const numerator =
    Math.sqrt(1 + eccentricity) *
    sinHalfE;

  const denominator =
    Math.sqrt(1 - eccentricity) *
    cosHalfE;

  return normalizeAngleRadians(
    2 * Math.atan2(
      numerator,
      denominator,
    ),
  );
}

/**
 * Calculate orbital radius from eccentric anomaly.
 *
 * Formula:
 *
 *   r = a(1 - e cos(E))
 *
 * @param semiMajorAxisAU - Semi-major axis in AU
 * @param eccentricity - Orbital eccentricity
 * @param eccentricAnomalyRadians - Eccentric anomaly
 *
 * @returns Distance from the Sun in AU
 */
export function calculateOrbitalRadius(
  semiMajorAxisAU: number,
  eccentricity: number,
  eccentricAnomalyRadians: number,
): number {
  return (
    semiMajorAxisAU *
    (1 -
      eccentricity *
        Math.cos(eccentricAnomalyRadians))
  );
}