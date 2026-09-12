"use client";

import { planetData } from "@/lib/planetData";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sun } from "./Sun";
import OrbitPath from "./OrbitPath";
import { CameraController } from "./CameraController";
import { Planet } from "./Planet";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import ZoomControls from "../ui/Button";
import { DeepSpace } from "./DeepSpace";
import { AsteroidBelt } from "./AsteroidBelt";
import { KuiperBelt } from "./KuiperBelt";

import {
  SIMULATION_MODES,
  type PlaybackSpeed,
  type SimulationMode,
} from "@/lib/simulationTime";

import { CinematicController } from "./CinamaticController";
import { StarField } from "./StarField";

import type { PlanetSelection } from "@/types";

/* ============================================================
   🌌 SHARED SIMULATION CLOCK

   Every planet uses the SAME astronomical time.

   The clock starts from the real current UTC time.

   Shared Simulation Clock
             ↓
       Simulation Δtime
          ↙       ↘
       Orbit     Rotation
   ============================================================ */

const DAY_IN_MILLISECONDS = 86_400_000;

/* ============================================================
   🎬 PROGRESSIVE STARTUP TIMING

   The main solar system is rendered immediately.

   Only heavier decorative systems are delayed slightly
   so the browser/GPU does not need to initialize every
   expensive object during the very first frame.

   This gives the user:

   Page Open
       ↓
   Background
       ↓
   Sun + Planets
       ↓
   Heavy Environment
       ↓
   Orbit Paths
   ============================================================ */

const ENVIRONMENT_START_DELAY = 180;
const ORBIT_START_DELAY = 280;

/* ============================================================
   💡 SHADOW STARTUP TIMING

   Shadow rendering is one of the heavier GPU operations
   during the first scene initialization.

   The actual shadow configuration is NOT changed.

   We only wait a very short moment before enabling the
   existing 2048 × 2048 shadow map.

   Final visual quality remains the same.
   ============================================================ */

const SHADOW_START_DELAY = 120;

type Props = {
  simulationMode: SimulationMode;
  playbackSpeed: PlaybackSpeed;
  selectedPlanet: string;
  onPlanetClick: (planet: PlanetSelection) => void;
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
  simulationMode: SimulationMode;
  playbackSpeed: PlaybackSpeed;
  simulationTimeRef: React.MutableRefObject<number>;
  simulationDeltaDaysRef: React.MutableRefObject<number>;
}) {
  /* ==========================================================
     🌀 SMOOTH SIMULATION SPEED
     ========================================================== */

  const currentDaysPerSecond = useRef<number>(
    SIMULATION_MODES[simulationMode].daysPerSecond,
  );

  useFrame((_, delta) => {
    /* ========================================================
       🎯 TARGET SIMULATION SPEED
       ======================================================== */

    const targetDaysPerSecond =
      SIMULATION_MODES[simulationMode].daysPerSecond;

    /* ========================================================
       🌀 SMOOTH MODE TRANSITION
       ======================================================== */

    currentDaysPerSecond.current = THREE.MathUtils.lerp(
      currentDaysPerSecond.current,
      targetDaysPerSecond,
      1 - Math.exp(-8 * delta),
    );

    /* ========================================================
       ⚡ PLAYBACK SPEED
       ======================================================== */

    const effectivePlaybackSpeed = playbackSpeed ?? 1;

    const daysPerSecond =
      currentDaysPerSecond.current * effectivePlaybackSpeed;

    /* ========================================================
       ⏱️ EXACT SIMULATED TIME ELAPSED
       ======================================================== */

    const simulationDeltaDays = daysPerSecond * delta;

    /* ========================================================
       📡 SHARE EXACT FRAME DELTA
       ======================================================== */

    simulationDeltaDaysRef.current = simulationDeltaDays;

    /* ========================================================
       🌍 ADVANCE SHARED ASTRONOMICAL TIME
       ======================================================== */

    simulationTimeRef.current +=
      simulationDeltaDays * DAY_IN_MILLISECONDS;
  });

  return null;
}

/* ============================================================
   🎬 PROGRESSIVE SCENE STARTUP

   Main scene objects are NOT delayed.

   This controller only controls:

   • Heavy environment
   • Orbit paths
   • Shadow rendering

   No artificial full-scene waiting period is used.
   ============================================================ */

