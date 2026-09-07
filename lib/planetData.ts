import { PlanetType } from "@/types";

export const planetData: PlanetType[] = [
  {
    name: "Mercury",
    size: 1,
    distance: 12,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 87.969,
    rotationPeriodHours: 1407.6,
    rotationDirection: 1,

    realSpeed: 170000,
    texture: "/textures/mercury.jpeg",
    moons: 0,

    type: "Terrestrial",
    radius: 2439,
    mass: 3.30e23,
    gravity: 3.7,
    temperature: "-180°C to 430°C",
    dayLength: "59 Earth days",
    yearLength: "88 days",
    gravityNote: "About 38% of Earth's gravity",

    fact: "Mercury is the closest planet to the Sun ☀️",

    plasmaColors: {
      a: "#555555",
      b: "#888888",
      c: "#bbbbbb",
    },
  },

  {
    name: "Venus",
    size: 1.5,
    distance: 16,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 224.701,
    rotationPeriodHours: 5832,
    rotationDirection: -1,

    realSpeed: 126000,
    texture: "/textures/venus.jpeg",
    moons: 0,

    type: "Terrestrial",
    radius: 6052,
    mass: 4.87e24,
    gravity: 8.87,
    temperature: "≈ 465°C",
    dayLength: "243 Earth days",
    yearLength: "225 days",
    gravityNote: "Very similar to Earth",

    fact: "Venus is the hottest planet in the solar system 🔥",

    plasmaColors: {
      a: "#ffcc66",
      b: "#ff8844",
      c: "#ff5500",
    },
  },

  {
    name: "Earth",
    size: 2,
    distance: 20,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.934,
    rotationDirection: 1,

    realSpeed: 107000,
    texture: "/textures/earth.jpg",
    moons: 1,

    // 🌙 Earth's Moon
    moonSystem: [
      {
        name: "Moon",
        size: 0.32,
        distance: 3.8,
        speed: 1.4,
        inclination: 5.1,
        angle: 0,
        color: "#b8b8b8",
      },
    ],

    type: "Terrestrial",
    radius: 6371,
    mass: 5.97e24,
    gravity: 9.8,
    temperature: "-88°C to 58°C",
    dayLength: "24 hours",
    yearLength: "365 days",
    gravityNote: "Same as Earth 🌍",

    fact: "Earth is the only planet known to support life 🌍",

    plasmaColors: {
      a: "#2e8bff",
      b: "#00c6ff",
      c: "#a0e9ff",
    },
  },

  {
    name: "Mars",
    size: 1.3,
    distance: 24,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.623,
    rotationDirection: 1,

    realSpeed: 87000,
    texture: "/textures/mars.jpg",
    moons: 2,

    // 🌙 Mars — Phobos & Deimos
    moonSystem: [
      {
        name: "Phobos",
        size: 0.16,
        distance: 2.3,
        speed: 2.4,
        inclination: 1.1,
        angle: 0,
        color: "#8f8578",
      },
      {
        name: "Deimos",
        size: 0.11,
        distance: 3.4,
        speed: 1.4,
        inclination: 1.8,
        angle: 2.8,
        color: "#a89f92",
      },
    ],

    type: "Terrestrial",
    radius: 3389,
    mass: 6.42e23,
    gravity: 3.71,
    temperature: "-125°C to 20°C",
    dayLength: "24.6 hours",
    yearLength: "687 days",
    gravityNote: "About 38% of Earth's gravity",

    fact: "Mars is known as the Red Planet 🔴",

    plasmaColors: {
      a: "#ff4d4d",
      b: "#ff8844",
      c: "#ffcc99",
    },
  },

  {
    name: "Jupiter",
    size: 4,
    distance: 32,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.925,
    rotationDirection: 1,

    realSpeed: 47000,
    texture: "/textures/jupiter.jpg",
    moons: 79,

    // 🌙 Jupiter — Major Galilean moons
    // We visually simulate the major moons instead of rendering all 79.
    moonSystem: [
      {
        name: "Io",
        size: 0.22,
        distance: 5.2,
        speed: 2.2,
        inclination: 0.1,
        angle: 0,
        color: "#d6b85a",
      },
      {
        name: "Europa",
        size: 0.18,
        distance: 6.7,
        speed: 1.7,
        inclination: 0.5,
        angle: 1.5,
        color: "#d8c9a6",
      },
      {
        name: "Ganymede",
        size: 0.29,
        distance: 8.5,
        speed: 1.2,
        inclination: -0.8,
        angle: 3,
        color: "#8f8779",
      },
      {
        name: "Callisto",
        size: 0.25,
        distance: 11,
        speed: 0.8,
        inclination: 1.2,
        angle: 4.6,
        color: "#5f5a52",
      },
    ],

    type: "Gas Giant",
    radius: 69911,
    mass: 1.90e27,
    gravity: 24.79,
    temperature: "-145°C",
    dayLength: "10 hours",
    yearLength: "12 years",
    gravityNote: "About 2.5x Earth's gravity",

    fact: "Jupiter is the largest planet in the solar system 🪐",

    plasmaColors: {
      a: "#d9a066",
      b: "#c97b2b",
      c: "#f2d2a2",
    },
  },

  {
    name: "Saturn",
    size: 3.5,
    distance: 40,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 10759.22,
    rotationPeriodHours: 10.656,
    rotationDirection: 1,

    realSpeed: 35000,
    texture: "/textures/saturn.jpg",
    moons: 83,

    // 🌙 Saturn — Selected major moons
    moonSystem: [
      {
        name: "Mimas",
        size: 0.12,
        distance: 5.2,
        speed: 2.1,
        inclination: 1.5,
        angle: 0,
        color: "#b7b1a7",
      },
      {
        name: "Enceladus",
        size: 0.14,
        distance: 6.2,
        speed: 1.8,
        inclination: -0.8,
        angle: 1.1,
        color: "#d8d8d2",
      },
      {
        name: "Tethys",
        size: 0.16,
        distance: 7.2,
        speed: 1.5,
        inclination: 0.7,
        angle: 2.2,
        color: "#c7c3ba",
      },
      {
        name: "Dione",
        size: 0.18,
        distance: 8.4,
        speed: 1.25,
        inclination: -1.2,
        angle: 3.1,
        color: "#aaa69e",
      },
      {
        name: "Rhea",
        size: 0.21,
        distance: 9.7,
        speed: 1,
        inclination: 1.8,
        angle: 4.2,
        color: "#aaa59b",
      },
      {
        name: "Titan",
        size: 0.32,
        distance: 12,
        speed: 0.65,
        inclination: 0.3,
        angle: 5,
        color: "#c59b63",
      },
      {
        name: "Iapetus",
        size: 0.19,
        distance: 15,
        speed: 0.42,
        inclination: 7.5,
        angle: 2.7,
        color: "#77736b",
      },
    ],

    type: "Gas Giant",
    radius: 58232,
    mass: 5.68e26,
    gravity: 10.44,
    temperature: "-178°C",
    dayLength: "10.7 hours",
    yearLength: "29 years",
    gravityNote: "Similar to Earth",

    fact: "Saturn is famous for its beautiful rings 💍",

    plasmaColors: {
      a: "#e0c068",
      b: "#c2a14a",
      c: "#fff2b3",
    },
  },

  {
    name: "Uranus",
    size: 2.5,
    distance: 48,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 30688.5,
    rotationPeriodHours: 17.24,
    rotationDirection: -1,

    realSpeed: 24000,
    texture: "/textures/uranus.jpeg",
    moons: 27,

    // 🌙 Uranus — Selected major moons
    moonSystem: [
      {
        name: "Miranda",
        size: 0.14,
        distance: 4.5,
        speed: 1.9,
        inclination: 4.2,
        angle: 0,
        color: "#a7a39b",
      },
      {
        name: "Ariel",
        size: 0.18,
        distance: 5.8,
        speed: 1.45,
        inclination: 0.3,
        angle: 1.2,
        color: "#aaa9a3",
      },
      {
        name: "Umbriel",
        size: 0.19,
        distance: 7,
        speed: 1.15,
        inclination: 0.6,
        angle: 2.4,
        color: "#77746f",
      },
      {
        name: "Titania",
        size: 0.23,
        distance: 8.5,
        speed: 0.9,
        inclination: -0.5,
        angle: 3.6,
        color: "#aaa79f",
      },
      {
        name: "Oberon",
        size: 0.22,
        distance: 10,
        speed: 0.72,
        inclination: 0.9,
        angle: 5,
        color: "#85817a",
      },
    ],

    type: "Ice Giant",
    radius: 25362,
    mass: 8.68e25,
    gravity: 8.69,
    temperature: "-224°C",
    dayLength: "17 hours",
    yearLength: "84 years",
    gravityNote: "Close to Earth",

    fact: "Uranus rotates on its side 🔄",

    plasmaColors: {
      a: "#7de3ff",
      b: "#4cc9f0",
      c: "#bde0fe",
    },
  },

  {
    name: "Neptune",
    size: 2.5,
    distance: 56,

    // 🪐 Orbital & axial rotation
    orbitalPeriodDays: 60182,
    rotationPeriodHours: 16.11,
    rotationDirection: 1,

    realSpeed: 19000,
    texture: "/textures/astronomy.jpg",
    moons: 14,

    // 🌙 Neptune — Selected major moons
    moonSystem: [
      {
        name: "Triton",
        size: 0.30,
        distance: 6.5,
        speed: 0.9,
        inclination: 156.8,
        angle: 0,
        color: "#b8a99a",
      },
      {
        name: "Nereid",
        size: 0.13,
        distance: 9.5,
        speed: 0.55,
        inclination: 7.2,
        angle: 2.5,
        color: "#8e8a82",
      },
      {
        name: "Proteus",
        size: 0.16,
        distance: 5.2,
        speed: 1.2,
        inclination: 0.5,
        angle: 4,
        color: "#77736d",
      },
    ],

    type: "Ice Giant",
    radius: 24622,
    mass: 1.02e26,
    gravity: 11.15,
    temperature: "-214°C",
    dayLength: "16 hours",
    yearLength: "165 years",
    gravityNote: "Slightly stronger than Earth",

    fact: "Neptune has the fastest winds in the solar system 🌪️",

    plasmaColors: {
      a: "#3a86ff",
      b: "#0077b6",
      c: "#90e0ef",
    },
  },
];