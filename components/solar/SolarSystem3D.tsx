import { planetData } from "@/lib/planetData";
import { Canvas } from "@react-three/fiber";
import { StarField } from "./StarField";
import { Sun } from "./Sun";
import OrbitPath from "./OrbitPath";
import { CameraController } from "./CameraController";
import { Planet } from "./Planet";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import ZoomControls from "../ui/Button";
import PlanetInfo from "@/components/common/PlanetInfo";

type Props = {
  speed: number;
  selectedPlanet: string;
  onPlanetClick: (planet: any) => void;
};

export default function SolarSystem3D({
  speed,
  selectedPlanet,
  onPlanetClick
}: Props) {
  const planetRefs = useRef<
    Record<string, React.RefObject<THREE.Group | null>>
  >({});

  const setRef = (name: string, ref: React.RefObject<THREE.Group | null>) => {
    planetRefs.current[name] = ref;
  };


  const controlsRef = useRef<any>(null);

  const zoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2);
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2);
      controlsRef.current.update();
    }
  };
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [0, 30, 80], fov: 65 }}>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={1200}
        />
        <StarField />
        <Sun />

        {planetData.map((planet, index) => (
          <OrbitPath
            key={planet.name}
            distance={planet.distance}
            index={index}
          />
        ))}

        {planetData.map((planet) => (
          <Planet
            key={planet.name}
            planet={planet}
            speed={speed}
            setRef={setRef}
            onClick={onPlanetClick}
          />
        ))}

        <CameraController selectedPlanet={selectedPlanet} refs={planetRefs} />
      </Canvas>
      <ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} />
    </div>
  );
}
