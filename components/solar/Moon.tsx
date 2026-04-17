import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// 🌙 Moon
export const Moon = ({ index }: { index: number }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * (index + 1);

    if (!ref.current) return;
    ref.current.position.x = 3 * Math.cos(t);
    ref.current.position.z = 3 * Math.sin(t);
  });

  return (
    <Sphere ref={ref} args={[0.3, 16, 16]}>
      <meshStandardMaterial color="gray" />
    </Sphere>
  );
};