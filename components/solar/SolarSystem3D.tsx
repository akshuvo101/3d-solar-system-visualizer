
import { planetData } from "@/lib/planetData";
import { Canvas } from "@react-three/fiber";
import { StarField } from "./StarField";
import { Sun } from "./Sun";
import OrbitPath from "./OrbitPath";
import { CameraController } from "./CameraController";
import { Planet } from "./Planet";
import { useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import ZoomControls from "../ui/Button";
import { DeepSpace } from "./DeepSpace";
import { AsteroidBelt } from "./AsteroidBelt";
import { KuiperBelt } from "./KuiperBelt";

type Props = {
  speed: number;
  selectedPlanet: string;
  onPlanetClick: (planet: any) => void;
};

export default function SolarSystem3D({
  speed,
  selectedPlanet,
  onPlanetClick,
}: Props) {
  const planetRefs = useRef<
    Record<string, React.RefObject<THREE.Group | null>>
  >({});

  const setRef = (
    name: string,
    ref: React.RefObject<THREE.Group | null>
  ) => {
    planetRefs.current[name] = ref;
  };

  const controlsRef = useRef<any>(null);

  /*
   * ============================================================
   * 🔍 MANUAL ZOOM IN
   * ============================================================
   */
  const zoomIn = () => {
    if (!controlsRef.current) return;

    controlsRef.current.dollyIn(1.2);
    controlsRef.current.update();
  };

  /*
   * ============================================================
   * 🔎 MANUAL ZOOM OUT
   * ============================================================
   */
  const zoomOut = () => {
    if (!controlsRef.current) return;

    controlsRef.current.dollyOut(1.2);
    controlsRef.current.update();
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [0, 30, 80],
          fov: 65,
          near: 0.1,
          far: 5000,
        }}
        dpr={[1, 2]}
      >
        {/* ======================================================
            🎥 PROFESSIONAL 3D CAMERA
            ====================================================== */}

        <OrbitControls
          ref={controlsRef}
          makeDefault

          /*
           * 🖱️ Full 360° rotation
           */
          enableRotate
          rotateSpeed={0.55}

          /*
           * 🔍 Smooth zoom
           */
          enableZoom
          zoomSpeed={0.75}

          /*
           * ✨ Cinematic damping
           */
          enableDamping
          dampingFactor={0.045}

          /*
           * 🚫 No camera panning
           */
          enablePan={false}

          /*
           * 📏 VERY LARGE ZOOM RANGE
           *
           * User can completely leave
           * the selected planet.
           */
          minDistance={4}
          maxDistance={2500}

          /*
           * ↕️ Almost full vertical rotation
           */
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI - 0.05}

          /*
           * 🔄 Unlimited horizontal rotation
           */
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}

          /*
           * 🖱️ Mouse controls
           */
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}

          /*
           * 📱 Touch controls
           */
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
        />

        {/* ======================================================
            🌌 DEEP SPACE
            ====================================================== */}

        <DeepSpace />

        {/* ======================================================
            ✨ STARS
            ====================================================== */}

        <StarField />

        {/* ======================================================
            🪨 ASTEROID BELT
            ====================================================== */}

        <AsteroidBelt />

        {/* ======================================================
            🧊 KUIPER BELT
            ====================================================== */}

        <KuiperBelt />

        {/* ======================================================
            ☀️ SUN
            ====================================================== */}

        <Sun />

        {/* ======================================================
            🪐 PLANET ORBIT PATHS
            ====================================================== */}

        {planetData.map((planet, index) => (
          <OrbitPath
            key={planet.name}
            distance={planet.distance}
            index={index}
          />
        ))}

        {/* ======================================================
            🌍 PLANETS + MOONS
            ====================================================== */}

        {planetData.map((planet) => (
          <Planet
            key={planet.name}
            planet={planet}
            speed={speed}
            selectedPlanet={selectedPlanet}
            setRef={setRef}
            onClick={onPlanetClick}
          />
        ))}

        {/* ======================================================
            🎯 CINEMATIC PLANET CAMERA
            ====================================================== */}

        <CameraController
          selectedPlanet={selectedPlanet}
          refs={planetRefs}
        />
      </Canvas>

      {/* ========================================================
          🔍 MANUAL ZOOM CONTROLS
          ======================================================== */}

      <ZoomControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
      />
    </div>
  );
}
