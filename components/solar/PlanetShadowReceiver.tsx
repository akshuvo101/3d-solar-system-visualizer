"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

type PlanetShadowReceiverProps = {
  radius?: number;
  opacity?: number;
  segments?: number;
};

export default function PlanetShadowReceiver({
  radius = 1,
  opacity = 0.22,
  segments = 64,
}: PlanetShadowReceiverProps) {
  const material = useMemo(() => {
    const mat = new THREE.ShadowMaterial({
      color: 0x000000,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
    });

    return mat;
  }, [opacity]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh
      scale={1.012}
      receiveShadow
      renderOrder={30}
      raycast={() => null}
    >
      <sphereGeometry args={[radius, segments, segments]} />

      <primitive
        object={material}
        attach="material"
      />
    </mesh>
  );
}