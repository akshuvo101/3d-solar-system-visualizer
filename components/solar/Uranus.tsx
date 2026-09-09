import { Ring, Sphere } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

// ============================================================
// URANUS
// ============================================================
// Visual-only component.
//
// Planet rotation is controlled centrally by Planet.tsx using
// the astronomy rotation model.
//
// Uranus uses spherical 3D procedural noise instead of UV-based
// noise to eliminate longitude seams / column-wise artifacts.
//
// Uranus has an extreme axial tilt (~97.77°), which is handled
// by Planet.tsx through the planet's axial tilt configuration.
// ============================================================

export const Uranus = () => {
  // ============================================================
  // URANUS BODY MATERIAL
  // ============================================================

  const uranusMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: {
          value:
            new THREE.Vector3(
              0,
              0,
              0,
            ),
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
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        uniform vec3 uSunPosition;

        // ======================================================
        // 3D HASH
        // ======================================================

        float hash31(vec3 p) {

          p =
            fract(
              p *
              0.3183099 +
              vec3(
                0.11,
                0.17,
                0.13
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
            hash31(i);

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

        // ======================================================
        // 3D FBM
        // ======================================================

        float fbm3(vec3 p) {

          float value = 0.0;
          float amplitude = 0.5;

          for(int i = 0; i < 4; i++) {

            value +=
              noise3(p) *
              amplitude;

            p *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        // ======================================================
        // RIDGED DETAIL
        // ======================================================

        float ridgedNoise(vec3 p) {

          float n =
            noise3(p);

          return
            1.0 -
            abs(
              n * 2.0 -
              1.0
            );
        }

        // ======================================================
        // LARGE ATMOSPHERIC STRUCTURE
        // ======================================================

        float largeAtmosphere(
          vec3 direction
        ) {

          vec3 p =
            direction;

          p.xz *= 2.8;
          p.y *= 8.5;

          return fbm3(
            p *
            0.72
          );
        }

        // ======================================================
        // MEDIUM ATMOSPHERIC STRUCTURE
        // ======================================================

        float mediumAtmosphere(
          vec3 direction
        ) {

          vec3 p =
            direction;

          p.xz *= 7.0;
          p.y *= 20.0;

          float broad =
            fbm3(
              p *
              0.62 +
              vec3(
                2.7,
                5.1,
                8.3
              )
            );

          float fine =
            ridgedNoise(
              p *
              1.65
            );

          return
            broad *
            0.72 +
            fine *
            0.28;
        }

        // ======================================================
        // URANUS BAND STRUCTURE
        // ======================================================

        float bandPattern(
          vec3 direction
        ) {

          float latitude =
            direction.y;

          float broadBands =
            sin(
              latitude *
              17.0
            );

          float mediumBands =
            sin(
              latitude *
              36.0 +
              sin(
                latitude *
                7.0
              ) *
              1.2
            );

          float fineBands =
            sin(
              latitude *
              70.0 +
              sin(
                latitude *
                15.0
              ) *
              1.4
            );

          float bands =
            broadBands *
            0.48 +
            mediumBands *
            0.34 +
            fineBands *
            0.18;

          return
            bands *
            0.5 +
            0.5;
        }

        // ======================================================
        // BAND TURBULENCE
        // ======================================================

        float bandTurbulence(
          vec3 direction
        ) {

          vec3 p =
            direction;

          p.xz *= 5.5;
          p.y *= 24.0;

          float n1 =
            fbm3(
              p *
              0.72
            );

          float n2 =
            noise3(
              p *
              2.0 +
              vec3(
                4.2,
                7.8,
                2.6
              )
            );

          return
            n1 *
            0.76 +
            n2 *
            0.24;
        }

        // ======================================================
        // POLAR MASK
        // ======================================================

        float polarMask(
          vec3 direction
        ) {

          float latitude =
            abs(
              direction.y
            );

          return smoothstep(
            0.66,
            0.97,
            latitude
          );
        }

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          // ====================================================
          // COLOR PALETTE
          // ====================================================

          vec3 deepCyan =
            vec3(
              0.018,
              0.085,
              0.105
            );

          vec3 cyan =
            vec3(
              0.075,
              0.285,
              0.315
            );

          vec3 blueCyan =
            vec3(
              0.16,
              0.47,
              0.50
            );

          vec3 paleCyan =
            vec3(
              0.42,
              0.70,
              0.72
            );

          vec3 icy =
            vec3(
              0.70,
              0.87,
              0.87
            );

          vec3 polarColor =
            vec3(
              0.40,
              0.68,
              0.69
            );

          // ====================================================
          // ATMOSPHERIC STRUCTURE
          // ====================================================

          float largeNoise =
            largeAtmosphere(
              direction
            );

          float mediumNoise =
            mediumAtmosphere(
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
          // BASE COLOR
          // ====================================================

          vec3 surface =
            mix(
              deepCyan,
              cyan,
              bands *
              0.78
            );

          // Large smooth atmospheric variation.
          surface =
            mix(
              surface,
              blueCyan,
              smoothstep(
                0.34,
                0.67,
                largeNoise
              ) *
              0.58
            );

          // Medium cloud/haze structure.
          surface =
            mix(
              surface,
              paleCyan,
              smoothstep(
                0.48,
                0.77,
                mediumNoise
              ) *
              0.44
            );

          // Very subtle icy highlights.
          surface =
            mix(
              surface,
              icy,
              smoothstep(
                0.72,
                0.92,
                turbulence
              ) *
              0.16
            );

          // ====================================================
          // SOFT HORIZONTAL CLOUD STREAKS
          // ====================================================

          float elongatedDetail =
            ridgedNoise(
              vec3(
                direction.x *
                9.0,

                direction.y *
                42.0,

                direction.z *
                9.0
              )
            );

          surface *=
            0.93 +
            elongatedDetail *
            0.09;

          // ====================================================
          // POLAR BRIGHTENING
          // ====================================================

          float polar =
            polarMask(
              direction
            );

          surface =
            mix(
              surface,
              polarColor,
              polar *
              0.24
            );

          // ====================================================
          // EQUATORIAL HAZE
          // ====================================================

          float equatorial =
            1.0 -
            smoothstep(
              0.16,
              0.58,
              abs(
                direction.y
              )
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.035,
                1.025,
                1.020
              ),
              equatorial *
              0.14
            );

          // ====================================================
          // VERY FINE SPHERICAL DETAIL
          // ====================================================

          float microDetail =
            noise3(
              direction *
              82.0
            );

          surface +=
            (
              microDetail -
              0.5
            ) *
            0.012;

          // ====================================================
          // SUN LIGHTING
          // ====================================================

          vec3 normal =
            normalize(
              vWorldNormal
            );

          vec3 uranusToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              uranusToSun
            );

          float directLight =
            max(
              NdotL,
              0.0
            );

          directLight =
            pow(
              directLight,
              0.74
            );

          // ====================================================
          // SOFT DAYLIGHT
          // ====================================================

          float daylight =
            smoothstep(
              -0.09,
              0.24,
              NdotL
            );

          float dayIntensity =
            0.075 +
            directLight *
            1.12;

          surface *=
            dayIntensity;

          // ====================================================
          // COOL DISTANT SUNLIGHT
          // ====================================================

          vec3 sunlightTint =
            vec3(
              0.94,
              1.0,
              1.0
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.13
            );

          // ====================================================
          // TWILIGHT
          // ====================================================

          float twilight =
            smoothstep(
              -0.22,
              0.08,
              NdotL
            ) *
            (
              1.0 -
              smoothstep(
                0.04,
                0.30,
                NdotL
              )
            );

          vec3 twilightColor =
            vec3(
              0.018,
              0.075,
              0.085
            );

          surface +=
            twilightColor *
            twilight *
            0.085;

          // ====================================================
          // NIGHT SIDE
          // ====================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.14 +
            daylight *
            0.86;

          surface +=
            vec3(
              0.0008,
              0.003,
              0.0035
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
              4.5
            );

          surface +=
            vec3(
              0.045,
              0.12,
              0.125
            ) *
            limb *
            0.06;

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
                0.96
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
  // URANUS ATMOSPHERE
  // ============================================================

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      side:
        THREE.BackSide,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,

      uniforms: {
        glowColor: {
          value:
            new THREE.Color(
              "#61d2d8"
            ),
        },

        intensity: {
          value: 0.145,
        },

        power: {
          value: 4.6,
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
  // URANUS MAIN RING MATERIAL
  // ============================================================

  const mainRingMaterial = useMemo(() => {
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
        // MAIN RING
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
          // RING BAND STRUCTURE
          // ====================================================

          float fineBands =
            sin(
              radial *
              310.0
            ) *
            0.5 +
            0.5;

          float mediumBands =
            sin(
              radial *
              135.0 +
              sin(
                radial *
                21.0
              ) *
              2.0
            ) *
            0.5 +
            0.5;

          float broadBands =
            sin(
              radial *
              48.0
            ) *
            0.5 +
            0.5;

          float density =
            noise(
              vec2(
                radial *
                125.0,

                vUv.y *
                15.0
              )
            );

          float fineDensity =
            noise(
              vec2(
                radial *
                250.0,

                vUv.y *
                26.0
              )
            );

          float brightness =
            fineBands *
            0.30 +

            mediumBands *
            0.23 +

            broadBands *
            0.13 +

            density *
            0.25 +

            fineDensity *
            0.09;

          // ====================================================
          // RING COLORS
          // ====================================================

          vec3 darkRing =
            vec3(
              0.065,
              0.13,
              0.135
            );

          vec3 midRing =
            vec3(
              0.27,
              0.40,
              0.40
            );

          vec3 brightRing =
            vec3(
              0.55,
              0.68,
              0.67
            );

          vec3 icyRing =
            vec3(
              0.72,
              0.82,
              0.80
            );

          vec3 ringColor =
            mix(
              darkRing,
              midRing,
              smoothstep(
                0.15,
                0.52,
                brightness
              )
            );

          ringColor =
            mix(
              ringColor,
              brightRing,
              smoothstep(
                0.50,
                0.78,
                brightness
              ) *
              0.66
            );

          ringColor =
            mix(
              ringColor,
              icyRing,
              smoothstep(
                0.74,
                0.93,
                brightness
              ) *
              0.28
            );

          // ====================================================
          // INNER / OUTER FADE
          // ====================================================

          float innerFade =
            smoothstep(
              0.015,
              0.060,
              radial
            );

          float outerFade =
            1.0 -
            smoothstep(
              0.41,
              0.50,
              radial
            );

          float alpha =
            innerFade *
            outerFade;

          // ====================================================
          // SUBTLE RING DIVISIONS
          // ====================================================

          float divisionOne =
            smoothstep(
              0.205,
              0.216,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.216,
                0.228,
                radial
              )
            );

          float divisionTwo =
            smoothstep(
              0.315,
              0.324,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.324,
                0.337,
                radial
              )
            );

          alpha *=
            1.0 -
            divisionOne *
            0.52;

          alpha *=
            1.0 -
            divisionTwo *
            0.34;

          gl_FragColor =
            vec4(
              ringColor,
              alpha *
              0.54
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
        "#819b9a",

      transparent: true,

      opacity: 0.19,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // MIDDLE RING
  // ============================================================

  const middleRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color:
        "#718f8d",

      transparent: true,

      opacity: 0.26,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // INNER RING
  // ============================================================

  const innerRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color:
        "#526f6d",

      transparent: true,

      opacity: 0.30,

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
          URANUS BODY
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
            uranusMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          URANUS ATMOSPHERE
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
          URANUS RINGS
          ====================================================== */}

      <group>

        {/* ====================================================
            INNER RING
            ==================================================== */}

        <Ring
          args={[
            1.18,
            1.30,
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
              innerRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            MAIN DETAILED RING
            ==================================================== */}

        <Ring
          args={[
            1.30,
            1.49,
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
              mainRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            MIDDLE RING
            ==================================================== */}

        <Ring
          args={[
            1.53,
            1.67,
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
              middleRingMaterial
            }
            attach="material"
          />
        </Ring>

        {/* ====================================================
            OUTER FAINT RING
            ==================================================== */}

        <Ring
          args={[
            1.74,
            1.84,
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