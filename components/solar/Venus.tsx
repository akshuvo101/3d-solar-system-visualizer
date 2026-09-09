import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * ============================================================
 * ♀ VENUS
 * ============================================================
 *
 * Visual goals:
 * - Thick yellow / golden Venus atmosphere
 * - Spherical procedural cloud structure
 * - No UV-based procedural terrain/cloud pattern
 * - No longitude seam / column-wise artifact
 * - Stable terminator and night-side shading
 * - Separate upper cloud layer
 * - Soft atmospheric limb glow
 *
 * Rotation:
 * Planetary axial rotation is controlled centrally by Planet.tsx.
 * This component intentionally does NOT rotate the Venus mesh.
 *
 * Venus is retrograde, so its rotation direction is already
 * represented by the astronomical rotation data.
 */

export const Venus = () => {
  const cloudRef = useRef<THREE.Mesh>(null);

  /* ============================================================
   * ♀ VENUS MAIN CLOUD DECK
   * ============================================================
   */

  const venusMaterial = useMemo(() => {
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
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {

          /*
           * Object-space spherical direction.
           *
           * Using the normalized vertex position instead of UV
           * coordinates prevents longitude seams and column-wise
           * procedural patterns.
           */
          vLocalDirection =
            normalize(position);

          vec4 worldPosition =
            modelMatrix *
            vec4(position, 1.0);

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
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        uniform float uTime;
        uniform vec3 uSunPosition;

        /*
         * ========================================================
         * 3D HASH
         * ========================================================
         */

        float hash3(vec3 p) {

          p =
            fract(
              p *
              0.3183099 +
              vec3(
                0.71,
                0.113,
                0.419
              )
            );

          p +=
            dot(
              p,
              p.yzx + 19.19
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        /*
         * ========================================================
         * 3D VALUE NOISE
         * ========================================================
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
              vec3(0.0, 0.0, 0.0)
            );

          float n100 =
            hash3(
              i +
              vec3(1.0, 0.0, 0.0)
            );

          float n010 =
            hash3(
              i +
              vec3(0.0, 1.0, 0.0)
            );

          float n110 =
            hash3(
              i +
              vec3(1.0, 1.0, 0.0)
            );

          float n001 =
            hash3(
              i +
              vec3(0.0, 0.0, 1.0)
            );

          float n101 =
            hash3(
              i +
              vec3(1.0, 0.0, 1.0)
            );

          float n011 =
            hash3(
              i +
              vec3(0.0, 1.0, 1.0)
            );

          float n111 =
            hash3(
              i +
              vec3(1.0, 1.0, 1.0)
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

        /*
         * ========================================================
         * 3D FBM
         * ========================================================
         */

        float fbm3(vec3 p) {

          float value = 0.0;

          float amplitude = 0.5;

          float frequency = 1.0;

          for(int i = 0; i < 5; i++) {

            value +=
              noise3(
                p *
                frequency
              ) *
              amplitude;

            frequency *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        /*
         * ========================================================
         * DOMAIN-WARPED VENUS CLOUDS
         * ========================================================
         *
         * Creates broad atmospheric structures without relying
         * on UV coordinates.
         */

        float venusCloudField(
          vec3 direction
        ) {

          vec3 p =
            direction *
            4.2;

          float warp =
            fbm3(
              p *
              0.72 +
              vec3(
                3.1,
                -1.7,
                4.4
              )
            );

          p +=
            (
              warp -
              0.5
            ) *
            1.15;

          float large =
            fbm3(
              p *
              1.15
            );

          float medium =
            fbm3(
              p *
              2.7 +
              vec3(
                -2.4,
                1.3,
                3.8
              )
            );

          return
            large * 0.72 +
            medium * 0.28;
        }

        /*
         * ========================================================
         * LONG ATMOSPHERIC STRUCTURE
         * ========================================================
         *
         * Produces stretched cloud bands by sampling 3D space
         * along the Venus sphere.
         */

        float atmosphericBands(
          vec3 direction
        ) {

          float latitude =
            direction.y;

          float broadBands =
            sin(
              latitude *
              28.0 +
              fbm3(
                direction *
                3.0
              ) *
              3.0
            );

          broadBands =
            broadBands *
            0.5 +
            0.5;

          float bandNoise =
            fbm3(
              direction *
              12.0 +
              vec3(
                1.7,
                -3.2,
                2.4
              )
            );

          return
            broadBands *
            (
              0.70 +
              bandNoise *
              0.30
            );
        }

        /*
         * ========================================================
         * FINE CLOUD FILAMENTS
         * ========================================================
         */

        float fineCloudStructure(
          vec3 direction
        ) {

          vec3 p =
            direction *
            22.0;

          float fine =
            fbm3(
              p
            );

          float finer =
            fbm3(
              p *
              1.8 +
              vec3(
                -4.0,
                2.0,
                5.0
              )
            );

          return
            fine * 0.70 +
            finer * 0.30;
        }

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          /*
           * ======================================================
           * VENUS COLOR PALETTE
           * ======================================================
           */

          vec3 deepBrown =
            vec3(
              0.045,
              0.012,
              0.002
            );

          vec3 darkAmber =
            vec3(
              0.16,
              0.045,
              0.006
            );

          vec3 mutedGold =
            vec3(
              0.38,
              0.15,
              0.025
            );

          vec3 warmGold =
            vec3(
              0.63,
              0.33,
              0.070
            );

          vec3 paleGold =
            vec3(
              0.86,
              0.60,
              0.24
            );

          vec3 creamCloud =
            vec3(
              0.98,
              0.82,
              0.50
            );

          /*
           * ======================================================
           * LARGE CLOUD STRUCTURE
           * ======================================================
           */

          float largeCloud =
            venusCloudField(
              direction
            );

          /*
           * ======================================================
           * ATMOSPHERIC BANDS
           * ======================================================
           */

          float bands =
            atmosphericBands(
              direction
            );

          /*
           * ======================================================
           * FINE STRUCTURE
           * ======================================================
           */

          float fine =
            fineCloudStructure(
              direction
            );

          /*
           * ======================================================
           * SECONDARY WISPS
           * ======================================================
           */

          float wisps =
            fbm3(
              direction *
              38.0 +
              vec3(
                2.7,
                -4.1,
                6.3
              )
            );

          /*
           * ======================================================
           * COMBINED CLOUD FIELD
           * ======================================================
           */

          float cloudPattern =
            largeCloud * 0.55 +
            bands * 0.22 +
            fine * 0.15 +
            wisps * 0.08;

          cloudPattern =
            clamp(
              cloudPattern,
              0.0,
              1.0
            );

          /*
           * ======================================================
           * NATURAL CONTRAST
           * ======================================================
           */

          float softCloud =
            smoothstep(
              0.24,
              0.48,
              largeCloud
            );

          float brightCloud =
            smoothstep(
              0.50,
              0.78,
              cloudPattern
            );

          float brightestCloud =
            smoothstep(
              0.72,
              0.93,
              cloudPattern
            );

          /*
           * ======================================================
           * BASE ATMOSPHERIC COLOR
           * ======================================================
           */

          vec3 surface =
            mix(
              deepBrown,
              darkAmber,
              softCloud
            );

          surface =
            mix(
              surface,
              mutedGold,
              smoothstep(
                0.30,
                0.56,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              warmGold,
              smoothstep(
                0.48,
                0.69,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              paleGold,
              smoothstep(
                0.62,
                0.84,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              creamCloud,
              brightestCloud
            );

          /*
           * ======================================================
           * CLOUD DEPTH
           * ======================================================
           */

          float depthNoise =
            fbm3(
              direction *
              17.0 +
              vec3(
                -3.2,
                4.7,
                -1.8
              )
            );

          surface *=
            0.82 +
            depthNoise *
            0.24;

          /*
           * ======================================================
           * DARK ATMOSPHERIC FILAMENTS
           * ======================================================
           */

          float darkFilaments =
            smoothstep(
              0.66,
              0.84,
              fine
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                0.58,
                0.43,
                0.23
              ),
              darkFilaments *
              0.18
            );

          /*
           * ======================================================
           * SUN LIGHT
           * ======================================================
           */

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 venusToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              venusToSun
            );

          float directLight =
            max(
              NdotL,
              0.0
            );

          directLight =
            pow(
              directLight,
              0.62
            );

          /*
           * Soft visible daylight transition.
           */

          float daylight =
            smoothstep(
              -0.12,
              0.24,
              NdotL
            );

          /*
           * ======================================================
           * ATMOSPHERIC DAY INTENSITY
           * ======================================================
           */

          float dayIntensity =
            0.12 +
            directLight *
            1.04;

          surface *=
            dayIntensity;

          /*
           * ======================================================
           * WARM SOLAR TINT
           * ======================================================
           */

          vec3 sunlightTint =
            vec3(
              1.0,
              0.90,
              0.68
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.18
            );

          /*
           * ======================================================
           * TERMINATOR
           * ======================================================
           */

          float twilight =
            smoothstep(
              -0.26,
              0.06,
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

          surface +=
            vec3(
              0.22,
              0.055,
              0.009
            ) *
            twilight *
            0.08;

          /*
           * ======================================================
           * NIGHT SIDE
           * ======================================================
           */

          float night =
            1.0 -
            daylight;

          surface *=
            0.14 +
            daylight *
            0.86;

          /*
           * Very subtle reflected atmospheric light.
           */

          surface +=
            vec3(
              0.007,
              0.0023,
              0.0006
            ) *
            night;

          /*
           * ======================================================
           * LIMB LIGHT
           * ======================================================
           */

          vec3 viewDirection =
            normalize(
              cameraPosition -
              vWorldPosition
            );

          float viewFacing =
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
              viewFacing,
              3.0
            );

          surface +=
            vec3(
              0.055,
              0.026,
              0.007
            ) *
            limb *
            daylight;

          /*
           * Prevent invalid dark values.
           */

          surface =
            max(
              surface,
              vec3(
                0.001
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

  /* ============================================================
   * ☁️ VENUS UPPER CLOUD LAYER
   * ============================================================
   */

  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      depthWrite: false,

      uniforms: {
        uTime: {
          value: 0,
        },

        uSunPosition: {
          value:
            new THREE.Vector3(
              0,
              0,
              0
            ),
        },
      },

      vertexShader: `
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

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
        varying vec3 vLocalDirection;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        uniform float uTime;
        uniform vec3 uSunPosition;

        /*
         * ========================================================
         * 3D HASH
         * ========================================================
         */

        float hash3(vec3 p) {

          p =
            fract(
              p *
              0.3183099 +
              vec3(
                0.71,
                0.113,
                0.419
              )
            );

          p +=
            dot(
              p,
              p.yzx + 19.19
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        /*
         * ========================================================
         * 3D NOISE
         * ========================================================
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

        /*
         * ========================================================
         * 3D FBM
         * ========================================================
         */

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

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          /*
           * ======================================================
           * SLOW UPPER CLOUD DRIFT
           * ======================================================
           *
           * The direction is warped instead of using UV.x.
           * This avoids a longitudinal seam.
           */

          vec3 drift =
            vec3(
              uTime * 0.0022,
              -uTime * 0.0005,
              uTime * 0.0011
            );

          vec3 cloudDirection =
            normalize(
              direction +
              drift *
              0.18
            );

          /*
           * ======================================================
           * LARGE CLOUD STRUCTURE
           * ======================================================
           */

          float large =
            fbm3(
              cloudDirection *
              5.8 +
              vec3(
                2.1,
                -3.7,
                4.6
              )
            );

          /*
           * ======================================================
           * MEDIUM STRUCTURE
           * ======================================================
           */

          float medium =
            fbm3(
              cloudDirection *
              13.0 +
              vec3(
                -4.0,
                2.4,
                1.7
              )
            );

          /*
           * ======================================================
           * FINE CLOUD DETAIL
           * ======================================================
           */

          float fine =
            fbm3(
              cloudDirection *
              31.0 +
              vec3(
                3.3,
                -5.1,
                2.2
              )
            );

          /*
           * ======================================================
           * ATMOSPHERIC STREAKS
           * ======================================================
           */

          float streak =
            fbm3(
              vec3(
                direction.x * 7.0,
                direction.y * 30.0,
                direction.z * 7.0
              )
            );

          float cloudMask =
            large * 0.64 +
            medium * 0.20 +
            fine * 0.09 +
            streak * 0.07;

          cloudMask =
            smoothstep(
              0.54,
              0.76,
              cloudMask
            );

          /*
           * ======================================================
           * SUN LIGHT
           * ======================================================
           */

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 venusToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float sunlight =
            max(
              dot(
                normal,
                venusToSun
              ),
              0.0
            );

          sunlight =
            pow(
              sunlight,
              0.68
            );

          /*
           * ======================================================
           * CLOUD COLORS
           * ======================================================
           */

          vec3 cloudDay =
            vec3(
              1.0,
              0.82,
              0.53
            );

          vec3 cloudMid =
            vec3(
              0.70,
              0.40,
              0.11
            );

          vec3 cloudNight =
            vec3(
              0.018,
              0.005,
              0.001
            );

          vec3 cloudColor =
            mix(
              cloudNight,
              cloudMid,
              smoothstep(
                0.02,
                0.38,
                sunlight
              )
            );

          cloudColor =
            mix(
              cloudColor,
              cloudDay,
              smoothstep(
                0.35,
                0.78,
                sunlight
              )
            );

          /*
           * Bright illuminated cloud tops.
           */

          cloudColor +=
            vec3(
              0.11,
              0.052,
              0.014
            ) *
            pow(
              sunlight,
              2.4
            );

          /*
           * ======================================================
           * FINAL CLOUD OPACITY
           * ======================================================
           */

          float alpha =
            cloudMask *
            (
              0.045 +
              sunlight *
              0.17
            );

          /*
           * Slightly stronger illuminated edge.
           */

          alpha +=
            cloudMask *
            pow(
              sunlight,
              2.0
            ) *
            0.025;

          gl_FragColor =
            vec4(
              cloudColor,
              alpha
            );
        }
      `,

      lights: false,
    });
  }, []);

  /* ============================================================
   * ✨ VENUS ATMOSPHERE
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
              "#e7a047"
            ),
        },

        intensity: {
          value: 0.135,
        },

        power: {
          value: 3.6,
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

      lights: false,
    });
  }, []);

  /* ============================================================
   * 🔄 ANIMATION
   * ============================================================
   *
   * IMPORTANT:
   * Venus itself is NOT rotated here.
   *
   * Planet.tsx controls the absolute astronomical rotation.
   *
   * The upper cloud layer receives only a subtle independent
   * visual drift to simulate Venus' dynamic cloud atmosphere.
   */

  useFrame(
    ({ clock }, delta) => {

      const time =
        clock.getElapsedTime();

      /*
       * Upper cloud deck:
       *
       * Small independent movement.
       * This is intentionally much slower than the old
       * direct planet rotation system.
       */

      if (cloudRef.current) {
        cloudRef.current.rotation.y +=
          delta *
          0.0042;
      }

      venusMaterial.uniforms.uTime.value =
        time;

      cloudMaterial.uniforms.uTime.value =
        time;
    }
  );

  /* ============================================================
   * ♀ VENUS RENDER
   * ============================================================
   */

  return (
    <group>

      {/* ======================================================
          Main Venus atmospheric cloud deck
          ====================================================== */}

      <Sphere
        args={[
          1,
          96,
          96,
        ]}
        castShadow={false}
        receiveShadow
      >
        <primitive
          object={
            venusMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          Upper cloud layer
          ====================================================== */}

      <Sphere
        ref={cloudRef}
        args={[
          1.014,
          72,
          72,
        ]}
        castShadow={false}
        receiveShadow={false}
      >
        <primitive
          object={
            cloudMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          Atmospheric limb
          ====================================================== */}

      <Sphere
        args={[
          1.034,
          64,
          64,
        ]}
        castShadow={false}
        receiveShadow={false}
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