
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
        // CRATER FIELD
        // ======================================================

        float craterField(vec2 uv) {

          float large =
            noise(
              uv * 18.0
            );

          float medium =
            noise(
              uv * 42.0
            );

          float small =
            noise(
              uv * 90.0
            );

          return
            large * 0.55 +
            medium * 0.30 +
            small * 0.15;
        }

        // ======================================================
        // MAIN
        // ======================================================

        void main() {

          vec2 uv =
            vUv;

          // ==================================================
          // ☿ MERCURY ROCK PALETTE
          // ==================================================

          vec3 darkRock =
            vec3(
              0.055,
              0.053,
              0.050
            );

          vec3 grayRock =
            vec3(
              0.18,
              0.175,
              0.165
            );

          vec3 lightRock =
            vec3(
              0.32,
              0.31,
              0.285
            );

          vec3 brightRock =
            vec3(
              0.43,
              0.41,
              0.37
            );

          // ==================================================
          // 🪨 LARGE GEOLOGICAL REGIONS
          // ==================================================

          float terrain =
            fbm(
              uv * 3.2 +
              vec2(
                4.0,
                2.0
              )
            );

          vec3 surface =
            mix(
              darkRock,
              grayRock,
              terrain
            );

          surface =
            mix(
              surface,
              lightRock,
              smoothstep(
                0.55,
                0.78,
                terrain
              )
            );

          // ==================================================
          // 🕳️ CRATERS
          // ==================================================

          float craters =
            craterField(uv);

          float craterMask =
            smoothstep(
              0.56,
              0.80,
              craters
            );

          surface =
            mix(
              surface,
              darkRock,
              craterMask * 0.48
            );

          // ==================================================
          // ⛰️ HIGHLANDS
          // ==================================================

          float highlands =
            fbm(
              uv * 8.0 +
              vec2(
                -2.0,
                5.0
              )
            );

          float highlandMask =
            smoothstep(
              0.68,
              0.88,
              highlands
            );

          surface =
            mix(
              surface,
              brightRock,
              highlandMask * 0.40
            );

          // ==================================================
          // 🪨 FINE ROCK DETAIL
          // ==================================================

          float detail =
            noise(
              uv * 100.0
            );

          surface +=
            (
              detail -
              0.5
            ) *
            0.028;

          // ==================================================
          // ☀️ REAL SUN LIGHTING
          // ==================================================

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

          // --------------------------------------------------
          // Clean day/night transition
          // --------------------------------------------------

          float daylight =
            smoothstep(
              -0.06,
              0.28,
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

          // ==================================================
          // 🌞 DAY SIDE
          // ==================================================

          float dayIntensity =
            0.10 +
            directLight *
            1.18;

          surface *=
            dayIntensity;

          // ==================================================
          // 🔥 SUBTLE SUN WARMTH
          // ==================================================

          vec3 sunlightTint =
            vec3(
              1.0,
              0.94,
              0.84
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              daylight *
              0.12
            );

          // ==================================================
          // 🌅 TWILIGHT / TERMINATOR
          // ==================================================

          float twilight =
            smoothstep(
              -0.18,
              0.12,
              NdotL
            )
            *
            (
              1.0 -
              smoothstep(
                0.05,
                0.28,
                NdotL
              )
            );

          vec3 warmTwilight =
            vec3(
              0.16,
              0.075,
              0.025
            );

          surface +=
            warmTwilight *
            twilight *
            0.055;

          // ==================================================
          // 🌑 DEEP NIGHT SIDE
          // ==================================================

          float night =
            1.0 -
            daylight;

          surface *=
            0.18 +
            daylight *
            0.82;

          // Very subtle reflected-space light
          surface +=
            vec3(
              0.0035,
              0.0032,
              0.0028
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
   * 🌫️ EXTREMELY SUBTLE MERCURY EXOSPHERE
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
              "#c8c3b7"
            ),
        },

        intensity: {
          value: 0.055,
        },

        power: {
          value: 5.5,
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

      // Mercury rotation
      if (mercuryRef.current) {

        mercuryRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      // Extremely subtle exosphere pulse
      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time * 0.8
          ) *
          0.001;

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