function SceneStartup({
  onEnvironmentReady,
  onOrbitReady,
  onShadowsReady,
}: {
  onEnvironmentReady: () => void;
  onOrbitReady: () => void;
  onShadowsReady: () => void;
}) {
  const elapsedRef = useRef(0);

  const environmentReadyRef = useRef(false);
  const orbitReadyRef = useRef(false);
  const shadowsReadyRef = useRef(false);

  useFrame((_, delta) => {
    elapsedRef.current += delta;

    /* ========================================================
       💡 SHADOWS

       Enable the existing shadow system very shortly after
       the first scene frames.

       This allows the Sun + planets to initialize first.
       ======================================================== */

    if (
      !shadowsReadyRef.current &&
      elapsedRef.current >= SHADOW_START_DELAY / 1000
    ) {
      shadowsReadyRef.current = true;

      onShadowsReady();
    }

    /* ========================================================
       🌌 HEAVY ENVIRONMENT
       ======================================================== */

    if (
      !environmentReadyRef.current &&
      elapsedRef.current >= ENVIRONMENT_START_DELAY / 1000
    ) {
      environmentReadyRef.current = true;

      onEnvironmentReady();
    }

    /* ========================================================
       🌀 ORBIT PATHS
       ======================================================== */

    if (
      !orbitReadyRef.current &&
      elapsedRef.current >= ORBIT_START_DELAY / 1000
    ) {
      orbitReadyRef.current = true;

      onOrbitReady();
    }
  });

  return null;
}

