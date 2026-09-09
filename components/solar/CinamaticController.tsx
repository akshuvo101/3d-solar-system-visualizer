"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  getSelectedPlanetScale,
} from "@/lib/planetVisualScale";

type CinematicControllerProps = {
  selectedPlanet: string;

  planetRefs: React.MutableRefObject<
    Record<string, React.RefObject<THREE.Group | null>>
  >;

  environmentRef: React.RefObject<THREE.Group | null>;
};

/* ============================================================
   🎬 GENERAL CINEMATIC SETTINGS
   ============================================================ */

const CINEMATIC_START_DISTANCE = 28;
const CINEMATIC_END_DISTANCE = 15;

const VISIBILITY_THRESHOLD = 0.01;

/* ============================================================
   🪐 PLANET SETTINGS
   ============================================================ */

/*
 * IMPORTANT:
 *
 * These values match the physical visual scales
 * used inside Planet.tsx.
 *
 * Mercury = 0.40
 * Venus   = 0.95
 * Earth   = 1.00
 * Mars    = 0.53
 * Jupiter = 2.80
 * Saturn  = 2.45
 * Uranus  = 1.65
 * Neptune = 1.60
 */

/*
 * This is the desired apparent radius of the selected
 * planet during close-up.
 *
 * Because every planet has a different physical scale,
 * the outer cinematic group compensates for that scale.
 *
 * Example:
 *
 * Mercury:
 *   1.35 / 0.40 = 3.375
 *
 * Earth:
 *   1.35 / 1.00 = 1.35
 *
 * Jupiter:
 *   1.35 / 2.80 = 0.482
 *
 * So the selected planet gets approximately the same
 * cinematic visual size regardless of its base scale.
 */
/*
 * All non-selected planets are slightly reduced during
 * a full planetary close-up.
 *
 * This guarantees that the selected planet visually dominates
 * even when another planet happens to be physically nearby.
 */
const GLOBAL_CLOSEUP_SHRINK = 0.28;

/*
 * Minimum scale for very distant planets.
 */
const MIN_PLANET_SCALE = 0.035;

/*
 * Minimum opacity for very distant planets.
 */
const MIN_PLANET_OPACITY = 0.04;

/*
 * Maximum relative distance at which a planet participates
 * in the cinematic distance effect.
 */
/*
 * Distance where another planet starts shrinking/fading.
 */
const PLANET_FADE_START_DISTANCE = 18;
const PLANET_FADE_END_DISTANCE = 32;

/*
 * Smooth scale/opacity transition.
 */
const TRANSITION_SPEED = 0.12;

/* ============================================================
   ☀️ SUN SETTINGS
   ============================================================ */

const SUN_NORMAL_SCALE = 1;

const SUN_PLANET_VIEW_SCALE = 0.11;

const SUN_NORMAL_OPACITY = 1;
const SUN_CINEMATIC_OPACITY = 0.78;

const SUN_CINEMATIC_START_DISTANCE = 28;
const SUN_CINEMATIC_END_DISTANCE = 10;

const SUN_SELECTED_CINEMATIC_SCALE = 0.68;

const SUN_FINAL_HIDE_DISTANCE = 16;

/* ============================================================
   🌌 ENVIRONMENT
   ============================================================ */

const ENVIRONMENT_CINEMATIC_OPACITY = 0;

/* ============================================================
   🎞️ SMOOTHSTEP
   ============================================================ */

function smoothstep(
  edge0: number,
  edge1: number,
  x: number,
) {
  const t = THREE.MathUtils.clamp(
    (x - edge0) /
      (edge1 - edge0),
    0,
    1,
  );

  return t * t * (3 - 2 * t);
}

/* ============================================================
   🎨 ORIGINAL OPACITY
   ============================================================ */

function getOriginalOpacity(
  material: THREE.Material,
) {
  const key =
    "__cinematicOriginalOpacity";

  if (
    material.userData[key] ===
    undefined
  ) {
    material.userData[key] =
      material.opacity;
  }

  return material.userData[
    key
  ] as number;
}

/* ============================================================
   🎨 GROUP OPACITY
   ============================================================ */

