import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type JupiterProps = {
  rotationSpeed?: number;
};

export const Jupiter = ({
  rotationSpeed = 0.22,
}: JupiterProps) => {
  const jupiterRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const jupiterMaterial = useMemo(() => {
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
        // GREAT RED SPOT
        // ======================================================

        float redSpot(vec2 uv) {

          vec2 center =
            vec2(
              0.73,
              0.36
            );

          vec2 p =
            uv -
            center;

          p.x *= 1.65;
          p.y *= 0.85;

          float distanceFromCenter =
            length(p);

          float spot =
            1.0 -
            smoothstep(
              0.055,
              0.205,
              distanceFromCenter
            );

          float turbulence =
            fbm(
              uv * 35.0 +
              vec2(
                uTime * 0.003,
                -uTime * 0.002
              )
            );

          spot *=
            0.68 +
            turbulence *
            0.38;

          return spot;
        }

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec2 uv =
            vUv;

          // Slow atmospheric drift
          uv.x +=
            uTime * 0.003;

          // ====================================================
          // JUPITER COLORS
          // ====================================================

          vec3 deepBrown =
            vec3(
              0.115,
              0.060,
              0.035
            );

          vec3 darkBrown =
            vec3(
              0.25,
              0.135,
              0.075
            );

          vec3 brown =
            vec3(
              0.43,
              0.25,
              0.14
            );

          vec3 orange =
            vec3(
              0.67,
              0.42,
              0.24
            );

          vec3 cream =
            vec3(
              0.82,
              0.69,
              0.51
            );

          vec3 paleCream =
            vec3(
              0.94,
              0.85,
              0.68
            );

          // ====================================================
          // LARGE ATMOSPHERIC STRUCTURES
          // ====================================================

          float largeNoise =
            fbm(
              vec2(
                uv.x * 3.5,
                uv.y * 16.0
              )
            );

          float mediumNoise =
            fbm(
              vec2(
                uv.x * 10.0,
                uv.y * 32.0
              )
              +
              vec2(
                uTime * 0.01,
                -uTime * 0.004
              )
            );

          float fineNoise =
            noise(
              uv * 75.0
            );

          // ====================================================
          // HORIZONTAL GAS BANDS
          // ====================================================

          float latitude =
            uv.y;

          float bands =
            sin(
              latitude *
              34.0
            );

          bands =
            smoothstep(
              -0.25,
              0.55,
              bands
            );

          float bandNoise =
            fbm(
              vec2(
                uv.x * 2.5,
                uv.y * 20.0
              )
              +
              vec2(
                uTime * 0.002,
                0.0
              )
            );

          bands =
            bands * 0.68 +
            bandNoise * 0.32;

          // ====================================================
          // BASE ATMOSPHERE
          // ====================================================

          vec3 surface =
            mix(
              deepBrown,
              darkBrown,
              bands
            );

          surface =
            mix(
              surface,
              brown,
              smoothstep(
                0.30,
                0.58,
                largeNoise
              ) *
              0.72
            );

          surface =
            mix(
              surface,
              orange,
              smoothstep(
                0.42,
                0.68,
                largeNoise
              ) *
              0.58
            );

          surface =
            mix(
              surface,
              cream,
              smoothstep(
                0.54,
                0.76,
                mediumNoise
              ) *
              0.66
            );

          surface =
            mix(
              surface,
              paleCream,
              smoothstep(
                0.72,
                0.92,
                mediumNoise
              ) *
              0.44
            );

          // ====================================================
          // TURBULENT CLOUD STREAKS
          // ====================================================

          float streakNoise =
            noise(
              vec2(
                uv.x * 7.0 +
                sin(
                  uv.y * 20.0
                ) *
                2.0,

                uv.y * 55.0
              )
            );

          surface *=
            0.82 +
            streakNoise *
            0.30;

          // Additional horizontal turbulent flow
          float flowNoise =
            fbm(
              vec2(
                uv.x * 14.0 +
                uTime * 0.004,
                uv.y * 48.0
              )
            );

          surface =
            mix(
              surface,
              surface *
              1.10,
              smoothstep(
                0.60,
                0.85,
                flowNoise
              ) *
              0.22
            );

          // ====================================================
          // GREAT RED SPOT
          // ====================================================

          float spot =
            redSpot(uv);

          vec3 spotDark =
            vec3(
              0.36,
              0.075,
              0.035
            );

          vec3 spotColor =
            vec3(
              0.54,
              0.14,
              0.065
            );

          vec3 spotHighlight =
            vec3(
              0.72,
              0.27,
              0.12
            );

          float spotNoise =
            fbm(
              uv * 28.0 +
              vec2(
                uTime * 0.003,
                0.0
              )
            );

          spotColor =
            mix(
              spotDark,
              spotColor,
              spotNoise
            );

          spotColor =
            mix(
              spotColor,
              spotHighlight,
              smoothstep(
                0.60,
                0.88,
                spotNoise
              ) *
              0.45
            );

          surface =
            mix(
              surface,
              spotColor,
              spot *
              0.88
            );

          // ====================================================
          // RED SPOT INNER SWIRL
          // ====================================================

          vec2 spotCenter =
            vec2(
              0.73,
              0.36
            );

          vec2 spotPosition =
            uv -
            spotCenter;

          float angle =
            atan(
              spotPosition.y,
              spotPosition.x
            );

          float radius =
            length(
              spotPosition
            );

          float swirl =
            sin(
              angle * 8.0 +
              radius * 52.0 -
              uTime * 0.7
            );

          swirl =
            smoothstep(
              -0.25,
              0.70,
              swirl
            );

          surface =
            mix(
              surface,
              spotHighlight,
              spot *
              swirl *
              0.16
            );

          // ====================================================
          // POLAR REGIONS
          // ====================================================

          float polar =
            abs(
              uv.y -
              0.5
            ) *
            2.0;

          float polarMask =
            smoothstep(
              0.72,
              0.98,
              polar
            );

          vec3 polarColor =
            vec3(
              0.36,
              0.29,
              0.22
            );

          surface =
            mix(
              surface,
              polarColor,
              polarMask *
              0.34
            );

          // ====================================================
          // FINE CLOUD DETAIL
          // ====================================================

          surface +=
            (
              fineNoise -
              0.5
            ) *
            0.032;

          // ====================================================
          // SUN LIGHTING
          // ====================================================

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 jupiterToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              jupiterToSun
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

          // Soft transition around terminator
          float daylight =
            smoothstep(
              -0.08,
              0.24,
              NdotL
            );

          float dayIntensity =
            0.075 +
            directLight *
            1.22;

          surface *=
            dayIntensity;

          // ====================================================
          // WARM JUPITER SUNLIGHT
          // ====================================================

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
              0.14
            );

          // ====================================================
          // TWILIGHT
          // ====================================================

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
                0.05,
                0.30,
                NdotL
              )
            );

          vec3 twilightColor =
            vec3(
              0.18,
              0.055,
              0.022
            );

          surface +=
            twilightColor *
            twilight *
            0.055;

          // ====================================================
          // NIGHT SIDE
          // ====================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.16 +
            daylight *
            0.84;

          surface +=
            vec3(
              0.0035,
              0.0017,
              0.0008
            ) *
            night;

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

  // ============================================================
  // JUPITER ATMOSPHERE
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
              "#d6a06a"
            ),
        },

        intensity: {
          value: 0.17,
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

  // ============================================================
  // ANIMATION
  // ============================================================

  useFrame(
    ({ clock }, delta) => {

      const time =
        clock.getElapsedTime();

      if (jupiterRef.current) {

        jupiterRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

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

      jupiterMaterial.uniforms.uTime.value =
        time;
    }
  );

  return (
    <group>

      {/* Jupiter Main Body */}

      <Sphere
        ref={jupiterRef}
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
            jupiterMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* Jupiter Atmosphere */}

      <Sphere
        ref={atmosphereRef}
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

    </group>
  );
};