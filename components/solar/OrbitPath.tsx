"use client";

import { Ring } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type OrbitPathProps = {
  distance: number;
};

const OrbitPath = ({ distance }: OrbitPathProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const controls = useThree((state) => (state as any).controls);
  const opacityRef = useRef(0);
  const targetPosition = useRef(new THREE.Vector3());

  // Keep a fine, thread-like stroke that remains readable at system scale.
  // A small minimum avoids sub-pixel flicker when the whole system is visible.
  const lineWidth = THREE.MathUtils.clamp(distance * 0.00042, 0.012, 0.026);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const material = ref.current.material as THREE.MeshBasicMaterial;
    let cameraDistance = camera.position.length();

    if (controls?.target) {
      targetPosition.current.copy(controls.target);
      cameraDistance = camera.position.distanceTo(targetPosition.current);
    }

    // Fade orbit paths away near a selected planet; reveal them gently
    // when zooming out to the system view, with restrained brightness.
    const zoomVisibility = THREE.MathUtils.smoothstep(
      cameraDistance,
      17,
      50,
    );
    const targetOpacity = THREE.MathUtils.lerp(
      0.0,
      0.42,
      zoomVisibility,
    );

    opacityRef.current = THREE.MathUtils.lerp(
      opacityRef.current,
      targetOpacity,
      1 - Math.exp(-6 * delta),
    );
    material.opacity = opacityRef.current;
  });

  return (
    <Ring
      ref={ref}
      args={[
        Math.max(0.1, distance - lineWidth),
        distance + lineWidth,
        480,
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color="#b9c8ff"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </Ring>
  );
};

export default OrbitPath;
