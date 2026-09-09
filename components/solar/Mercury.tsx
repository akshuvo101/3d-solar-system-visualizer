import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const Mercury = () => {
  const atmosphereRef =
    useRef<THREE.Mesh>(null);

  /*
   * ============================================================
   * ☿ MERCURY SURFACE SHADER
   * ============================================================
   *
   * IMPORTANT:
   * The surface is generated from 3D spherical coordinates
   * instead of UV coordinates.
   *
   * This prevents:
   * - vertical UV seams
   * - column-like patterns
   * - stretched crater lines
   * - visible texture repetition at the longitude seam
   */

  const mercuryMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: {
          value: new THREE.Vector3(0, 0, 0),
        },
      },

      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        void main() {

          /*
           * Use the sphere's local direction as the
           * procedural texture coordinate.
           *
           * Unlike UVs, this has no longitude seam.
           */
          vLocalDirection =
            normalize(position);

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
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        uniform vec3 uSunPosition;

        /*
         * ======================================================
         * HASH 3D
         * ======================================================
         *
         * Deterministic pseudo-random value.
         *
         * This replaces the old 2D UV hash and allows
         * completely spherical procedural detail.
         */

        float hash3(vec3 p) {

          p =
            fract(
              p * 0.3183099
              + vec3(
                0.1,
                0.2,
                0.3
              )
            );

          p *=
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

        /*
         * ======================================================
         * 3D VALUE NOISE
         * ======================================================
         */

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
              2.0 *
              f
            );

          float n000 =
            hash3(
              i +
              vec3(
                0.0,
                0.0,
                0.0
              )
            );

          float n100 =
            hash3(
              i +
              vec3(
                1.0,
                0.0,
                0.0
              )
            );

          float n010 =
            hash3(
              i +
              vec3(
                0.0,
                1.0,
                0.0
              )
            );

          float n110 =
            hash3(
              i +
              vec3(
                1.0,
                1.0,
                0.0
              )
            );

          float n001 =
            hash3(
              i +
              vec3(
                0.0,
                0.0,
                1.0
              )
            );

          float n101 =
            hash3(
              i +
              vec3(
                1.0,
                0.0,
                1.0
              )
            );

          float n011 =
            hash3(
              i +
              vec3(
                0.0,
                1.0,
                1.0
              )
            );

          float n111 =
            hash3(
              i +
              vec3(
                1.0,
                1.0,
                1.0
              )
            );

          float nx00 =
            mix(
              n000,
              n100,
              f.x
            );

          float nx10 =
            mix(
              n010,
              n110,
              f.x
            );

          float nx01 =
            mix(
              n001,
              n101,
              f.x
            );

          float nx11 =
            mix(
              n011,
              n111,
              f.x
            );

          float nxy0 =
            mix(
              nx00,
              nx10,
              f.y
            );

          float nxy1 =
            mix(
              nx01,
              nx11,
              f.y
            );

          return mix(
            nxy0,
            nxy1,
            f.z
          );
        }

        /*
         * ======================================================
         * SPHERICAL FBM
         * ======================================================
         */

        float fbm3(vec3 p) {

          float value =
            0.0;

          float amplitude =
            0.5;

          for(
            int i = 0;
            i < 5;
            i++
          ) {

            value +=
              noise3(p) *
              amplitude;

            p *=
              2.03;

            amplitude *=
              0.5;
          }

          return value;
        }

        /*
         * ======================================================
         * 3D CRATER FIELD
         * ======================================================
         *
         * Craters are generated directly in 3D space.
         *
         * This is the key fix for the column-wise UV artifact.
         */

        float craterField(
          vec3 direction,
          float scale,
          float randomness
        ) {

          vec3 p =
            direction *
            scale;

          vec3 cell =
            floor(p);

          vec3 local =
            fract(p);

          float closest =
            10.0;

          float secondClosest =
            10.0;

          float selectedRandom =
            0.5;

          /*
           * Search neighboring 3D cells.
           *
           * 27 samples gives stable crater placement.
           */

          for(
            int z = -1;
            z <= 1;
            z++
          ) {

            for(
              int y = -1;
              y <= 1;
              y++
            ) {

              for(
                int x = -1;
                x <= 1;
                x++
              ) {

                vec3 offset =
                  vec3(
                    float(x),
                    float(y),
                    float(z)
                  );

                vec3 id =
                  cell +
                  offset;

                vec3 randomPoint =
                  vec3(
                    hash3(id),
                    hash3(
                      id +
                      vec3(
                        17.13,
                        31.71,
                        47.27
                      )
                    ),
                    hash3(
                      id +
                      vec3(
                        61.41,
                        23.17,
                        83.91
                      )
                    )
                  );

                /*
                 * Keep crater centers reasonably
                 * distributed without making them
                 * perfectly regular.
                 */

                randomPoint =
                  mix(
                    randomPoint,
                    vec3(
                      0.5
                    ),
                    randomness
                  );

                vec3 difference =
                  offset +
                  randomPoint -
                  local;

                float distanceValue =
                  length(
                    difference
                  );

                if(
                  distanceValue <
                  closest
                ) {

                  secondClosest =
                    closest;

                  closest =
                    distanceValue;

                  selectedRandom =
                    hash3(
                      id +
                      vec3(
                        7.31,
                        29.47,
                        53.19
                      )
                    );

                } else if(
                  distanceValue <
                  secondClosest
                ) {

                  secondClosest =
                    distanceValue;
                }
              }
            }
          }

          /*
           * Different crater sizes.
           */

          float radius =
            mix(
              0.075,
              0.19,
              selectedRandom
            );

          /*
           * Crater rim.
           */

          float rim =
            smoothstep(
              radius + 0.045,
              radius,
              closest
            );

          rim *=
            1.0 -
            smoothstep(
              radius,
              radius - 0.018,
              closest
            );

          /*
           * Interior depression.
           */

          float interior =
            1.0 -
            smoothstep(
              radius * 0.20,
              radius * 0.78,
              closest
            );

          /*
           * Central floor.

           * This gives the crater a more physical
           * bowl-like appearance.
           */

          float floorMask =
            1.0 -
            smoothstep(
              0.0,
              radius * 0.40,
              closest
            );

          /*
           * Break perfect circularity.
           */

          float distortion =
            noise3(
              direction *
              scale *
              2.1
            );

          interior *=
            mix(
              0.82,
              1.12,
              distortion
            );

          /*
           * Slightly vary crater strength.
           */

          float craterStrength =
            mix(
              0.72,
              1.15,
              selectedRandom
            );

          return (
            rim *
            0.90 +
            interior *
            0.62 +
            floorMask *
            0.20
          ) *
          craterStrength;
        }

        /*
         * ======================================================
         * MAIN
         * ======================================================
         */

        void main() {

          /*
           * Normalized spherical coordinate.
           *
           * No UVs are used anywhere below.
           */

          vec3 direction =
            normalize(
              vLocalDirection
            );

          /*
           * ==================================================
           * ☿ MERCURY COLOR PALETTE
           * ==================================================
           */

          vec3 deepRock =
            vec3(
              0.035,
              0.034,
              0.032
            );

          vec3 darkRock =
            vec3(
              0.075,
              0.073,
              0.069
            );

          vec3 midRock =
            vec3(
              0.165,
              0.158,
              0.148
            );

          vec3 lightRock =
            vec3(
              0.255,
              0.242,
              0.222
            );

          vec3 brightRock =
            vec3(
              0.355,
              0.337,
              0.307
            );

          /*
           * ==================================================
           * 🪨 LARGE GEOLOGICAL STRUCTURE
           * ==================================================
           */

          float broadTerrain =
            fbm3(
              direction *
              2.15
            );

          float terrain =
            fbm3(
              direction *
              4.8 +
              vec3(
                1.7,
                -2.3,
                4.1
              )
            );

          float combinedTerrain =
            broadTerrain *
            0.48 +
            terrain *
            0.52;

          vec3 surface =
            mix(
              deepRock,
              midRock,
              smoothstep(
                0.20,
                0.62,
                combinedTerrain
              )
            );

          surface =
            mix(
              surface,
              lightRock,
              smoothstep(
                0.58,
                0.82,
                combinedTerrain
              ) *
              0.72
            );

          /*
           * ==================================================
           * 🏔️ HIGHLANDS
           * ==================================================
           */

          float highlands =
            fbm3(
              direction *
              9.0 +
              vec3(
                -4.2,
                3.7,
                2.1
              )
            );

          float highlandMask =
            smoothstep(
              0.58,
              0.82,
              highlands
            );

          surface =
            mix(
              surface,
              brightRock,
              highlandMask *
              0.26
            );

          /*
           * ==================================================
           * 🕳️ LARGE CRATER BASINS
           * ==================================================
           */

          float largeCraters =
            craterField(
              direction,
              7.0,
              0.16
            );

          float largeCratersSecondary =
            craterField(
              direction +
              vec3(
                0.17,
                -0.11,
                0.08
              ),
              11.0,
              0.22
            );

          float basin =
            largeCraters *
            0.72 +
            largeCratersSecondary *
            0.28;

          float basinMask =
            smoothstep(
              0.34,
              0.86,
              basin
            );

          surface =
            mix(
              surface,
              darkRock,
              basinMask *
              0.40
            );

          /*
           * ==================================================
           * 🕳️ MEDIUM CRATER FIELD
           * ==================================================
           */

          float mediumCraters =
            craterField(
              direction,
              20.0,
              0.24
            );

          float mediumMask =
            smoothstep(
              0.30,
              0.82,
              mediumCraters
            );

          surface =
            mix(
              surface,
              darkRock,
              mediumMask *
              0.28
            );

          /*
           * ==================================================
           * ✨ CRATER RIM HIGHLIGHTS
           * ==================================================
           */

          float rimNoise =
            noise3(
              direction *
              34.0 +
              vec3(
                2.7,
                -1.4,
                5.1
              )
            );

          float rimHighlight =
            mediumCraters *
            smoothstep(
              0.46,
              0.78,
              rimNoise
            );

          surface +=
            vec3(
              0.055,
              0.050,
              0.044
            ) *
            rimHighlight *
            0.30;

          /*
           * ==================================================
           * 🕳️ SMALL CRATERS
           * ==================================================
           */

          float smallCraters =
            craterField(
              direction,
              46.0,
              0.32
            );

          float smallerCraters =
            craterField(
              direction +
              vec3(
                -0.09,
                0.13,
                -0.07
              ),
              72.0,
              0.38
            );

          float fineCraters =
            smallCraters *
            0.64 +
            smallerCraters *
            0.36;

          float fineMask =
            smoothstep(
              0.30,
              0.78,
              fineCraters
            );

          surface =
            mix(
              surface,
              darkRock,
              fineMask *
              0.15
            );

          /*
           * ==================================================
           * 🪨 FINE REGOLITH
           * ==================================================
           */

          float regolith =
            fbm3(
              direction *
              95.0 +
              vec3(
                8.1,
                -4.2,
                3.6
              )
            );

          surface +=
            (
              regolith -
              0.5
            ) *
            0.020;

          /*
           * Fine granular surface detail.
           */

          float grain =
            noise3(
              direction *
              175.0
            );

          surface +=
            (
              grain -
              0.5
            ) *
            0.008;

          /*
           * ==================================================
           * 🌑 SUBTLE DARK GEOLOGICAL REGIONS
           * ==================================================
           */

          float darkRegion =
            fbm3(
              direction *
              2.8 +
              vec3(
                -5.0,
                7.2,
                1.8
              )
            );

          float darkMask =
            smoothstep(
              0.30,
              0.48,
              darkRegion
            );

          surface =
            mix(
              surface,
              darkRock,
              darkMask *
              0.11
            );

          /*
           * ==================================================
           * ☀️ SUN LIGHTING
           * ==================================================
           */

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 mercuryToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              mercuryToSun
            );

          /*
           * Soft terminator.
           */

          float daylight =
            smoothstep(
              -0.08,
              0.24,
              NdotL
            );

          float directLight =
            max(
              NdotL,
              0.0
            );

          directLight =
            pow(
              directLight,
              0.72
            );

          /*
           * ==================================================
           * 🌞 DAY SIDE
           * ==================================================
           */

          float dayIntensity =
            0.095 +
            directLight *
            1.20;

          surface *=
            dayIntensity;

          /*
           * ==================================================
           * 🌅 SUNLIGHT WARMTH
           * ==================================================
           */

          vec3 sunlightTint =
            vec3(
              1.0,
              0.935,
              0.84
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.13
            );

          /*
           * ==================================================
           * 🌅 TERMINATOR
           * ==================================================
           */

          float twilight =
            smoothstep(
              -0.20,
              0.08,
              NdotL
            ) *
            (
              1.0 -
              smoothstep(
                0.02,
                0.25,
                NdotL
              )
            );

          vec3 warmTwilight =
            vec3(
              0.13,
              0.055,
              0.018
            );

          surface +=
            warmTwilight *
            twilight *
            0.045;

          /*
           * ==================================================
           * 🌑 NIGHT SIDE
           * ==================================================
           */

          float night =
            1.0 -
            daylight;

          surface *=
            0.17 +
            daylight *
            0.83;

          /*
           * Extremely subtle reflected ambient light.
           */

          surface +=
            vec3(
              0.0038,
              0.0035,
              0.0032
            ) *
            night;

          /*
           * ==================================================
           * 🌌 LIMB DEPTH
           * ==================================================
           */

          float viewFacing =
            max(
              dot(
                normal,
                normalize(
                  cameraPosition -
                  vWorldPosition
                )
              ),
              0.0
            );

          float limb =
            pow(
              1.0 -
              viewFacing,
              3.8
            );

          surface +=
            vec3(
              0.018,
              0.016,
              0.013
            ) *
            limb *
            daylight;

          /*
           * ==================================================
           * FINAL CONTRAST
           * ==================================================
           */

          surface =
            max(
              surface,
              vec3(
                0.0012
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

  /*
   * ============================================================
   * 🌫️ MERCURY EXOSPHERE
   * ============================================================
   *
   * Mercury has an extremely thin exosphere rather than a
   * conventional atmosphere.
   *
   * The visual effect is therefore intentionally very subtle.
   */

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      side: THREE.BackSide,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,

      uniforms: {
        glowColor: {
          value:
            new THREE.Color(
              "#c9c2b5"
            ),
        },

        intensity: {
          value: 0.032,
        },

        power: {
          value: 5.8,
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
        uniform float intensity;
        uniform float power;

        void main() {

          float viewDot =
            max(
              dot(
                normalize(vNormal),
                normalize(vViewDir)
              ),
              0.0
            );

          float fresnel =
            pow(
              1.0 -
              viewDot,
              power
            );

          float alpha =
            fresnel *
            intensity;

          gl_FragColor =
            vec4(
              glowColor,
              alpha
            );
        }
      `,
    });
  }, []);

  /*
   * ============================================================
   * 🌫️ EXOSPHERE ANIMATION
   * ============================================================
   *
   * Planet rotation is controlled centrally by Planet.tsx.
   * Only the extremely subtle exosphere breathing effect is
   * animated here.
   */

  useFrame(({ clock }) => {
    const time =
      clock.getElapsedTime();

    if (atmosphereRef.current) {
      const pulse =
        1 +
        Math.sin(
          time *
          0.8
        ) *
        0.0012;

      atmosphereRef.current.scale.setScalar(
        pulse,
      );
    }
  });

  /*
   * ============================================================
   * 🎨 RENDER
   * ============================================================
   */

  return (
    <group>

      {/* ☿ Mercury Surface */}

      <Sphere
        args={[
          1,
          96,
          96,
        ]}
        castShadow
        receiveShadow
      >
        <primitive
          object={
            mercuryMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* 🌫️ Extremely Thin Exosphere */}

      <Sphere
        ref={
          atmosphereRef
        }
        args={[
          1.018,
          64,
          64,
        ]}
      >
        <primitive
          object={
            atmosphereMaterial
          }
          attach="material"
        />
      </Sphere>

    </group>
  );
};