function setGroupOpacity(
  group: THREE.Object3D,
  opacity: number,
) {
  group.traverse((object) => {
    const mesh =
      object as THREE.Mesh;

    if (!mesh.material) {
      return;
    }

    const materials =
      Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

    materials.forEach(
      (material) => {
        const originalOpacity =
          getOriginalOpacity(
            material,
          );

        const targetOpacity =
          originalOpacity *
          THREE.MathUtils.clamp(
            opacity,
            0,
            1,
          );

        if (
          Math.abs(
            material.opacity -
              targetOpacity,
          ) > 0.001
        ) {
          material.transparent =
            true;

          material.opacity =
            targetOpacity;

          material.needsUpdate =
            true;
        }
      },
    );
  });
}

/* ============================================================
   🎨 RESTORE GROUP OPACITY
   ============================================================ */

function restoreGroupOpacity(
  group: THREE.Object3D,
) {
  setGroupOpacity(group, 1);
}

/* ============================================================
   🪐 PLANET DISTANCE FACTOR
   ============================================================ */

function getPlanetFadeFactor(
  distance: number,
) {
  return 1 - smoothstep(
    PLANET_FADE_START_DISTANCE,
    PLANET_FADE_END_DISTANCE,
    distance,
  );
}

/* ============================================================
   🎬 SMOOTH SCALE
   ============================================================ */

function smoothScaleTo(
  group: THREE.Object3D,
  targetScale: number,
) {
  const currentScale =
    group.scale.x;

  const nextScale =
    THREE.MathUtils.lerp(
      currentScale,
      targetScale,
      TRANSITION_SPEED,
    );

  group.scale.setScalar(
    nextScale,
  );
}

/* ============================================================
   🪐 SELECTED PLANET CINEMATIC SCALE
   ============================================================ */

/*
 * This is the main fix.
 *
 * Planet.tsx:
 *
 * Mercury = 0.40
 * Venus   = 0.95
 * Earth   = 1.00
 *
 * We compensate the outer cinematic group:
 *
 * Mercury:
 * 1.35 / 0.40 = 3.375
 *
 * Venus:
 * 1.35 / 0.95 ≈ 1.42
 *
 * Earth:
 * 1.35 / 1.00 = 1.35
 *
 * Therefore the selected planet becomes
 * the dominant object during close-up.
 */

/* ============================================================
   🪐 NON-SELECTED PLANET SCALE
   ============================================================ */

function getNonSelectedPlanetScale(
  distance: number,
  cinematicProgress: number,
) {
  const distanceFade =
    getPlanetFadeFactor(
      distance,
    );

  /*
   * Distance-based shrinking.
   */
  const distanceScale =
    THREE.MathUtils.lerp(
      1,
      MIN_PLANET_SCALE,
      distanceFade,
    );

  /*
   * Global close-up shrinking.
   *
   * At full close-up:
   *
   * 1 → approximately 0.55
   *
   * This ensures nearby planets are still
   * smaller than the selected planet.
   */
  const globalScale =
    THREE.MathUtils.lerp(
      1,
      GLOBAL_CLOSEUP_SHRINK,
      cinematicProgress,
    );

  /*
   * Distance effect becomes stronger
   * during cinematic mode.
   */
  return cinematicProgress > 0
    ? Math.min(
        globalScale,
        distanceScale,
      )
    : 1;
}

/* ============================================================
   🪐 NON-SELECTED PLANET OPACITY
   ============================================================ */

function getNonSelectedPlanetOpacity(
  distance: number,
  cinematicProgress: number,
) {
  const distanceFade =
    getPlanetFadeFactor(
      distance,
    );

  const distanceOpacity =
    THREE.MathUtils.lerp(
      1,
      MIN_PLANET_OPACITY,
      distanceFade,
    );

  /*
   * Nearby planets remain visible,
   * but become less prominent during
   * a full close-up.
   */
  const globalOpacity =
    THREE.MathUtils.lerp(
      1,
      0.62,
      cinematicProgress,
    );

  return cinematicProgress > 0
    ? Math.min(
        globalOpacity,
        distanceOpacity,
      )
    : 1;
}

/* ============================================================
   🎬 CINEMATIC CONTROLLER
   ============================================================ */

