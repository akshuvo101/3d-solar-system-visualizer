// import { PlanetType } from "@/types";

// export const planetData: PlanetType[] = [
//   {
//     name: "Mercury",
//     size: 1,
//     distance: 12,
//     speed: 1.6,
//     realSpeed: 170000, // km/h
//     texture: "/textures/mercury.jpeg",
//     moons: 0,
//     plasmaColors: {
//       a: "#555555",
//       b: "#888888",
//       c: "#bbbbbb",
//     },
//   },
//   {
//     name: "Venus",
//     size: 1.5,
//     distance: 16,
//     speed: 1.2,
//     realSpeed: 126000, // km/h
//     texture: "/textures/venus.jpeg",
//     moons: 0,
//     plasmaColors: {
//       a: "#ffcc66",
//       b: "#ff8844",
//       c: "#ff5500",
//     },
//   },
//   {
//     //
//     name: "Earth",
//     size: 2,
//     distance: 20,
//     speed: 1,
//     realSpeed: 107000,
//     texture: "/textures/earth.jpg",
//     moons: 1,

//     type: "Terrestrial",
//     radius: 6371,
//     mass: 5.97e24,
//     gravity: 9.8,
//     temperature: "-88°C to 58°C",
//     dayLength: "24 hours",
//     yearLength: "365 days",
//     gravityNote: "Same as Earth 🌍",

//     fact: "Earth is the only planet known to support life 🌍",
//     plasmaColors: {
//       a: "#2e8bff",
//       b: "#00c6ff",
//       c: "#a0e9ff",
//     },
//   },
//   {
//     name: "Mars",
//     size: 1.3,
//     distance: 24,
//     speed: 0.8,
//     realSpeed: 87000, // km/h
//     texture: "/textures/mars.jpg",
//     moons: 2,
//     plasmaColors: {
//       a: "#ff4d4d",
//       b: "#ff8844",
//       c: "#ffcc99",
//     },
//   },
//   {
//     name: "Jupiter",
//     size: 4,
//     distance: 32,
//     speed: 0.5,
//     realSpeed: 47000, // km/h
//     texture: "/textures/jupiter.jpg",
//     moons: 4,
//     plasmaColors: {
//       a: "#d9a066",
//       b: "#c97b2b",
//       c: "#f2d2a2",
//     },
//   },
//   {
//     name: "Saturn",
//     size: 3.5,
//     distance: 40,
//     speed: 0.4,
//     realSpeed: 35000, // km/h
//     texture: "/textures/saturn.jpg",
//     moons: 3,
//     plasmaColors: {
//       a: "#e0c068",
//       b: "#c2a14a",
//       c: "#fff2b3",
//     },
//   },
//   {
//     name: "Uranus",
//     size: 2.5,
//     distance: 48,
//     speed: 0.3,
//     realSpeed: 24000, // km/h
//     texture: "/textures/uranus.jpeg",
//     moons: 1,
//     plasmaColors: {
//       a: "#7de3ff",
//       b: "#4cc9f0",
//       c: "#bde0fe",
//     },
//   },
//   {
//     name: "Neptune",
//     size: 2.5,
//     distance: 56,
//     speed: 0.2,
//     realSpeed: 19000, // km/h
//     texture: "/textures/astronomy.jpg",
//     moons: 1,
//     plasmaColors: {
//       a: "#3a86ff",
//       b: "#0077b6",
//       c: "#90e0ef",
//     },
//   },
// ];


import { PlanetType } from "@/types";

export const planetData: PlanetType[] = [
  {
    name: "Mercury",
    size: 1,
    distance: 12,
    speed: 1.6,
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
    speed: 1.2,
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
    speed: 1,
    realSpeed: 107000,
    texture: "/textures/earth.jpg",
    moons: 1,

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
    speed: 0.8,
    realSpeed: 87000,
    texture: "/textures/mars.jpg",
    moons: 2,

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
    speed: 0.5,
    realSpeed: 47000,
    texture: "/textures/jupiter.jpg",
    moons: 79,

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
    speed: 0.4,
    realSpeed: 35000,
    texture: "/textures/saturn.jpg",
    moons: 83,

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
    speed: 0.3,
    realSpeed: 24000,
    texture: "/textures/uranus.jpeg",
    moons: 27,

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
    speed: 0.2,
    realSpeed: 19000,
    texture: "/textures/astronomy.jpg",
    moons: 14,

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