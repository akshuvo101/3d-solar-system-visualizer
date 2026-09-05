import { Ring } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type OrbitPathProps = {
  distance: number;
  index: number;
};

const OrbitPath = ({
  distance,
  index,
}: OrbitPathProps) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const time =
      clock.getElapsedTime() * 0.8 + index * 0.7;

    const material =
      ref.current.material as THREE.MeshBasicMaterial;

    // ✨ Very subtle breathing effect
    material.opacity =
      0.08 +
      0.07 *
        (Math.sin(time) * 0.5 + 0.5);
  });

  return (
    <Ring
      ref={ref}
      args={[
        distance - 0.035,
        distance + 0.035,
        160,
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color="#ff4dc4"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </Ring>
  );
};

export default OrbitPath;