import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MoonSystemType } from "@/types";
import {
  SIMULATION_MODES,
  type SimulationMode,
} from "@/lib/simulationTime";

type MoonProps = {
  moon: MoonSystemType;
  simulationMode?: SimulationMode;
};

// ============================================================
// ☀️ SOLAR SYSTEM LIGHT SOURCE
// ============================================================

const SUN_POSITION = new THREE.Vector3(0, 0, 0);

// Visual Sun radius in simulation space.
// Used only for soft penumbra estimation.
const SUN_RADIUS = 4.0;

// ============================================================
// 🌍 PLANET RADII
// ============================================================

const PLANET_RADII: Record<string, number> = {
  Mercury: 1,
  Venus: 1,
  Earth: 1,
  Mars: 1,
  Jupiter: 1,
  Saturn: 1,
  Uranus: 1,
  Neptune: 1,
};

// ============================================================
// 🌑 SHADOW SETTINGS
// ============================================================

const SHADOW_SOFTNESS = 0.22;

const MOON_ORBIT_SCALE = 0.62;

// Minimum distance from Sun required for a valid shadow caster.
const MIN_OCCLUDER_DISTANCE = 0.001;

// ============================================================
// 🌙 MOON
// ============================================================

export const Moon = ({
  moon,
  simulationMode = "year",
}: MoonProps) => {
  const ref = useRef<THREE.Mesh>(null);

  /*
   * ============================================================
   * 🌑 PREMIUM PROCEDURAL MOON MATERIAL
   * ============================================================
   */

  const moonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },

        uSunPosition: {
          value: SUN_POSITION.clone(),
        },

        // ======================================================
        // 🌑 SOLAR OCCLUSION
        // ======================================================

        uShadow: {
          value: 0,
        },
      },

      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {

          vUv = uv;

          vec4 worldPosition =
            modelMatrix *
            vec4(
              position,
              1.0
            );

          vWorldPosition =
            worldPosition.xyz;

          vNormal =
            normalize(
              mat3(modelMatrix) *
              normal
            );

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(
              position,
              1.0
            );
        }
      `,

      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform float uTime;
        uniform vec3 uSunPosition;
        uniform float uShadow;

        // ======================================================
        // HASH
        // ======================================================

        float hash(vec2 p) {

          return fract(
            sin(
              dot(
                p,
                vec2(
                  127.1,
                  311.7
                )
              )
            ) *
            43758.5453123
          );
        }

        // ======================================================
        // NOISE
        // ======================================================

        float noise(vec2 p) {

          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);

          float b =
            hash(
              i +
              vec2(
                1.0,
                0.0
              )
            );

          float c =
            hash(
              i +
              vec2(
                0.0,
                1.0
              )
            );

          float d =
            hash(
              i +
              vec2(
                1.0,
                1.0
              )
            );

          vec2 u =
            f *
            f *
            (3.0 - 2.0 * f);

          return mix(a, b, u.x)
            +
            (c - a) *
            u.y *
            (1.0 - u.x)
            +
            (d - b) *
            u.x *
            u.y;
        }

        // ======================================================
        // FBM
        // ======================================================

        float fbm(vec2 p) {

          float value = 0.0;
          float amplitude = 0.5;

          for(int i = 0; i < 6; i++) {

            value +=
              noise(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        // ======================================================
        // CRATER
        // ======================================================

        float crater(
          vec2 uv,
          vec2 center,
          float radius
        ) {

          float d =
            distance(
              uv,
              center
            );

          float rim =
            smoothstep(
              radius,
              radius * 0.72,
              d
            );

          float inner =
            smoothstep(
              radius * 0.72,
              radius * 0.28,
              d
            );

          float centerDepth =
            smoothstep(
              radius * 0.32,
              0.0,
              d
            );

          return
            rim * 0.30
            -
            inner * 0.25
            -
            centerDepth * 0.14;
        }

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec2 uv = vUv;

          // ====================================================
          // 🪨 LUNAR PALETTE
          // ====================================================

          vec3 deepRock =
            vec3(
              0.105,
              0.105,
              0.10
            );

          vec3 darkRock =
            vec3(
              0.19,
              0.19,
              0.18
            );

          vec3 midRock =
            vec3(
              0.34,
              0.34,
              0.32
            );

          vec3 lightRock =
            vec3(
              0.50,
              0.49,
              0.46
            );

          vec3 brightRock =
            vec3(
              0.64,
              0.63,
              0.59
            );

          // ====================================================
          // 🪨 LARGE TERRAIN
          // ====================================================

          float largeTerrain =
            fbm(
              uv * 4.2
            );

          vec3 surface =
            mix(
              darkRock,
              midRock,
              largeTerrain
            );

          surface =
            mix(
              surface,
              lightRock,
              smoothstep(
                0.56,
                0.79,
                largeTerrain
              )
            );

          // ====================================================
          // 🌑 MARIA
          // ====================================================

          float mariaNoise =
            fbm(
              uv * 2.8 +
              vec2(
                3.4,
                1.8
              )
            );

          float maria =
            smoothstep(
              0.38,
              0.55,
              mariaNoise
            );

          surface =
            mix(
              surface,
              vec3(
                0.145,
                0.145,
                0.135
              ),
              maria * 0.30
            );

          // ====================================================
          // 🕳️ MAJOR CRATERS
          // ====================================================

          float craters = 0.0;

          craters += crater(
            uv,
            vec2(0.18, 0.73),
            0.082
          );

          craters += crater(
            uv,
            vec2(0.34, 0.30),
            0.060
          );

          craters += crater(
            uv,
            vec2(0.51, 0.64),
            0.095
          );

          craters += crater(
            uv,
            vec2(0.68, 0.40),
            0.066
          );

          craters += crater(
            uv,
            vec2(0.81, 0.75),
            0.050
          );

          craters += crater(
            uv,
            vec2(0.12, 0.43),
            0.042
          );

          craters += crater(
            uv,
            vec2(0.58, 0.18),
            0.048
          );

          craters += crater(
            uv,
            vec2(0.88, 0.25),
            0.055
          );

          craters += crater(
            uv,
            vec2(0.43, 0.87),
            0.038
          );

          craters += crater(
            uv,
            vec2(0.73, 0.12),
            0.034
          );

          surface += craters;

          // ====================================================
          // 🕳️ SECONDARY CRATERS
          // ====================================================

          float craterNoise =
            fbm(
              uv * 22.0
            );

          float secondaryCraters =
            smoothstep(
              0.68,
              0.86,
              craterNoise
            );

          surface -=
            secondaryCraters *
            0.055;

          // ====================================================
          // 🪨 FINE ROCK
          // ====================================================

          float fineRock =
            fbm(
              uv * 38.0
            );

          surface +=
            (fineRock - 0.5) *
            0.040;

          // ====================================================
          // 🪨 MICRO IMPACTS
          // ====================================================

          float microNoise =
            noise(
              uv * 85.0
            );

          surface +=
            (microNoise - 0.5) *
            0.018;

          // ====================================================
          // 🌫️ DUST
          // ====================================================

          float dust =
            fbm(
              uv * 13.0 +
              vec2(
                1.7,
                4.1
              )
            );

          surface =
            mix(
              surface,
              surface * 1.08,
              smoothstep(
                0.60,
                0.85,
                dust
              ) *
              0.20
            );

          // ====================================================
          // ☀️ SUN DIRECTION
          // ====================================================

          vec3 moonToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normalize(vNormal),
              moonToSun
            );

          float diffuse =
            max(
              NdotL,
              0.0
            );

          // ====================================================
          // 🌑 PLANET SHADOW
          // ====================================================

          /*
           * uShadow:
           *
           * 0 = full sunlight
           * 1 = full planetary shadow
           *
           * The CPU calculates the large-scale eclipse.
           */

          float directLight =
            diffuse *
            (
              1.0 -
              uShadow
            );

          // ====================================================
          // 🌗 DAY
          // ====================================================

          float day =
            smoothstep(
              0.012,
              0.38,
              directLight
            );

          // ====================================================
          // 🌅 TERMINATOR
          // ====================================================

          float twilight =
            smoothstep(
              0.0,
              0.20,
              directLight
            )
            *
            (
              1.0 -
              smoothstep(
                0.20,
                0.46,
                directLight
              )
            );

          // ====================================================
          // ☀️ SUBTLE SUN TINT
          // ====================================================

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.045,
                1.04,
                1.025
              ),
              day * 0.18
            );

          // ====================================================
          // 🌅 TERMINATOR REFLECTION
          // ====================================================

          surface +=
            vec3(
              0.012,
              0.014,
              0.018
            ) *
            twilight;

          // ====================================================
          // 🌗 DAY / NIGHT BALANCE
          // ====================================================

          surface *=
            0.27 +
            day * 0.73;

          // ====================================================
          // 🌑 DEEP NIGHT
          // ====================================================

          float night =
            1.0 -
            day;

          surface *=
            1.0 -
            night * 0.10;

          surface +=
            vec3(
              0.0025,
              0.0025,
              0.0035
            ) *
            night;

          // ====================================================
          // ✨ FINAL
          // ====================================================

          surface =
            max(
              surface,
              vec3(
                0.002,
                0.002,
                0.002
              )
            );

          gl_FragColor =
            vec4(
              surface,
              1.0
            );
        }
      `,

      toneMapped: false,
    });
  }, []);

  // ============================================================
  // 🌑 SHADOW CALCULATION VECTORS
  // ============================================================

  const shadowVectors = useRef({
    moon: new THREE.Vector3(),
    planet: new THREE.Vector3(),
    sunToPlanet: new THREE.Vector3(),
    sunToMoon: new THREE.Vector3(),
    axisPoint: new THREE.Vector3(),
    planetToMoon: new THREE.Vector3(),
  });

  const shadowState = useRef(0);

  // ============================================================
  // 🌑 FIND HOST PLANET
  // ============================================================

  const findHostPlanet = () => {
    let parent =
      ref.current?.parent ?? null;

    while (parent) {
      if (
        parent.userData?.planetName
      ) {
        return parent;
      }

      parent = parent.parent;
    }

    return null;
  };

  // ============================================================
  // 🌑 PLANETARY ECLIPSE
  // ============================================================

  const calculatePlanetaryShadow = (
    moonWorldPosition: THREE.Vector3,
  ) => {
    if (!ref.current) {
      return 0;
    }

    const scene =
      ref.current.parent?.parent?.parent;

    if (!scene) {
      return 0;
    }

    const {
      moon,
      planet,
      sunToPlanet,
      sunToMoon,
      axisPoint,
      planetToMoon,
    } = shadowVectors.current;

    moon.copy(
      moonWorldPosition
    );

    // ==========================================================
    // ☀️ SUN → MOON AXIS
    // ==========================================================

    sunToMoon
      .copy(moon)
      .sub(SUN_POSITION);

    const sunMoonDistance =
      sunToMoon.length();

    if (
      sunMoonDistance <
      MIN_OCCLUDER_DISTANCE
    ) {
      return 0;
    }

    const moonDirection =
      sunToMoon.normalize();

    let strongestShadow = 0;

    // ==========================================================
    // 🌍 CHECK ALL PLANETS
    // ==========================================================

    scene.traverse((object) => {
      const planetName =
        object.userData?.planetName;

      if (
        !planetName ||
        !PLANET_RADII[planetName]
      ) {
        return;
      }

      // ========================================================
      // 🌍 PLANET WORLD POSITION
      // ========================================================

      object.getWorldPosition(
        planet
      );

      sunToPlanet
        .copy(planet)
        .sub(SUN_POSITION);

      const planetDistance =
        sunToPlanet.length();

      if (
        planetDistance <
        MIN_OCCLUDER_DISTANCE
      ) {
        return;
      }

      // ========================================================
      // 🚫 PLANET MUST BE BETWEEN SUN AND MOON
      // ========================================================

      const projection =
        sunToPlanet.dot(
          moonDirection
        );

      if (
        projection <= 0 ||
        projection >= sunMoonDistance
      ) {
        return;
      }

      // ========================================================
      // 🌍 WORLD SCALE / RADIUS
      // ========================================================

      const worldScale =
        new THREE.Vector3();

      object.getWorldScale(
        worldScale
      );

      const planetRadius =
        PLANET_RADII[planetName] *
        Math.max(
          worldScale.x,
          worldScale.y,
          worldScale.z
        );

      // ========================================================
      // ☀️ FINITE SUN → SHADOW CONE
      // ========================================================

      /*
       * The shadow cone gradually narrows as it travels
       * away from the occluding planet.
       */

      const shadowLength =
        planetDistance *
        planetRadius /
        Math.max(
          SUN_RADIUS - planetRadius,
          0.001
        );

      const distanceBehindPlanet =
        projection -
        planetDistance;

      // ========================================================
      // 🌑 UMBRA RADIUS
      // ========================================================

      const umbraRadius =
        Math.max(
          planetRadius *
          (
            1 -
            distanceBehindPlanet /
            Math.max(
              shadowLength,
              0.001
            )
          ),
          0
        );

      // ========================================================
      // 🎯 DISTANCE FROM SHADOW AXIS
      // ========================================================

      axisPoint
        .copy(moonDirection)
        .multiplyScalar(
          projection
        );

      const axisDistance =
        planet.distanceTo(
          axisPoint
        );

      // ========================================================
      // 🌘 PENUMBRA
      // ========================================================

      const penumbraRadius =
        planetRadius +
        distanceBehindPlanet *
        (
          SUN_RADIUS +
          planetRadius
        ) /
        Math.max(
          planetDistance,
          0.001
        ) *
        SHADOW_SOFTNESS;

      // ========================================================
      // 🌑 FULL UMBRA
      // ========================================================

      let shadow = 0;

      if (
        axisDistance <=
        umbraRadius
      ) {
        shadow = 1.0;
      }

      // ========================================================
      // 🌘 SOFT PENUMBRA
      // ========================================================

      else if (
        axisDistance <
        penumbraRadius
      ) {
        shadow =
          1.0 -
          THREE.MathUtils.smoothstep(
            umbraRadius,
            penumbraRadius,
            axisDistance
          );

        shadow *= 0.72;
      }

      // ========================================================
      // 🌑 SPECIAL HOST-PLANET BOOST
      // ========================================================

      /*
       * Moon is physically attached to its host planet.
       * For visual clarity, the host planet gets a slightly
       * stronger eclipse contribution.
       */

      const hostPlanet =
        findHostPlanet();

      if (
        hostPlanet === object
      ) {
        shadow *= 1.08;
      }

      strongestShadow =
        Math.max(
          strongestShadow,
          THREE.MathUtils.clamp(
            shadow,
            0,
            1
          )
        );
    });

    return THREE.MathUtils.clamp(
      strongestShadow,
      0,
      1
    );
  };

  // ============================================================
  // 🌙 ANIMATION
  // ============================================================

  useFrame(({ clock }, delta) => {
    if (!ref.current) {
      return;
    }

    const time =
      clock.getElapsedTime();

    // ==========================================================
    // ⚙️ SIMULATION SPEED
    // ==========================================================

    const daysPerSecond =
      SIMULATION_MODES[
        simulationMode
      ].daysPerSecond;

    const orbitalSpeed =
      moon.speed *
      (
        daysPerSecond /
        SIMULATION_MODES.year.daysPerSecond
      );

    const angle =
      time *
      orbitalSpeed +
      (moon.angle ?? 0);

    // ==========================================================
    // 🌙 ORBITAL INCLINATION
    // ==========================================================

    const inclination =
      THREE.MathUtils.degToRad(
        moon.inclination ?? 0
      );

    const orbitDistance =
      moon.distance *
      MOON_ORBIT_SCALE;

    const x =
      orbitDistance *
      Math.cos(angle);

    const z =
      orbitDistance *
      Math.sin(angle);

    const y =
      Math.sin(angle) *
      Math.sin(inclination) *
      orbitDistance;

    ref.current.position.set(
      x,
      y,
      z
    );

    // ==========================================================
    // 🔄 ROTATION
    // ==========================================================

    ref.current.rotation.y +=
      delta *
      0.08;

    // ==========================================================
    // 🌍 WORLD POSITION
    // ==========================================================

    const worldPosition =
      new THREE.Vector3();

    ref.current.getWorldPosition(
      worldPosition
    );

    // ==========================================================
    // 🌑 ECLIPSE SHADOW
    // ==========================================================

    const targetShadow =
      calculatePlanetaryShadow(
        worldPosition
      );

    // Smooth but responsive.
    shadowState.current =
      THREE.MathUtils.lerp(
        shadowState.current,
        targetShadow,
        0.18
      );

    moonMaterial.uniforms.uShadow.value =
      shadowState.current;

    // ==========================================================
    // 🎨 SHADER TIME
    // ==========================================================

    moonMaterial.uniforms.uTime.value =
      time;
  });

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  return (
    <Sphere
      ref={ref}
      args={[
        moon.size,
        48,
        48,
      ]}
      castShadow
      receiveShadow
    >
      <primitive
        object={moonMaterial}
        attach="material"
      />
    </Sphere>
  );
};