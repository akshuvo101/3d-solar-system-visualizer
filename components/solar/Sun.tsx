"use client";

import { Sphere, useTexture } from "@react-three/drei";
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
// ☀️ PRO CINEMATIC SUN
// ============================================================

export const Sun = ({ setRef }: SunProps) => {
  // ==========================================================
  // 🎥 SUN GROUP
  // ==========================================================

  const groupRef = useRef<THREE.Group>(null);

  // ==========================================================
  // ☀️ SUN TEXTURE
  // ==========================================================

  const texture = useTexture(
    "/textures/sun.jpg",
  ) as THREE.Texture;

  // ==========================================================
  // 🎥 VISUAL REFS
  // ==========================================================

  const coreRef = useRef<THREE.Mesh>(null);

  const plasmaRef =
    useRef<THREE.ShaderMaterial>(null);

  const hotCoreRef =
    useRef<THREE.Mesh>(null);

  const outerRef =
    useRef<THREE.Mesh>(null);

  const networkGroupRef =
    useRef<THREE.Group>(null);

  const networkMaterialRef =
    useRef<THREE.LineBasicMaterial>(null);

  const nodeMaterialRef =
    useRef<THREE.MeshBasicMaterial>(null);

  const coronaRef =
    useRef<THREE.ShaderMaterial>(null);

  const coronaGlowRef =
    useRef<THREE.ShaderMaterial>(null);

  const fresnelRef =
    useRef<THREE.ShaderMaterial>(null);

  // ==========================================================
  // 🔥 ADVANCED SOLAR PLASMA
  // ==========================================================

  const plasmaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0,
          },

          uMap: {
            value: texture,
          },

          uColorDeep: {
            value: new THREE.Color("#650500"),
          },

          uColorA: {
            value: new THREE.Color("#c91800"),
          },

          uColorB: {
            value: new THREE.Color("#ff4b08"),
          },

          uColorC: {
            value: new THREE.Color("#ff9d24"),
          },

          uColorHot: {
            value: new THREE.Color("#fff0ad"),
          },
        },

        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {

            vUv = uv;

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

        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          uniform float uTime;
          uniform sampler2D uMap;

          uniform vec3 uColorDeep;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          uniform vec3 uColorHot;

          // ==================================================
          // HASH
          // ==================================================

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

          // ==================================================
          // VALUE NOISE
          // ==================================================

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
              (
                3.0 -
                2.0 * f
              );

            return mix(
              a,
              b,
              u.x
            )
            +
            (
              c - a
            ) *
            u.y *
            (
              1.0 - u.x
            )
            +
            (
              d - b
            ) *
            u.x *
            u.y;
          }

          // ==================================================
          // FBM
          // ==================================================

          float fbm(vec2 p) {

            float value = 0.0;
            float amplitude = 0.5;

            value +=
              noise(p) *
              amplitude;

            p *= 2.03;
            amplitude *= 0.5;

            value +=
              noise(p) *
              amplitude;

            p *= 2.01;
            amplitude *= 0.5;

            value +=
              noise(p) *
              amplitude;

            p *= 2.02;
            amplitude *= 0.5;

            value +=
              noise(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;

            value +=
              noise(p) *
              amplitude;

            return value;
          }

          // ==================================================
          // SOLAR GRANULATION
          // ==================================================

          float granulation(vec2 p) {

            float g1 =
              noise(
                p * 38.0
              );

            float g2 =
              noise(
                p * 72.0
              );

            float g3 =
              noise(
                p * 120.0
              );

            return
              g1 * 0.55 +
              g2 * 0.30 +
              g3 * 0.15;
          }

          // ==================================================
          // SUNSPOT
          // ==================================================

          float sunspot(
            vec2 uv,
            vec2 center,
            float radius
          ) {

            float d =
              distance(
                uv,
                center
              );

            float spot =
              1.0 -
              smoothstep(
                radius * 0.35,
                radius,
                d
              );

            float irregular =
              noise(
                uv * 28.0
              );

            spot *=
              mix(
                0.7,
                1.15,
                irregular
              );

            return clamp(
              spot,
              0.0,
              1.0
            );
          }

          // ==================================================
          // MAIN
          // ==================================================

          void main() {

            vec2 uv = vUv;

            // =================================================
            // SOLAR ROTATION
            // =================================================

            float rotation =
              uTime * 0.025;

            vec2 rotatingUv =
              uv;

            rotatingUv.x +=
              rotation;

            // =================================================
            // LARGE TURBULENCE
            // =================================================

            float largeNoise =
              fbm(
                rotatingUv * 5.5 +
                vec2(
                  uTime * 0.018,
                  -uTime * 0.012
                )
              );

            // =================================================
            // MEDIUM TURBULENCE
            // =================================================

            float mediumNoise =
              fbm(
                rotatingUv * 11.0 +
                vec2(
                  -uTime * 0.035,
                  uTime * 0.028
                )
              );

            // =================================================
            // SMALL TURBULENCE
            // =================================================

            float smallNoise =
              noise(
                rotatingUv * 24.0 +
                vec2(
                  uTime * 0.05,
                  -uTime * 0.04
                )
              );

            // =================================================
            // GRANULATION
            // =================================================

            float granules =
              granulation(
                rotatingUv +
                vec2(
                  uTime * 0.015,
                  -uTime * 0.01
                )
              );

            // =================================================
            // PLASMA
            // =================================================

            float plasma =
              largeNoise * 0.38 +
              mediumNoise * 0.36 +
              smallNoise * 0.10 +
              granules * 0.16;

            plasma =
              clamp(
                plasma,
                0.0,
                1.0
              );

            // =================================================
            // TEXTURE
            // =================================================

            vec3 tex =
              texture2D(
                uMap,
                rotatingUv
              ).rgb;

            float textureHeat =
              dot(
                tex,
                vec3(
                  0.55,
                  0.30,
                  0.15
                )
              );

            // =================================================
            // HEAT FIELD
            // =================================================

            float heat =
              clamp(
                textureHeat * 0.42 +
                plasma * 0.68,
                0.0,
                1.0
              );

            // =================================================
            // ACTIVE REGIONS
            // =================================================

            float spot1 =
              sunspot(
                rotatingUv,
                vec2(
                  0.30,
                  0.58
                ),
                0.075
              );

            float spot2 =
              sunspot(
                rotatingUv,
                vec2(
                  0.68,
                  0.38
                ),
                0.055
              );

            float spot3 =
              sunspot(
                rotatingUv,
                vec2(
                  0.52,
                  0.73
                ),
                0.045
              );

            float spots =
              max(
                spot1,
                max(
                  spot2,
                  spot3
                )
              );

            heat -=
              spots * 0.34;

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
                  0.58,
                  heat
                )
              );

            fire =
              mix(
                fire,
                uColorC,
                smoothstep(
                  0.52,
                  0.82,
                  heat
                )
              );

            fire =
              mix(
                fire,
                uColorHot,
                smoothstep(
                  0.78,
                  1.0,
                  heat
                ) * 0.75
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
                1.18,
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
                0.9,
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
            // FINAL ENERGY
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
    [texture],
  );

  // ==========================================================
  // 🕸️ SOLAR NODE NETWORK
  // ==========================================================

  const solarNetwork = useMemo(() => {

    const nodes: THREE.Vector3[] = [];

    const edges: Array<
      [number, number]
    > = [];

    // Keep network safely inside the solar circle.
    const networkRadius = 4.55;

    // Small number of nodes.
    const nodeCount = 42;

    // Deterministic pseudo-random generator.
    let seed = 17;

    const random = () => {
      seed =
        (
          seed * 9301 +
          49297
        ) %
        233280;

      return seed / 233280;
    };

    // ========================================================
    // CREATE NODES
    // ========================================================

    for (
      let i = 0;
      i < nodeCount;
      i++
    ) {

      const angle =
        random() *
        Math.PI *
        2;

      const radius =
        Math.sqrt(
          random()
        ) *
        networkRadius;

      const x =
        Math.cos(angle) *
        radius;

      const y =
        Math.sin(angle) *
        radius;

      // Slight surface-depth variation.
      const z =
        1.35 +
        random() *
        0.22;

      nodes.push(
        new THREE.Vector3(
          x,
          y,
          z,
        ),
      );
    }

    // ========================================================
    // CONNECT NEARBY NODES
    // ========================================================

    for (
      let i = 0;
      i < nodes.length;
      i++
    ) {

      const distances: Array<{
        index: number;
        distance: number;
      }> = [];

      for (
        let j = 0;
        j < nodes.length;
        j++
      ) {

        if (i === j) continue;

        const distance =
          nodes[i].distanceTo(
            nodes[j],
          );

        distances.push({
          index: j,
          distance,
        });
      }

      distances.sort(
        (a, b) =>
          a.distance -
          b.distance,
      );

      // Connect only the closest
      // 1–2 neighbors.
      const connections =
        i % 3 === 0
          ? 2
          : 1;

      for (
        let k = 0;
        k < connections;
        k++
      ) {

        const target =
          distances[k];

        if (!target) continue;

        const a = Math.min(
          i,
          target.index,
        );

        const b = Math.max(
          i,
          target.index,
        );

        const exists =
          edges.some(
            ([x, y]) =>
              x === a &&
              y === b,
          );

        if (
          !exists &&
          target.distance < 2.1
        ) {
          edges.push([
            a,
            b,
          ]);
        }
      }
    }

    // ========================================================
    // CREATE EDGE GEOMETRY
    // ========================================================

    const edgePositions: number[] =
      [];

    edges.forEach(
      ([a, b]) => {

        const start =
          nodes[a];

        const end =
          nodes[b];

        edgePositions.push(
          start.x,
          start.y,
          start.z,

          end.x,
          end.y,
          end.z,
        );
      },
    );

    const edgeGeometry =
      new THREE.BufferGeometry();

    edgeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        edgePositions,
        3,
      ),
    );

    // ========================================================
    // NODE GEOMETRY
    // ========================================================

    const nodeGeometry =
      new THREE.SphereGeometry(
        0.045,
        8,
        8,
      );

    // ========================================================
    // RETURN
    // ========================================================

    return {
      nodes,
      edgeGeometry,
      nodeGeometry,
    };

  }, []);

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

            float hash(vec3 p) {

              p =
                fract(
                  p *
                  0.3183099
                ) *
                17.0;

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

              vec3 color =
                mix(
                  uColor,
                  uHotColor,
                  stream * 0.45
                );

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
  // ✨ INNER FRESNEL
  // ==========================================================

  const fresnelMaterial =
    useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,

          blending:
            THREE.AdditiveBlending,

          side: THREE.BackSide,

          depthWrite: false,

          uniforms: {
            glowColor: {
              value:
                new THREE.Color(
                  "#ff3d0a",
                ),
            },

            innerColor: {
              value:
                new THREE.Color(
                  "#ff8b24",
                ),
            },

            intensity: {
              value: 0.30,
            },

            power: {
              value: 3.4,
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

            uniform vec3 glowColor;
            uniform vec3 innerColor;

            uniform float intensity;
            uniform float power;

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
                  power
                );

              float inner =
                pow(
                  1.0 -
                  facing,
                  2.2
                );

              vec3 color =
                mix(
                  innerColor,
                  glowColor,
                  rim
                );

              float alpha =
                (
                  rim * 0.75 +
                  inner * 0.15
                ) *
                intensity;

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

      if (plasmaRef.current) {

        plasmaRef.current
          .uniforms
          .uTime
          .value = t;
      }

      // ======================================================
      // ☀️ CORE
      // ======================================================

      if (coreRef.current) {

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
      // 🕸️ SOLAR NETWORK
      // ======================================================

      if (
        networkGroupRef.current
      ) {

        networkGroupRef.current
          .rotation
          .z =
          Math.sin(
            t * 0.18,
          ) *
          0.018;

        networkGroupRef.current
          .rotation
          .y =
          Math.sin(
            t * 0.12,
          ) *
          0.012;
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

      // ======================================================
      // 🕸️ NETWORK NODE PULSE
      // ======================================================

      if (
        nodeMaterialRef.current
      ) {

        nodeMaterialRef.current
          .opacity =
          0.55 +
          Math.sin(
            t * 2.2,
          ) *
          0.12;
      }

      // ======================================================
      // 🔗 NETWORK EDGE PULSE
      // ======================================================

      if (
        networkMaterialRef.current
      ) {

        networkMaterialRef.current
          .opacity =
          0.20 +
          Math.sin(
            t * 1.6,
          ) *
          0.04;
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

        // Register Sun
        // inside planetRefs
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
          🕸️ SMALL SOLAR NODE NETWORK
          ==================================================== */}

      <group
        ref={
          networkGroupRef
        }
      >

        {/* ==================================================
            🔗 ULTRA THIN EDGES
            ================================================== */}

        <lineSegments
          geometry={
            solarNetwork.edgeGeometry
          }
        >

          <lineBasicMaterial
            ref={
              networkMaterialRef
            }
            color="#ffd45a"
            transparent
            opacity={0.20}
            blending={
              THREE.AdditiveBlending
            }
            depthWrite={false}
            toneMapped={false}
          />

        </lineSegments>

        {/* ==================================================
            ✨ TINY NODES
            ================================================== */}

        {solarNetwork.nodes.map(
          (position, index) => (

            <mesh
              key={index}
              position={position}
              geometry={
                solarNetwork.nodeGeometry
              }
            >

              <meshBasicMaterial
                ref={
                  index === 0
                    ? nodeMaterialRef
                    : undefined
                }
                color="#fff1a3"
                transparent
                opacity={0.55}
                blending={
                  THREE.AdditiveBlending
                }
                depthWrite={false}
                toneMapped={false}
              />

            </mesh>

          ),
        )}

      </group>

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

      {/* ====================================================
          ✨ INNER FRESNEL
          ==================================================== */}

      <mesh>

        <sphereGeometry
          args={[
            5.72,
            64,
            64,
          ]}
        />

        <primitive
          ref={
            fresnelRef
          }
          object={
            fresnelMaterial
          }
          attach="material"
        />

      </mesh>

    </group>
  );
};