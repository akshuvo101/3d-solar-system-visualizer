"use client";

import { useEffect, useMemo, useState } from "react";

type PlanetInfoData = {
  name: string;
  distance?: number;
  speed?: number;
  realSpeed?: number;
  fact?: string;

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

type PlanetInfoProps = {
  planet: PlanetInfoData | null;
};

type CinematicSlide = {
  title: string;
  subtitle?: string;
  value?: string;
  accent?: boolean;
};

// ⏱️ Each slide stays for 8 seconds
const SLIDE_DURATION = 8000;

// 📍 First 5 slides on LEFT, remaining slides on RIGHT
const LEFT_SLIDE_COUNT = 5;

/* =====================================================
   🌌 DEFAULT SOLAR SYSTEM INTRODUCTION
===================================================== */

const DEFAULT_SOLAR_SYSTEM_SLIDES: CinematicSlide[] = [
  {
    title: "WELCOME, EXPLORER",
    subtitle: "YOUR JOURNEY THROUGH THE COSMOS BEGINS HERE",
    accent: true,
  },

  {
    title: "OUR SOLAR SYSTEM",
    value:
      "A vast cosmic neighborhood centered around one extraordinary star — the Sun.",
  },

  {
    title: "WHAT YOU ARE ABOUT TO EXPLORE",
    value:
      "Eight planets, countless moons, fascinating worlds, and the scientific stories that explain our place in the universe.",
  },

  {
    title: "EVERY WORLD HAS A STORY",
    value:
      "Discover their size, gravity, atmosphere, motion, formation, and the mysteries that make each celestial world unique.",
    accent: true,
  },

  {
    title: "THE SCIENCE OF THE COSMOS",
    value:
      "Explore the discoveries, laws, theories, and brilliant minds that helped humanity understand the universe.",
  },

  {
    title: "FROM THE SUN TO NEPTUNE",
    value:
      "Travel across the Solar System and witness the diversity of worlds orbiting our cosmic star.",
    accent: true,
  },

  {
    title: "SELECT A WORLD",
    subtitle: "CHOOSE A PLANET AND BEGIN YOUR EXPLORATION",
    accent: true,
  },
];

/* =====================================================
   🪐 PLANET INFO COMPONENT
===================================================== */

export default function PlanetInfo({
  planet,
}: PlanetInfoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  /* =====================================================
     BUILD SLIDES
  ===================================================== */

  const slides = useMemo<CinematicSlide[]>(() => {
    // 🌌 No planet selected → show Solar System intro
    if (!planet) {
      return DEFAULT_SOLAR_SYSTEM_SLIDES;
    }

    // 🪐 Planet selected → show planet information
    return [
      // 1️⃣ INTRODUCTION
      {
        title:
          planet.name === "Sun"
            ? "THE SUN"
            : planet.name.toUpperCase(),

        subtitle:
          planet.name === "Sun"
            ? "THE HEART OF OUR SOLAR SYSTEM"
            : `ENTERING THE WORLD OF ${planet.name.toUpperCase()}`,

        accent: true,
      },

      // 2️⃣ TYPE
      {
        title:
          planet.name === "Sun"
            ? "CELESTIAL TYPE"
            : "PLANET TYPE",

        value: planet.type ?? "Unknown",
      },

      // 3️⃣ FACT
      ...(planet.fact
        ? [
            {
              title: "DID YOU KNOW?",
              value: planet.fact,
              accent: true,
            },
          ]
        : []),

      // 4️⃣ RADIUS
      ...(planet.radius !== undefined
        ? [
            {
              title: "RADIUS",
              value: `${planet.radius.toLocaleString()} KM`,
            },
          ]
        : []),

      // 5️⃣ MASS
      ...(planet.mass !== undefined
        ? [
            {
              title: "MASS",
              value: `${planet.mass} KG`,
            },
          ]
        : []),

      // =============================
      // RIGHT SIDE STARTS FROM HERE
      // =============================

      // 6️⃣ GRAVITY
      ...(planet.gravity !== undefined
        ? [
            {
              title: "SURFACE GRAVITY",
              value: `${planet.gravity} M/S²`,
            },
          ]
        : []),

      // 7️⃣ TEMPERATURE
      ...(planet.temperature
        ? [
            {
              title: "TEMPERATURE",
              value: planet.temperature,
            },
          ]
        : []),

      // 8️⃣ DAY LENGTH
      ...(planet.dayLength
        ? [
            {
              title: "LENGTH OF DAY",
              value: planet.dayLength,
            },
          ]
        : []),

      // 9️⃣ YEAR LENGTH
      ...(planet.yearLength
        ? [
            {
              title:
                planet.name === "Sun"
                  ? "GALACTIC ORBIT"
                  : "ORBITAL PERIOD",

              value: planet.yearLength,
            },
          ]
        : []),

      // 🔟 ORBITAL SPEED
      ...(planet.realSpeed !== undefined
        ? [
            {
              title: "ORBITAL SPEED",
              value: `${planet.realSpeed.toLocaleString()} KM/H`,
            },
          ]
        : []),

      // 1️⃣1️⃣ MOONS
      {
        title: "NATURAL SATELLITES",
        value: `${planet.moons ?? 0} MOON${
          planet.moons === 1 ? "" : "S"
        }`,
      },

      // 1️⃣2️⃣ SCIENTIFIC NOTE
      ...(planet.gravityNote
        ? [
            {
              title: "EXPLORER NOTE",
              value: planet.gravityNote,
              accent: true,
            },
          ]
        : []),

      // 1️⃣3️⃣ ENDING
      {
        title: `EXPLORING ${planet.name.toUpperCase()}`,
        subtitle: "THE JOURNEY CONTINUES",
        accent: true,
      },
    ];
  }, [planet]);

  /* =====================================================
     RESET WHEN PLANET CHANGES
  ===================================================== */

  useEffect(() => {
    setCurrentIndex(0);
  }, [planet?.name]);

  /* =====================================================
     AUTO CHANGE SLIDES
  ===================================================== */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentIndex((previousIndex) => {
        return (previousIndex + 1) % slides.length;
      });
    }, SLIDE_DURATION);

    return () => {
      window.clearInterval(interval);
    };
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  /*
    📍 Desktop positioning:

    Slides 1–5 → LEFT
    Slides 6+ → RIGHT

    📱 Mobile → LEFT
  */

  const isRightSide =
    planet !== null && currentIndex >= LEFT_SLIDE_COUNT;

  return (
    <>
      {/* =============================================
          CINEMATIC INFORMATION OVERLAY
      ============================================== */}

      <div
        className={`
          pointer-events-none
          fixed
          top-16
          z-10

          w-[min(82vw,560px)]

          /* 📱 MOBILE */
          left-4
          text-left

          sm:left-6
          sm:top-20

          /* 🖥️ DESKTOP */
          lg:top-20

          ${
            isRightSide
              ? `
                lg:left-auto
                lg:right-[12%]
                lg:text-right
              `
              : `
                lg:left-[18%]
                lg:right-auto
                lg:text-left
              `
          }
        `}
      >
        <div
          key={`${planet?.name ?? "solar-system"}-${currentIndex}`}
          className="cinematic-slide"
        >
          <div
            className={`
              flex
              flex-col

              ${
                isRightSide
                  ? "items-start lg:items-end"
                  : "items-start"
              }
            `}
          >
            {/* Cinematic Accent Line */}

            <div
              className={`
                mb-3
                h-px

                ${
                  currentSlide.accent
                    ? "w-16 bg-pink-400"
                    : "w-10 bg-white/40"
                }
              `}
            />

            {/* Information Title */}

            <h2
              className={`
                max-w-full
                break-words

                text-[10px]
                font-semibold
                uppercase
                leading-relaxed
                tracking-[0.22em]

                sm:text-xs
                sm:tracking-[0.3em]

                ${
                  currentSlide.accent
                    ? "text-pink-400"
                    : "text-white/55"
                }
              `}
            >
              {currentSlide.title}
            </h2>

            {/* Main Information */}

            {currentSlide.value && (
              <p
                className={`
                  mt-3
                  max-w-full
                  break-words

                  text-sm
                  font-medium
                  leading-relaxed

                  sm:text-base
                  md:text-lg

                  ${
                    currentSlide.accent
                      ? "text-pink-100"
                      : "text-white/90"
                  }
                `}
              >
                {currentSlide.value}
              </p>
            )}

            {/* Subtitle */}

            {currentSlide.subtitle && (
              <p
                className="
                  mt-3
                  max-w-full
                  break-words

                  text-[9px]
                  uppercase
                  leading-relaxed
                  tracking-[0.18em]

                  text-white/40

                  sm:text-[10px]
                  sm:tracking-[0.24em]
                "
              >
                {currentSlide.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

    </>
  );
}