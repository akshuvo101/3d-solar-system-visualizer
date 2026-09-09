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
import { PLANET_VISUAL_SCALE } from "@/lib/planetVisualScale";

import {
  getPlanetHeliocentricPosition,
} from "@/lib/astronomy/planetaryPosition";

import {
  ORBITAL_ELEMENTS,
} from "@/lib/astronomy/orbitalElements";

import {
  getPlanetRotationPhaseRadians,
  getPlanetAxialTiltRadians,
} from "@/lib/astronomy/rotationPhase";

/* ============================================================
   🪐 PLANET
   ============================================================ */

export const Planet = ({
  planet,
  simulationMode,
  playbackSpeed,
  selectedPlanet,
  simulationTimeRef,
  simulationDeltaDaysRef,
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
     🌐 AXIAL TILT GROUP

     This group controls the orientation of the
     planet's rotational axis.

     Example:

     Earth   ≈ 23.44°
     Mars    ≈ 25.19°
     Uranus  ≈ 97.77°
     Venus   ≈ 177.36°

     This is intentionally separated from the
     daily rotational phase.
     ========================================================== */

  const axialTiltGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌀 PLANET ROTATION GROUP

     ONLY the actual planet visual rotates here.

     The absolute astronomical rotation phase is
     applied to this group.

     Moon system stays outside this group so the
     Moon's orbital movement is NOT affected by the
     planet's axial rotation.
     ========================================================== */

  const rotationGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌙 MOON GROUP
     ========================================================== */

  const moonGroupRef =
    useRef<THREE.Group | null>(null);

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
       🌌 SHARED ASTRONOMICAL TIME

       SolarSystem3D.tsx owns the simulation clock.

       Planet.tsx does NOT create or advance its own clock.

       All planets read the same simulated timestamp.

              Shared Simulation Clock
                       ↓
                simulationTimeRef
                       ↓
                  Planet.tsx
                       ↓
              simulated Date
                       ↓
          astronomical calculations
       ======================================================== */

    const simulationDate =
      new Date(
        simulationTimeRef.current,
      );

    /* ========================================================
       🪐 REAL ASTRONOMICAL PLANET POSITION

       Sun is intentionally excluded.

       The planetaryPosition engine calculates:

       Date
        ↓
       Julian Date
        ↓
       Days since J2000
        ↓
       Mean Anomaly
        ↓
       Kepler Equation
        ↓
       Eccentric Anomaly
        ↓
       True Anomaly
        ↓
       Orbital Radius
        ↓
       Inclination / Ω / ω
        ↓
       Heliocentric XYZ
       ======================================================== */

    const orbitalElements =
      ORBITAL_ELEMENTS[
        planet.name
      ];

    if (orbitalElements) {
      const astronomicalPosition =
        getPlanetHeliocentricPosition(
          planet.name,
          simulationDate,
        );

      /* ======================================================
         📐 REAL → VISUAL SCALE

         astronomicalPosition is measured in AU.

         Example:

         Earth:
         ~1 AU

         Jupiter:
         ~5.2 AU

         But our Three.js scene uses:

         Earth:
         distance = 20

         Jupiter:
         distance = 32

         Therefore we normalize each planet using its
         existing visual orbital distance.

         This preserves the current visual composition
         while making the POSITION itself astronomical.

         Scale:

         visualDistance / semiMajorAxisAU
         ====================================================== */

      const visualScale =
        planet.distance /
        orbitalElements.semiMajorAxisAU;

      /* ======================================================
         🌌 COORDINATE SYSTEM CONVERSION

         Astronomy engine:

         X = ecliptic X
         Y = ecliptic Y
         Z = ecliptic normal

         Three.js scene:

         X = horizontal
         Y = vertical
         Z = depth

         Therefore:

         Three X ← astronomical X
         Three Y ← astronomical Z
         Three Z ← -astronomical Y

         This keeps the ecliptic plane as the
         horizontal X/Z plane of the 3D scene.
         ====================================================== */

      group.position.x =
        astronomicalPosition.x *
        visualScale;

      group.position.y =
        astronomicalPosition.z *
        visualScale;

      group.position.z =
        -astronomicalPosition.y *
        visualScale;
    }

    /* ========================================================
       🧭 ABSOLUTE ASTRONOMICAL ROTATION

       Rotation is no longer accumulated frame-by-frame.

       OLD:

       rotation +=
         rotationSpeed × delta

       NEW:

       simulated Date
             ↓
       Julian Date
             ↓
       days since J2000
             ↓
       W = W0 + Wdot × d
             ↓
       absolute rotation phase
             ↓
       Three.js rotation

       This means the planet's orientation is tied
       directly to the simulated astronomical date.

       Reloading the application on another real date
       therefore produces another rotational phase.
       ======================================================== */

    const rotationGroup =
      rotationGroupRef.current;

    const axialTiltGroup =
      axialTiltGroupRef.current;

    if (rotationGroup) {
      /* ======================================================
         🌍 ABSOLUTE ROTATIONAL PHASE

         W = W0 + Wdot × d

         W0:
         Planet rotation phase at J2000.0

         Wdot:
         Planet rotation rate in degrees/day

         d:
         Days since J2000.0

         Venus and Uranus naturally receive
         retrograde rotation because their
         rotationRateDegPerDay values are negative.
         ====================================================== */

      const rotationPhaseRadians =
        getPlanetRotationPhaseRadians(
          planet,
          simulationDate,
        );

      /* ======================================================
         Apply the absolute astronomical phase.

         IMPORTANT:

         We do NOT use:

         rotation += ...

         anymore.

         The current simulation date is the
         single source of truth.
         ====================================================== */

      rotationGroup.rotation.y =
        rotationPhaseRadians;
    }

    /* ========================================================
       🧭 REAL AXIAL TILT

       The planet's rotational axis is tilted relative
       to the ecliptic reference plane.

       Examples:

       Earth:
       ~23.44°

       Mars:
       ~25.19°

       Uranus:
       ~97.77°

       Venus:
       ~177.36°

       The axial tilt is applied separately from
       the planet's daily rotational phase.

       This prevents the tilt from affecting the
       Moon's orbital system.
       ======================================================== */

    if (axialTiltGroup) {
      const axialTiltRadians =
        getPlanetAxialTiltRadians(
          planet,
        );

      /* ------------------------------------------------------
         Three.js scene:

         X = horizontal
         Y = vertical
         Z = depth

         Therefore we tilt the planetary rotation
         axis around the Z-axis.

         The rotation group remains responsible for
         the actual daily spin.
         ------------------------------------------------------ */

      axialTiltGroup.rotation.z =
        axialTiltRadians;
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
            🧭 AXIAL TILT GROUP

            Controls the real orientation of the
            planetary rotational axis.

            This stays above the rotation group
            so the planet rotates around its tilted axis.
        ==================================================== */}

        <group
          ref={axialTiltGroupRef}
        >

          {/* ==================================================
              🌀 PLANET ROTATION GROUP

              Controls the absolute astronomical
              rotational phase.

              Moon remains outside this group.
          ================================================== */}

          <group
            ref={rotationGroupRef}
          >

            {/* ================================================
                🌑 REAL SHADOW RECEIVER
            ================================================= */}

            <PlanetShadowReceiver
              radius={1}
              opacity={0.20}
              segments={64}
            />

            {/* ================================================
                🌍 EARTH
            ================================================= */}

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

        </group>

        {/* ====================================================
            🌙 MOON SYSTEM

            Moon is intentionally OUTSIDE the
            axial tilt + rotation hierarchy.

            Therefore planet axial rotation does not
            directly rotate the Moon's orbital system.
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