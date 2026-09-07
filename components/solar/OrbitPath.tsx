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
      clock.getElapsedTime() * 0.45 +
      index * 0.7;

    const material =
      ref.current.material as THREE.MeshBasicMaterial;

    // Subtle breathing — keeps orbit alive without looking animated
    material.opacity =
      0.045 +
      0.035 *
        (Math.sin(time) * 0.5 + 0.5);
  });

  return (
    <Ring
      ref={ref}
      args={[
        distance - 0.025,
        distance + 0.025,
        192,
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color="#b9c9ff"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </Ring>
  );
};

export default OrbitPath;