import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type VenusProps = {
  rotationSpeed?: number;
};

export const Venus = ({
  rotationSpeed = -0.012,
}: VenusProps) => {
  const venusRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  /*
   * ============================================================
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
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;

          vec4 worldPosition =
            modelMatrix * vec4(position, 1.0);

          vWorldPosition =
            worldPosition.xyz;

          vNormal =
            normalize(
              mat3(modelMatrix) * normal
            );

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform float uTime;
        uniform vec3 uSunPosition;

        float hash(vec2 p) {
          return fract(
            sin(
              dot(
                p,
                vec2(127.1, 311.7)
              )
            ) *
            43758.5453123
          );
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          vec2 u =
            f * f *
            (3.0 - 2.0 * f);

          return mix(a, b, u.x)
            + (c - a) * u.y * (1.0 - u.x)
            + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;

          for(int i = 0; i < 6; i++) {
            value += noise(p) * amplitude;
            p *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        float warpedClouds(vec2 uv) {
          float warpX =
            fbm(
              uv * 3.0 +
              vec2(2.0, 7.0)
            );

          float warpY =
            fbm(
              uv * 3.0 +
              vec2(-5.0, 3.0)
            );

          vec2 warped = uv;

          warped.x +=
            (warpX - 0.5) * 0.16;

          warped.y +=
            (warpY - 0.5) * 0.10;

          return fbm(warped);
        }

        void main() {

          vec2 uv = vUv;

          /*
           * Slow Venus atmospheric movement
           */
          uv.x += uTime * 0.0025;

          /*
           * ==================================================
           * VENUS COLOR PALETTE
           * ==================================================
           */

          vec3 deepBrown =
            vec3(0.055, 0.018, 0.004);

          vec3 darkAmber =
            vec3(0.20, 0.065, 0.008);

          vec3 mutedGold =
            vec3(0.43, 0.19, 0.035);

          vec3 warmGold =
            vec3(0.68, 0.38, 0.095);

          vec3 paleGold =
            vec3(0.88, 0.65, 0.30);

          vec3 creamCloud =
            vec3(0.98, 0.83, 0.54);

          /*
           * ==================================================
           * LARGE CLOUD STRUCTURE
           * ==================================================
           */

          float largeCloud =
            warpedClouds(
              vec2(
                uv.x * 2.8,
                uv.y * 5.0
              )
            );

          /*
           * Medium turbulence
           */

          float mediumCloud =
            fbm(
              vec2(
                uv.x * 8.0,
                uv.y * 15.0
              ) +
              vec2(
                uTime * 0.010,
                -uTime * 0.004
              )
            );

          /*
           * Fine atmospheric structure
           */

          float fineCloud =
            fbm(
              uv * 32.0 +
              vec2(
                -uTime * 0.008,
                uTime * 0.004
              )
            );

          /*
           * Long cloud streaks
           */

          float streakNoise =
            noise(
              vec2(
                uv.x * 7.0 +
                sin(uv.y * 18.0) * 1.8,
                uv.y * 28.0
              )
            );

          float longStreak =
            noise(
              vec2(
                uv.x * 3.0 +
                sin(uv.y * 12.0) * 2.4,
                uv.y * 42.0
              )
            );

          /*
           * ==================================================
           * LATITUDE BANDS
           * ==================================================
           */

          float latitudeWave =
            sin(uv.y * 55.0);

          float latitudeBands =
            smoothstep(
              0.12,
              0.72,
              latitudeWave * 0.5 + 0.5
            );

          float latitudeVariation =
            fbm(
              vec2(
                uv.x * 4.0,
                uv.y * 11.0
              )
            );

          latitudeBands *=
            0.72 +
            latitudeVariation * 0.28;

          /*
           * ==================================================
           * COMBINED CLOUD FIELD
           * ==================================================
           */

          float cloudPattern =
            largeCloud * 0.40 +
            mediumCloud * 0.31 +
            fineCloud * 0.11 +
            streakNoise * 0.10 +
            longStreak * 0.08;

          cloudPattern =
            clamp(
              cloudPattern +
              latitudeBands * 0.08,
              0.0,
              1.0
            );

          /*
           * ==================================================
           * BASE COLOR
           * ==================================================
           */

          vec3 surface =
            mix(
              deepBrown,
              darkAmber,
              smoothstep(
                0.12,
                0.40,
                largeCloud
              )
            );

          surface =
            mix(
              surface,
              mutedGold,
              smoothstep(
                0.28,
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
                0.70,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              paleGold,
              smoothstep(
                0.63,
                0.84,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              creamCloud,
              smoothstep(
                0.78,
                0.96,
                cloudPattern
              )
            );

          /*
           * Cloud depth
           */

          float cloudDepth =
            fbm(
              uv * 18.0 +
              vec2(3.7, -6.1)
            );

          surface *=
            0.80 +
            cloudDepth * 0.28;

          /*
           * Dark atmospheric filaments
           */

          float darkFilaments =
            smoothstep(
              0.56,
              0.78,
              streakNoise
            );

          surface =
            mix(
              surface,
              surface *
              vec3(0.62, 0.48, 0.30),
              darkFilaments * 0.20
            );

          /*
           * ==================================================
           * SUN LIGHT
           * ==================================================
           */

          vec3 normal =
            normalize(vNormal);

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

          float daylight =
            smoothstep(
              -0.12,
              0.25,
              NdotL
            );

          /*
           * ==================================================
           * IMPORTANT:
           * SHADOW-RECEIVING BASE
           * ==================================================
           *
           * The actual shadow map is handled by Three.js.
           * We intentionally keep the shader's own lighting
           * soft enough so the shadow can remain visible.
           */

          float dayIntensity =
            0.115 +
            directLight * 1.08;

          surface *=
            dayIntensity;

          /*
           * Warm solar illumination
           */

          vec3 sunlightTint =
            vec3(
              1.0,
              0.90,
              0.69
            );

          surface =
            mix(
              surface,
              surface * sunlightTint,
              daylight * 0.20
            );

          /*
           * ==================================================
           * TERMINATOR
           * ==================================================
           */

          float twilight =
            smoothstep(
              -0.24,
              0.07,
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
              0.24,
              0.065,
              0.012
            ) *
            twilight *
            0.085;

          /*
           * ==================================================
           * NIGHT SIDE
           * ==================================================
           */

          float night =
            1.0 -
            daylight;

          surface *=
            0.13 +
            daylight * 0.87;

          /*
           * Very subtle atmospheric bounce
           */

          surface +=
            vec3(
              0.007,
              0.0025,
              0.0007
            ) *
            night;

          /*
           * ==================================================
           * LIMB LIGHT
           * ==================================================
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
              1.0 - viewFacing,
              3.2
            );

          surface +=
            vec3(
              0.055,
              0.028,
              0.008
            ) *
            limb *
            daylight;

          surface =
            max(
              surface,
              vec3(0.001)
            );

          gl_FragColor =
            vec4(
              surface,
              1.0
            );
        }
      `,

      toneMapped: false,

      /*
       * Important for custom shader material.
       */
      lights: false,
    });
  }, []);

  /*
   * ============================================================
   * ☁️ UPPER CLOUD LAYER
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
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform float uTime;
        uniform vec3 uSunPosition;

        float hash(vec2 p) {
          return fract(
            sin(
              dot(
                p,
                vec2(127.1, 311.7)
              )
            ) *
            43758.5453123
          );
        }

        float noise(vec2 p) {

          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          vec2 u =
            f * f *
            (3.0 - 2.0 * f);

          return mix(a, b, u.x)
            + (c - a) * u.y * (1.0 - u.x)
            + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {

          float value = 0.0;
          float amplitude = 0.5;

          for(int i = 0; i < 5; i++) {

            value +=
              noise(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        void main() {

          vec2 uv = vUv;

          /*
           * Upper cloud movement
           */
          uv.x +=
            uTime * 0.0055;

          /*
           * Large upper cloud structures
           */

          float large =
            fbm(
              vec2(
                uv.x * 5.5,
                uv.y * 9.0
              )
            );

          /*
           * Fine cloud filaments
           */

          float fine =
            fbm(
              uv * 30.0 +
              vec2(
                -uTime * 0.012,
                uTime * 0.004
              )
            );

          /*
           * Long streaks
           */

          float streak =
            noise(
              vec2(
                uv.x * 9.0 +
                sin(uv.y * 16.0) * 1.4,
                uv.y * 36.0
              )
            );

          float cloudMask =
            large * 0.72 +
            fine * 0.16 +
            streak * 0.12;

          cloudMask =
            smoothstep(
              0.54,
              0.76,
              cloudMask
            );

          /*
           * Sun direction
           */

          vec3 normal =
            normalize(vNormal);

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
              0.65
            );

          /*
           * Cloud colors
           */

          vec3 cloudDay =
            vec3(
              1.0,
              0.82,
              0.53
            );

          vec3 cloudMid =
            vec3(
              0.72,
              0.43,
              0.13
            );

          vec3 cloudNight =
            vec3(
              0.025,
              0.009,
              0.002
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
           * Bright cloud tops
           */

          cloudColor +=
            vec3(
              0.11,
              0.055,
              0.015
            ) *
            pow(
              sunlight,
              2.5
            );

          /*
           * Keep this layer subtle.
           */

          float alpha =
            cloudMask *
            (
              0.055 +
              sunlight * 0.19
            );

          alpha +=
            cloudMask * 0.012;

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

  /*
   * ============================================================
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
              "#e9a64d"
            ),
        },

        intensity: {
          value: 0.145,
        },

        power: {
          value: 3.8,
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
              1.0 - viewDot,
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
       * Venus retrograde rotation.
       */

      if (venusRef.current) {
        venusRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      /*
       * Upper cloud layer moves faster.
       */

      if (cloudRef.current) {
        cloudRef.current.rotation.y +=
          delta *
          rotationSpeed *
          1.22;
      }

      /*
       * Tiny atmosphere breathing.
       */

      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time * 0.55
          ) *
          0.0012;

        atmosphereRef.current.scale.setScalar(
          pulse
        );
      }

      venusMaterial.uniforms.uTime.value =
        time;

      cloudMaterial.uniforms.uTime.value =
        time;
    }
  );

  return (
    <group>

      {/* Venus main cloud deck */}
      <Sphere
        ref={venusRef}
        args={[1, 96, 96]}
        castShadow={false}
        receiveShadow
      >
        <primitive
          object={venusMaterial}
          attach="material"
        />
      </Sphere>

      {/* Upper cloud layer */}
      <Sphere
        ref={cloudRef}
        args={[1.014, 72, 72]}
        castShadow={false}
        receiveShadow={false}
      >
        <primitive
          object={cloudMaterial}
          attach="material"
        />
      </Sphere>

      {/* Atmospheric limb */}
      <Sphere
        ref={atmosphereRef}
        args={[1.034, 64, 64]}
        castShadow={false}
        receiveShadow={false}
      >
        <primitive
          object={atmosphereMaterial}
          attach="material"
        />
      </Sphere>

    </group>
  );
};