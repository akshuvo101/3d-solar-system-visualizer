/**
 * Convert a JavaScript Date to Julian Date.
 *
 * Julian Date is a continuous count of days used in astronomy.
 *
 * The calculation is based on UTC because astronomical calculations
 * should not depend on the user's local timezone.
 */

export const JULIAN_DATE_J2000 = 2451545.0;

/**
 * Convert a JavaScript Date into Julian Date.
 *
 * @param date - JavaScript Date object
 * @returns Julian Date
 */
export function dateToJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Calculate the number of days elapsed since the J2000.0 epoch.
 *
 * J2000.0 = 2000-01-01 12:00:00 UTC
 *
 * @param date - JavaScript Date object
 * @returns Days since J2000.0
 */
export function daysSinceJ2000(date: Date): number {
  return dateToJulianDate(date) - JULIAN_DATE_J2000;
}