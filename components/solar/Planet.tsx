"use client";

import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

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

   Optimized for smooth initial rendering.

   Important goals:

   • Correct astronomical position on the FIRST frame
   • Correct rotation on the FIRST frame
   • No visible position jump from origin → planet orbit
   • Shared simulation clock remains the single source of truth
   • Axial rotation remains synchronized with orbital time
   • Shadow setup runs only when the visual hierarchy changes
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

     CinematicController and CameraController use this group.
     ========================================================== */

  const groupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌍 INNER VISUAL GROUP
     ========================================================== */

  const visualGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌐 AXIAL TILT GROUP
     ========================================================== */

  const axialTiltGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌀 PLANET ROTATION GROUP
     ========================================================== */

  const rotationGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🌙 MOON GROUP
     ========================================================== */

  const moonGroupRef =
    useRef<THREE.Group | null>(null);

  /* ==========================================================
     🎨 PHYSICAL VISUAL SCALE

     Calculated once per planet.
     ========================================================== */

  const visualScale =
    PLANET_VISUAL_SCALE[
      planet.name
    ] ?? 1;

  /* ==========================================================
     ⏱️ INITIAL SIMULATION DATE

     SolarSystem3D initializes simulationTimeRef from:

     Date.now()

     Therefore this is the exact real-world UTC-based
     astronomical starting timestamp for this planet.
     ========================================================== */

  const initialSimulationDate =
    useMemo(
      () =>
        new Date(
          simulationTimeRef.current,
        ),
      [simulationTimeRef],
    );

  /* ==========================================================
     🪐 INITIAL ASTRONOMICAL POSITION

     IMPORTANT:

     Previously the planet started at the default group
     position [0,0,0] and only received its real position
     inside useFrame().

     That could produce a visible first-frame jump.

     Now we calculate the initial position immediately.
     ========================================================== */

  const initialPosition =
    useMemo(() => {
      const orbitalElements =
        ORBITAL_ELEMENTS[
          planet.name
        ];

      if (!orbitalElements) {
        return {
          x: 0,
          y: 0,
          z: 0,
        };
      }

      const astronomicalPosition =
        getPlanetHeliocentricPosition(
          planet.name,
          initialSimulationDate,
        );

      const astronomicalVisualScale =
        planet.distance /
        orbitalElements.semiMajorAxisAU;

      return {
        x:
          astronomicalPosition.x *
          astronomicalVisualScale,

        y:
          astronomicalPosition.z *
          astronomicalVisualScale,

        z:
          -astronomicalPosition.y *
          astronomicalVisualScale,
      };
    }, [
      planet.name,
      planet.distance,
      initialSimulationDate,
    ]);

  /* ==========================================================
     🧭 INITIAL ROTATION

     The planet already has its correct astronomical rotation
     phase before the first visible frame.
     ========================================================== */

  const initialRotation =
    useMemo(
      () =>
        getPlanetRotationPhaseRadians(
          planet,
          initialSimulationDate,
        ),
      [
        planet,
        initialSimulationDate,
      ],
    );

  /* ==========================================================
     🧭 INITIAL AXIAL TILT

     Applied immediately instead of waiting for useFrame().
     ========================================================== */

  const initialAxialTilt =
    useMemo(
      () =>
        getPlanetAxialTiltRadians(
          planet,
        ),
      [planet],
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
          1 -
            Math.exp(
              -8 * delta,
            ),
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

       SolarSystem3D owns the simulation clock.

       Planet only reads it.

       Shared Simulation Clock
                ↓
         simulationTimeRef
                ↓
            Planet.tsx
                ↓
          astronomical Date
                ↓
        orbital calculation
       ======================================================== */

    const simulationDate =
      new Date(
        simulationTimeRef.current,
      );

    /* ========================================================
       🪐 REAL ASTRONOMICAL PLANET POSITION
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
         📐 ASTRONOMICAL → VISUAL SCALE

         Real orbital distance is preserved proportionally
         while the existing visual scene composition remains.
         ====================================================== */

      const astronomicalVisualScale =
        planet.distance /
        orbitalElements.semiMajorAxisAU;

      /* ======================================================
         🌌 COORDINATE SYSTEM CONVERSION

         Astronomy:

         X = ecliptic X
         Y = ecliptic Y
         Z = ecliptic normal

         Three.js:

         X = horizontal
         Y = vertical
         Z = depth

         Therefore:

         Three X ← astronomical X
         Three Y ← astronomical Z
         Three Z ← -astronomical Y
         ====================================================== */

      group.position.x =
        astronomicalPosition.x *
        astronomicalVisualScale;

      group.position.y =
        astronomicalPosition.z *
        astronomicalVisualScale;

      group.position.z =
        -astronomicalPosition.y *
        astronomicalVisualScale;
    }

    /* ========================================================
       🌀 ABSOLUTE ASTRONOMICAL ROTATION

       The rotation is derived directly from the simulated
       astronomical date.

       W = W0 + Wdot × d

       No frame-by-frame accumulation is used.
       ======================================================== */

    const rotationGroup =
      rotationGroupRef.current;

    if (rotationGroup) {
      const rotationPhaseRadians =
        getPlanetRotationPhaseRadians(
          planet,
          simulationDate,
        );

      rotationGroup.rotation.y =
        rotationPhaseRadians;
    }

    /* ========================================================
       🧭 REAL AXIAL TILT
       ======================================================== */

    const axialTiltGroup =
      axialTiltGroupRef.current;

    if (axialTiltGroup) {
      axialTiltGroup.rotation.z =
        getPlanetAxialTiltRadians(
          planet,
        );
    }
  });

  /* ============================================================
     🎯 REGISTER PLANET REFERENCE

     useLayoutEffect is used so the reference is registered
     as early as possible in the render lifecycle.

     CameraController / CinematicController can therefore
     access the planet without waiting for a later paint.
     ============================================================ */

  useLayoutEffect(() => {
    const group =
      groupRef.current;

    if (!group) {
      return;
    }

    group.userData.planetName =
      planet.name;

    group.userData.planetVisualScale =
      visualScale;

    setRef(
      planet.name,
      groupRef,
    );
  }, [
    planet.name,
    setRef,
    visualScale,
  ]);

  /* ============================================================
     🌑 SHADOW CONFIGURATION

     This effect intentionally runs only when the planet's
     visual structure changes.

     Previously this effect had NO dependency array,
     meaning it could traverse the complete planet hierarchy
     after every render.

     That is unnecessary work.

     Transparent atmosphere/cloud layers do not cast shadows.
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

        object.castShadow =
          !hasTransparentMaterial;

        object.receiveShadow =
          !hasTransparentMaterial;
      },
    );
  }, [
    planet.name,
  ]);

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
     🎨 RENDER

     The position, rotation and tilt are initialized directly
     on the groups.

     This is important for smooth first-frame rendering.
     ============================================================ */

  return (
    <group
      ref={groupRef}
      position={[
        initialPosition.x,
        initialPosition.y,
        initialPosition.z,
      ]}
    >
      {/* ======================================================
          🌍 VISUAL PLANET GROUP

          Controls physical visual size.

          CinematicController can independently scale
          the outer group.
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

            Initialized immediately with the real axial tilt.
        ==================================================== */}

        <group
          ref={axialTiltGroupRef}
          rotation={[
            0,
            0,
            initialAxialTilt,
          ]}
        >
          {/* ==================================================
              🌀 PLANET ROTATION GROUP

              Initialized immediately with the astronomical
              rotation phase.
          ================================================== */}

          <group
            ref={rotationGroupRef}
            rotation={[
              0,
              initialRotation,
              0,
            ]}
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

            {planet.name ===
            "Earth" ? (
              <group
                onClick={handleClick}
              >
                <Earth />
              </group>

            ) : planet.name ===
              "Mars" ? (

              <group
                onClick={handleClick}
              >
                <Mars />
              </group>

            ) : planet.name ===
              "Mercury" ? (

              <group
                onClick={handleClick}
              >
                <Mercury />
              </group>

            ) : planet.name ===
              "Venus" ? (

              <group
                onClick={handleClick}
              >
                <Venus />
              </group>

            ) : planet.name ===
              "Jupiter" ? (

              <group
                onClick={handleClick}
              >
                <Jupiter />
              </group>

            ) : planet.name ===
              "Saturn" ? (

              <group
                onClick={handleClick}
              >
                <Saturn />
              </group>

            ) : planet.name ===
              "Uranus" ? (

              <group
                onClick={handleClick}
              >
                <Uranus />
              </group>

            ) : planet.name ===
              "Neptune" ? (

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

            Moon remains outside the axial rotation hierarchy.

            Therefore:

            Planet rotation
                  ❌
            does not directly rotate
            the Moon orbital system.
        ==================================================== */}

        <group
          ref={moonGroupRef}
          scale={
            selectedPlanet ===
            planet.name
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