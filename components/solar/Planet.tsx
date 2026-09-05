import { Ring, Sphere, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Moon } from "./Moon";
import * as THREE from "three";
import { PlanetComponentProps } from "@/types";
import { createPlanetPlasmaMaterial } from "@/shaders/planetShader";

export const Planet = ({
  planet,
  speed,
  setRef,
  onClick,
}: PlanetComponentProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  const texture = useTexture(planet.texture);

  const colors = planet.plasmaColors || {
    a: "#ffffff",
    b: "#cccccc",
    c: "#999999",
  };

  const material = useMemo(() => {
    return createPlanetPlasmaMaterial(texture, colors);
  }, [texture, colors]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() * planet.speed * speed;

    if (!groupRef.current) return;

    // 🌍 Planet orbit around the Sun
    groupRef.current.position.x =
      planet.distance * Math.cos(t);

    groupRef.current.position.z =
      planet.distance * Math.sin(t);

    // 🌀 Planet rotation
    groupRef.current.rotation.y += delta * 0.3;

    // 🔥 Shader animation
    const time = clock.getElapsedTime();

    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }
  });

  useEffect(() => {
    setRef(planet.name, groupRef);
  }, [planet.name, setRef]);

  return (
    <group ref={groupRef}>

      {/* 🌍 Planet */}
      <Sphere
        onClick={() =>
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
          })
        }
        args={[planet.size * 1.05, 32, 32]}
      >
        <meshBasicMaterial
          color={planet.plasmaColors?.a || "#ffffff"}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* 🪐 Saturn's Rings */}
      {planet.name === "Saturn" && (
        <Ring
          args={[
            planet.size * 1.5,
            planet.size * 2,
            64,
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="white"
            side={THREE.DoubleSide}
          />
        </Ring>
      )}

      {/* 🌙 Major / Visual Moons */}
      <group>
        {planet.moonSystem?.map((moon) => (
          <Moon
            key={moon.name}
            moon={moon}
          />
        ))}
      </group>

    </group>
  );
};