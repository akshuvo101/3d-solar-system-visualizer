export type SimulationMode = "day" | "month" | "year";

export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10;

const SECONDS_PER_DAY = 24 * 60 * 60;

export const SIMULATION_MODES = {
  day: {
    label: "1 Day",

    // Real time:
    // 1 real second = 1 simulation second
    daysPerSecond: 1 / SECONDS_PER_DAY,
  },

  month: {
    label: "1 Month",

    // 30 simulation days = 1 real hour
    daysPerSecond: 30 / (60 * 60),
  },

  year: {
    label: "1 Year",

    // 365.256 simulation days = 1 real hour
    daysPerSecond: 365.256 / (60 * 60),
  },
} as const;

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  0.5,
  1,
  2,
  5,
  10,
];

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1;

export const DEFAULT_SIMULATION_MODE: SimulationMode = "day";