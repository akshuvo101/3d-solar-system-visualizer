"use client";

import { planetData } from "@/lib/planetData";
import { Canvas, useFrame } from "@react-three/fiber";
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

/* ============================================================
   🌌 SHARED SIMULATION CLOCK

   Every planet must use the SAME astronomical time.

   The clock starts from the real current UTC time.

   Example:

   Page opened:
   2026-09-10 02:55 UTC

   Simulation clock starts:
   2026-09-10 02:55 UTC

   Then Day / Month / Year + playback speed
   advance this single clock.

   IMPORTANT:

   The same exact simulation delta is also shared
   with planet axial rotation.

   Therefore orbital motion and axial rotation
   always use the same simulated elapsed time.
   ============================================================ */

const DAY_IN_MILLISECONDS = 86_400_000;

type Props = {
  simulationMode: keyof typeof SIMULATION_MODES;
  playbackSpeed: PlaybackSpeed;
  selectedPlanet: string;
  onPlanetClick: (planet: any) => void;
};

/* ============================================================
   ⏱️ SHARED SIMULATION CLOCK

   This component lives inside Canvas so it can use useFrame().

   It updates TWO shared values:

   1. simulationTimeRef
      → Current simulated astronomical timestamp.

   2. simulationDeltaDaysRef
      → Exact simulated Earth-days elapsed during
        the current rendered frame.

   Planet components consume both values.

   This guarantees:

   Shared Simulation Clock
            ↓
      simulation Δtime
         ↙       ↘
      Orbit    Rotation
   ============================================================ */

function SimulationClock({
  simulationMode,
  playbackSpeed,
  simulationTimeRef,
  simulationDeltaDaysRef,
}: {
  simulationMode: keyof typeof SIMULATION_MODES;
  playbackSpeed: PlaybackSpeed;
  simulationTimeRef: React.MutableRefObject<number>;
  simulationDeltaDaysRef: React.MutableRefObject<number>;
}) {
  /* ==========================================================
     🌀 SMOOTH SIMULATION SPEED

     This prevents a sudden jump when switching:

     Day → Month
     Month → Year
     Year → Day
     ========================================================== */

  const currentDaysPerSecond = useRef<number>(
    SIMULATION_MODES[
      simulationMode
    ].daysPerSecond,
  );

  useFrame((_, delta) => {
    /* ========================================================
       🎯 TARGET SIMULATION SPEED
       ======================================================== */

    const targetDaysPerSecond =
      SIMULATION_MODES[
        simulationMode
      ].daysPerSecond;

    /* ========================================================
       🌀 SMOOTH MODE TRANSITION

       The current simulation speed gradually approaches
       the selected mode speed.

       This keeps Day / Month / Year transitions smooth.
       ======================================================== */

    currentDaysPerSecond.current =
      THREE.MathUtils.lerp(
        currentDaysPerSecond.current,
        targetDaysPerSecond,
        1 - Math.exp(-8 * delta),
      );

    /* ========================================================
       ⚡ PLAYBACK SPEED

       Example:

       Year mode
       × 5 playback
       =
       5× faster simulation time
       ======================================================== */

    const effectivePlaybackSpeed =
      playbackSpeed ?? 1;

    const daysPerSecond =
      currentDaysPerSecond.current *
      effectivePlaybackSpeed;

    /* ========================================================
       ⏱️ EXACT SIMULATED TIME ELAPSED

       days/sec
          ×
       real seconds/frame
          =
       simulated Earth-days/frame

       IMPORTANT:

       This exact value is shared with EVERY planet.

       No Planet component calculates its own
       simulation speed anymore.
       ======================================================== */

    const simulationDeltaDays =
      daysPerSecond * delta;

    /* ========================================================
       📡 SHARE EXACT FRAME DELTA

       Planet.tsx will use this value for axial rotation.

       Therefore rotation uses the exact same
       simulated elapsed time as orbital motion.
       ======================================================== */

    simulationDeltaDaysRef.current =
      simulationDeltaDays;

    /* ========================================================
       🌍 ADVANCE SHARED ASTRONOMICAL TIME

       simulated days
            ×
       milliseconds/day
            =
       simulated milliseconds
       ======================================================== */

    simulationTimeRef.current +=
      simulationDeltaDays *
      DAY_IN_MILLISECONDS;
  });

  return null;
}

