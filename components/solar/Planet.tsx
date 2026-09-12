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

   Initial-render optimized WITHOUT removing any existing logic.

   Important goals:

   • Correct astronomical position on FIRST frame
   • Correct rotation on FIRST frame
   • Correct axial tilt on FIRST frame
   • Shared simulation clock remains the single source of truth
   • Moon system remains fully functional
   • Shadow system remains fully functional
   • Planet click behavior remains unchanged
   • Existing planet-specific visual components remain unchanged
   • Only safe performance optimizations are applied
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

     Static value for this planet.
     ========================================================== */

  const visualScale =
    PLANET_VISUAL_SCALE[
      planet.name
    ] ?? 1;

  /* ==========================================================
     🪐 ORBITAL ELEMENTS

     Reused by both initial render and frame updates.

     This avoids repeatedly looking up the same object.
     ========================================================== */

  const orbitalElements =
    useMemo(
      () =>
        ORBITAL_ELEMENTS[
          planet.name
        ],
      [planet.name],
    );

  /* ==========================================================
     📐 ASTRONOMICAL → VISUAL SCALE

     Static for the current planet.

     Previously this calculation was repeated inside
     useFrame() on every rendered frame.

     It is now calculated once.
     ========================================================== */

  const astronomicalVisualScale =
    useMemo(() => {
      if (!orbitalElements) {
        return 1;
      }

      return (
        planet.distance /
        orbitalElements.semiMajorAxisAU
      );
    }, [
      planet.distance,
      orbitalElements,
    ]);

  /* ==========================================================
     ⏱️ INITIAL SIMULATION DATE

     SolarSystem3D initializes this from Date.now().
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

     Calculated before the first visible frame.

     This prevents:

     origin → real position

     visual jumping.
     ========================================================== */

  const initialPosition =
    useMemo(() => {
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
      initialSimulationDate,
      orbitalElements,
      astronomicalVisualScale,
    ]);

  /* ==========================================================
     🧭 INITIAL ROTATION

     Correct astronomical rotation is applied immediately.
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

     Axial tilt is static for each planet.

     Calculated once instead of once per frame.
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

       SolarSystem3D owns the clock.
       ======================================================== */

    const simulationDate =
      new Date(
        simulationTimeRef.current,
      );

    /* ========================================================
       🪐 REAL ASTRONOMICAL PLANET POSITION

       Existing behavior preserved.
       ======================================================== */

    if (orbitalElements) {
      const astronomicalPosition =
        getPlanetHeliocentricPosition(
          planet.name,
          simulationDate,
        );

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

         Existing coordinate conversion preserved.
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

       Existing behavior preserved.

       W = W0 + Wdot × d
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
       🧭 AXIAL TILT

       Existing visual behavior preserved.

       The value was calculated once above because
       axial tilt does not change during runtime.
       ======================================================== */

    const axialTiltGroup =
      axialTiltGroupRef.current;

    if (axialTiltGroup) {
      axialTiltGroup.rotation.z =
        initialAxialTilt;
    }
  });

  /* ============================================================
     🎯 REGISTER PLANET REFERENCE

     Existing behavior preserved.
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

     Existing shadow logic preserved.

     This runs only when the planet identity changes.
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

     Existing click data preserved.
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

     No visual component has been removed.
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

          Existing visual scaling preserved.
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
                    planet.plasmaColors
                      ?.a ||
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

            Existing behavior preserved.
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