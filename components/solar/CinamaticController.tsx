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

const GLOBAL_CLOSEUP_SHRINK = 0.28;

const MIN_PLANET_SCALE = 0.035;

const MIN_PLANET_OPACITY = 0.04;

const PLANET_FADE_START_DISTANCE = 18;
const PLANET_FADE_END_DISTANCE = 32;

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
   ⚡ PERFORMANCE SETTINGS
   ============================================================ */

const SCALE_EPSILON = 0.0001;
const OPACITY_EPSILON = 0.001;

/*
 * Material traversal is expensive when performed every frame.
 *
 * We cache the materials belonging to each group and reuse them.
 */
type CachedMaterial = {
  material: THREE.Material;
  originalOpacity: number;
};

const materialCache = new WeakMap<
  THREE.Object3D,
  CachedMaterial[]
>();

/* ============================================================
   🎞️ SMOOTHSTEP
   ============================================================ */

function smoothstep(
  edge0: number,
  edge1: number,
  x: number,
) {
  const t = THREE.MathUtils.clamp(
    (x - edge0) / (edge1 - edge0),
    0,
    1,
  );

  return t * t * (3 - 2 * t);
}

/* ============================================================
   🎨 GET GROUP MATERIALS
   ============================================================ */

/*
 * This replaces repeated group.traverse() calls during
 * every animation frame.
 *
 * Materials are collected once and then reused.
 */
function getCachedMaterials(
  group: THREE.Object3D,
): CachedMaterial[] {
  const cached = materialCache.get(group);

  if (cached) {
    return cached;
  }

  const materials: CachedMaterial[] = [];

  group.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.material) {
      return;
    }

    const meshMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    meshMaterials.forEach((material) => {
      /*
       * The same material can theoretically be shared by
       * multiple meshes. Avoid adding duplicates.
       */
      const alreadyCached = materials.some(
        (entry) => entry.material === material,
      );

      if (alreadyCached) {
        return;
      }

      const originalOpacity =
        material.userData.__cinematicOriginalOpacity;

      if (originalOpacity === undefined) {
        material.userData.__cinematicOriginalOpacity =
          material.opacity;
      }

      materials.push({
        material,
        originalOpacity:
          material.userData.__cinematicOriginalOpacity,
      });
    });
  });

  materialCache.set(group, materials);

  return materials;
}

/* ============================================================
   🎨 GROUP OPACITY
   ============================================================ */

function setGroupOpacity(
  group: THREE.Object3D,
  opacity: number,
) {
  const materials = getCachedMaterials(group);

  const clampedOpacity =
    THREE.MathUtils.clamp(opacity, 0, 1);

  materials.forEach(
    ({ material, originalOpacity }) => {
      const targetOpacity =
        originalOpacity * clampedOpacity;

      /*
       * Only update when the value actually changed.
       */
      if (
        Math.abs(
          material.opacity - targetOpacity,
        ) <= OPACITY_EPSILON
      ) {
        return;
      }

      /*
       * transparent + needsUpdate only needs to happen
       * when transparency is first enabled.
       *
       * Setting needsUpdate every frame can trigger
       * unnecessary material processing.
       */
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }

      material.opacity = targetOpacity;
    },
  );
}

/* ============================================================
   🎨 RESTORE GROUP OPACITY
   ============================================================ */

function restoreGroupOpacity(
  group: THREE.Object3D,
) {
  const materials = getCachedMaterials(group);

  materials.forEach(
    ({ material, originalOpacity }) => {
      if (
        Math.abs(
          material.opacity - originalOpacity,
        ) <= OPACITY_EPSILON
      ) {
        return;
      }

      material.opacity = originalOpacity;
    },
  );
}

/* ============================================================
   🪐 PLANET DISTANCE FACTOR
   ============================================================ */