export function CinematicController({
  selectedPlanet,
  planetRefs,
  environmentRef,
}: CinematicControllerProps) {
  const { camera } =
    useThree();

  /* ==========================================================
     🎯 REUSABLE POSITIONS
     ========================================================== */

  const selectedPosition =
    useRef(
      new THREE.Vector3(),
    );

  const objectPosition =
    useRef(
      new THREE.Vector3(),
    );

  /* ==========================================================
     🎬 FRAME LOOP
     ========================================================== */

  useFrame(() => {
    /* ========================================================
       🏠 NO PLANET SELECTED
       ======================================================== */

    if (!selectedPlanet) {
      Object.entries(
        planetRefs.current,
      ).forEach(
        ([planetName, ref]) => {
          const group =
            ref.current;

          if (!group) {
            return;
          }

          group.visible = true;

          smoothScaleTo(
            group,
            planetName === "Sun"
              ? SUN_NORMAL_SCALE
              : 1,
          );

          restoreGroupOpacity(
            group,
          );
        },
      );

      const environment =
        environmentRef.current;

      if (environment) {
        environment.visible =
          true;

        restoreGroupOpacity(
          environment,
        );
      }

      return;
    }

    /* ========================================================
       🎯 SELECTED OBJECT
       ======================================================== */

    const selectedRef =
      planetRefs.current[
        selectedPlanet
      ]?.current;

    if (!selectedRef) {
      return;
    }

    selectedRef.getWorldPosition(
      selectedPosition.current,
    );

    const selectedDistance =
      camera.position.distanceTo(
        selectedPosition.current,
      );

    const isSunSelected =
      selectedPlanet === "Sun";

    /* ========================================================
       ☀️ SUN SELECTED
       ======================================================== */

    if (isSunSelected) {
      const sunProgress =
        1 -
        smoothstep(
          SUN_CINEMATIC_END_DISTANCE,
          SUN_CINEMATIC_START_DISTANCE,
          selectedDistance,
        );

      /* ======================================================
         🪐 OTHER PLANETS
         ====================================================== */

      Object.entries(
        planetRefs.current,
      ).forEach(
        ([planetName, ref]) => {
          const group =
            ref.current;

          if (!group) {
            return;
          }

          if (
            planetName === "Sun"
          ) {
            return;
          }

          if (
            planetName ===
            selectedPlanet
          ) {
            group.visible = true;

            smoothScaleTo(
              group,
              1,
            );

            restoreGroupOpacity(
              group,
            );

            return;
          }

          /* --------------------------------------------------
             Final Sun close-up
             -------------------------------------------------- */

          if (
            selectedDistance <=
            SUN_FINAL_HIDE_DISTANCE
          ) {
            group.visible =
              false;

            group.scale.setScalar(
              1,
            );

            restoreGroupOpacity(
              group,
            );

            return;
          }

          /* --------------------------------------------------
             Distance from Sun
             -------------------------------------------------- */

          group.getWorldPosition(
            objectPosition.current,
          );

          const distanceFromSun =
            selectedPosition.current.distanceTo(
              objectPosition.current,
            );

          const normalizedDistance =
            THREE.MathUtils.clamp(
              distanceFromSun / 35,
              0,
              1,
            );

          const fadeFactor =
            THREE.MathUtils.clamp(
              sunProgress *
                0.75 +
                normalizedDistance *
                  0.45,
              0,
              1,
            );

          const opacity =
            THREE.MathUtils.lerp(
              1,
              0,
              smoothstep(
                0.25,
                0.95,
                fadeFactor,
              ),
            );

          const scale =
            THREE.MathUtils.lerp(
              1,
              MIN_PLANET_SCALE,
              smoothstep(
                0.15,
                1,
                fadeFactor,
              ),
            );

          if (
            opacity <=
            VISIBILITY_THRESHOLD
          ) {
            group.visible =
              false;

            group.scale.setScalar(
              1,
            );

            restoreGroupOpacity(
              group,
            );

            return;
          }

          group.visible = true;

          smoothScaleTo(
            group,
            scale,
          );

          setGroupOpacity(
            group,
            opacity,
          );
        },
      );

      /* ======================================================
         🌌 ENVIRONMENT
         ====================================================== */

      const environment =
        environmentRef.current;

      if (environment) {
        const environmentProgress =
          smoothstep(
            0.5,
            0.9,
            sunProgress,
          );

        const opacity =
          THREE.MathUtils.lerp(
            1,
            ENVIRONMENT_CINEMATIC_OPACITY,
            environmentProgress,
          );

        if (
          selectedDistance <=
          SUN_FINAL_HIDE_DISTANCE + 2
        ) {
          environment.visible =
            false;
        } else if (
          opacity <=
          VISIBILITY_THRESHOLD
        ) {
          environment.visible =
            false;
        } else {
          environment.visible =
            true;

          setGroupOpacity(
            environment,
            opacity,
          );
        }
      }

      /* ======================================================
         ☀️ SUN ITSELF
         ====================================================== */

      const sunGroup =
        planetRefs.current[
          "Sun"
        ]?.current;

      if (sunGroup) {
        sunGroup.visible =
          true;

        const sunScale =
          THREE.MathUtils.lerp(
            SUN_NORMAL_SCALE,
            SUN_SELECTED_CINEMATIC_SCALE,
            sunProgress,
          );

        smoothScaleTo(
          sunGroup,
          sunScale,
        );

        restoreGroupOpacity(
          sunGroup,
        );
      }

      return;
    }

    /* ========================================================
       🪐 NORMAL PLANET SELECTED
       ======================================================== */

    const cinematicProgress =
      1 -
      smoothstep(
        CINEMATIC_END_DISTANCE,
        CINEMATIC_START_DISTANCE,
        selectedDistance,
      );

    /* ========================================================
       🪐 ALL PLANETS
       ======================================================== */

    Object.entries(
      planetRefs.current,
    ).forEach(
      ([planetName, ref]) => {
        const group =
          ref.current;

        if (!group) {
          return;
        }

        /* ====================================================
           ☀️ SUN
           ==================================================== */

        if (
          planetName === "Sun"
        ) {
          return;
        }

        /* ====================================================
           🎯 SELECTED PLANET
           ==================================================== */

        if (
          planetName ===
          selectedPlanet
        ) {
          group.visible = true;

          /*
           * MAIN FIX:
           *
           * Compensate for the physical
           * planet scale.
           *
           * Mercury:
           *   physical = 0.40
           *   cinematic = 3.375
           *   final ≈ 1.35
           *
           * Earth:
           *   physical = 1
           *   cinematic = 1.35
           *   final ≈ 1.35
           */
          const selectedScale =
            THREE.MathUtils.lerp(
              1,
              getSelectedPlanetScale(
                selectedPlanet,
              ),
              cinematicProgress,
            );

          smoothScaleTo(
            group,
            selectedScale,
          );

          restoreGroupOpacity(
            group,
          );

          return;
        }

        /* ====================================================
           📍 ACTUAL WORLD DISTANCE
           ==================================================== */

        group.getWorldPosition(
          objectPosition.current,
        );

        const distanceFromSelected =
          selectedPosition.current.distanceTo(
            objectPosition.current,
          );

        /* ====================================================
           🪐 NON-SELECTED PLANET SCALE
           ==================================================== */

        const scale =
          getNonSelectedPlanetScale(
            distanceFromSelected,
            cinematicProgress,
          );

        /* ====================================================
           🪐 NON-SELECTED PLANET OPACITY
           ==================================================== */

        const opacity =
          getNonSelectedPlanetOpacity(
            distanceFromSelected,
            cinematicProgress,
          );

        /* ====================================================
           🔴 FINAL HIDE
           ==================================================== */

        if (
          opacity <=
          VISIBILITY_THRESHOLD
        ) {
          group.visible =
            false;

          group.scale.setScalar(
            1,
          );

          restoreGroupOpacity(
            group,
          );

          return;
        }

        /* ====================================================
           🎬 APPLY
           ==================================================== */

        group.visible = true;

        smoothScaleTo(
          group,
          scale,
        );

        setGroupOpacity(
          group,
          opacity,
        );
      },
    );

    /* ========================================================
       ☀️ SUN WHEN PLANET IS SELECTED
       ======================================================== */

    const sunGroup =
      planetRefs.current[
        "Sun"
      ]?.current;

    if (sunGroup) {
      sunGroup.visible = true;

      const sunScale =
        THREE.MathUtils.lerp(
          SUN_NORMAL_SCALE,
          SUN_PLANET_VIEW_SCALE,
          cinematicProgress,
        );

      smoothScaleTo(
        sunGroup,
        sunScale,
      );

      const sunOpacity =
        THREE.MathUtils.lerp(
          SUN_NORMAL_OPACITY,
          SUN_CINEMATIC_OPACITY,
          cinematicProgress,
        );

      setGroupOpacity(
        sunGroup,
        sunOpacity,
      );
    }

    /* ========================================================
       🌌 ENVIRONMENT
       ======================================================== */

    const environment =
      environmentRef.current;

    if (environment) {
      const opacity =
        THREE.MathUtils.lerp(
          1,
          0,
          cinematicProgress,
        );

      if (
        opacity <=
        VISIBILITY_THRESHOLD
      ) {
        environment.visible =
          false;
      } else {
        environment.visible =
          true;

        setGroupOpacity(
          environment,
          opacity,
        );
      }
    }
  });

  return null;
}