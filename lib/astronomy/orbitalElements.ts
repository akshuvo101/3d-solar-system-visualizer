/**
 * Keplerian orbital elements for the major planets.
 *
 * Reference epoch:
 * J2000.0 = 2000-01-01 12:00:00 UTC
 *
 * Units:
 * - semiMajorAxisAU: Astronomical Units
 * - angles: degrees
 * - orbitalPeriodDays: Earth days
 *
 * These values provide an educational / engineering-level
 * approximation of heliocentric planetary motion.
 */

export type OrbitalElements = {
  semiMajorAxisAU: number;
  eccentricity: number;
  inclinationDeg: number;
  longitudeOfAscendingNodeDeg: number;
  argumentOfPeriapsisDeg: number;
  meanAnomalyDeg: number;
  orbitalPeriodDays: number;
};

export const ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  Mercury: {
    semiMajorAxisAU: 0.38709927,
    eccentricity: 0.20563593,
    inclinationDeg: 7.00497902,
    longitudeOfAscendingNodeDeg: 48.33076593,
    argumentOfPeriapsisDeg: 77.45779628,
    meanAnomalyDeg: 174.7948,
    orbitalPeriodDays: 87.969,
  },

  Venus: {
    semiMajorAxisAU: 0.72333566,
    eccentricity: 0.00677672,
    inclinationDeg: 3.39467605,
    longitudeOfAscendingNodeDeg: 76.67984255,
    argumentOfPeriapsisDeg: 131.60246718,
    meanAnomalyDeg: 50.4161,
    orbitalPeriodDays: 224.701,
  },

  Earth: {
    semiMajorAxisAU: 1.00000261,
    eccentricity: 0.01671123,
    inclinationDeg: -0.00001531,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 102.93768193,
    meanAnomalyDeg: 357.51716,
    orbitalPeriodDays: 365.256,
  },

  Mars: {
    semiMajorAxisAU: 1.52371034,
    eccentricity: 0.0933941,
    inclinationDeg: 1.84969142,
    longitudeOfAscendingNodeDeg: 49.55953891,
    argumentOfPeriapsisDeg: -23.94362959,
    meanAnomalyDeg: 19.373,
    orbitalPeriodDays: 686.98,
  },

  Jupiter: {
    semiMajorAxisAU: 5.202887,
    eccentricity: 0.04838624,
    inclinationDeg: 1.30439695,
    longitudeOfAscendingNodeDeg: 100.47390909,
    argumentOfPeriapsisDeg: 14.72847983,
    meanAnomalyDeg: 20.02,
    orbitalPeriodDays: 4332.59,
  },

  Saturn: {
    semiMajorAxisAU: 9.53667594,
    eccentricity: 0.05386179,
    inclinationDeg: 2.48599187,
    longitudeOfAscendingNodeDeg: 113.66242448,
    argumentOfPeriapsisDeg: 92.59887831,
    meanAnomalyDeg: 317.0207,
    orbitalPeriodDays: 10759.22,
  },

  Uranus: {
    semiMajorAxisAU: 19.18916464,
    eccentricity: 0.04725744,
    inclinationDeg: 0.77263783,
    longitudeOfAscendingNodeDeg: 74.01692503,
    argumentOfPeriapsisDeg: 170.9542763,
    meanAnomalyDeg: 141.049,
    orbitalPeriodDays: 30688.5,
  },

  Neptune: {
    semiMajorAxisAU: 30.06992276,
    eccentricity: 0.00859048,
    inclinationDeg: 1.77004347,
    longitudeOfAscendingNodeDeg: 131.78422574,
    argumentOfPeriapsisDeg: 44.96476227,
    meanAnomalyDeg: -86.819,
    orbitalPeriodDays: 60182,
  },
};