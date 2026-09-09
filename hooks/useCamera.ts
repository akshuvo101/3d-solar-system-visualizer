"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLANET_CLOSEUP_CAMERA_DISTANCE } from "@/lib/planetVisualScale";

type UseCameraProps = {
  selectedPlanet: string;

  refs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;

  controlsRef?: React.RefObject<any>;
};

// ============================================================
// 🎥 CAMERA DISTANCES
// ============================================================

const CAMERA_DISTANCES: Record<string, number> = {
  /*
   * ☀️ Sun is physically much larger than planets.
   *
   * Therefore we keep the camera much farther away.
   */
  Sun: 45,

  Mercury: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Venus: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Earth: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Mars: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Jupiter: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Saturn: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Uranus: PLANET_CLOSEUP_CAMERA_DISTANCE,
  Neptune: PLANET_CLOSEUP_CAMERA_DISTANCE,
};

// ============================================================
// 🔍 CAMERA LIMITS
// ============================================================

const MIN_DISTANCE = 5;
const MAX_DISTANCE = 1200;

/*
 * Special minimum distance while viewing the Sun.
 *
 * This prevents the camera from entering the huge
 * solar sphere and turning the entire screen red.
 */
const SUN_MIN_DISTANCE = 12;

// ============================================================
// 🎬 CAMERA TRANSITION
// ============================================================

const TRANSITION_SPEED = 7.5;

const MAX_TRANSITION_TIME = 1.15;

// ============================================================
// 🎥 DEFAULT CAMERA DIRECTION
// ============================================================

const DEFAULT_CAMERA_DIRECTION =
  new THREE.Vector3(
    1,
    0.45,
    1,
  ).normalize();

// ============================================================
// 🎥 CAMERA CONTROLLER
// ============================================================

