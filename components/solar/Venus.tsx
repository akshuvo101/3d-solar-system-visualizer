
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
   * ♀ VENUS MAIN CLOUD / SURFACE SHADER
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

        // ======================================================
        // FBM
        // ======================================================

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

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec2 uv =
            vUv;

          // --------------------------------------------------
          // Slow atmospheric drift
          // --------------------------------------------------

          uv.x +=
            uTime *
            0.003;

          // ==================================================
          // 🟡 VENUS CLOUD PALETTE
          // ==================================================

          vec3 deepCloud =
            vec3(
              0.115,
              0.038,
              0.008
            );

          vec3 darkGold =
            vec3(
              0.30,
              0.105,
              0.018
            );

          vec3 gold =
            vec3(
              0.63,
              0.285,
              0.055
            );

          vec3 warmGold =
            vec3(
              0.80,
              0.47,
              0.12
            );

          vec3 brightCloud =
            vec3(
              0.94,
              0.69,
              0.34
            );

          // ==================================================
          // ☁️ LARGE ATMOSPHERIC STRUCTURES
          // ==================================================

          float largeClouds =
            fbm(
              vec2(
                uv.x * 3.0,
                uv.y * 6.5
              )
            );

          float mediumClouds =
            fbm(
              vec2(
                uv.x * 8.0,
                uv.y * 15.0
              )
              +
              vec2(
                uTime * 0.012,
                -uTime * 0.006
              )
            );

          float fineClouds =
            fbm(
              uv * 28.0
            );

          // ==================================================
          // 🌫️ LATITUDE BANDS
          // ==================================================

          float latitude =
            sin(
              uv.y *
              42.0
            )
            *
            0.5
            +
            0.5;

          latitude =
            smoothstep(
              0.32,
              0.78,
              latitude
            );

          // ==================================================
          // 🌀 STORM-LIKE STREAKS
          // ==================================================

          float streakNoise =
            noise(
              vec2(
                uv.x * 5.0 +
                sin(
                  uv.y * 16.0
                ) *
                1.8,

                uv.y * 24.0
              )
            );

          float turbulentFlow =
            noise(
              vec2(
                uv.x * 11.0 -
                sin(
                  uv.y * 10.0
                ) *
                1.2,

                uv.y * 18.0
              )
            );

          // ==================================================
          // 🎨 CLOUD PATTERN
          // ==================================================

          float cloudPattern =
            largeClouds *
            0.42
            +
            mediumClouds *
            0.34
            +
            fineClouds *
            0.12
            +
            latitude *
            0.12;

          cloudPattern +=
            streakNoise *
            0.10;

          cloudPattern =
            clamp(
              cloudPattern,
              0.0,
              1.0
            );

          // ==================================================
          // 🟡 BASE COLOR
          // ==================================================

          vec3 surface =
            mix(
              deepCloud,
              darkGold,
              largeClouds
            );

          surface =
            mix(
              surface,
              gold,
              smoothstep(
                0.30,
                0.62,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              warmGold,
              smoothstep(
                0.52,
                0.78,
                cloudPattern
              )
            );

          surface =
            mix(
              surface,
              brightCloud,
              smoothstep(
                0.72,
                0.92,
                cloudPattern
              )
            );

          // ==================================================
          // 🌀 ATMOSPHERIC CONTRAST
          // ==================================================

          surface *=
            0.78
            +
            streakNoise *
            0.34;

          surface *=
            0.92
            +
            turbulentFlow *
            0.14;

          // ==================================================
          // ☀️ REAL SUN LIGHTING
          // ==================================================

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
              0.68
            );

          // ==================================================
          // 🌗 DAY / NIGHT TRANSITION
          // ==================================================

          float daylight =
            smoothstep(
              -0.10,
              0.24,
              NdotL
            );

          // ==================================================
          // 🌞 DAY SIDE
          // ==================================================

          float dayIntensity =
            0.12
            +
            directLight *
            1.12;

          surface *=
            dayIntensity;

          // ==================================================
          // 🔥 WARM SUNLIGHT
          // ==================================================

          vec3 sunlightTint =
            vec3(
              1.0,
              0.91,
              0.72
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.18
            );

          // ==================================================
          // 🌅 TERMINATOR GLOW
          // ==================================================

          float twilight =
            smoothstep(
              -0.20,
              0.10,
              NdotL
            )
            *
            (
              1.0 -
              smoothstep(
                0.05,
                0.30,
                NdotL
              )
            );

          vec3 twilightColor =
            vec3(
              0.26,
              0.095,
              0.018
            );

          surface +=
            twilightColor *
            twilight *
            0.075;

          // ==================================================
          // 🌑 NIGHT SIDE
          // ==================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.16
            +
            daylight *
            0.84;

          // Very subtle atmospheric reflected light
          surface +=
            vec3(
              0.006,
              0.0025,
              0.0008
            )
            *
            night;

          // ==================================================
          // ✨ FINAL CONTRAST
          // ==================================================

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
    });
  }, []);

  /*
   * ============================================================
   * ☁️ OUTER CLOUD DETAIL LAYER
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
            43758.5453
          );
        }

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

          vec2 uv =
            vUv;

          uv.x +=
            uTime *
            0.004;

          float clouds =
            fbm(
              uv * 8.0
            );

          clouds +=
            noise(
              uv * 22.0
            )
            *
            0.30;

          clouds =
            smoothstep(
              0.56,
              0.78,
              clouds
            );

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

          float cloudLight =
            pow(
              sunlight,
              0.72
            );

          vec3 cloudDay =
            vec3(
              1.0,
              0.78,
              0.42
            );

          vec3 cloudNight =
            vec3(
              0.035,
              0.015,
              0.004
            );

          vec3 cloudColor =
            mix(
              cloudNight,
              cloudDay,
              smoothstep(
                0.02,
                0.42,
                sunlight
              )
            );

          // Bright cloud tops facing the Sun
          cloudColor +=
            vec3(
              0.10,
              0.055,
              0.018
            )
            *
            pow(
              cloudLight,
              2.8
            );

          gl_FragColor =
            vec4(
              cloudColor,
              clouds *
              (
                0.12 +
                cloudLight *
                0.18
              )
            );
        }
      `,
    });
  }, []);

  /*
   * ============================================================
   * ✨ SUBTLE VENUS ATMOSPHERE
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
              "#f2a84b"
            ),
        },

        intensity: {
          value: 0.20,
        },

        power: {
          value: 4.2,
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

      // Venus retrograde rotation
      if (venusRef.current) {

        venusRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      // Clouds move slightly faster
      if (cloudRef.current) {

        cloudRef.current.rotation.y +=
          delta *
          rotationSpeed *
          1.15;
      }

      // Very subtle atmospheric breathing
      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time * 0.65
          ) *
          0.0015;

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

  /*
   * ============================================================
   * 🎨 RENDER
   * ============================================================
   */

  return (
    <group>

      {/* ♀ Venus Main Body */}

      <Sphere
        ref={venusRef}
        args={[
          1,
          64,
          64,
        ]}
        castShadow
        receiveShadow
      >
        <primitive
          object={
            venusMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ☁️ Secondary Cloud Detail */}

      <Sphere
        ref={cloudRef}
        args={[
          1.014,
          64,
          64,
        ]}
      >
        <primitive
          object={
            cloudMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* ✨ Subtle Outer Atmosphere */}

      <Sphere
        ref={atmosphereRef}
        args={[
          1.032,
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