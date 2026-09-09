"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { STAR_POSITIONS } from "@/lib/constants";

export const StarField = () => {
  const materialRef = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    const material = materialRef.current;

    if (!material) return;

    // Very subtle cinematic breathing effect.
    // Keeps the stars alive without looking like blinking lights.
    const time = clock.elapsedTime;

    material.opacity =
      0.68 +
      Math.sin(time * 0.55) * 0.025;
  });

  return (
    <points
      frustumCulled={false}
      renderOrder={-10}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[STAR_POSITIONS, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        ref={materialRef}
        color="#dbe6ff"
        size={0.30}
        sizeAttenuation
        transparent
        opacity={0.68}
        depthWrite={false}
        depthTest
        toneMapped={false}
      />
    </points>
  );
};