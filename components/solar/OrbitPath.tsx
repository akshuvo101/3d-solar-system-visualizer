import { Ring } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three"; // ✅ ADD THIS

const OrbitPath = ({ distance, index }: { distance: number; index: number }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 1.3 + index;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.14 + 0.12 * (Math.sin(t) * 0.5 + 0.5);
    ref.current.rotation.z += 0.0012;
  });

  return (
    <Ring
      ref={ref}
      args={[distance - 0.08, distance + 0.08, 128]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color="#ff4dc4"
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </Ring>
  );
};

export default OrbitPath;