/* ============================================================
   🌌 SOLAR SYSTEM
   ============================================================ */

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
    Record<string, React.RefObject<THREE.Group | null>>
  >({});

  /* ============================================================
     🪐 STABLE PLANET REF CALLBACK

     Keeps the callback reference stable between renders.

     This avoids unnecessary effect re-runs inside Planet
     components when simulation state changes.
     ============================================================ */

  const setRef = useCallback(
    (
      name: string,
      ref: React.RefObject<THREE.Group | null>,
    ) => {
      planetRefs.current[name] = ref;
    },
    [],
  );

  /* ============================================================
     🎥 ORBIT CONTROLS REF
     ============================================================ */

  const controlsRef = useRef<any>(null);

  /* ============================================================
     🌌 ENVIRONMENT REF
     ============================================================ */

  const environmentRef = useRef<THREE.Group | null>(null);

  /* ============================================================
     ⏱️ SHARED ASTRONOMICAL SIMULATION TIME

     Initialized ONLY from the real current time.

     localStorage is intentionally NOT used.
     ============================================================ */

  const simulationTimeRef = useRef<number>(Date.now());

  /* ============================================================
     ⏱️ SHARED SIMULATION DELTA
     ============================================================ */

  const simulationDeltaDaysRef = useRef<number>(0);

  /* ============================================================
     🎬 PROGRESSIVE STARTUP STATE

     These states control only heavy/deferred systems.

     The main solar system itself is visible immediately.
     ============================================================ */

  const [environmentReady, setEnvironmentReady] =
    useState(false);

  const [orbitReady, setOrbitReady] =
    useState(false);

  const [shadowsReady, setShadowsReady] =
    useState(false);

  /* ============================================================
     🎬 STARTUP CALLBACKS
     ============================================================ */

  const handleEnvironmentReady = useCallback(() => {
    setEnvironmentReady(true);
  }, []);

  const handleOrbitReady = useCallback(() => {
    setOrbitReady(true);
  }, []);

  const handleShadowsReady = useCallback(() => {
    setShadowsReady(true);
  }, []);

  /* ============================================================
     🔍 MANUAL ZOOM IN
     ============================================================ */

  const zoomIn = () => {
    const controls = controlsRef.current;

    if (!controls || !controls.enabled) {
      return;
    }

    controls.dollyIn(1.2);
    controls.update();
  };

  /* ============================================================
     🔎 MANUAL ZOOM OUT
     ============================================================ */

  const zoomOut = () => {
    const controls = controlsRef.current;

    if (!controls || !controls.enabled) {
      return;
    }

    controls.dollyOut(1.2);
    controls.update();
  };

  /* ============================================================
     🌌 PAGE ROOT

     The background exists immediately.

     This means the user never sees a white/empty area while
     the WebGL canvas initializes.
     ============================================================ */

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",

        background:
          "radial-gradient(circle at center, #090d1c 0%, #03050d 55%, #000108 100%)",
      }}
    >
      {/* ======================================================
          🌌 INITIAL SPACE BACKGROUND

          Exists outside Canvas.

          This provides immediate visual feedback while
          WebGL is initializing.
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",

          background:
            "radial-gradient(circle at 50% 48%, rgba(28, 42, 90, 0.16), transparent 42%)",

          zIndex: 0,
        }}
      />

      {/* ======================================================
          🎬 THREE.JS SCENE

          The Canvas is visible immediately.

          There is NO artificial full-scene opacity delay.
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <Canvas
          camera={{
            position: [0, 30, 80],
            fov: 65,
            near: 0.1,
            far: 5000,
          }}

          /* ==================================================
             🚀 PERFORMANCE

             Maximum DPR remains 1.5.

             This keeps good visual quality while reducing
             initial GPU workload on high-density displays.
          ================================================== */

          dpr={[1, 1.5]}

          /*
             IMPORTANT:
             Shadow rendering remains enabled.

             We only delay the actual shadow-casting light
             by a very short amount.

             Final shadow quality is unchanged.
          */
          shadows

          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
        >
          {/* ==================================================
              ⏱️ SHARED SIMULATION CLOCK

              MUST remain before planets.
          ================================================== */}

          <SimulationClock
            simulationMode={simulationMode}
            playbackSpeed={playbackSpeed}
            simulationTimeRef={simulationTimeRef}
            simulationDeltaDaysRef={
              simulationDeltaDaysRef
            }
          />

          {/* ==================================================
              🎬 STARTUP CONTROLLER

              Lightweight.

              Only delays heavy/deferred systems.
          ================================================== */}

          <SceneStartup
            onEnvironmentReady={
              handleEnvironmentReady
            }
            onOrbitReady={handleOrbitReady}
            onShadowsReady={handleShadowsReady}
          />

          {/* ==================================================
              🎥 ORBIT CONTROLS

              Existing camera behavior preserved.
          ================================================== */}

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

          {/* ==================================================
              🌌 DEEP SPACE

              Immediate.
          ================================================== */}

          <DeepSpace />

          {/* ==================================================
              ✨ STAR FIELD

              Immediate.

              Lightweight enough to establish the space
              environment from the first rendered frame.
          ================================================== */}

          <StarField />

          {/* ==================================================
              🌌 HEAVIER ENVIRONMENT

              Delayed slightly.

              Includes:

              • Asteroid Belt
              • Kuiper Belt
          ================================================== */}

          {environmentReady && (
            <group ref={environmentRef}>
              <AsteroidBelt />
              <KuiperBelt />
            </group>
          )}

          {/* ==================================================
              🌀 ORBIT PATHS

              Delayed slightly after the environment.

              This prevents all orbit geometries from being
              created during the initial frame.
          ================================================== */}

          {orbitReady && (
            <group>
              {planetData.map((planet, index) => (
                <OrbitPath
                  key={planet.name}
                  distance={planet.distance}
                  index={index}
                />
              ))}
            </group>
          )}

          {/* ==================================================
              ☀️ SUN

              Main visual anchor.

              Rendered immediately.
          ================================================== */}

          <Sun setRef={setRef} />

          {/* ==================================================
              💡 SUN LIGHT

              IMPORTANT:

              All existing lighting values are preserved.

              Only castShadow is progressively enabled.

              Before shadowsReady:
                  castShadow = false

              After startup:
                  castShadow = true

              Therefore the final lighting/shadow quality
              remains exactly as before.
          ================================================== */}

          <pointLight
            position={[0, 0, 0]}
            intensity={65}
            distance={0}
            decay={0.8}

            castShadow={shadowsReady}

            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0002}
            shadow-normalBias={0.02}
            shadow-radius={2}
          />

          {/* ==================================================
              🌙 SOFT AMBIENT LIGHT

              Existing value preserved.
          ================================================== */}

          <ambientLight intensity={0.06} />

          {/* ==================================================
              🌍 PLANETS

              Rendered immediately.

              No planet has been removed.

              All existing simulation, interaction,
              astronomical positioning and rotation logic
              remains intact inside Planet.
          ================================================== */}

          {planetData.map((planet) => (
            <Planet
              key={planet.name}
              planet={planet}
              simulationMode={simulationMode}
              playbackSpeed={playbackSpeed}
              simulationTimeRef={simulationTimeRef}
              simulationDeltaDaysRef={
                simulationDeltaDaysRef
              }
              selectedPlanet={selectedPlanet}
              setRef={setRef}
              onClick={onPlanetClick}
            />
          ))}

          {/* ==================================================
              🎬 CINEMATIC CONTROLLER

              Existing behavior preserved.
          ================================================== */}

          <CinematicController
            selectedPlanet={selectedPlanet}
            planetRefs={planetRefs}
            environmentRef={environmentRef}
          />

          {/* ==================================================
              🎯 CAMERA CONTROLLER

              Existing behavior preserved.
          ================================================== */}

          <CameraController
            selectedPlanet={selectedPlanet}
            refs={planetRefs}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>

      {/* ========================================================
          🔍 MANUAL ZOOM CONTROLS

          Existing UI preserved.
      ======================================================== */}

      <ZoomControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
      />
    </div>
  );
}