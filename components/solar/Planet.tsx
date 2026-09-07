import { Sphere } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Moon } from "./Moon";
import { Earth } from "./Earth";
import { Mars } from "./Mars";
import { Mercury } from "./Mercury";
import { Venus } from "./Venus";
import { Jupiter } from "./Jupiter";
import { Saturn } from "./Saturn";
import * as THREE from "three";
import { PlanetComponentProps } from "@/types";
import { SIMULATION_MODES } from "@/lib/simulationTime";
import { Uranus } from "./Uranus";
import { Neptune } from "./Neptune";

export const Planet = ({
  planet,
  simulationMode,
  selectedPlanet,
  setRef,
  onClick,
}: PlanetComponentProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  const { camera } = useThree();

  // ============================================================
  // 🎥 SMOOTH ZOOM SPEED
  // ============================================================

  const currentSpeedMultiplier = useRef(1);

  // ============================================================
  // 🪐 ORBIT ANGLE
  // ============================================================

  const orbitalAngle = useRef(0);

  // ============================================================
  // 🎥 LAST FRAME TIME
  // ============================================================

  const lastTime = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // ============================================================
    // ⏱️ SIMULATION SPEED
    // ============================================================

    const daysPerSecond =
      SIMULATION_MODES[simulationMode].daysPerSecond;

    // ============================================================
    // 🎥 FIND SELECTED PLANET
    // ============================================================

    let targetDistance = 80;

    if (selectedPlanet) {
      const selectedRef =
        groupRef.current.parent?.children.find(
          (child) => {
            return (
              child.userData?.planetName ===
              selectedPlanet
            );
          }
        );

      if (selectedRef) {
        targetDistance =
          camera.position.distanceTo(
            selectedRef.getWorldPosition(
              new THREE.Vector3()
            )
          );
      }
    }

    // ============================================================
    // 🔍 ZOOM SPEED
    // ============================================================
    //
    // Close camera  → slower
    // Far camera    → faster
    //
    // IMPORTANT:
    // The value changes smoothly so planets never jump.
    // ============================================================

    const MIN_DISTANCE = 8;
    const MAX_DISTANCE = 150;

    const MIN_SPEED = 0.35;
    const MAX_SPEED = 2.2;

    const normalizedZoom =
      THREE.MathUtils.clamp(
        (targetDistance - MIN_DISTANCE) /
          (MAX_DISTANCE - MIN_DISTANCE),
        0,
        1
      );

    const targetSpeedMultiplier =
      THREE.MathUtils.lerp(
        MIN_SPEED,
        MAX_SPEED,
        normalizedZoom
      );

    currentSpeedMultiplier.current =
      THREE.MathUtils.lerp(
        currentSpeedMultiplier.current,
        targetSpeedMultiplier,
        0.06
      );

    // ============================================================
    // 🪐 PLANET ORBIT
    // ============================================================

    const orbitalSpeed =
      (daysPerSecond /
        planet.orbitalPeriodDays) *
      Math.PI *
      2;

    orbitalAngle.current -=
      orbitalSpeed *
      currentSpeedMultiplier.current *
      delta;

    groupRef.current.position.x =
      planet.distance *
      Math.cos(orbitalAngle.current);

    groupRef.current.position.z =
      planet.distance *
      Math.sin(orbitalAngle.current);

    // ============================================================
    // 🌀 GENERIC AXIAL ROTATION
    // ============================================================

    if (
      planet.name !== "Earth" &&
      planet.name !== "Mars" &&
      planet.name !== "Mercury" &&
      planet.name !== "Venus" &&
      planet.name !== "Jupiter" &&
      planet.name !== "Saturn" &&
      planet.name !== "Uranus" &&
      planet.name !== "Neptune"
    ) {
      const rotationDirection =
        planet.rotationDirection ?? 1;

      groupRef.current.rotation.y +=
        delta *
        0.3 *
        rotationDirection;
    }

    lastTime.current =
      clock.getElapsedTime();
  });

  // ============================================================
  // 🎯 STORE PLANET REFERENCE
  // ============================================================

  useEffect(() => {
    groupRef.current!.userData.planetName =
      planet.name;

    setRef(
      planet.name,
      groupRef
    );
  }, [planet.name, setRef]);

  // ============================================================
  // 🖱️ PLANET CLICK DATA
  // ============================================================

  const handleClick = () => {
    onClick({
      name: planet.name,
      distance: planet.distance,
      speed: planet.speed,
      realSpeed: planet.realSpeed,
      fact: planet.fact,

      type: planet.type,
      radius: planet.radius,
      mass: planet.mass,
      gravity: planet.gravity,
      temperature: planet.temperature,
      dayLength: planet.dayLength,
      yearLength: planet.yearLength,
      moons: planet.moons,
      gravityNote: planet.gravityNote,
    });
  };

  return (
    <group ref={groupRef}>

      {/* ======================================================
          🌍 EARTH
          ====================================================== */}

      {planet.name === "Earth" ? (
        <group onClick={handleClick}>
          <Earth />
        </group>

      ) : planet.name === "Mars" ? (

        <group onClick={handleClick}>
          <Mars />
        </group>

      ) : planet.name === "Mercury" ? (

        <group onClick={handleClick}>
          <Mercury />
        </group>

      ) : planet.name === "Venus" ? (

        <group onClick={handleClick}>
          <Venus />
        </group>

      ) : planet.name === "Jupiter" ? (

        <group onClick={handleClick}>
          <Jupiter />
        </group>

      ) : planet.name === "Saturn" ? (

        <group onClick={handleClick}>
          <Saturn />
        </group>

      ) : planet.name === "Uranus" ? (

        <group onClick={handleClick}>
          <Uranus />
        </group>

      ) : planet.name === "Neptune" ? (

        <group onClick={handleClick}>
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

      {/* ======================================================
          🌙 MAJOR / VISUAL MOONS
          ====================================================== */}

      <group>
        {planet.moonSystem?.map(
          (moon) => (
            <Moon
              key={moon.name}
              moon={moon}
              simulationMode={simulationMode}
            />
          )
        )}
      </group>

    </group>
  );
};