export type SimulationMode = "day" | "month" | "year";

export const SIMULATION_MODES = {
  day: {
    label: "1 Day",
    daysPerSecond: 0.02,
  },

  month: {
    label: "1 Month",
    daysPerSecond: 0.6,
  },

  year: {
    label: "1 Year",
    daysPerSecond: 7.3,
  },
} as const;

export const DEFAULT_SIMULATION_MODE: SimulationMode = "day";