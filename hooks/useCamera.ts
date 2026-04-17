import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

type UseCameraProps = {
  selectedPlanet: string;
  refs: React.MutableRefObject<Record<string, React.RefObject<THREE.Group | null>>>;
};

export const useCamera = ({ selectedPlanet, refs }: UseCameraProps) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  // 🎯 Smooth follow camera
  useFrame(() => {
    const ref = refs.current[selectedPlanet];

    if (ref?.current) {
      const pos = ref.current.position;

      targetPos.current.set(
        pos.x + 10,
        pos.y + 5,
        pos.z + 10
      );

      camera.position.lerp(targetPos.current, 0.03);
      camera.lookAt(pos);
    }
  });

  // 🎯 Scroll zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const zoomSpeed = 0.05;

      camera.position.multiplyScalar(
        e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
      );
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [camera]);
};