export default function SolarSystem3D({
  simulationMode,
  playbackSpeed,
  selectedPlanet,
  onPlanetClick,
}: Props) {
  /* ============================================================
     🪐 PLANET REFS
     ============================================================ */

  const planetRefs = useRef<
    Record<
      string,
      React.RefObject<THREE.Group | null>
    >
  >({});

  const setRef = (
    name: string,
    ref: React.RefObject<THREE.Group | null>,
  ) => {
    planetRefs.current[name] = ref;
  };

  /* ============================================================
     🎥 ORBIT CONTROLS REF
     ============================================================ */

  const controlsRef = useRef<any>(null);

  /* ============================================================
     🌌 ENVIRONMENT REF
     ============================================================ */

  const environmentRef =
    useRef<THREE.Group | null>(null);

  /* ============================================================
     ⏱️ SHARED ASTRONOMICAL SIMULATION TIME

     IMPORTANT:

     This is initialized ONLY from the real current time.

     localStorage is intentionally NOT used.

     Every planet receives this exact same time.

     On page reload:

     Date.now()
          ↓
     new astronomical starting point
     ============================================================ */

  const simulationTimeRef =
    useRef<number>(Date.now());

  /* ============================================================
     ⏱️ SHARED SIMULATION DELTA

     This stores the exact amount of simulated
     Earth-days that passed during the current frame.

     SimulationClock calculates it once.

     Every Planet consumes the same value.

     This is what synchronizes:

     🪐 Orbital motion
            +
     🔄 Axial rotation
     ============================================================ */

  const simulationDeltaDaysRef =
    useRef<number>(0);

  /* ============================================================
     🔍 MANUAL ZOOM IN
     ============================================================ */

  const zoomIn = () => {
    const controls =
      controlsRef.current;

    if (
      !controls ||
      !controls.enabled
    ) {
      return;
    }

    controls.dollyIn(1.2);
    controls.update();
  };

  /* ============================================================
     🔎 MANUAL ZOOM OUT
     ============================================================ */

  const zoomOut = () => {
    const controls =
      controlsRef.current;

    if (
      !controls ||
      !controls.enabled
    ) {
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
          powerPreference:
            "high-performance",
        }}
      >
        {/* ======================================================
            ⏱️ SHARED SIMULATION CLOCK

            MUST be rendered before planets.

            This creates ONE simulation time and
            ONE exact simulation delta for the
            entire solar system.
        ====================================================== */}

        <SimulationClock
          simulationMode={
            simulationMode
          }
          playbackSpeed={
            playbackSpeed
          }
          simulationTimeRef={
            simulationTimeRef
          }
          simulationDeltaDaysRef={
            simulationDeltaDaysRef
          }
        />

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
          maxPolarAngle={
            Math.PI - 0.05
          }
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

        <group
          ref={environmentRef}
        >
          <AsteroidBelt />
          <KuiperBelt />

          {planetData.map(
            (planet, index) => (
              <OrbitPath
                key={planet.name}
                distance={
                  planet.distance
                }
                index={index}
              />
            ),
          )}
        </group>

        {/* ======================================================
            ☀️ SUN
        ====================================================== */}

        <Sun
          setRef={setRef}
        />

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

        <ambientLight
          intensity={0.035}
        />

        {/* ======================================================
            🌍 PLANETS
        ====================================================== */}

        {planetData.map(
          (planet) => (
            <Planet
              key={planet.name}
              planet={planet}
              simulationMode={
                simulationMode
              }
              playbackSpeed={
                playbackSpeed
              }
              simulationTimeRef={
                simulationTimeRef
              }
              simulationDeltaDaysRef={
                simulationDeltaDaysRef
              }
              selectedPlanet={
                selectedPlanet
              }
              setRef={setRef}
              onClick={
                onPlanetClick
              }
            />
          ),
        )}

        {/* ======================================================
            🎬 CINEMATIC CONTROLLER
        ====================================================== */}

        <CinematicController
          selectedPlanet={
            selectedPlanet
          }
          planetRefs={
            planetRefs
          }
          environmentRef={
            environmentRef
          }
        />

        {/* ======================================================
            🎯 CAMERA CONTROLLER
        ====================================================== */}

        <CameraController
          selectedPlanet={
            selectedPlanet
          }
          refs={planetRefs}
          controlsRef={
            controlsRef
          }
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