import { Ring, Sphere } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * ============================================================
 * 🔵 NEPTUNE
 * ============================================================
 *
 * Visual model:
 * - Spherical 3D procedural atmospheric noise
 * - No UV-based surface noise
 * - No internal axial rotation
 * - No artificial atmosphere pulse
 * - Planet.tsx remains the single source of truth for rotation
 *
 * This avoids UV seam / column-like artifacts while keeping
 * Neptune's characteristic deep blue atmospheric appearance.
 */

export const Neptune = () => {
  /* ============================================================
     🔵 NEPTUNE ATMOSPHERIC MATERIAL
     ============================================================ */

  const neptuneMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: {
          value: new THREE.Vector3(0, 0, 0),
        },
      },

      vertexShader: `
        varying vec3 vLocalDirection;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {

          vLocalDirection =
            normalize(position);

          vec4 worldPosition =
            modelMatrix *
            vec4(position, 1.0);

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
        varying vec3 vLocalDirection;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        uniform vec3 uSunPosition;

        /* ======================================================
           HASH
           ====================================================== */

        float hash31(vec3 p) {

          p = fract(
            p * 0.1031
          );

          p +=
            dot(
              p,
              p.yzx + 33.33
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        /* ======================================================
           3D VALUE NOISE
           ====================================================== */

        float noise3(vec3 p) {

          vec3 i =
            floor(p);

          vec3 f =
            fract(p);

          f =
            f * f *
            (3.0 - 2.0 * f);

          float n000 =
            hash31(
              i +
              vec3(
                0.0,
                0.0,
                0.0
              )
            );

          float n100 =
            hash31(
              i +
              vec3(
                1.0,
                0.0,
                0.0
              )
            );

          float n010 =
            hash31(
              i +
              vec3(
                0.0,
                1.0,
                0.0
              )
            );

          float n110 =
            hash31(
              i +
              vec3(
                1.0,
                1.0,
                0.0
              )
            );

          float n001 =
            hash31(
              i +
              vec3(
                0.0,
                0.0,
                1.0
              )
            );

          float n101 =
            hash31(
              i +
              vec3(
                1.0,
                0.0,
                1.0
              )
            );

          float n011 =
            hash31(
              i +
              vec3(
                0.0,
                1.0,
                1.0
              )
            );

          float n111 =
            hash31(
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

        /* ======================================================
           FBM
           ====================================================== */

        float fbm3(
          vec3 p,
          int octaves
        ) {

          float value = 0.0;

          float amplitude =
            0.5;

          float normalization =
            0.0;

          for (
            int i = 0;
            i < 6;
            i++
          ) {

            if (i >= octaves) {
              break;
            }

            value +=
              noise3(p) *
              amplitude;

            normalization +=
              amplitude;

            p *=
              2.02;

            amplitude *=
              0.5;
          }

          return value /
            max(
              normalization,
              0.0001
            );
        }

        /* ======================================================
           RIDGED ATMOSPHERIC STRUCTURE
           ====================================================== */

        float ridgedNoise(
          vec3 p
        ) {

          float n =
            fbm3(
              p,
              4
            );

          return
            1.0 -
            abs(
              n * 2.0 -
              1.0
            );
        }

        /* ======================================================
           LARGE SCALE ATMOSPHERE
           ====================================================== */

        float largeAtmosphere(
          vec3 direction
        ) {

          vec3 p =
            direction *
            2.8;

          p +=
            vec3(
              1.7,
              -2.4,
              3.1
            );

          return fbm3(
            p,
            5
          );
        }

        /* ======================================================
           MEDIUM ATMOSPHERIC TURBULENCE
           ====================================================== */

        float mediumAtmosphere(
          vec3 direction
        ) {

          vec3 p =
            direction *
            7.5;

          p +=
            vec3(
              -2.1,
              4.8,
              1.6
            );

          return fbm3(
            p,
            4
          );
        }

        /* ======================================================
           FINE CLOUD STRUCTURE
           ====================================================== */

        float fineClouds(
          vec3 direction
        ) {

          vec3 p =
            direction *
            18.0;

          p +=
            vec3(
              5.2,
              -3.7,
              2.4
            );

          return fbm3(
            p,
            3
          );
        }

        /* ======================================================
           HORIZONTAL ATMOSPHERIC BANDS
           ====================================================== */

        float bandPattern(
          vec3 direction
        ) {

          float latitude =
            direction.y;

          float broadBands =
            sin(
              latitude *
              30.0
            ) *
            0.5 +
            0.5;

          float secondaryBands =
            sin(
              latitude *
              66.0 +
              0.7
            ) *
            0.5 +
            0.5;

          float bandNoise =
            fbm3(
              direction *
              9.0,
              3
            );

          return
            broadBands *
            0.58 +
            secondaryBands *
            0.18 +
            bandNoise *
            0.24;
        }

        /* ======================================================
           BAND TURBULENCE
           ====================================================== */

        float bandTurbulence(
          vec3 direction
        ) {

          vec3 p =
            direction *
            vec3(
              5.0,
              24.0,
              5.0
            );

          float base =
            noise3(p);

          float detail =
            noise3(
              p *
              1.9 +
              vec3(
                2.7,
                1.3,
                -1.8
              )
            );

          return
            base *
            0.62 +
            detail *
            0.38;
        }

        /* ======================================================
           POLAR STRUCTURE
           ====================================================== */

        float polarMask(
          vec3 direction
        ) {

          float latitude =
            abs(
              direction.y
            );

          return smoothstep(
            0.70,
            0.98,
            latitude
          );
        }

        /* ======================================================
           DARK STORM SYSTEMS
           ====================================================== */

        float stormField(
          vec3 direction
        ) {

          float large =
            fbm3(
              direction *
              3.7 +
              vec3(
                2.4,
                -1.7,
                4.2
              ),
              4
            );

          float medium =
            ridgedNoise(
              direction *
              9.0 +
              vec3(
                -3.1,
                2.6,
                1.8
              )
            );

          float storm =
            smoothstep(
              0.68,
              0.88,
              large
            );

          storm *=
            smoothstep(
              0.42,
              0.78,
              medium
            );

          return storm;
        }

        /* ======================================================
           HIGH-ALTITUDE BRIGHT CLOUDS
           ====================================================== */

        float highCloudField(
          vec3 direction
        ) {

          float large =
            fbm3(
              direction *
              8.0 +
              vec3(
                3.4,
                -2.8,
                1.1
              ),
              4
            );

          float fine =
            fbm3(
              direction *
              20.0 +
              vec3(
                -1.7,
                4.2,
                2.8
              ),
              3
            );

          float clouds =
            large *
            0.72 +
            fine *
            0.28;

          return smoothstep(
            0.64,
            0.84,
            clouds
          );
        }

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          /* ==================================================
             🔵 NEPTUNE PALETTE
             ================================================== */

          vec3 abyssBlue =
            vec3(
              0.003,
              0.012,
              0.050
            );

          vec3 deepBlue =
            vec3(
              0.006,
              0.030,
              0.125
            );

          vec3 oceanBlue =
            vec3(
              0.010,
              0.082,
              0.300
            );

          vec3 royalBlue =
            vec3(
              0.020,
              0.155,
              0.500
            );

          vec3 electricBlue =
            vec3(
              0.055,
              0.285,
              0.700
            );

          vec3 icyBlue =
            vec3(
              0.30,
              0.56,
              0.86
            );

          vec3 cloudBlue =
            vec3(
              0.18,
              0.40,
              0.72
            );

          /* ==================================================
             🌊 LARGE ATMOSPHERIC FLOW
             ================================================== */

          float largeFlow =
            largeAtmosphere(
              direction
            );

          /* ==================================================
             🌫️ MEDIUM TURBULENCE
             ================================================== */

          float mediumFlow =
            mediumAtmosphere(
              direction
            );

          /* ==================================================
             🌀 ATMOSPHERIC BANDS
             ================================================== */

          float bands =
            bandPattern(
              direction
            );

          float turbulence =
            bandTurbulence(
              direction
            );

          bands =
            mix(
              bands,
              turbulence,
              0.34
            );

          bands =
            smoothstep(
              0.16,
              0.86,
              bands
            );

          /* ==================================================
             🎨 BASE COLOR
             ================================================== */

          vec3 surface =
            mix(
              deepBlue,
              oceanBlue,
              bands
            );

          surface =
            mix(
              surface,
              royalBlue,
              smoothstep(
                0.30,
                0.76,
                largeFlow
              ) *
              0.62
            );

          surface =
            mix(
              surface,
              electricBlue,
              smoothstep(
                0.58,
                0.86,
                mediumFlow
              ) *
              0.30
            );

          /* ==================================================
             ☁️ HIGH ALTITUDE CLOUDS
             ================================================== */

          float highClouds =
            highCloudField(
              direction
            );

          surface =
            mix(
              surface,
              cloudBlue,
              highClouds *
              0.30
            );

          /* ==================================================
             💨 FINE CLOUD STRUCTURE
             ================================================== */

          float fine =
            fineClouds(
              direction
            );

          surface +=
            (
              fine -
              0.5
            ) *
            0.026;

          /* ==================================================
             🌪️ DARK STORM SYSTEMS
             ================================================== */

          float storm =
            stormField(
              direction
            );

          vec3 stormBlue =
            vec3(
              0.002,
              0.009,
              0.038
            );

          surface =
            mix(
              surface,
              stormBlue,
              storm *
              0.48
            );

          /* ==================================================
             🌀 STORM EDGE TURBULENCE
             ================================================== */

          float stormEdge =
            ridgedNoise(
              direction *
              15.0 +
              vec3(
                4.0,
                -2.0,
                3.0
              )
            );

          surface =
            mix(
              surface,
              vec3(
                0.08,
                0.25,
                0.60
              ),
              storm *
              smoothstep(
                0.48,
                0.78,
                stormEdge
              ) *
              0.16
            );

          /* ==================================================
             🧊 POLAR REGIONS
             ================================================== */

          float polar =
            polarMask(
              direction
            );

          surface =
            mix(
              surface,
              vec3(
                0.09,
                0.25,
                0.56
              ),
              polar *
              0.18
            );

          /* ==================================================
             🌊 EQUATORIAL HAZE
             ================================================== */

          float equatorial =
            1.0 -
            smoothstep(
              0.05,
              0.34,
              abs(
                direction.y
              )
            );

          surface =
            mix(
              surface,
              vec3(
                0.018,
                0.12,
                0.38
              ),
              equatorial *
              0.12
            );

          /* ==================================================
             ✨ SUBTLE METHANE-ICE STREAKS
             ================================================== */

          float streakNoise =
            fbm3(
              direction *
              28.0 +
              vec3(
                -2.4,
                3.8,
                1.7
              ),
              3
            );

          float streaks =
            smoothstep(
              0.68,
              0.88,
              streakNoise
            );

          surface =
            mix(
              surface,
              icyBlue,
              streaks *
              0.13
            );

          /* ==================================================
             ☀️ SUN LIGHTING
             ================================================== */

          vec3 neptuneToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          vec3 normal =
            normalize(
              vWorldNormal
            );

          float NdotL =
            dot(
              normal,
              neptuneToSun
            );

          float diffuse =
            max(
              NdotL,
              0.0
            );

          /* ==================================================
             🌅 SOFT DAYLIGHT
             ================================================== */

          float day =
            smoothstep(
              0.012,
              0.44,
              diffuse
            );

          /* ==================================================
             🌅 TWILIGHT
             ================================================== */

          float twilight =
            smoothstep(
              0.0,
              0.20,
              diffuse
            ) *
            (
              1.0 -
              smoothstep(
                0.20,
                0.46,
                diffuse
              )
            );

          surface +=
            vec3(
              0.014,
              0.045,
              0.13
            ) *
            twilight;

          /* ==================================================
             ☀️ SUN-FACING HIGHLIGHT
             ================================================== */

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.05,
                1.07,
                1.12
              ),
              day *
              0.20
            );

          /* ==================================================
             🌗 DAY / NIGHT BALANCE
             ================================================== */

          surface *=
            0.30 +
            day *
            0.70;

          /* ==================================================
             🌑 NIGHT SIDE
             ================================================== */

          float night =
            1.0 -
            day;

          surface *=
            1.0 -
            night *
            0.16;

          surface +=
            vec3(
              0.0015,
              0.005,
              0.020
            ) *
            night;

          /* ==================================================
             🌌 LIMB LIGHT
             ================================================== */

          float viewDistance =
            length(
              cameraPosition -
              vWorldPosition
            );

          vec3 viewDirection =
            normalize(
              cameraPosition -
              vWorldPosition
            );

          float rim =
            pow(
              1.0 -
              max(
                dot(
                  normal,
                  viewDirection
                ),
                0.0
              ),
              4.2
            );

          surface +=
            vec3(
              0.018,
              0.055,
              0.15
            ) *
            rim *
            0.32;

          /* ==================================================
             ✨ FINAL CONTRAST
             ================================================== */

          surface =
            max(
              surface,
              vec3(
                0.002,
                0.006,
                0.024
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

  /* ============================================================
     ✨ NEPTUNE ATMOSPHERE
     ============================================================ */

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
              "#3d8cff"
            ),
        },

        intensity: {
          value: 0.16,
        },

        power: {
          value: 4.8,
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

          float fresnel =
            pow(
              1.0 -
              max(
                dot(
                  vNormal,
                  vViewDir
                ),
                0.0
              ),
              power
            );

          gl_FragColor =
            vec4(
              glowColor,
              fresnel *
              intensity
            );
        }
      `,
    });
  }, []);

  /* ============================================================
     💍 NEPTUNE RING MATERIAL
     ============================================================ */

  const ringMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      side:
        THREE.DoubleSide,

      depthWrite: false,

      vertexShader: `
        varying vec2 vUv;

        void main() {

          vUv =
            uv;

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

        float noise(vec2 p) {

          vec2 i =
            floor(p);

          vec2 f =
            fract(p);

          f =
            f * f *
            (3.0 - 2.0 * f);

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

          return mix(
            mix(
              a,
              b,
              f.x
            ),
            mix(
              c,
              d,
              f.x
            ),
            f.y
          );
        }

        void main() {

          vec2 uv =
            vUv;

          float radial =
            length(
              uv -
              vec2(
                0.5
              )
            );

          /* ==================================================
             RING DIVISIONS
             ================================================== */

          float finePattern =
            sin(
              radial *
              430.0
            ) *
            0.5 +
            0.5;

          float mediumPattern =
            sin(
              radial *
              165.0 +
              0.8
            ) *
            0.5 +
            0.5;

          float irregular =
            noise(
              vec2(
                radial *
                150.0,
                uv.y *
                12.0
              )
            );

          float brightness =
            finePattern *
            0.22 +
            mediumPattern *
            0.28 +
            irregular *
            0.50;

          /* ==================================================
             💙 COOL DARK NEPTUNE RINGS
             ================================================== */

          vec3 darkRing =
            vec3(
              0.025,
              0.050,
              0.090
            );

          vec3 midRing =
            vec3(
              0.085,
              0.14,
              0.23
            );

          vec3 brightRing =
            vec3(
              0.18,
              0.28,
              0.42
            );

          vec3 ringColor =
            mix(
              darkRing,
              midRing,
              brightness
            );

          ringColor =
            mix(
              ringColor,
              brightRing,
              smoothstep(
                0.68,
                0.92,
                brightness
              ) *
              0.30
            );

          /* ==================================================
             🌑 SUBTLE INNER DIVISION
             ================================================== */

          float division =
            smoothstep(
              0.47,
              0.49,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.49,
                0.52,
                radial
              )
            );

          ringColor *=
            1.0 -
            division *
            0.72;

          /* ==================================================
             ALPHA
             ================================================== */

          float innerFade =
            smoothstep(
              0.015,
              0.055,
              radial
            );

          float outerFade =
            smoothstep(
              0.78,
              0.50,
              radial
            );

          float alpha =
            innerFade *
            outerFade;

          gl_FragColor =
            vec4(
              ringColor,
              alpha *
              0.20
            );
        }
      `,
    });
  }, []);

  /* ============================================================
     🎨 RENDER
     ============================================================ */

  return (
    <group>

      {/* ======================================================
          🔵 NEPTUNE BODY
          ====================================================== */}

      <Sphere
        args={[
          1,
          72,
          72,
        ]}
        castShadow
        receiveShadow
      >
        <primitive
          object={
            neptuneMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          ✨ ATMOSPHERIC OUTER GLOW
          ====================================================== */}

      <Sphere
        args={[
          1.028,
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

      {/* ======================================================
          💍 NEPTUNE RINGS
          ====================================================== */}

      <group>

        {/* Main faint ring */}

        <Ring
          args={[
            1.28,
            1.39,
            160,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <primitive
            object={
              ringMaterial
            }
            attach="material"
          />
        </Ring>

        {/* Outer faint ring */}

        <Ring
          args={[
            1.46,
            1.51,
            160,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#4d6f9d"
            transparent
            opacity={0.11}
            side={
              THREE.DoubleSide
            }
            depthWrite={false}
          />
        </Ring>

        {/* Extremely faint dust ring */}

        <Ring
          args={[
            1.55,
            1.58,
            160,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#385576"
            transparent
            opacity={0.055}
            side={
              THREE.DoubleSide
            }
            depthWrite={false}
          />
        </Ring>

      </group>
    </group>
  );
};