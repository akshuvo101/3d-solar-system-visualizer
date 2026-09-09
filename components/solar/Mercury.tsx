import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type MercuryProps = {
  rotationSpeed?: number;
};

export const Mercury = ({
  rotationSpeed = 0.045,
}: MercuryProps) => {
  const mercuryRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  /*
   * ============================================================
   * ☿ MERCURY SURFACE SHADER
   * ============================================================
   */

  const mercuryMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },

        uSunPosition: {
          value: new THREE.Vector3(0, 0, 0),
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

        /*
         * ======================================================
         * HASH
         * ======================================================
         */

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

        /*
         * ======================================================
         * HASH 3D
         * ======================================================
         */

        float hash3(vec3 p) {

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

        /*
         * ======================================================
         * VALUE NOISE
         * ======================================================
         */

        float noise(vec2 p) {

          vec2 i =
            floor(p);

          vec2 f =
            fract(p);

          float a =
            hash(i);

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
              2.0 *
              f
            );

          return mix(
            a,
            b,
            u.x
          )
          +
          (
            c -
            a
          ) *
          u.y *
          (
            1.0 -
            u.x
          )
          +
          (
            d -
            b
          ) *
          u.x *
          u.y;
        }

        /*
         * ======================================================
         * FBM
         * ======================================================
         */

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

        /*
         * ======================================================
         * CELL / VORONOI-LIKE STRUCTURE
         * ======================================================
         */

        float craterCells(vec2 p) {

          vec2 cell =
            floor(p);

          vec2 local =
            fract(p);

          float nearest =
            10.0;

          for(int y = -1; y <= 1; y++) {

            for(int x = -1; x <= 1; x++) {

              vec2 offset =
                vec2(
                  float(x),
                  float(y)
                );

              vec2 randomPoint =
                vec2(
                  hash(
                    cell +
                    offset
                  ),
                  hash(
                    cell +
                    offset +
                    vec2(
                      17.3,
                      41.7
                    )
                  )
                );

              vec2 difference =
                offset +
                randomPoint -
                local;

              float distanceValue =
                dot(
                  difference,
                  difference
                );

              nearest =
                min(
                  nearest,
                  distanceValue
                );
            }
          }

          return sqrt(nearest);
        }

        /*
         * ======================================================
         * PROCEDURAL CRATER
         * ======================================================
         */

        float crater(
          vec2 uv,
          float scale,
          float variation
        ) {

          vec2 p =
            uv *
            scale;

          vec2 cell =
            floor(p);

          vec2 local =
            fract(p);

          float closest =
            10.0;

          float secondClosest =
            10.0;

          float selectedRandom =
            0.0;

          for(int y = -1; y <= 1; y++) {

            for(int x = -1; x <= 1; x++) {

              vec2 offset =
                vec2(
                  float(x),
                  float(y)
                );

              vec2 id =
                cell +
                offset;

              vec2 point =
                vec2(
                  hash(id),
                  hash(
                    id +
                    vec2(
                      13.7,
                      91.2
                    )
                  )
                );

              /*
               * Keep crater centers slightly irregular.
               */

              point =
                mix(
                  point,
                  vec2(
                    0.5
                  ),
                  variation
                );

              vec2 diff =
                offset +
                point -
                local;

              float d =
                length(diff);

              if(d < closest) {

                secondClosest =
                  closest;

                closest =
                  d;

                selectedRandom =
                  hash(
                    id +
                    vec2(
                      73.1,
                      29.4
                    )
                  );

              } else if(
                d <
                secondClosest
              ) {

                secondClosest =
                  d;
              }
            }
          }

          /*
           * Different crater sizes.
           */

          float radius =
            mix(
              0.10,
              0.25,
              selectedRandom
            );

          /*
           * Crater rim.
           */

          float rim =
            smoothstep(
              radius + 0.055,
              radius,
              closest
            );

          rim *=
            1.0 -
            smoothstep(
              radius,
              radius - 0.025,
              closest
            );

          /*
           * Interior depression.
           */

          float interior =
            1.0 -
            smoothstep(
              radius * 0.28,
              radius * 0.82,
              closest
            );

          /*
           * Central floor.
           */

          float floorMask =
            1.0 -
            smoothstep(
              0.0,
              radius * 0.38,
              closest
            );

          /*
           * Slightly break circular perfection.
           */

          float irregular =
            noise(
              (
                cell +
                vec2(
                  selectedRandom
                )
              ) *
              2.7
            );

          interior *=
            mix(
              0.82,
              1.15,
              irregular
            );

          return
            rim * 0.95 +
            interior * 0.68 +
            floorMask * 0.22;
        }

        /*
         * ======================================================
         * LARGE CRATER BASINS
         * ======================================================
         */

        float largeBasins(vec2 uv) {

          vec2 p =
            uv *
            5.0;

          float n =
            crater(
              p,
              1.0,
              0.12
            );

          float n2 =
            crater(
              uv +
              vec2(
                4.3,
                8.1
              ),
              2.8,
              0.28
            );

          return
            n * 0.75 +
            n2 * 0.35;
        }

        /*
         * ======================================================
         * SMALL CRATER FIELD
         * ======================================================
         */

        float smallCraters(vec2 uv) {

          float c1 =
            crater(
              uv,
              38.0,
              0.25
            );

          float c2 =
            crater(
              uv +
              vec2(
                7.2,
                3.4
              ),
              65.0,
              0.42
            );

          float c3 =
            crater(
              uv +
              vec2(
                12.1,
                -8.3
              ),
              105.0,
              0.55
            );

          return
            c1 * 0.55 +
            c2 * 0.32 +
            c3 * 0.18;
        }

        /*
         * ======================================================
         * MAIN
         * ======================================================
         */

        void main() {

          vec2 uv =
            vUv;

          /*
           * ==================================================
           * ☿ MERCURY COLOR PALETTE
           * ==================================================
           */

          vec3 deepRock =
            vec3(
              0.040,
              0.038,
              0.036
            );

          vec3 darkRock =
            vec3(
              0.085,
              0.082,
              0.078
            );

          vec3 midRock =
            vec3(
              0.175,
              0.168,
              0.155
            );

          vec3 lightRock =
            vec3(
              0.285,
              0.270,
              0.245
            );

          vec3 brightRock =
            vec3(
              0.390,
              0.370,
              0.335
            );

          /*
           * ==================================================
           * 🪨 LARGE GEOLOGICAL VARIATION
           * ==================================================
           */

          float terrain =
            fbm(
              uv *
              3.0 +
              vec2(
                2.4,
                5.7
              )
            );

          float broadTerrain =
            fbm(
              uv *
              1.45 +
              vec2(
                7.1,
                -3.8
              )
            );

          float combinedTerrain =
            terrain *
            0.72 +
            broadTerrain *
            0.28;

          vec3 surface =
            mix(
              deepRock,
              midRock,
              smoothstep(
                0.18,
                0.62,
                combinedTerrain
              )
            );

          surface =
            mix(
              surface,
              lightRock,
              smoothstep(
                0.60,
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
            fbm(
              uv *
              7.5 +
              vec2(
                -4.2,
                3.7
              )
            );

          float highlandMask =
            smoothstep(
              0.61,
              0.84,
              highlands
            );

          surface =
            mix(
              surface,
              brightRock,
              highlandMask *
              0.30
            );

          /*
           * ==================================================
           * 🕳️ LARGE CRATER BASINS
           * ==================================================
           */

          float basin =
            largeBasins(
              uv
            );

          float basinDark =
            smoothstep(
              0.38,
              0.78,
              basin
            );

          surface =
            mix(
              surface,
              darkRock,
              basinDark *
              0.42
            );

          /*
           * ==================================================
           * 🕳️ MEDIUM CRATERS
           * ==================================================
           */

          float mediumCrater =
            crater(
              uv +
              vec2(
                1.7,
                8.4
              ),
              20.0,
              0.30
            );

          float mediumMask =
            smoothstep(
              0.30,
              0.92,
              mediumCrater
            );

          surface =
            mix(
              surface,
              darkRock,
              mediumMask *
              0.30
            );

          /*
           * ==================================================
           * 🪨 CRATER RIM HIGHLIGHT
           * ==================================================
           */

          float rimNoise =
            noise(
              uv *
              35.0
            );

          float rimHighlight =
            mediumCrater *
            smoothstep(
              0.40,
              0.82,
              rimNoise
            );

          surface +=
            vec3(
              0.075,
              0.068,
              0.058
            ) *
            rimHighlight *
            0.34;

          /*
           * ==================================================
           * 🪨 SMALL CRATERS
           * ==================================================
           */

          float fineCraters =
            smallCraters(
              uv
            );

          float fineMask =
            smoothstep(
              0.35,
              0.82,
              fineCraters
            );

          surface =
            mix(
              surface,
              darkRock,
              fineMask *
              0.17
            );

          /*
           * ==================================================
           * 🪨 FINE REGOLITH
           * ==================================================
           */

          float regolith =
            fbm(
              uv *
              120.0 +
              vec2(
                8.1,
                -4.2
              )
            );

          surface +=
            (
              regolith -
              0.5
            ) *
            0.022;

          /*
           * Very fine granular variation.
           */

          float grain =
            noise(
              uv *
              220.0
            );

          surface +=
            (
              grain -
              0.5
            ) *
            0.009;

          /*
           * ==================================================
           * 🌑 SUBTLE DARK REGIONS
           * ==================================================
           */

          float darkRegion =
            fbm(
              uv *
              2.1 +
              vec2(
                -5.0,
                7.2
              )
            );

          float darkMask =
            smoothstep(
              0.28,
              0.46,
              darkRegion
            );

          surface =
            mix(
              surface,
              darkRock,
              darkMask *
              0.12
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
            )
            *
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
           * Very subtle space reflection.
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

          /*
           * Keep limb extremely subtle.
           */

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
          value: 0.035,
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
   * 🔄 ANIMATION
   * ============================================================
   */

  useFrame(
    ({ clock }, delta) => {

      const time =
        clock.getElapsedTime();

      /*
       * Mercury rotation.
       */

      if (mercuryRef.current) {

        mercuryRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      /*
       * Extremely subtle exosphere pulse.
       */

      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time *
            0.8
          ) *
          0.0012;

        atmosphereRef.current.scale.setScalar(
          pulse
        );
      }

      mercuryMaterial.uniforms.uTime.value =
        time;
    }
  );

  /*
   * ============================================================
   * 🎨 RENDER
   * ============================================================
   */

  return (
    <group>

      {/* ☿ Mercury Surface */}

      <Sphere
        ref={mercuryRef}
        args={[1, 96, 96]}
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