"use client";

import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { Moon } from "./Moon";
import { Earth } from "./Earth";
import { Mars } from "./Mars";
import { Mercury } from "./Mercury";
import { Venus } from "./Venus";
import { Jupiter } from "./Jupiter";
import { Saturn } from "./Saturn";
import { Uranus } from "./Uranus";
import { Neptune } from "./Neptune";
import PlanetShadowReceiver from "./PlanetShadowReceiver";

import * as THREE from "three";

import { PlanetComponentProps } from "@/types";
import { SIMULATION_MODES } from "@/lib/simulationTime";
import { PLANET_VISUAL_SCALE } from "@/lib/planetVisualScale";

/* ============================================================
   🪐 PLANET
   ============================================================ */

export const Planet = ({
  planet,
  simulationMode,
  playbackSpeed,
  selectedPlanet,
  setRef,
  onClick,
}: PlanetComponentProps) => {
  /* ==========================================================
     🎥 OUTER GROUP

     CinematicController controls this group.

     IMPORTANT:
     Do not put physical planet scale or axial rotation
     on this group.
     ========================================================== */

  const groupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌍 INNER VISUAL GROUP

     Physical planet size is applied here.

     CinematicController scale
              ×
     Planet physical scale

     Both systems work independently.
     ========================================================== */

  const visualGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌀 PLANET ROTATION GROUP

     ONLY the actual planet visual rotates here.

     Moon system stays outside this group so the Moon's
     orbital movement is NOT affected by the planet's
     axial rotation.
     ========================================================== */

  const rotationGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌙 MOON GROUP
     ========================================================== */

  const moonGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🪐 ORBIT ANGLE
     ========================================================== */

  const orbitalAngle =
    useRef(0);

  /* ==========================================================
     🌀 SMOOTH SIMULATION TIME

     Keeps Day → Month → Year transitions smooth.

     The value represents:

     simulation Earth-days
     per real-world second.
     ========================================================== */

  const currentSimulationDaysPerSecond =
    useRef<number>(
      SIMULATION_MODES[
        simulationMode
      ].daysPerSecond,
    );

  /* ==========================================================
     🎬 FRAME LOOP
     ========================================================== */

  useFrame((_, delta) => {
    /* ========================================================
       🌙 MOON VISIBILITY
       ======================================================== */

    const moonGroup =
      moonGroupRef.current;

    if (moonGroup) {
      const targetMoonScale =
        selectedPlanet === planet.name
          ? 1
          : 0;

      const nextMoonScale =
        THREE.MathUtils.lerp(
          moonGroup.scale.x,
          targetMoonScale,
          1 - Math.exp(-8 * delta),
        );

      moonGroup.scale.setScalar(
        nextMoonScale,
      );

      moonGroup.visible =
        nextMoonScale > 0.001;
    }

    /* ========================================================
       🎥 OUTER GROUP
       ======================================================== */

    const group =
      groupRef.current;

    if (!group) {
      return;
    }

    /* ========================================================
       ⏱️ SIMULATION TIME

       Day:
       1 real second = 1 real second

       Month:
       30 simulation days = 1 real hour

       Year:
       365.256 simulation days = 1 real hour
       ======================================================== */

    const targetSimulationDaysPerSecond =
      SIMULATION_MODES[
        simulationMode
      ].daysPerSecond;

    currentSimulationDaysPerSecond.current =
      THREE.MathUtils.lerp(
        currentSimulationDaysPerSecond.current,
        targetSimulationDaysPerSecond,
        1 - Math.exp(-8 * delta),
      );

    /* ========================================================
       ⚡ PLAYBACK SPEED

       Base simulation speed
              ×
       User selected playback speed

       If playbackSpeed is undefined for any reason,
       fallback to 1× so the planet never receives
       NaN position values.

       Camera distance does NOT affect this.
       ======================================================== */

    const effectivePlaybackSpeed =
      playbackSpeed ?? 1;

    const daysPerSecond =
      currentSimulationDaysPerSecond.current *
      effectivePlaybackSpeed;

    /* ========================================================
       🪐 REAL PLANET ORBIT

       The planet's orbital period is measured in
       Earth days.

       Example:

       Earth  ≈ 365.256 days
       Mars   ≈ 687 days
       Jupiter ≈ 4332.59 days

       Formula:

       rotations/orbits per simulation day
       =
       1 / orbitalPeriodDays

       radians/sec
       =
       daysPerSecond
       ×
       1 / orbitalPeriodDays
       ×
       2π

       IMPORTANT:
       Camera distance does NOT affect this speed.
       ======================================================== */

    const orbitalSpeed =
      (daysPerSecond /
        planet.orbitalPeriodDays) *
      Math.PI *
      2;

    orbitalAngle.current -=
      orbitalSpeed *
      delta;

    group.position.x =
      planet.distance *
      Math.cos(
        orbitalAngle.current,
      );

    group.position.z =
      planet.distance *
      Math.sin(
        orbitalAngle.current,
      );

    /* ========================================================
       🌀 REAL AXIAL ROTATION

       Uses each planet's real rotation period.

       Examples:

       Mercury ≈ 1407.6 hours
       Venus   ≈ 5832 hours
       Earth   ≈ 23.934 hours
       Mars    ≈ 24.623 hours
       Jupiter ≈ 9.925 hours
       Saturn  ≈ 10.656 hours
       Uranus  ≈ 17.24 hours
       Neptune ≈ 16.11 hours

       Formula:

       rotationPeriodHours
              ↓
       rotationPeriodDays
              ↓
       rotations per simulation day
              ↓
       simulation days/sec
              ↓
       radians/sec

       No visual speed multiplier is used.

       Therefore the relative rotation speed of every
       planet remains physically correct.
       ======================================================== */

    const rotationGroup =
      rotationGroupRef.current;

    if (
      rotationGroup &&
      planet.rotationPeriodHours > 0
    ) {
      /* ------------------------------------------------------
         Convert real rotation period:

         hours → Earth days
         ------------------------------------------------------ */

      const rotationPeriodDays =
        planet.rotationPeriodHours / 24;

      /* ------------------------------------------------------
         How many rotations happen during
         one simulation Earth-day?
         ------------------------------------------------------ */

      const rotationsPerSimulationDay =
        1 / rotationPeriodDays;

      /* ------------------------------------------------------
         Full rotation = 2π radians
         ------------------------------------------------------ */

      const rotationSpeed =
        rotationsPerSimulationDay *
        daysPerSecond *
        Math.PI *
        2;

      /* ------------------------------------------------------
         Real rotation direction

         +1 = prograde
         -1 = retrograde

         Venus  = -1
         Uranus = -1
         ------------------------------------------------------ */

      const rotationDirection =
        planet.rotationDirection ?? 1;

      rotationGroup.rotation.y +=
        rotationSpeed *
        delta *
        rotationDirection;
    }
  });

  /* ============================================================
     🎯 REGISTER PLANET REFERENCE
     ============================================================ */

  useEffect(() => {
    const group =
      groupRef.current;

    if (!group) {
      return;
    }

    /*
     * Used by:
     *
     * CinematicController
     * CameraController
     */

    group.userData.planetName =
      planet.name;

    /*
     * Store physical visual scale
     * for other systems if needed.
     */

    const physicalScale =
      PLANET_VISUAL_SCALE[
        planet.name
      ] ?? 1;

    group.userData.planetVisualScale =
      physicalScale;

    setRef(
      planet.name,
      groupRef,
    );
  }, [
    planet.name,
    setRef,
  ]);

  /* ============================================================
     🌑 SHADOW CONFIGURATION

     Every opaque planet mesh becomes a shadow caster.

     Transparent atmosphere/cloud layers do NOT cast shadows.
     ============================================================ */

  useEffect(() => {
    const visualGroup =
      visualGroupRef.current;

    if (!visualGroup) {
      return;
    }

    visualGroup.traverse(
      (object) => {
        if (
          !(object instanceof THREE.Mesh)
        ) {
          return;
        }

        const material =
          object.material;

        /*
         * Multiple materials are possible.
         */

        const materials =
          Array.isArray(material)
            ? material
            : [material];

        const hasTransparentMaterial =
          materials.some(
            (mat) =>
              mat.transparent ||
              mat.opacity < 0.98,
          );

        /*
         * Main opaque planet surface:
         * cast + receive shadows.
         *
         * Transparent clouds / atmosphere:
         * don't cast hard planet-sized shadows.
         */

        object.castShadow =
          !hasTransparentMaterial;

        object.receiveShadow =
          !hasTransparentMaterial;
      },
    );
  });

  /* ============================================================
     🖱️ PLANET CLICK
     ============================================================ */

  const handleClick = () => {
    onClick({
      name: planet.name,

      distance:
        planet.distance,

      speed:
        planet.speed,

      realSpeed:
        planet.realSpeed,

      fact:
        planet.fact,

      type:
        planet.type,

      radius:
        planet.radius,

      mass:
        planet.mass,

      gravity:
        planet.gravity,

      temperature:
        planet.temperature,

      dayLength:
        planet.dayLength,

      yearLength:
        planet.yearLength,

      moons:
        planet.moons,

      gravityNote:
        planet.gravityNote,
    });
  };

  /* ============================================================
     🎨 PHYSICAL VISUAL SCALE
     ============================================================ */

  const visualScale =
    PLANET_VISUAL_SCALE[
      planet.name
    ] ?? 1;

  /* ============================================================
     🎨 RENDER
     ============================================================ */

  return (
    <group ref={groupRef}>

      {/* ======================================================
          🌍 VISUAL PLANET GROUP

          This group controls the actual planet size.

          CinematicController scales the OUTER group,
          so this physical scale remains intact.
      ====================================================== */}

      <group
        ref={visualGroupRef}
        scale={[
          visualScale,
          visualScale,
          visualScale,
        ]}
      >

        {/* ====================================================
            🌀 PLANET ROTATION GROUP

            ONLY the planet itself rotates.

            Moon remains outside this group.
        ==================================================== */}

        <group
          ref={rotationGroupRef}
        >

          {/* ==================================================
              🌑 REAL SHADOW RECEIVER
          ================================================== */}

          <PlanetShadowReceiver
            radius={1}
            opacity={0.20}
            segments={64}
          />

          {/* ==================================================
              🌍 EARTH
          ================================================== */}

          {planet.name === "Earth" ? (
            <group
              onClick={handleClick}
            >
              <Earth />
            </group>

          ) : planet.name === "Mars" ? (

            <group
              onClick={handleClick}
            >
              <Mars />
            </group>

          ) : planet.name === "Mercury" ? (

            <group
              onClick={handleClick}
            >
              <Mercury />
            </group>

          ) : planet.name === "Venus" ? (

            <group
              onClick={handleClick}
            >
              <Venus />
            </group>

          ) : planet.name === "Jupiter" ? (

            <group
              onClick={handleClick}
            >
              <Jupiter />
            </group>

          ) : planet.name === "Saturn" ? (

            <group
              onClick={handleClick}
            >
              <Saturn />
            </group>

          ) : planet.name === "Uranus" ? (

            <group
              onClick={handleClick}
            >
              <Uranus />
            </group>

          ) : planet.name === "Neptune" ? (

            <group
              onClick={handleClick}
            >
              <Neptune />
            </group>

          ) : (

            <Sphere
              onClick={handleClick}
              args={[
                planet.size * 1.05,
                32,
                32,
              ]}
              castShadow
              receiveShadow
            >
              <meshBasicMaterial
                color={
                  planet.plasmaColors?.a ||
                  "#ffffff"
                }
                transparent
                opacity={0.15}
                blending={
                  THREE.AdditiveBlending
                }
              />
            </Sphere>
          )}

        </group>

        {/* ====================================================
            🌙 MOON SYSTEM

            Moon is intentionally OUTSIDE the
            rotationGroupRef.

            Therefore planet axial rotation does not
            rotate the Moon's orbital system.
        ==================================================== */}

        <group
          ref={moonGroupRef}
          scale={
            selectedPlanet === planet.name
              ? 1
              : 0
          }
        >
          {planet.moonSystem?.map(
            (moon) => (
              <Moon
                key={moon.name}
                moon={moon}
                simulationMode={
                  simulationMode
                }
              />
            ),
          )}
        </group>

      </group>
    </group>
  );
};