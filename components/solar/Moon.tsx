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

const MIN_OCCLUDER_DISTANCE = 0.001;

// ============================================================
// 🌙 MOON
// ============================================================

export const Moon = ({
  moon,
  simulationMode = "year",
}: MoonProps) => {
  const ref = useRef<THREE.Mesh>(null);

  // ==========================================================
  // 🌍 REUSABLE WORLD POSITION
  //
  // IMPORTANT PERFORMANCE OPTIMIZATION:
  //
  // This vector is reused every frame instead of creating:
  //
  // new THREE.Vector3()
  //
  // during every animation frame.
  // ==========================================================

  const worldPositionRef = useRef(
    new THREE.Vector3(),
  );

  // ==========================================================
  // 🌑 CACHED HOST PLANET
  //
  // The Moon's parent hierarchy does not change during normal
  // rendering, so there is no reason to search it repeatedly.
  // ==========================================================

  const hostPlanetRef =
    useRef<THREE.Object3D | null>(null);

  const hostPlanetResolvedRef =
    useRef(false);

  // ==========================================================
  // 🌑 PREMIUM PROCEDURAL LUNAR MATERIAL
  // ==========================================================

  const moonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },

        uSunPosition: {
          value: SUN_POSITION.clone(),
        },

        uShadow: {
          value: 0,
        },
      },

      vertexShader: `
        varying vec3 vLocalPosition;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        void main() {

          vLocalPosition =
            normalize(position);

          vec4 worldPosition =
            modelMatrix *
            vec4(
              position,
              1.0
            );

          vWorldPosition =
            worldPosition.xyz;

          vWorldNormal =
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
        varying vec3 vLocalPosition;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        uniform float uTime;
        uniform vec3 uSunPosition;
        uniform float uShadow;

        // ======================================================
        // HASH
        // ======================================================

        float hash(vec3 p) {

          p =
            fract(
              p * 0.3183099 +
              vec3(
                0.1,
                0.2,
                0.3
              )
            );

          p *= 17.0;

          return fract(
            p.x *
            p.y *
            p.z *
            (
              p.x +
              p.y +
              p.z
            )
          );
        }

        // ======================================================
        // 3D VALUE NOISE
        // ======================================================

        float noise(vec3 p) {

          vec3 i =
            floor(p);

          vec3 f =
            fract(p);

          f =
            f *
            f *
            (
              3.0 -
              2.0 * f
            );

          float n000 =
            hash(
              i +
              vec3(
                0.0,
                0.0,
                0.0
              )
            );

          float n100 =
            hash(
              i +
              vec3(
                1.0,
                0.0,
                0.0
              )
            );

          float n010 =
            hash(
              i +
              vec3(
                0.0,
                1.0,
                0.0
              )
            );

          float n110 =
            hash(
              i +
              vec3(
                1.0,
                1.0,
                0.0
              )
            );

          float n001 =
            hash(
              i +
              vec3(
                0.0,
                0.0,
                1.0
              )
            );

          float n101 =
            hash(
              i +
              vec3(
                1.0,
                0.0,
                1.0
              )
            );

          float n011 =
            hash(
              i +
              vec3(
                0.0,
                1.0,
                1.0
              )
            );

          float n111 =
            hash(
              i +
              vec3(
                1.0,
                1.0,
                1.0
              )
            );

          float x00 =
            mix(
              n000,
              n100,
              f.x
            );

          float x10 =
            mix(
              n010,
              n110,
              f.x
            );

          float x01 =
            mix(
              n001,
              n101,
              f.x
            );

          float x11 =
            mix(
              n011,
              n111,
              f.x
            );

          float y0 =
            mix(
              x00,
              x10,
              f.y
            );

          float y1 =
            mix(
              x01,
              x11,
              f.y
            );

          return mix(
            y0,
            y1,
            f.z
          );
        }

        // ======================================================
        // FBM
        // ======================================================

        float fbm(vec3 p) {

          float value = 0.0;
          float amplitude = 0.5;

          for(
            int i = 0;
            i < 6;
            i++
          ) {

            value +=
              noise(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        // ======================================================
        // RIDGED TERRAIN
        // ======================================================

        float ridged(vec3 p) {

          float n =
            fbm(p);

          return
            1.0 -
            abs(
              n * 2.0 -
              1.0
            );
        }

        // ======================================================
        // CRATER FIELD
        // ======================================================

        float craterField(vec3 p) {

          float large =
            ridged(
              p * 4.2 +
              vec3(
                1.7,
                -2.4,
                3.1
              )
            );

          float medium =
            ridged(
              p * 8.5 +
              vec3(
                -4.1,
                2.2,
                1.3
              )
            );

          float small =
            ridged(
              p * 17.0 +
              vec3(
                2.6,
                5.1,
                -3.7
              )
            );

          float craterPattern =
            large * 0.58 +
            medium * 0.29 +
            small * 0.13;

          return craterPattern;
        }

        // ======================================================
        // LUNAR HEIGHT
        // ======================================================

        float lunarHeight(vec3 p) {

          float terrain =
            fbm(
              p * 3.8
            );

          float roughness =
            fbm(
              p * 10.0 +
              vec3(
                3.1,
                -1.7,
                2.4
              )
            );

          float crater =
            craterField(p);

          float height =
            terrain * 0.060;

          height +=
            (
              crater -
              0.50
            ) *
            0.075;

          height +=
            (
              roughness -
              0.50
            ) *
            0.022;

          return height;
        }

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec3 p =
            normalize(
              vLocalPosition
            );

          // ====================================================
          // 🪨 LUNAR SURFACE
          // ====================================================

          float macro =
            fbm(
              p * 3.2
            );

          float terrain =
            fbm(
              p * 6.8 +
              vec3(
                2.1,
                -1.3,
                4.2
              )
            );

          float fine =
            fbm(
              p * 18.0 +
              vec3(
                -3.4,
                1.7,
                2.8
              )
            );

          float micro =
            noise(
              p * 42.0
            );

          // ====================================================
          // 🌑 MARIA
          // ====================================================

          float mariaNoise =
            fbm(
              p * 2.3 +
              vec3(
                4.7,
                -2.2,
                1.5
              )
            );

          float maria =
            smoothstep(
              0.43,
              0.61,
              mariaNoise
            );

          // ====================================================
          // 🎨 REALISTIC LUNAR PALETTE
          // ====================================================

          vec3 regolithDark =
            vec3(
              0.095,
              0.092,
              0.086
            );

          vec3 regolith =
            vec3(
              0.185,
              0.181,
              0.168
            );

          vec3 regolithMid =
            vec3(
              0.285,
              0.278,
              0.255
            );

          vec3 regolithLight =
            vec3(
              0.405,
              0.395,
              0.365
            );

          vec3 highland =
            vec3(
              0.525,
              0.510,
              0.470
            );

          // ====================================================
          // 🪨 TERRAIN COLOR MIX
          // ====================================================

          vec3 surface =
            mix(
              regolithDark,
              regolith,
              macro
            );

          surface =
            mix(
              surface,
              regolithMid,
              smoothstep(
                0.36,
                0.63,
                terrain
              )
            );

          surface =
            mix(
              surface,
              regolithLight,
              smoothstep(
                0.58,
                0.82,
                macro *
                0.72 +
                terrain *
                0.28
              )
            );

          surface =
            mix(
              surface,
              highland,
              smoothstep(
                0.68,
                0.91,
                terrain
              ) *
              0.38
            );

          // ====================================================
          // 🌑 MARIA DARKENING
          // ====================================================

          vec3 mariaColor =
            vec3(
              0.125,
              0.122,
              0.114
            );

          surface =
            mix(
              surface,
              mariaColor,
              maria * 0.48
            );

          // ====================================================
          // 🕳️ CRATER RELIEF
          // ====================================================

          float crater =
            craterField(p);

          float craterDark =
            smoothstep(
              0.58,
              0.78,
              crater
            );

          float craterRim =
            smoothstep(
              0.43,
              0.58,
              crater
            ) *
            (
              1.0 -
              smoothstep(
                0.78,
                0.92,
                crater
              )
            );

          surface *=
            1.0 -
            craterDark *
            0.22;

          surface +=
            vec3(
              0.035,
              0.034,
              0.030
            ) *
            craterRim;

          // ====================================================
          // 🪨 FINE REGOLITH
          // ====================================================

          surface +=
            (
              fine -
              0.5
            ) *
            0.055;

          // ====================================================
          // 🪨 MICRO IMPACT DETAIL
          // ====================================================

          surface +=
            (
              micro -
              0.5
            ) *
            0.025;

          // ====================================================
          // 🌫️ DUST / POWDER VARIATION
          // ====================================================

          float dust =
            fbm(
              p * 13.0 +
              vec3(
                1.4,
                3.7,
                -2.1
              )
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.035,
                1.025,
                1.010
              ),
              smoothstep(
                0.60,
                0.88,
                dust
              ) *
              0.28
            );

          // ====================================================
          // ☀️ SUN DIRECTION
          // ====================================================

          vec3 moonToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          vec3 baseNormal =
            normalize(
              vWorldNormal
            );

          float NdotL =
            dot(
              baseNormal,
              moonToSun
            );

          float diffuse =
            max(
              NdotL,
              0.0
            );

          // ====================================================
          // ⛰️ PROCEDURAL BUMP NORMAL
          // ====================================================

          vec3 reference =
            abs(baseNormal.y) < 0.92
              ? vec3(0.0, 1.0, 0.0)
              : vec3(1.0, 0.0, 0.0);

          vec3 tangent =
            normalize(
              cross(
                reference,
                baseNormal
              )
            );

          vec3 bitangent =
            normalize(
              cross(
                baseNormal,
                tangent
              )
            );

          float bumpStep =
            0.018;

          vec3 sampleT =
            normalize(
              p +
              tangent *
              bumpStep
            );

          vec3 sampleB =
            normalize(
              p +
              bitangent *
              bumpStep
            );

          float h =
            lunarHeight(p);

          float hT =
            lunarHeight(sampleT);

          float hB =
            lunarHeight(sampleB);

          float dT =
            hT -
            h;

          float dB =
            hB -
            h;

          vec3 bumpedNormal =
            normalize(
              baseNormal -
              tangent *
              dT *
              2.8 -
              bitangent *
              dB *
              2.8
            );

          vec3 finalNormal =
            normalize(
              mix(
                baseNormal,
                bumpedNormal,
                0.72
              )
            );

          // ====================================================
          // ☀️ REALISTIC DIFFUSE LIGHTING
          // ====================================================

          float directLight =
            dot(
              finalNormal,
              moonToSun
            );

          directLight =
            max(
              directLight,
              0.0
            );

          directLight *=
            1.0 -
            uShadow;

          // ====================================================
          // 🌗 SOFT TERMINATOR
          // ====================================================

          float day =
            smoothstep(
              0.015,
              0.42,
              directLight
            );

          float twilight =
            smoothstep(
              0.0,
              0.24,
              directLight
            ) *
            (
              1.0 -
              smoothstep(
                0.24,
                0.50,
                directLight
              )
            );

          // ====================================================
          // 🌑 NIGHT SIDE
          // ====================================================

          float night =
            1.0 -
            day;

          // ====================================================
          // 🌍 SUBTLE EARTHSHINE
          // ====================================================

          vec3 earthshine =
            vec3(
              0.008,
              0.012,
              0.018
            );

          float earthshineAmount =
            pow(
              night,
              1.65
            ) *
            0.72;

          // ====================================================
          // ☀️ SOLAR RESPONSE
          // ====================================================

          float diffuseStrength =
            0.46 +
            day *
            0.54;

          surface *=
            diffuseStrength;

          // ====================================================
          // 🌅 TERMINATOR REFLECTION
          // ====================================================

          surface +=
            vec3(
              0.010,
              0.011,
              0.012
            ) *
            twilight;

          // ====================================================
          // 🌑 NIGHT SIDE EARTHSHINE
          // ====================================================

          surface +=
            earthshine *
            earthshineAmount;

          // ====================================================
          // 🌘 ECLIPSE DARKENING
          // ====================================================

          surface *=
            1.0 -
            uShadow *
            0.34;

          // ====================================================
          // ✨ EDGE / RIM RESPONSE
          // ====================================================

          vec3 viewDirection =
            normalize(
              cameraPosition -
              vWorldPosition
            );

          float rim =
            1.0 -
            max(
              dot(
                finalNormal,
                viewDirection
              ),
              0.0
            );

          rim =
            pow(
              rim,
              4.5
            );

          surface +=
            vec3(
              0.018,
              0.018,
              0.017
            ) *
            rim *
            day *
            0.12;

          // ====================================================
          // 🎨 FINAL LUNAR TONAL BALANCE
          // ====================================================

          surface =
            max(
              surface,
              vec3(
                0.0025,
                0.0025,
                0.0025
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
  //
  // ALL vectors are allocated ONCE and reused every frame.
  // ============================================================

  const shadowVectors = useRef({
    moon: new THREE.Vector3(),
    planet: new THREE.Vector3(),
    sunToPlanet: new THREE.Vector3(),
    sunToMoon: new THREE.Vector3(),
    axisPoint: new THREE.Vector3(),
    planetToMoon: new THREE.Vector3(),
    worldScale: new THREE.Vector3(),
  });

  const shadowState = useRef(0);

  // ============================================================
  // 🌑 FIND HOST PLANET
  //
  // This is now cached.
  //
  // Previously this parent traversal happened repeatedly
  // inside scene.traverse().
  // ============================================================

  const getHostPlanet = () => {
    if (
      hostPlanetResolvedRef.current
    ) {
      return hostPlanetRef.current;
    }

    let parent =
      ref.current?.parent ?? null;

    while (parent) {
      if (
        parent.userData?.planetName
      ) {
        hostPlanetRef.current =
          parent;

        break;
      }

      parent =
        parent.parent;
    }

    hostPlanetResolvedRef.current =
      true;

    return hostPlanetRef.current;
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
      worldScale,
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

    // Resolve host planet once.
    const hostPlanet =
      getHostPlanet();

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

      const shadowLength =
        planetDistance *
        planetRadius /
        Math.max(
          SUN_RADIUS -
            planetRadius,
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
      // 🌑 HOST PLANET BOOST
      // ========================================================

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
    const mesh = ref.current;

    if (!mesh) {
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

    mesh.position.set(
      x,
      y,
      z
    );

    // ==========================================================
    // 🔄 ROTATION
    // ==========================================================

    mesh.rotation.y +=
      delta *
      0.08;

    // ==========================================================
    // 🌍 WORLD POSITION
    //
    // Reuses the same Vector3 every frame.
    // ==========================================================

    mesh.getWorldPosition(
      worldPositionRef.current
    );

    // ==========================================================
    // 🌑 ECLIPSE SHADOW
    // ==========================================================

    const targetShadow =
      calculatePlanetaryShadow(
        worldPositionRef.current
      );

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
        64,
        64,
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