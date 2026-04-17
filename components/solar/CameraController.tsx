import { CameraControllerProps } from "@/types";
import { useCamera } from "@/hooks/useCamera";

export const CameraController = ({ selectedPlanet, refs }: CameraControllerProps) => {
  useCamera({ selectedPlanet, refs });
  return null;
};