export const useCamera = ({
  selectedPlanet,
  refs,
  controlsRef,
}: UseCameraProps) => {
  const { camera } = useThree();

  // ==========================================================
  // 🪐 PLANET POSITIONS
  // ==========================================================

  const planetPosition = useRef(
    new THREE.Vector3(),
  );

  const previousPlanetPosition = useRef(
    new THREE.Vector3(),
  );

  const planetMovement = useRef(
    new THREE.Vector3(),
  );

  // ==========================================================
  // 🎥 CAMERA ORIENTATION
  // ==========================================================

  const cameraDirection = useRef(
    DEFAULT_CAMERA_DIRECTION.clone(),
  );

  const followDistance = useRef(
    CAMERA_DISTANCES[selectedPlanet] ?? 25,
  );

  // ==========================================================
  // 🎬 TRANSITION STATE
  // ==========================================================

  const transitionStartCamera = useRef(
    new THREE.Vector3(),
  );

  const transitionStartTarget = useRef(
    new THREE.Vector3(),
  );

  const transitionDestinationCamera =
    useRef(
      new THREE.Vector3(),
    );

  const transitionDestinationTarget =
    useRef(
      new THREE.Vector3(),
    );

  const transitionPlanetPosition =
    useRef(
      new THREE.Vector3(),
    );

  const transitionElapsed =
    useRef(0);

  const isTransitioning =
    useRef(false);

  // ==========================================================
  // 🔄 INITIALIZATION
  // ==========================================================

  const initialized =
    useRef(false);

  // ==========================================================
  // 🎥 TEMP VECTORS
  // ==========================================================

  const offset =
    useRef(
      new THREE.Vector3(),
    );

  const transitionOffset =
    useRef(
      new THREE.Vector3(),
    );

  // ==========================================================
  // 🎥 MAIN CAMERA LOOP
  // ==========================================================

  useFrame((_, delta) => {
    const selectedRef =
      refs.current[selectedPlanet];

    if (!selectedRef?.current) {
      return;
    }

    const controls =
      controlsRef?.current;

    // ========================================================
    // 🎯 GET EXACT WORLD POSITION
    // ========================================================

    selectedRef.current.getWorldPosition(
      planetPosition.current,
    );

    const target =
      planetPosition.current;

    // ========================================================
    // 🕐 INITIALIZATION
    // ========================================================

    if (!initialized.current) {
      previousPlanetPosition.current.copy(
        target,
      );

      initialized.current = true;
    }

    // ========================================================
    // 🪐 CALCULATE PLANET MOVEMENT
    // ========================================================

    planetMovement.current
      .copy(target)
      .sub(
        previousPlanetPosition.current,
      );

    previousPlanetPosition.current.copy(
      target,
    );

    // ========================================================
    // 🎬 CAMERA SELECTION TRANSITION
    // ========================================================

    if (isTransitioning.current) {
      transitionElapsed.current +=
        delta;

      const alpha =
        1 -
        Math.exp(
          -TRANSITION_SPEED *
            delta,
        );

      // ------------------------------------------------------
      // Camera
      // ------------------------------------------------------

      camera.position.lerp(
        transitionDestinationCamera.current,
        alpha,
      );

      // ------------------------------------------------------
      // OrbitControls target
      // ------------------------------------------------------

      if (controls) {
        controls.target.lerp(
          transitionDestinationTarget.current,
          alpha,
        );
      }

      // ------------------------------------------------------
      // Transition completion
      // ------------------------------------------------------

      const cameraError =
        camera.position.distanceTo(
          transitionDestinationCamera.current,
        );

      const targetError = controls
        ? controls.target.distanceTo(
            transitionDestinationTarget.current,
          )
        : 0;

      const transitionFinished =
        cameraError < 0.05 &&
        targetError < 0.05;

      const transitionTimedOut =
        transitionElapsed.current >=
        MAX_TRANSITION_TIME;

      if (
        transitionFinished ||
        transitionTimedOut
      ) {
        // ----------------------------------------------------
        // Get CURRENT selected object position.
        // ----------------------------------------------------

        selectedRef.current.getWorldPosition(
          planetPosition.current,
        );

        const currentPlanetPosition =
          planetPosition.current;

        // ----------------------------------------------------
        // Calculate movement during transition.
        // ----------------------------------------------------

        transitionOffset.current
          .copy(currentPlanetPosition)
          .sub(
            transitionPlanetPosition.current,
          );

        // ----------------------------------------------------
        // Shift camera + target together.
        // ----------------------------------------------------

        camera.position.add(
          transitionOffset.current,
        );

        if (controls) {
          controls.target.add(
            transitionOffset.current,
          );
        }

        // ----------------------------------------------------
        // Rebuild exact camera state.
        // ----------------------------------------------------

        if (controls) {
          offset.current
            .copy(camera.position)
            .sub(controls.target);

          const currentDistance =
            offset.current.length();

          if (
            currentDistance >
            0.000001
          ) {
            followDistance.current =
              THREE.MathUtils.clamp(
                currentDistance,
                MIN_DISTANCE,
                MAX_DISTANCE,
              );

            cameraDirection.current.copy(
              offset.current.normalize(),
            );
          }
        }

        // ----------------------------------------------------
        // Reset movement tracking.
        // ----------------------------------------------------

        previousPlanetPosition.current.copy(
          currentPlanetPosition,
        );

        // ----------------------------------------------------
        // Synchronize controls.
        // ----------------------------------------------------

        if (controls) {
          controls.target.copy(
            currentPlanetPosition,
          );

          controls.update();

          controls.enabled = true;
        }

        transitionElapsed.current = 0;

        isTransitioning.current = false;

        return;
      }

      return;
    }

    // ========================================================
    // 🌍 NORMAL PLANET FOLLOW
    // ========================================================

    if (
      planetMovement.current.lengthSq() >
      0.0000000001
    ) {
      camera.position.add(
        planetMovement.current,
      );

      if (controls) {
        controls.target.add(
          planetMovement.current,
        );
      }
    }

    // ========================================================
    // 🎯 UPDATE CAMERA STATE
    // ========================================================

    if (controls) {
      offset.current
        .copy(camera.position)
        .sub(controls.target);

      const currentDistance =
        offset.current.length();

      if (
        currentDistance >
        0.000001
      ) {
        followDistance.current =
          THREE.MathUtils.clamp(
            currentDistance,
            MIN_DISTANCE,
            MAX_DISTANCE,
          );

        cameraDirection.current.copy(
          offset.current.normalize(),
        );
      }
    } else {
      const currentDistance =
        camera.position.distanceTo(
          target,
        );

      followDistance.current =
        THREE.MathUtils.clamp(
          currentDistance,
          MIN_DISTANCE,
          MAX_DISTANCE,
        );
    }
  });

  // ============================================================
  // 🪐 PLANET SELECTION
  // ============================================================

  useEffect(() => {
    const controls =
      controlsRef?.current;

    const selectedRef =
      refs.current[selectedPlanet];

    if (!selectedRef?.current) {
      return;
    }

    // ========================================================
    // 🎯 GET CURRENT POSITION
    // ========================================================

    selectedRef.current.getWorldPosition(
      planetPosition.current,
    );

    const target =
      planetPosition.current;

    // ========================================================
    // 🎥 CAPTURE CURRENT CAMERA ORIENTATION
    // ========================================================

    if (controls) {
      offset.current
        .copy(camera.position)
        .sub(controls.target);

      if (
        offset.current.lengthSq() >
        0.000001
      ) {
        cameraDirection.current.copy(
          offset.current.normalize(),
        );
      } else {
        cameraDirection.current.copy(
          DEFAULT_CAMERA_DIRECTION,
        );
      }
    } else {
      cameraDirection.current.copy(
        DEFAULT_CAMERA_DIRECTION,
      );
    }

    // ========================================================
    // 🎥 SPECIAL SUN CAMERA LIMIT
    // ========================================================

    if (controls) {
      /*
       * When Sun is selected, prevent OrbitControls
       * from zooming inside the Sun.
       */
      controls.minDistance =
        selectedPlanet === "Sun"
          ? SUN_MIN_DISTANCE
          : MIN_DISTANCE;
    }

    // ========================================================
    // 🎯 NEW CAMERA DISTANCE
    // ========================================================

    const newDistance =
      CAMERA_DISTANCES[
        selectedPlanet
      ] ?? 25;

    followDistance.current =
      THREE.MathUtils.clamp(
        newDistance,
        selectedPlanet === "Sun"
          ? SUN_MIN_DISTANCE
          : MIN_DISTANCE,
        MAX_DISTANCE,
      );

    // ========================================================
    // 🎬 SAVE TRANSITION START
    // ========================================================

    transitionStartCamera.current.copy(
      camera.position,
    );

    if (controls) {
      transitionStartTarget.current.copy(
        controls.target,
      );
    } else {
      transitionStartTarget.current.copy(
        target,
      );
    }

    // ========================================================
    // 🪐 SAVE OBJECT POSITION
    // ========================================================

    transitionPlanetPosition.current.copy(
      target,
    );

    // ========================================================
    // 🎯 TRANSITION TARGET
    // ========================================================

    transitionDestinationTarget.current.copy(
      target,
    );

    // ========================================================
    // 🎥 BUILD CAMERA DESTINATION
    // ========================================================

    transitionDestinationCamera.current
      .copy(target)
      .add(
        cameraDirection.current
          .clone()
          .multiplyScalar(
            followDistance.current,
          ),
      );

    // ========================================================
    // 🔄 RESET FOLLOW TRACKING
    // ========================================================

    previousPlanetPosition.current.copy(
      target,
    );

    initialized.current = true;

    // ========================================================
    // 🎬 RESET TRANSITION TIMER
    // ========================================================

    transitionElapsed.current = 0;

    isTransitioning.current = true;

    // ========================================================
    // 🎛️ TEMPORARILY DISABLE CONTROLS
    // ========================================================

    if (controls) {
      controls.enabled = false;
    }

    // ========================================================
    // 🧹 CLEANUP
    // ========================================================

    return () => {
      if (controls) {
        controls.minDistance =
          MIN_DISTANCE;
      }
    };
  }, [
    selectedPlanet,
    refs,
    camera,
    controlsRef,
  ]);
};