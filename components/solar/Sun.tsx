"use client";

import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SunProps = {
  setRef?: (
    name: string,
    ref: React.RefObject<THREE.Group | null>,
  ) => void;
};

// ============================================================
// ☀️ PRO CINEMATIC PROCEDURAL SUN
// ============================================================

export const Sun = ({ setRef }: SunProps) => {
  // ==========================================================
  // 🎥 SUN GROUP
  // ==========================================================

  const groupRef = useRef<THREE.Group>(null);

  // ==========================================================
  // 🎥 VISUAL REFS
  // ==========================================================

  const coreRef =
    useRef<THREE.Mesh>(null);

  const plasmaRef =
    useRef<THREE.ShaderMaterial>(null);

  const hotCoreRef =
    useRef<THREE.Mesh>(null);

  const outerRef =
    useRef<THREE.Mesh>(null);

  const coronaRef =
    useRef<THREE.ShaderMaterial>(null);

  const coronaGlowRef =
    useRef<THREE.ShaderMaterial>(null);

  // ==========================================================
  // 🔥 ADVANCED PROCEDURAL SOLAR PLASMA
  // ==========================================================

  const plasmaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0,
          },

          uColorDeep: {
            value:
              new THREE.Color("#650500"),
          },

          uColorA: {
            value:
              new THREE.Color("#c91800"),
          },

          uColorB: {
            value:
              new THREE.Color("#ff4b08"),
          },

          uColorC: {
            value:
              new THREE.Color("#ff9d24"),
          },

          uColorHot: {
            value:
              new THREE.Color("#fff0ad"),
          },
        },

        // ======================================================
        // VERTEX SHADER
        // ======================================================

        vertexShader: `
          varying vec3 vLocalPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {

            vLocalPosition = position;

            vec4 mvPosition =
              modelViewMatrix *
              vec4(position, 1.0);

            vNormal =
              normalize(
                normalMatrix *
                normal
              );

            vViewDir =
              normalize(
                -mvPosition.xyz
              );

            gl_Position =
              projectionMatrix *
              mvPosition;
          }
        `,

        // ======================================================
        // FRAGMENT SHADER
        // ======================================================

        fragmentShader: `
          varying vec3 vLocalPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          uniform float uTime;

          uniform vec3 uColorDeep;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          uniform vec3 uColorHot;

          // ==================================================
          // ROBUST 3D HASH
          // ==================================================
          //
          // IMPORTANT:
          // The previous hash used multiplication of the
          // individual coordinates after fract().
          //
          // That can produce artificial dark seams when one
          // coordinate becomes zero.
          //
          // This version uses a dot-product based hash and
          // avoids coordinate-plane artifacts.
          // ==================================================

          float hash(vec3 p) {

            return fract(
              sin(
                dot(
                  p,
                  vec3(
                    127.1,
                    311.7,
                    74.7
                  )
                )
              ) *
              43758.5453123
            );
          }

          // ==================================================
          // 3D VALUE NOISE
          // ==================================================

          float noise3(vec3 p) {

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

          // ==================================================
          // FBM
          // ==================================================

          float fbm3(vec3 p) {

            float value = 0.0;

            float amplitude = 0.5;

            value +=
              noise3(p) *
              amplitude;

            p *= 2.02;
            amplitude *= 0.5;

            value +=
              noise3(p) *
              amplitude;

            p *= 2.01;
            amplitude *= 0.5;

            value +=
              noise3(p) *
              amplitude;

            p *= 2.03;
            amplitude *= 0.5;

            value +=
              noise3(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;

            value +=
              noise3(p) *
              amplitude;

            return value;
          }

          // ==================================================
          // HIGH FREQUENCY GRANULATION
          // ==================================================

          float granulation(vec3 p) {

            float g1 =
              noise3(
                p * 26.0
              );

            float g2 =
              noise3(
                p * 54.0
              );

            float g3 =
              noise3(
                p * 96.0
              );

            float g4 =
              noise3(
                p * 150.0
              );

            return
              g1 * 0.46 +
              g2 * 0.28 +
              g3 * 0.18 +
              g4 * 0.08;
          }

          // ==================================================
          // SOLAR ACTIVE REGION
          // ==================================================

          float activeRegion(
            vec3 direction,
            vec3 center,
            float size
          ) {

            float d =
              distance(
                direction,
                center
              );

            float region =
              1.0 -
              smoothstep(
                size * 0.35,
                size,
                d
              );

            float distortion =
              fbm3(
                direction * 7.0
              );

            region *=
              mix(
                0.76,
                1.08,
                distortion
              );

            return clamp(
              region,
              0.0,
              1.0
            );
          }

          // ==================================================
          // MAIN
          // ==================================================

          void main() {

            vec3 direction =
              normalize(
                vLocalPosition
              );

            // =================================================
            // SOLAR SURFACE MOTION
            // =================================================

            vec3 movingDirection =
              direction;

            movingDirection.x +=
              sin(
                direction.y * 7.0 +
                uTime * 0.018
              ) *
              0.035;

            movingDirection.y +=
              cos(
                direction.x * 6.0 -
                uTime * 0.014
              ) *
              0.025;

            movingDirection =
              normalize(
                movingDirection
              );

            // =================================================
            // LARGE TURBULENCE
            // =================================================

            float largeNoise =
              fbm3(
                movingDirection * 3.8 +
                vec3(
                  uTime * 0.012,
                  -uTime * 0.009,
                  uTime * 0.006
                )
              );

            // =================================================
            // MEDIUM TURBULENCE
            // =================================================

            float mediumNoise =
              fbm3(
                movingDirection * 8.5 +
                vec3(
                  -uTime * 0.020,
                  uTime * 0.016,
                  -uTime * 0.012
                )
              );

            // =================================================
            // SMALL TURBULENCE
            // =================================================

            float smallNoise =
              noise3(
                movingDirection * 19.0 +
                vec3(
                  uTime * 0.035,
                  -uTime * 0.028,
                  uTime * 0.022
                )
              );

            // =================================================
            // GRANULATION
            // =================================================

            float granules =
              granulation(
                movingDirection
              );

            // =================================================
            // PLASMA FIELD
            // =================================================

            float plasma =
              largeNoise * 0.38 +
              mediumNoise * 0.34 +
              smallNoise * 0.12 +
              granules * 0.16;

            plasma =
              clamp(
                plasma,
                0.0,
                1.0
              );

            // =================================================
            // SOLAR ACTIVE REGIONS
            // =================================================

            float spot1 =
              activeRegion(
                movingDirection,
                normalize(
                  vec3(
                    0.34,
                    0.42,
                    0.82
                  )
                ),
                0.22
              );

            float spot2 =
              activeRegion(
                movingDirection,
                normalize(
                  vec3(
                    -0.58,
                    0.18,
                    0.76
                  )
                ),
                0.17
              );

            float spot3 =
              activeRegion(
                movingDirection,
                normalize(
                  vec3(
                    0.24,
                    -0.62,
                    0.74
                  )
                ),
                0.14
              );

            // =================================================
            // ACTIVE REGION MASK
            // =================================================

            float activeRegionMask =
              max(
                spot1,
                max(
                  spot2,
                  spot3
                )
              );

            // =================================================
            // SUBTLE DARK SOLAR STRUCTURE
            // =================================================
            //
            // Kept intentionally weak.
            // This creates sunspot-like regions without
            // producing artificial black lines.
            // =================================================

            float darkStructure =
              smoothstep(
                0.62,
                0.94,
                activeRegionMask
              );

            plasma -=
              darkStructure *
              0.055;

            plasma =
              clamp(
                plasma,
                0.0,
                1.0
              );

            // =================================================
            // COLOR HEAT
            // =================================================

            float heat =
              clamp(
                plasma * 1.18 +
                largeNoise * 0.18,
                0.0,
                1.0
              );

            // =================================================
            // COLOR RAMP
            // =================================================

            vec3 fire =
              mix(
                uColorDeep,
                uColorA,
                smoothstep(
                  0.05,
                  0.28,
                  heat
                )
              );

            fire =
              mix(
                fire,
                uColorB,
                smoothstep(
                  0.25,
                  0.56,
                  heat
                )
              );

            fire =
              mix(
                fire,
                uColorC,
                smoothstep(
                  0.50,
                  0.80,
                  heat
                )
              );

            fire =
              mix(
                fire,
                uColorHot,
                smoothstep(
                  0.76,
                  1.0,
                  heat
                ) *
                0.78
              );

            // =================================================
            // GRANULATION CONTRAST
            // =================================================

            float granulationContrast =
              smoothstep(
                0.28,
                0.72,
                granules
              );

            fire *=
              mix(
                0.82,
                1.16,
                granulationContrast
              );

            // =================================================
            // VIEW ANGLE
            // =================================================

            float facing =
              clamp(
                dot(
                  normalize(vNormal),
                  normalize(vViewDir)
                ),
                0.0,
                1.0
              );

            // =================================================
            // LIMB DARKENING
            // =================================================

            float limb =
              smoothstep(
                0.0,
                0.92,
                facing
              );

            fire *=
              mix(
                0.56,
                1.0,
                limb
              );

            // =================================================
            // CENTRAL ENERGY
            // =================================================

            float centerGlow =
              pow(
                facing,
                1.8
              );

            fire +=
              uColorC *
              centerGlow *
              0.08;

            // =================================================
            // EDGE ENERGY
            // =================================================

            float edge =
              pow(
                1.0 - facing,
                2.5
              );

            fire +=
              uColorA *
              edge *
              0.12;

            // =================================================
            // FINAL SOLAR ENERGY
            // =================================================

            fire *= 1.10;

            gl_FragColor =
              vec4(
                fire,
                1.0
              );
          }
        `,

        toneMapped: false,
      }),
    [],
  );

  // ==========================================================
  // 🔥 INNER SOLAR ENERGY
  // ==========================================================

  const hotCoreMaterial =
    useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: "#ff9f32",

          transparent: true,

          opacity: 0.16,

          blending:
            THREE.AdditiveBlending,

          depthWrite: false,

          toneMapped: false,
        }),
      [],
    );

  // ==========================================================
  // 🔴 OUTER PLASMA
  // ==========================================================

  const outerMaterial =
    useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: "#ff2608",

          transparent: true,

          opacity: 0.11,

          blending:
            THREE.AdditiveBlending,

          depthWrite: false,

          toneMapped: false,
        }),
      [],
    );

  // ==========================================================
  // 🌌 DYNAMIC CORONA
  // ==========================================================

  const coronaMaterial =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,

          depthWrite: false,

          side: THREE.BackSide,

          blending:
            THREE.AdditiveBlending,

          uniforms: {
            uTime: {
              value: 0,
            },

            uColor: {
              value:
                new THREE.Color(
                  "#ff4a0a",
                ),
            },

            uHotColor: {
              value:
                new THREE.Color(
                  "#ffb52e",
                ),
            },
          },

          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            void main() {

              vNormal =
                normalize(
                  normalMatrix *
                  normal
                );

              vec4 worldPosition =
                modelMatrix *
                vec4(
                  position,
                  1.0
                );

              vWorldPosition =
                worldPosition.xyz;

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
            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            uniform float uTime;

            uniform vec3 uColor;
            uniform vec3 uHotColor;

            // ==================================================
            // ROBUST CORONA HASH
            // ==================================================

            float hash(vec3 p) {

              return fract(
                sin(
                  dot(
                    p,
                    vec3(
                      127.1,
                      311.7,
                      74.7
                    )
                  )
                ) *
                43758.5453123
              );
            }

            // ==================================================
            // CORONA NOISE
            // ==================================================

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
                hash(i);

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

            // ==================================================
            // MAIN
            // ==================================================

            void main() {

              vec3 normal =
                normalize(
                  vNormal
                );

              vec3 viewDir =
                normalize(
                  cameraPosition -
                  vWorldPosition
                );

              float facing =
                max(
                  dot(
                    normal,
                    viewDir
                  ),
                  0.0
                );

              float rim =
                pow(
                  1.0 -
                  facing,
                  3.6
                );

              // ==============================================
              // MOVING CORONA FIELD
              // ==============================================

              vec3 noisePos =
                normal * 5.5;

              noisePos.x +=
                uTime * 0.018;

              noisePos.y +=
                uTime * 0.025;

              noisePos.z +=
                uTime * 0.012;

              float n1 =
                noise(
                  noisePos
                );

              float n2 =
                noise(
                  normal * 12.0 -
                  vec3(
                    uTime * 0.02,
                    uTime * 0.045,
                    0.0
                  )
                );

              float turbulence =
                n1 * 0.65 +
                n2 * 0.35;

              float stream =
                smoothstep(
                  0.35,
                  0.82,
                  turbulence
                );

              // ==============================================
              // CORONA COLOR
              // ==============================================

              vec3 color =
                mix(
                  uColor,
                  uHotColor,
                  stream * 0.45
                );

              // ==============================================
              // CORONA ALPHA
              // ==============================================

              float alpha =
                rim *
                (
                  0.20 +
                  stream * 0.55
                ) *
                0.40;

              gl_FragColor =
                vec4(
                  color,
                  alpha
                );
            }
          `,

          toneMapped: false,
        }),
      [],
    );

  // ==========================================================
  // ✨ SOFT OUTER CORONA GLOW
  // ==========================================================

  const coronaGlowMaterial =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,

          depthWrite: false,

          side: THREE.BackSide,

          blending:
            THREE.AdditiveBlending,

          uniforms: {
            uColor: {
              value:
                new THREE.Color(
                  "#ff4508",
                ),
            },

            uIntensity: {
              value: 0.10,
            },
          },

          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewDir;

            void main() {

              vec4 mvPosition =
                modelViewMatrix *
                vec4(
                  position,
                  1.0
                );

              vNormal =
                normalize(
                  normalMatrix *
                  normal
                );

              vViewDir =
                normalize(
                  -mvPosition.xyz
                );

              gl_Position =
                projectionMatrix *
                mvPosition;
            }
          `,

          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewDir;

            uniform vec3 uColor;
            uniform float uIntensity;

            void main() {

              float facing =
                max(
                  dot(
                    normalize(
                      vNormal
                    ),
                    normalize(
                      vViewDir
                    )
                  ),
                  0.0
                );

              float rim =
                pow(
                  1.0 -
                  facing,
                  4.5
                );

              float alpha =
                rim *
                uIntensity;

              gl_FragColor =
                vec4(
                  uColor,
                  alpha
                );
            }
          `,

          toneMapped: false,
        }),
      [],
    );

  // ==========================================================
  // 🎥 SUN ANIMATION
  // ==========================================================

  useFrame(
    ({ clock }, delta) => {

      const t =
        clock.getElapsedTime();

      // ======================================================
      // ☀️ NATURAL PULSE
      // ======================================================

      const pulse =
        1 +
        Math.sin(
          t * 2.4,
        ) *
        0.018;

      // ======================================================
      // 🔥 MAIN PLASMA
      // ======================================================

      if (
        plasmaRef.current
      ) {

        plasmaRef.current
          .uniforms
          .uTime
          .value = t;
      }

      // ======================================================
      // ☀️ CORE
      // ======================================================

      if (
        coreRef.current
      ) {

        coreRef.current
          .scale
          .setScalar(
            pulse,
          );

        coreRef.current
          .rotation
          .y +=
          delta * 0.18;

        coreRef.current
          .rotation
          .x +=
          delta * 0.025;
      }

      // ======================================================
      // 🔥 HOT CORE
      // ======================================================

      if (
        hotCoreRef.current
      ) {

        hotCoreRef.current
          .scale
          .setScalar(
            0.965 +
            Math.sin(
              t * 3.6,
            ) *
            0.018,
          );

        hotCoreRef.current
          .rotation
          .y +=
          delta * 0.12;
      }

      // ======================================================
      // 🔴 OUTER PLASMA
      // ======================================================

      if (
        outerRef.current
      ) {

        outerRef.current
          .scale
          .setScalar(
            1.14 +
            Math.sin(
              t * 1.8,
            ) *
            0.025,
          );

        outerRef.current
          .rotation
          .y -=
          delta * 0.06;
      }

      // ======================================================
      // 🌌 CORONA
      // ======================================================

      if (
        coronaRef.current
      ) {

        coronaRef.current
          .uniforms
          .uTime
          .value = t;
      }

      // ======================================================
      // 🌟 OUTER CORONA PULSE
      // ======================================================

      if (
        coronaGlowRef.current
      ) {

        coronaGlowRef.current
          .uniforms
          .uIntensity
          .value =
          0.10 +
          Math.sin(
            t * 0.9,
          ) *
          0.018;
      }
    },
  );

  // ==========================================================
  // ☀️ RENDER
  // ==========================================================

  return (
    <group
      ref={(node) => {

        groupRef.current =
          node;

        if (
          node &&
          setRef
        ) {

          setRef(
            "Sun",
            groupRef as React.RefObject<
              THREE.Group | null
            >,
          );
        }
      }}
    >

      {/* ====================================================
          ☀️ MAIN SOLAR SURFACE
          ==================================================== */}

      <Sphere
        ref={coreRef}
        args={[
          5.45,
          64,
          64,
        ]}
      >

        <primitive
          ref={plasmaRef}
          object={
            plasmaMaterial
          }
          attach="material"
        />

      </Sphere>

      {/* ====================================================
          🔥 HOT INNER ENERGY
          ==================================================== */}

      <Sphere
        ref={
          hotCoreRef
        }
        args={[
          4.48,
          48,
          48,
        ]}
      >

        <primitive
          object={
            hotCoreMaterial
          }
          attach="material"
        />

      </Sphere>

      {/* ====================================================
          🔴 OUTER PLASMA
          ==================================================== */}

      <Sphere
        ref={
          outerRef
        }
        args={[
          4.72,
          32,
          32,
        ]}
      >

        <primitive
          object={
            outerMaterial
          }
          attach="material"
        />

      </Sphere>

      {/* ====================================================
          🌌 DYNAMIC CORONA
          ==================================================== */}

      <mesh>

        <sphereGeometry
          args={[
            6.05,
            64,
            64,
          ]}
        />

        <primitive
          ref={
            coronaRef
          }
          object={
            coronaMaterial
          }
          attach="material"
        />

      </mesh>

      {/* ====================================================
          ✨ SOFT OUTER GLOW
          ==================================================== */}

      <mesh>

        <sphereGeometry
          args={[
            6.35,
            48,
            48,
          ]}
        />

        <primitive
          ref={
            coronaGlowRef
          }
          object={
            coronaGlowMaterial
          }
          attach="material"
        />

      </mesh>

    </group>
  );
};