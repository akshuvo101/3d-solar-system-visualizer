import { useCamera } from "@/hooks/useCamera";
import * as THREE from "three";

type CameraControllerProps = {
  selectedPlanet: string;
  refs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;
  controlsRef: React.RefObject<any>;
};

export const CameraController = ({
  selectedPlanet,
  refs,
  controlsRef,
}: CameraControllerProps) => {
  useCamera({
    selectedPlanet,
    refs,
    controlsRef,
  });

  return null;
};