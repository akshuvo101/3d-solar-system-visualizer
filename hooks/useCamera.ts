import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type UseCameraProps = {
  selectedPlanet: string;
  refs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;
};

// 🎥 Initial cinematic distance for each planet
const CAMERA_DISTANCES: Record<string, number> = {
  Sun: 45,
  Mercury: 16,
  Venus: 18,
  Earth: 20,
  Mars: 18,
  Jupiter: 30,
  Saturn: 34,
  Uranus: 24,
  Neptune: 24,
};

// 🔍 Zoom limits
const MIN_DISTANCE = 5;
const MAX_DISTANCE = 1200;

export const useCamera = ({
  selectedPlanet,
  refs,
}: UseCameraProps) => {
  const { camera } = useThree();

  const currentLookAt = useRef(
    new THREE.Vector3()
  );

  const targetLookAt = useRef(
    new THREE.Vector3()
  );

  // 🎯 Current distance from the selected planet
  const followDistance = useRef(
    CAMERA_DISTANCES[selectedPlanet] ?? 25
  );

  // 🎥 Current camera direction around planet
  const cameraDirection = useRef(
    new THREE.Vector3(1, 0.45, 1).normalize()
  );

  // 🔄 New planet transition
  const isTransitioning = useRef(true);

  /*
   * 🎯 Smooth planet follow
   *
   * Camera follows the selected planet,
   * but does NOT reset its distance every frame.
   */
  useFrame(() => {
    const ref =
      refs.current[selectedPlanet];

    if (!ref?.current) return;

    const planetPosition =
      ref.current.position;

    /*
     * During the initial transition,
     * use the cinematic position.
     */
    if (isTransitioning.current) {
      const distance =
        followDistance.current;

      const desiredPosition =
        new THREE.Vector3(
          planetPosition.x +
            cameraDirection.current.x *
              distance,

          planetPosition.y +
            cameraDirection.current.y *
              distance,

          planetPosition.z +
            cameraDirection.current.z *
              distance
        );

      camera.position.lerp(
        desiredPosition,
        0.07
      );

      /*
       * Once camera gets close enough,
       * stop forcing its position.
       */
      if (
        camera.position.distanceTo(
          desiredPosition
        ) < 0.5
      ) {
        isTransitioning.current =
          false;
      }
    } else {
      /*
       * 🌍 Follow only the planet's movement.
       *
       * Preserve the user's current
       * zoom distance.
       */
      const currentDistance =
        camera.position.distanceTo(
          planetPosition
        );

      const safeDistance =
        THREE.MathUtils.clamp(
          currentDistance,
          MIN_DISTANCE,
          MAX_DISTANCE
        );

      const desiredPosition =
        new THREE.Vector3(
          planetPosition.x +
            cameraDirection.current.x *
              safeDistance,

          planetPosition.y +
            cameraDirection.current.y *
              safeDistance,

          planetPosition.z +
            cameraDirection.current.z *
              safeDistance
        );

      camera.position.lerp(
        desiredPosition,
        0.035
      );
    }

    /*
     * 🎯 Smooth look-at
     */
    targetLookAt.current.copy(
      planetPosition
    );

    currentLookAt.current.lerp(
      targetLookAt.current,
      0.08
    );

    camera.lookAt(
      currentLookAt.current
    );
  });

  /*
   * 🪐 When selecting another planet
   */
  useEffect(() => {
    const distance =
      CAMERA_DISTANCES[selectedPlanet] ??
      25;

    followDistance.current =
      distance;

    /*
     * Reset cinematic direction.
     */
    cameraDirection.current.set(
      1,
      0.45,
      1
    ).normalize();

    isTransitioning.current =
      true;
  }, [selectedPlanet]);

  /*
   * 🔍 Manual zoom
   *
   * Zoom changes the camera's distance
   * without breaking planet follow.
   */
  useEffect(() => {
    const handleWheel = (
      e: WheelEvent
    ) => {
      e.preventDefault();

      const zoomSpeed = 0.08;

      const direction =
        e.deltaY > 0 ? 1 : -1;

      const zoomMultiplier =
        direction > 0
          ? 1 + zoomSpeed
          : 1 - zoomSpeed;

      const selectedRef =
        refs.current[selectedPlanet];

      if (!selectedRef?.current) return;

      const planetPosition =
        selectedRef.current.position;

      /*
       * Calculate current distance
       * from the selected planet.
       */
      const currentDistance =
        camera.position.distanceTo(
          planetPosition
        );

      const newDistance =
        THREE.MathUtils.clamp(
          currentDistance *
            zoomMultiplier,
          MIN_DISTANCE,
          MAX_DISTANCE
        );

      /*
       * Keep the same camera direction,
       * only change the distance.
       */
      camera.position
        .sub(planetPosition)
        .normalize()
        .multiplyScalar(
          newDistance
        )
        .add(planetPosition);

      /*
       * Remember the user's zoom distance.
       */
      followDistance.current =
        newDistance;

      /*
       * Stop cinematic transition
       * once the user manually zooms.
       */
      isTransitioning.current =
        false;
    };

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel
      );
    };
  }, [
    camera,
    refs,
    selectedPlanet,
  ]);
};