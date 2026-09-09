import { Ring, Sphere } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

// ============================================================
// SATURN
// ============================================================
// Visual-only component.
// Planet rotation is controlled centrally by Planet.tsx using
// the astronomy rotation model.
//
// This version uses spherical 3D procedural noise instead of
// UV-based noise to avoid longitude seams / column artifacts.
// ============================================================

export const Saturn = () => {
  // ============================================================
  // SATURN BODY MATERIAL
  // ============================================================

  const saturnMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: {
          value: new THREE.Vector3(0, 0, 0),
        },
      },

      vertexShader: `
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

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
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        uniform vec3 uSunPosition;

        // ======================================================
        // CONSTANTS
        // ======================================================

        const float PI = 3.14159265359;

        // ======================================================
        // 3D HASH
        // ======================================================

        float hash31(vec3 p) {

          p = fract(
            p * 0.3183099 +
            vec3(0.11, 0.17, 0.13)
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
            hash31(i);

          float n100 =
            hash31(
              i +
              vec3(1.0, 0.0, 0.0)
            );

          float n010 =
            hash31(
              i +
              vec3(0.0, 1.0, 0.0)
            );

          float n110 =
            hash31(
              i +
              vec3(1.0, 1.0, 0.0)
            );

          float n001 =
            hash31(
              i +
              vec3(0.0, 0.0, 1.0)
            );

          float n101 =
            hash31(
              i +
              vec3(1.0, 0.0, 1.0)
            );

          float n011 =
            hash31(
              i +
              vec3(0.0, 1.0, 1.0)
            );

          float n111 =
            hash31(
              i +
              vec3(1.0, 1.0, 1.0)
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

        // ======================================================
        // 3D FBM
        // ======================================================

        float fbm3(vec3 p) {

          float value = 0.0;
          float amplitude = 0.5;

          for(int i = 0; i < 5; i++) {

            value +=
              noise3(p) *
              amplitude;

            p *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        // ======================================================
        // RIDGED CLOUD DETAIL
        // ======================================================

        float ridgedNoise(vec3 p) {

          float n =
            noise3(p);

          return 1.0 -
            abs(
              n * 2.0 -
              1.0
            );
        }

        // ======================================================
        // STRETCHED ATMOSPHERIC STRUCTURE
        // ======================================================

        float atmosphericStructure(
          vec3 direction
        ) {

          vec3 stretched =
            direction;

          // Stretch the field strongly along longitude.
          // This creates Saturn-like elongated cloud texture
          // without using UV coordinates.
          stretched.x *= 3.2;
          stretched.z *= 3.2;

          stretched.y *= 17.0;

          float large =
            fbm3(
              stretched *
              0.65
            );

          float medium =
            fbm3(
              stretched *
              1.45 +
              vec3(
                7.2,
                2.4,
                4.8
              )
            );

          float fine =
            ridgedNoise(
              stretched *
              3.8
            );

          return
            large * 0.50 +
            medium * 0.34 +
            fine * 0.16;
        }

        // ======================================================
        // HORIZONTAL BAND STRUCTURE
        // ======================================================

        float bandPattern(
          vec3 direction
        ) {

          float latitude =
            direction.y;

          float absLatitude =
            abs(
              latitude
            );

          // Multiple frequency bands.
          float broadBands =
            sin(
              latitude *
              18.0
            );

          float mediumBands =
            sin(
              latitude *
              38.0 +
              sin(
                latitude *
                8.0
              ) *
              1.5
            );

          float fineBands =
            sin(
              latitude *
              82.0 +
              sin(
                latitude *
                19.0
              ) *
              2.0
            );

          // Reduce band contrast toward the poles.
          float equatorialMask =
            1.0 -
            smoothstep(
              0.58,
              0.96,
              absLatitude
            );

          float bands =
            broadBands *
            0.48 +
            mediumBands *
            0.34 +
            fineBands *
            0.18;

          bands =
            bands *
            0.5 +
            0.5;

          return mix(
            bands,
            0.48,
            1.0 -
            equatorialMask
          );
        }

        // ======================================================
        // TURBULENT BAND DETAIL
        // ======================================================

        float bandTurbulence(
          vec3 direction
        ) {

          vec3 p =
            direction;

          p.xz *= 7.0;
          p.y *= 28.0;

          float n1 =
            fbm3(
              p *
              0.75
            );

          float n2 =
            noise3(
              p *
              2.2 +
              vec3(
                3.7,
                9.1,
                5.3
              )
            );

          return
            n1 *
            0.72 +
            n2 *
            0.28;
        }

        // ======================================================
        // POLAR STRUCTURE
        // ======================================================

        float polarStructure(
          vec3 direction
        ) {

          float polar =
            abs(
              direction.y
            );

          return smoothstep(
            0.68,
            0.98,
            polar
          );
        }

        // ======================================================
        // COLOR PALETTE
        // ======================================================

        vec3 deepGold =
          vec3(
            0.105,
            0.068,
            0.038
          );

        vec3 darkGold =
          vec3(
            0.245,
            0.172,
            0.095
          );

        vec3 warmGold =
          vec3(
            0.49,
            0.375,
            0.215
          );

        vec3 paleGold =
          vec3(
            0.70,
            0.59,
            0.405
          );

        vec3 cream =
          vec3(
            0.87,
            0.78,
            0.60
          );

        vec3 polarColor =
          vec3(
            0.30,
            0.245,
            0.17
          );

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          // ====================================================
          // ATMOSPHERIC STRUCTURE
          // ====================================================

          float structure =
            atmosphericStructure(
              direction
            );

          float bands =
            bandPattern(
              direction
            );

          float turbulence =
            bandTurbulence(
              direction
            );

          // ====================================================
          // BASE SATURN COLOR
          // ====================================================

          vec3 surface =
            mix(
              deepGold,
              darkGold,
              bands
            );

          // Broad cloud variations.
          surface =
            mix(
              surface,
              warmGold,
              smoothstep(
                0.34,
                0.64,
                structure
              ) *
              0.72
            );

          // Brighter cloud regions.
          surface =
            mix(
              surface,
              paleGold,
              smoothstep(
                0.52,
                0.78,
                structure
              ) *
              0.58
            );

          // Cream-colored atmospheric highlights.
          surface =
            mix(
              surface,
              cream,
              smoothstep(
                0.70,
                0.91,
                turbulence
              ) *
              0.28
            );

          // ====================================================
          // HORIZONTAL STREAKING
          // ====================================================

          float streakNoise =
            ridgedNoise(
              vec3(
                direction.x *
                12.0,

                direction.y *
                48.0,

                direction.z *
                12.0
              )
            );

          float elongatedFlow =
            fbm3(
              vec3(
                direction.x *
                4.0,

                direction.y *
                34.0,

                direction.z *
                4.0
              )
            );

          surface *=
            0.91 +
            streakNoise *
            0.12;

          surface =
            mix(
              surface,
              surface *
              1.045,
              smoothstep(
                0.58,
                0.84,
                elongatedFlow
              ) *
              0.28
            );

          // ====================================================
          // SUBTLE EQUATORIAL BRIGHTNESS
          // ====================================================

          float equatorial =
            1.0 -
            smoothstep(
              0.12,
              0.78,
              abs(
                direction.y
              )
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.045,
                1.025,
                0.985
              ),
              equatorial *
              0.16
            );

          // ====================================================
          // POLAR REGIONS
          // ====================================================

          float polar =
            polarStructure(
              direction
            );

          surface =
            mix(
              surface,
              polarColor,
              polar *
              0.34
            );

          // ====================================================
          // FINE SPHERICAL DETAIL
          // ====================================================

          float microDetail =
            noise3(
              direction *
              95.0
            );

          surface +=
            (
              microDetail -
              0.5
            ) *
            0.018;

          // ====================================================
          // SUN LIGHTING
          // ====================================================

          vec3 normal =
            normalize(
              vWorldNormal
            );

          vec3 saturnToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              saturnToSun
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

          // ====================================================
          // SOFT DAYLIGHT
          // ====================================================

          float daylight =
            smoothstep(
              -0.10,
              0.23,
              NdotL
            );

          float dayIntensity =
            0.075 +
            directLight *
            1.18;

          surface *=
            dayIntensity;

          // ====================================================
          // WARM SATURN SUNLIGHT
          // ====================================================

          vec3 sunlightTint =
            vec3(
              1.0,
              0.91,
              0.77
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.14
            );

          // ====================================================
          // TWILIGHT
          // ====================================================

          float twilight =
            smoothstep(
              -0.22,
              0.06,
              NdotL
            ) *
            (
              1.0 -
              smoothstep(
                0.04,
                0.32,
                NdotL
              )
            );

          vec3 twilightColor =
            vec3(
              0.16,
              0.045,
              0.016
            );

          surface +=
            twilightColor *
            twilight *
            0.045;

          // ====================================================
          // NIGHT SIDE
          // ====================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.15 +
            daylight *
            0.85;

          // Very subtle reflected ambient light.
          surface +=
            vec3(
              0.0032,
              0.0017,
              0.0008
            ) *
            night;

          // ====================================================
          // LIMB LIGHT
          // ====================================================

          vec3 viewDirection =
            normalize(
              cameraPosition -
              vWorldPosition
            );

          float viewDot =
            max(
              dot(
                normal,
                viewDirection
              ),
              0.0
            );

          float limb =
            pow(
              1.0 -
              viewDot,
              4.2
            );

          surface +=
            vec3(
              0.11,
              0.075,
              0.040
            ) *
            limb *
            0.055;

          // ====================================================
          // FINAL CONTRAST
          // ====================================================

          surface =
            pow(
              max(
                surface,
                vec3(
                  0.001
                )
              ),
              vec3(
                0.94
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
      lights: false,
    });
  }, []);

  // ============================================================
  // ATMOSPHERE MATERIAL
  // ============================================================

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
              "#dfc18b"
            ),
        },

        intensity: {
          value: 0.13,
        },

        power: {
          value: 4.5,
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
                normalize(
                  vNormal
                ),
                normalize(
                  vViewDir
                )
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

  // ============================================================
  // MAIN RING MATERIAL
  // ============================================================

  const innerRingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      side: THREE.DoubleSide,

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
        // 2D NOISE
        // ======================================================

        float noise(vec2 p) {

          vec2 i =
            floor(p);

          vec2 f =
            fract(p);

          f =
            f *
            f *
            (
              3.0 -
              2.0 *
              f
            );

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

        // ======================================================
        // RING
        // ======================================================

        void main() {

          vec2 centered =
            vUv -
            vec2(
              0.5
            );

          float radial =
            length(
              centered
            );

          // ====================================================
          // MULTI-SCALE RING DIVISIONS
          // ====================================================

          float fineBands =
            sin(
              radial *
              235.0
            ) *
            0.5 +
            0.5;

          float mediumBands =
            sin(
              radial *
              112.0 +
              sin(
                radial *
                19.0
              ) *
              2.4
            ) *
            0.5 +
            0.5;

          float broadBands =
            sin(
              radial *
              42.0
            ) *
            0.5 +
            0.5;

          // ====================================================
          // IRREGULAR RING DENSITY
          // ====================================================

          float densityNoise =
            noise(
              vec2(
                radial *
                110.0,

                vUv.y *
                18.0
              )
            );

          float fineNoise =
            noise(
              vec2(
                radial *
                210.0,

                vUv.y *
                34.0
              )
            );

          float brightness =
            fineBands *
            0.27 +

            mediumBands *
            0.24 +

            broadBands *
            0.13 +

            densityNoise *
            0.25 +

            fineNoise *
            0.11;

          // ====================================================
          // RING COLORS
          // ====================================================

          vec3 darkRing =
            vec3(
              0.12,
              0.090,
              0.058
            );

          vec3 midRing =
            vec3(
              0.43,
              0.345,
              0.235
            );

          vec3 brightRing =
            vec3(
              0.78,
              0.68,
              0.51
            );

          vec3 paleRing =
            vec3(
              0.91,
              0.83,
              0.68
            );

          vec3 ringColor =
            mix(
              darkRing,
              midRing,
              smoothstep(
                0.14,
                0.52,
                brightness
              )
            );

          ringColor =
            mix(
              ringColor,
              brightRing,
              smoothstep(
                0.48,
                0.77,
                brightness
              ) *
              0.78
            );

          ringColor =
            mix(
              ringColor,
              paleRing,
              smoothstep(
                0.72,
                0.93,
                brightness
              ) *
              0.36
            );

          // ====================================================
          // INNER / OUTER FADE
          // ====================================================

          float innerFade =
            smoothstep(
              0.0,
              0.050,
              radial
            );

          float outerFade =
            1.0 -
            smoothstep(
              0.425,
              0.500,
              radial
            );

          float alpha =
            innerFade *
            outerFade;

          // ====================================================
          // CASSINI DIVISION
          // ====================================================

          float cassini =
            smoothstep(
              0.247,
              0.266,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.266,
                0.288,
                radial
              )
            );

          alpha *=
            1.0 -
            cassini *
            0.88;

          // ====================================================
          // ADDITIONAL SUBTLE DIVISION
          // ====================================================

          float secondaryDivision =
            smoothstep(
              0.365,
              0.374,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.374,
                0.385,
                radial
              )
            );

          alpha *=
            1.0 -
            secondaryDivision *
            0.52;

          // ====================================================
          // FINAL RING
          // ====================================================

          gl_FragColor =
            vec4(
              ringColor,
              alpha *
              0.86
            );
        }
      `,
    });
  }, []);

  // ============================================================
  // OUTER RING
  // ============================================================

  const outerRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color:
        "#927b59",

      transparent: true,

      opacity: 0.24,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // INNER DARK RING
  // ============================================================

  const innerDarkRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color:
        "#56452f",

      transparent: true,

      opacity: 0.64,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // BRIGHT INNER RING
  // ============================================================

  const brightInnerRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color:
        "#c7ad78",

      transparent: true,

      opacity: 0.40,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <group>

      {/* ======================================================
          SATURN BODY
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
            saturnMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          SATURN ATMOSPHERE
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
          SATURN RINGS
          ====================================================== */}

      <group>

        {/* ====================================================
            MAIN DETAILED RING
            ==================================================== */}

        <Ring
          args={[
            1.35,
            2.35,
            160,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
          receiveShadow
        >
          <primitive
            object={
              innerRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            INNER DARK RING
            ==================================================== */}

        <Ring
          args={[
            1.15,
            1.35,
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
              innerDarkRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            BRIGHT INNER RING
            ==================================================== */}

        <Ring
          args={[
            1.38,
            1.72,
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
              brightInnerRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            OUTER FAINT RING
            ==================================================== */}

        <Ring
          args={[
            2.35,
            2.62,
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
              outerRingMaterial
            }
            attach="material"
          />
        </Ring>

      </group>

    </group>
  );
};