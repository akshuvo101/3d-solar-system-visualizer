"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const STAR_COUNT = 2800;
const STAR_RADIUS_MIN = 350;
const STAR_RADIUS_MAX = 1800;

export const StarField = () => {
  const starsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  /*
   * --------------------------------------------------
   * Generate Random 3D Star Distribution
   * --------------------------------------------------
   *
   * Stars are distributed inside a spherical volume.
   *
   * This avoids:
   * - vertical columns
   * - horizontal lines
   * - grid-like patterns
   * - repeated spacing
   */

  const starPositions = useMemo(() => {
    const positions = new Float32Array(
      STAR_COUNT * 3,
    );

    const random = () => {
      /*
       * Seeded-looking randomization using Math.random.
       * Every star gets a completely independent position.
       */

      return Math.random();
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      /*
       * Random spherical coordinates.
       */

      const theta =
        random() * Math.PI * 2;

      const phi =
        Math.acos(
          2 * random() - 1,
        );

      /*
       * Cubic-root distribution prevents
       * stars from becoming too concentrated
       * near the center.
       */

      const radius =
        STAR_RADIUS_MIN +
        Math.cbrt(random()) *
          (STAR_RADIUS_MAX -
            STAR_RADIUS_MIN);

      const sinPhi = Math.sin(phi);

      const x =
        radius *
        sinPhi *
        Math.cos(theta);

      const y =
        radius *
        Math.cos(phi);

      const z =
        radius *
        sinPhi *
        Math.sin(theta);

      const index = i * 3;

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
    }

    return positions;
  }, []);

  /*
   * --------------------------------------------------
   * Cinematic Animation
   * --------------------------------------------------
   */

  useFrame(({ clock }) => {
    const stars = starsRef.current;
    const material = materialRef.current;

    if (!stars || !material) return;

    const time = clock.elapsedTime;

    /*
     * Extremely slow rotation.
     *
     * This is intentionally almost invisible.
     */

    stars.rotation.y =
      time * 0.00035;

    stars.rotation.x =
      Math.sin(time * 0.0002) * 0.001;

    /*
     * Subtle global breathing.
     *
     * No aggressive blinking.
     */

    material.opacity =
      0.66 +
      Math.sin(time * 0.35) * 0.018;
  });

  return (
    <points
      ref={starsRef}
      frustumCulled={false}
      renderOrder={-10}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[starPositions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        ref={materialRef}
        color="#dbe6ff"
        size={0.28}
        sizeAttenuation
        transparent
        opacity={0.66}
        depthWrite={false}
        depthTest={true}
        toneMapped={false}
      />
    </points>
  );
};