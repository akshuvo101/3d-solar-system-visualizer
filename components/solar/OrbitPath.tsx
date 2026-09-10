"use client";

import { Ring } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type OrbitPathProps = {
  distance: number;
  index: number;
};

const OrbitPath = ({
  distance,
  index,
}: OrbitPathProps) => {
  const ref = useRef<THREE.Mesh>(null);

  const { camera } = useThree();

  /*
   * OrbitControls is registered with makeDefault.
   *
   * We intentionally read it from the R3F state instead of
   * changing any camera/controller logic.
   */
  const controls = useThree(
    (state) => (state as any).controls,
  );

  /*
   * Smooth opacity state.
   */
  const opacityRef = useRef(0.06);

  /*
   * Temporary vector used to calculate actual
   * camera-to-target distance.
   */
  const targetPosition = useRef(
    new THREE.Vector3(),
  );

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;

    const material =
      ref.current.material as THREE.MeshBasicMaterial;

    /* ========================================================
       🎥 ACTUAL ZOOM DISTANCE

       We measure:

           Camera
              ↓
           Controls Target

       This is much more accurate than measuring the camera
       distance from the Sun/origin.

       It also works correctly when the camera is following
       a selected planet.
    ======================================================== */

    let cameraDistance = camera.position.length();

    if (controls?.target) {
      targetPosition.current.copy(
        controls.target,
      );

      cameraDistance =
        camera.position.distanceTo(
          targetPosition.current,
        );
    }

    /* ========================================================
       🌀 ZOOM VISIBILITY

       Very close:
           Orbit almost invisible

       Medium distance:
           Orbit gradually appears

       Far away:
           Orbit fully visible
    ======================================================== */

    const fadeStart = 18;
    const fadeEnd = 90;

    const zoomVisibility =
      THREE.MathUtils.smoothstep(
        cameraDistance,
        fadeStart,
        fadeEnd,
      );

    /* ========================================================
       🌌 SUBTLE ORBIT BREATHING

       Keeps the orbit paths alive without making them
       look like animated glowing rings.
    ======================================================== */

    const breathingTime =
      clock.getElapsedTime() * 0.45 +
      index * 0.7;

    const breathingOpacity =
      0.19 +
      0.09 *
        (Math.sin(breathingTime) * 0.5 + 0.5);

    /* ========================================================
       🎯 TARGET OPACITY
    ======================================================== */

    const targetOpacity =
      breathingOpacity *
      zoomVisibility;

    /* ========================================================
       🌀 FRAME-RATE INDEPENDENT SMOOTH FADE

       This makes the orbit smoothly appear/disappear
       instead of popping in/out.
    ======================================================== */

    opacityRef.current =
      THREE.MathUtils.lerp(
        opacityRef.current,
        targetOpacity,
        1 - Math.exp(-8 * delta),
      );

    material.opacity =
      opacityRef.current;
  });

  return (
    <Ring
      ref={ref}
      args={[
        distance - 0.025,
        distance + 0.025,
        192,
      ]}
      rotation={[
        -Math.PI / 2,
        0,
        0,
      ]}
    >
      <meshBasicMaterial
        color="#b9c9ff"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </Ring>
  );
};

export default OrbitPath;