function getPlanetFadeFactor(
  distance: number,
) {
  return 1 -
    smoothstep(
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
  const currentScale = group.scale.x;

  const nextScale = THREE.MathUtils.lerp(
    currentScale,
    targetScale,
    TRANSITION_SPEED,
  );

  /*
   * Avoid unnecessary Three.js scale updates when the
   * difference becomes extremely small.
   */
  if (
    Math.abs(nextScale - currentScale) <=
    SCALE_EPSILON
  ) {
    return;
  }

  group.scale.setScalar(nextScale);
}

/* ============================================================
   🪐 NON-SELECTED PLANET SCALE
   ============================================================ */

function getNonSelectedPlanetScale(
  distance: number,
  cinematicProgress: number,
) {
  const distanceFade =
    getPlanetFadeFactor(distance);

  const distanceScale =
    THREE.MathUtils.lerp(
      1,
      MIN_PLANET_SCALE,
      distanceFade,
    );

  const globalScale =
    THREE.MathUtils.lerp(
      1,
      GLOBAL_CLOSEUP_SHRINK,
      cinematicProgress,
    );

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
    getPlanetFadeFactor(distance);

  const distanceOpacity =
    THREE.MathUtils.lerp(
      1,
      MIN_PLANET_OPACITY,
      distanceFade,
    );

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
  const { camera } = useThree();

  /* ==========================================================
     🎯 REUSABLE POSITIONS
     ========================================================== */

  const selectedPosition = useRef(
    new THREE.Vector3(),
  );

  const objectPosition = useRef(
    new THREE.Vector3(),
  );

  /* ==========================================================
     ⚡ CACHED PLANET REFERENCES
     ========================================================== */

  const planetEntriesRef = useRef<
    Array<
      [
        string,
        React.RefObject<THREE.Group | null>,
      ]
    >
  >([]);

  const planetEntriesInitializedRef =
    useRef(false);

  /*
   * Build the entries only when needed instead of calling
   * Object.entries() on every frame.
   */
  const getPlanetEntries = () => {
    const refs = planetRefs.current;

    /*
     * Initial scene mounting.
     */
    if (!planetEntriesInitializedRef.current) {
      const entries = Object.entries(refs);

      if (entries.length > 0) {
        planetEntriesRef.current =
          entries;

        planetEntriesInitializedRef.current =
          true;
      }

      return planetEntriesRef.current;
    }

    /*
     * Extremely cheap safety check for dynamically added
     * planet references.
     *
     * Normally this will never rebuild.
     */
    if (
      planetEntriesRef.current.length !==
      Object.keys(refs).length
    ) {
      planetEntriesRef.current =
        Object.entries(refs);
    }

    return planetEntriesRef.current;
  };

  /* ==========================================================
     🎬 FRAME LOOP
     ========================================================== */

  useFrame(() => {
    const entries =
      getPlanetEntries();

    /* ========================================================
       🏠 NO PLANET SELECTED
       ======================================================== */

    if (!selectedPlanet) {
      entries.forEach(
        ([planetName, ref]) => {
          const group = ref.current;

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

          restoreGroupOpacity(group);
        },
      );

      const environment =
        environmentRef.current;

      if (environment) {
        environment.visible = true;

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

      entries.forEach(
        ([planetName, ref]) => {
          const group = ref.current;

          if (!group) {
            return;
          }

          /*
           * Sun is handled separately below.
           */
          if (planetName === "Sun") {
            return;
          }

          /*
           * Selected object protection.
           */
          if (
            planetName ===
            selectedPlanet
          ) {
            group.visible = true;

            smoothScaleTo(group, 1);

            restoreGroupOpacity(group);

            return;
          }

          /* --------------------------------------------------
             Final Sun close-up
             -------------------------------------------------- */

          if (
            selectedDistance <=
            SUN_FINAL_HIDE_DISTANCE
          ) {
            group.visible = false;

            if (
              Math.abs(group.scale.x - 1) >
              SCALE_EPSILON
            ) {
              group.scale.setScalar(1);
            }

            restoreGroupOpacity(group);

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
              sunProgress * 0.75 +
                normalizedDistance * 0.45,
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

          /* --------------------------------------------------
             Final visibility
             -------------------------------------------------- */

          if (
            opacity <=
            VISIBILITY_THRESHOLD
          ) {
            group.visible = false;

            if (
              Math.abs(group.scale.x - 1) >
              SCALE_EPSILON
            ) {
              group.scale.setScalar(1);
            }

            restoreGroupOpacity(group);

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
          environment.visible = false;
        } else if (
          opacity <=
          VISIBILITY_THRESHOLD
        ) {
          environment.visible = false;
        } else {
          environment.visible = true;

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
        planetRefs.current["Sun"]?.current;

      if (sunGroup) {
        sunGroup.visible = true;

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

    entries.forEach(
      ([planetName, ref]) => {
        const group = ref.current;

        if (!group) {
          return;
        }

        /* ====================================================
           ☀️ SUN
           ==================================================== */

        if (planetName === "Sun") {
          return;
        }

        /* ====================================================
           🎯 SELECTED PLANET
           ==================================================== */

        if (
          planetName === selectedPlanet
        ) {
          group.visible = true;

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
          group.visible = false;

          if (
            Math.abs(group.scale.x - 1) >
            SCALE_EPSILON
          ) {
            group.scale.setScalar(1);
          }

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
      planetRefs.current["Sun"]?.current;

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
        environment.visible = false;
      } else {
        environment.visible = true;

        setGroupOpacity(
          environment,
          opacity,
        );
      }
    }
  });

  return null;
}