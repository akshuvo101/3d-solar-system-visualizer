"use client";

import { planetData } from "@/lib/planetData";
import { Canvas } from "@react-three/fiber";
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
import {
  SIMULATION_MODES,
  type PlaybackSpeed,
} from "@/lib/simulationTime";
import { CinematicController } from "./CinamaticController";
import { StarField } from "./StarField";

type Props = {
  simulationMode: keyof typeof SIMULATION_MODES;
  playbackSpeed: PlaybackSpeed;
  selectedPlanet: string;
  onPlanetClick: (planet: any) => void;
};

export default function SolarSystem3D({
  simulationMode,
  playbackSpeed,
  selectedPlanet,
  onPlanetClick,
}: Props) {
  // ============================================================
  // 🪐 PLANET REFS
  // ============================================================

  const planetRefs = useRef<
    Record<string, React.RefObject<THREE.Group | null>>
  >({});

  const setRef = (
    name: string,
    ref: React.RefObject<THREE.Group | null>,
  ) => {
    planetRefs.current[name] = ref;
  };

  // ============================================================
  // 🎥 ORBIT CONTROLS REF
  // ============================================================

  const controlsRef = useRef<any>(null);

  const environmentRef =
    useRef<THREE.Group | null>(null);

  // ============================================================
  // 🔍 MANUAL ZOOM IN
  // ============================================================

  const zoomIn = () => {
    const controls = controlsRef.current;

    if (!controls || !controls.enabled) {
      return;
    }

    controls.dollyIn(1.2);
    controls.update();
  };

  // ============================================================
  // 🔎 MANUAL ZOOM OUT
  // ============================================================

  const zoomOut = () => {
    const controls = controlsRef.current;

    if (!controls || !controls.enabled) {
      return;
    }

    controls.dollyOut(1.2);
    controls.update();
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
        shadows
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        {/* ======================================================
            🎥 ORBIT CONTROLS
            ====================================================== */}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.045}
          rotateSpeed={0.55}
          zoomSpeed={0.75}
          minDistance={4}
          maxDistance={2500}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI - 0.05}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
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

        <group ref={environmentRef}>
          <AsteroidBelt />
          <KuiperBelt />

          {planetData.map((planet, index) => (
            <OrbitPath
              key={planet.name}
              distance={planet.distance}
              index={index}
            />
          ))}
        </group>

        {/* ======================================================
            ☀️ SUN
            ====================================================== */}

        <Sun setRef={setRef} />

        {/* ======================================================
            💡 SUN LIGHT
            ====================================================== */}

        <pointLight
          position={[0, 0, 0]}
          intensity={50}
          distance={0}
          decay={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
          shadow-radius={2}
        />

        {/* ======================================================
            🌙 SOFT AMBIENT LIGHT
            ====================================================== */}

        <ambientLight intensity={0.035} />

        {/* ======================================================
            🌍 PLANETS
            ====================================================== */}

        {planetData.map((planet) => (
          <Planet
            key={planet.name}
            planet={planet}
            simulationMode={simulationMode}
            playbackSpeed={playbackSpeed}
            selectedPlanet={selectedPlanet}
            setRef={setRef}
            onClick={onPlanetClick}
          />
        ))}

        {/* ======================================================
            🎬 CINEMATIC CONTROLLER
            ====================================================== */}

        <CinematicController
          selectedPlanet={selectedPlanet}
          planetRefs={planetRefs}
          environmentRef={environmentRef}
        />

        {/* ======================================================
            🎯 CAMERA CONTROLLER
            ====================================================== */}

        <CameraController
          selectedPlanet={selectedPlanet}
          refs={planetRefs}
          controlsRef={controlsRef}
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