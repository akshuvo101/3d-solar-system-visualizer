import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { MoonSystemType } from "@/types";

type MoonProps = {
  moon: MoonSystemType;
};

export const Moon = ({ moon }: MoonProps) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const time = clock.getElapsedTime();

    // 🌙 Each moon has its own orbital speed and starting angle
    const angle =
      time * moon.speed + (moon.angle ?? 0);

    const inclination =
      THREE.MathUtils.degToRad(moon.inclination ?? 0);

    // Base orbital position
    const x = moon.distance * Math.cos(angle);
    const z = moon.distance * Math.sin(angle);

    // Apply orbital inclination
    const y = Math.sin(angle) * Math.sin(inclination) * moon.distance;

    ref.current.position.set(x, y, z);

    // Small synchronous rotation
    ref.current.rotation.y += 0.01;
  });

  return (
    <Sphere
      ref={ref}
      args={[moon.size, 16, 16]}
    >
      <meshStandardMaterial
        color={moon.color ?? "#a0a0a0"}
        roughness={0.9}
        metalness={0}
      />
    </Sphere>
  );
};