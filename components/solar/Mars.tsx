
import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type MarsProps = {
  rotationSpeed?: number;
};

export const Mars = ({
  rotationSpeed = 0.075,
}: MarsProps) => {
  const marsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  /*
   * ============================================================
   * 🔴 MARS SURFACE SHADER
   * ============================================================
   */

  const marsMaterial = useMemo(() => {
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
        // VALUE NOISE
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

          // ==================================================
          // 🏜️ MARTIAN COLOR PALETTE
          // ==================================================

          vec3 darkMars =
            vec3(
              0.065,
              0.012,
              0.006
            );

          vec3 deepRed =
            vec3(
              0.19,
              0.030,
              0.012
            );

          vec3 rust =
            vec3(
              0.42,
              0.085,
              0.030
            );

          vec3 orangeRust =
            vec3(
              0.62,
              0.16,
              0.050
            );

          vec3 dustyRock =
            vec3(
              0.72,
              0.26,
              0.10
            );

          // ==================================================
          // 🏔️ LARGE TERRAIN
          // ==================================================

          float largeTerrain =
            fbm(
              uv * 3.2 +
              vec2(
                2.5,
                1.7
              )
            );

          vec3 surface =
            mix(
              darkMars,
              deepRed,
              largeTerrain
            );

          surface =
            mix(
              surface,
              rust,
              smoothstep(
                0.43,
                0.70,
                largeTerrain
              )
            );

          // ==================================================
          // 🪨 MEDIUM ROCK / DUST DETAIL
          // ==================================================

          float mediumTerrain =
            fbm(
              uv * 12.0 +
              vec2(
                5.0,
                3.0
              )
            );

          float mediumMask =
            smoothstep(
              0.58,
              0.82,
              mediumTerrain
            );

          surface =
            mix(
              surface,
              orangeRust,
              mediumMask *
              0.52
            );

          // ==================================================
          // 🏜️ DUSTY HIGHLANDS
          // ==================================================

          float highlands =
            fbm(
              uv * 7.0 +
              vec2(
                -2.0,
                4.0
              )
            );

          surface =
            mix(
              surface,
              dustyRock,
              smoothstep(
                0.70,
                0.88,
                highlands
              ) *
              0.24
            );

          // ==================================================
          // 🌋 DARK VALLEYS
          // ==================================================

          float valleys =
            fbm(
              uv * 8.0 +
              vec2(
                -3.0,
                4.0
              )
            );

          surface *=
            0.70 +
            valleys *
            0.45;

          // ==================================================
          // 🪨 FINE SURFACE DETAIL
          // ==================================================

          float detail =
            noise(
              uv * 55.0
            );

          surface +=
            (
              detail -
              0.5
            ) *
            0.038;

          // ==================================================
          // 🕳️ CRATER-LIKE MICRO STRUCTURE
          // ==================================================

          float craterNoise =
            noise(
              uv * 34.0
            );

          float craterDetail =
            noise(
              uv * 72.0
            );

          float craterMask =
            smoothstep(
              0.68,
              0.86,
              craterNoise
            );

          craterMask *=
            smoothstep(
              0.30,
              0.72,
              craterDetail
            );

          surface *=
            1.0 -
            craterMask *
            0.12;

          // ==================================================
          // ❄️ POLAR ICE CAPS
          // ==================================================

          float latitude =
            abs(
              uv.y -
              0.5
            ) *
            2.0;

          float polarIce =
            smoothstep(
              0.82,
              0.97,
              latitude
            );

          float iceNoise =
            noise(
              uv * 18.0
            );

          polarIce *=
            smoothstep(
              0.42,
              0.70,
              iceNoise +
              0.30
            );

          vec3 iceColor =
            vec3(
              0.76,
              0.72,
              0.66
            );

          surface =
            mix(
              surface,
              iceColor,
              polarIce *
              0.90
            );

          // ==================================================
          // ☀️ REAL SUN LIGHTING
          // ==================================================

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 marsToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              marsToSun
            );

          float directLight =
            max(
              NdotL,
              0.0
            );

          directLight =
            pow(
              directLight,
              0.70
            );

          // ==================================================
          // 🌗 DAY / NIGHT TRANSITION
          // ==================================================

          float daylight =
            smoothstep(
              -0.08,
              0.25,
              NdotL
            );

          // ==================================================
          // 🌞 SUNLIT SIDE
          // ==================================================

          float dayIntensity =
            0.105 +
            directLight *
            1.16;

          surface *=
            dayIntensity;

          // ==================================================
          // 🔥 WARM MARTIAN SUNLIGHT
          // ==================================================

          vec3 sunlightTint =
            vec3(
              1.0,
              0.91,
              0.78
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.15
            );

          // ==================================================
          // 🌅 TERMINATOR
          // ==================================================

          float twilight =
            smoothstep(
              -0.18,
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
              0.22,
              0.055,
              0.018
            );

          surface +=
            twilightColor *
            twilight *
            0.065;

          // ==================================================
          // 🌑 DEEP NIGHT SIDE
          // ==================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.17 +
            daylight *
            0.83;

          // Extremely subtle reflected space light
          surface +=
            vec3(
              0.0035,
              0.0012,
              0.0006
            ) *
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
   * 🌫️ SUBTLE MARTIAN ATMOSPHERE
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
              "#d66a42"
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

      // Mars axial rotation
      if (marsRef.current) {

        marsRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      // Very subtle atmosphere movement
      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time * 0.7
          ) *
          0.0012;

        atmosphereRef.current.scale.setScalar(
          pulse
        );
      }

      marsMaterial.uniforms.uTime.value =
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

      {/* 🔴 Mars Surface */}

      <Sphere
        ref={marsRef}
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
            marsMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* 🌫️ Thin Martian Atmosphere */}

      <Sphere
        ref={atmosphereRef}
        args={[
          1.025,
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
