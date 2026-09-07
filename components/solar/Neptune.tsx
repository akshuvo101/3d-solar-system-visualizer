import { Ring, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type NeptuneProps = {
  rotationSpeed?: number;
};

export const Neptune = ({
  rotationSpeed = 0.085,
}: NeptuneProps) => {
  const neptuneRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  /*
   * ============================================================
   * 🔵 NEPTUNE PROCEDURAL SURFACE
   * ============================================================
   */

  const neptuneMaterial = useMemo(() => {
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

          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);

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
            (3.0 - 2.0 * f);

          return mix(a, b, u.x)
            +
            (c - a) *
            u.y *
            (1.0 - u.x)
            +
            (d - b) *
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

          vec2 uv = vUv;

          // Neptune's atmosphere flows east-west
          uv.x +=
            uTime *
            0.0035;

          // ====================================================
          // 🔵 NEPTUNE COLOR PALETTE
          // ====================================================

          vec3 abyssBlue =
            vec3(
              0.004,
              0.018,
              0.075
            );

          vec3 deepBlue =
            vec3(
              0.008,
              0.040,
              0.17
            );

          vec3 oceanBlue =
            vec3(
              0.012,
              0.105,
              0.36
            );

          vec3 royalBlue =
            vec3(
              0.025,
              0.19,
              0.58
            );

          vec3 electricBlue =
            vec3(
              0.08,
              0.34,
              0.76
            );

          vec3 icyBlue =
            vec3(
              0.38,
              0.65,
              0.90
            );

          // ====================================================
          // 🌊 LARGE-SCALE FLOW
          // ====================================================

          float largeFlow =
            fbm(
              vec2(
                uv.x * 2.8,
                uv.y * 6.5
              )
            );

          // ====================================================
          // 🌫️ MEDIUM TURBULENCE
          // ====================================================

          float mediumFlow =
            fbm(
              vec2(
                uv.x * 8.0,
                uv.y * 20.0
              )
              +
              vec2(
                uTime * 0.008,
                -uTime * 0.003
              )
            );

          // ====================================================
          // 🔹 FINE DETAIL
          // ====================================================

          float fineDetail =
            fbm(
              uv * 48.0
            );

          // ====================================================
          // 🌀 HORIZONTAL ATMOSPHERIC BANDS
          // ====================================================

          float bandWave =
            sin(
              uv.y *
              38.0
            ) *
            0.5 +
            0.5;

          float bandDistortion =
            noise(
              vec2(
                uv.x * 6.0,
                uv.y * 15.0
              )
            );

          float bands =
            bandWave *
            0.62 +
            bandDistortion *
            0.38;

          // Slightly soften the bands
          bands =
            smoothstep(
              0.18,
              0.82,
              bands
            );

          // ====================================================
          // 🎨 BASE ATMOSPHERIC COLOR
          // ====================================================

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
                0.72,
                largeFlow
              ) *
              0.72
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
              0.38
            );

          // ====================================================
          // ☁️ HIGH-ALTITUDE CLOUD STRUCTURES
          // ====================================================

          float cloudNoise =
            fbm(
              vec2(
                uv.x * 14.0,
                uv.y * 24.0
              )
              +
              vec2(
                -uTime * 0.012,
                uTime * 0.002
              )
            );

          float cloudMask =
            smoothstep(
              0.69,
              0.86,
              cloudNoise
            );

          surface =
            mix(
              surface,
              icyBlue,
              cloudMask *
              0.34
            );

          // ====================================================
          // 💨 FINE METHANE-ICE STREAKS
          // ====================================================

          float streakNoise =
            noise(
              vec2(
                uv.x * 28.0,
                uv.y * 6.0
              )
            );

          float streaks =
            smoothstep(
              0.66,
              0.88,
              streakNoise
            );

          surface =
            mix(
              surface,
              vec3(
                0.32,
                0.56,
                0.84
              ),
              streaks *
              0.18
            );

          // ====================================================
          // 🌪️ DARK STORM SYSTEMS
          // ====================================================

          float stormField =
            fbm(
              vec2(
                uv.x * 3.4,
                uv.y * 5.5
              )
              +
              vec2(
                1.8,
                3.7
              )
            );

          float storm =
            smoothstep(
              0.70,
              0.84,
              stormField
            );

          float stormDetail =
            noise(
              uv * 10.0 +
              vec2(
                3.0,
                1.7
              )
            );

          storm *=
            smoothstep(
              0.38,
              0.68,
              stormDetail
            );

          surface =
            mix(
              surface,
              vec3(
                0.003,
                0.012,
                0.055
              ),
              storm *
              0.42
            );

          // ====================================================
          // 🌀 SUBTLE STORM EYE / TURBULENCE
          // ====================================================

          float vortex =
            fbm(
              vec2(
                uv.x * 9.0 +
                sin(uv.y * 8.0),
                uv.y * 9.0
              )
            );

          float vortexMask =
            smoothstep(
              0.72,
              0.88,
              vortex
            );

          surface =
            mix(
              surface,
              vec3(
                0.16,
                0.38,
                0.70
              ),
              vortexMask *
              0.15
            );

          // ====================================================
          // 🧊 POLAR REGIONS
          // ====================================================

          float latitude =
            abs(
              uv.y -
              0.5
            ) *
            2.0;

          float polar =
            smoothstep(
              0.76,
              0.98,
              latitude
            );

          surface =
            mix(
              surface,
              vec3(
                0.12,
                0.31,
                0.62
              ),
              polar *
              0.20
            );

          // ====================================================
          // 🌫️ EQUATORIAL HAZE
          // ====================================================

          float equatorial =
            1.0 -
            smoothstep(
              0.08,
              0.36,
              abs(
                uv.y -
                0.5
              )
            );

          surface =
            mix(
              surface,
              vec3(
                0.025,
                0.16,
                0.48
              ),
              equatorial *
              0.12
            );

          // ====================================================
          // 🔹 MICRO DETAIL
          // ====================================================

          surface +=
            (fineDetail - 0.5) *
            0.022;

          // ====================================================
          // ☀️ REAL SUN LIGHTING
          // ====================================================

          vec3 neptuneToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normalize(vNormal),
              neptuneToSun
            );

          float diffuse =
            max(
              NdotL,
              0.0
            );

          // Strong but smooth terminator
          float day =
            smoothstep(
              0.015,
              0.42,
              diffuse
            );

          // ====================================================
          // 🌅 TWILIGHT
          // ====================================================

          float twilight =
            smoothstep(
              0.0,
              0.22,
              diffuse
            )
            *
            (
              1.0 -
              smoothstep(
                0.22,
                0.48,
                diffuse
              )
            );

          // ====================================================
          // ☀️ SUN-FACING BLUE HIGHLIGHT
          // ====================================================

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.06,
                1.08,
                1.12
              ),
              day *
              0.22
            );

          // ====================================================
          // 🌅 TERMINATOR BLUE
          // ====================================================

          surface +=
            vec3(
              0.018,
              0.055,
              0.15
            ) *
            twilight;

          // ====================================================
          // 🌗 DAY / NIGHT BALANCE
          // ====================================================

          surface *=
            0.28 +
            day *
            0.72;

          // ====================================================
          // 🌑 DEEP NIGHT SIDE
          // ====================================================

          float night =
            1.0 -
            day;

          surface *=
            1.0 -
            night *
            0.12;

          surface +=
            vec3(
              0.002,
              0.007,
              0.028
            ) *
            night;

          // ====================================================
          // ✨ FINAL CONTRAST
          // ====================================================

          surface =
            max(
              surface,
              vec3(
                0.002,
                0.006,
                0.025
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
   * ✨ SUBTLE NEPTUNE ATMOSPHERE
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
          value: new THREE.Color(
            "#3d8cff"
          ),
        },

        intensity: {
          value: 0.17,
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

  /*
   * ============================================================
   * 💍 NEPTUNE RING MATERIAL
   * ============================================================
   */

  const ringMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,

      side: THREE.DoubleSide,

      depthWrite: false,

      uniforms: {
        uTime: {
          value: 0,
        },
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {

          vUv = uv;

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

        uniform float uTime;

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

          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);

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
            (3.0 - 2.0 * f);

          return mix(a, b, u.x)
            +
            (c - a) *
            u.y *
            (1.0 - u.x)
            +
            (d - b) *
            u.x *
            u.y;
        }

        // ======================================================
        // MAIN
        // ======================================================

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

          // Fine ring divisions
          float radialPattern =
            sin(
              radial *
              320.0
            ) *
            0.5 +
            0.5;

          // Secondary irregularity
          float irregular =
            noise(
              vec2(
                radial *
                130.0,
                uv.y *
                10.0
              )
            );

          float brightness =
            radialPattern *
            0.25 +
            irregular *
            0.75;

          // ====================================================
          // 💙 COOL DARK RING COLOR
          // ====================================================

          vec3 darkRing =
            vec3(
              0.035,
              0.065,
              0.12
            );

          vec3 brightRing =
            vec3(
              0.18,
              0.30,
              0.46
            );

          vec3 ringColor =
            mix(
              darkRing,
              brightRing,
              brightness
            );

          // ====================================================
          // 🌑 SUBTLE RING DIVISION
          // ====================================================

          float division =
            smoothstep(
              0.47,
              0.50,
              radial
            ) *
            (
              1.0 -
              smoothstep(
                0.50,
                0.53,
                radial
              )
            );

          ringColor *=
            1.0 -
            division *
            0.75;

          // ====================================================
          // ALPHA
          // ====================================================

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
              0.22
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

  useFrame(({ clock }, delta) => {

    const time =
      clock.getElapsedTime();

    // Neptune axial rotation
    if (neptuneRef.current) {
      neptuneRef.current.rotation.y +=
        delta *
        rotationSpeed;
    }

    // Very subtle ring motion
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z +=
        delta *
        rotationSpeed *
        0.035;
    }

    // Subtle atmosphere breathing
    if (atmosphereRef.current) {

      const pulse =
        1 +
        Math.sin(
          time *
          0.42
        ) *
        0.0025;

      atmosphereRef.current.scale.setScalar(
        pulse
      );
    }

    neptuneMaterial.uniforms.uTime.value =
      time;

    ringMaterial.uniforms.uTime.value =
      time;
  });

  /*
   * ============================================================
   * 🎨 RENDER
   * ============================================================
   */

  return (
    <group>

      {/* ======================================================
          🔵 NEPTUNE BODY
          ====================================================== */}

      <Sphere
        ref={neptuneRef}
        args={[
          1,
          64,
          64,
        ]}
        castShadow
        receiveShadow
      >
        <primitive
          object={neptuneMaterial}
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          ✨ SUBTLE ATMOSPHERE
          ====================================================== */}

      <Sphere
        ref={atmosphereRef}
        args={[
          1.028,
          64,
          64,
        ]}
      >
        <primitive
          object={atmosphereMaterial}
          attach="material"
        />
      </Sphere>

      {/* ======================================================
          💍 FAINT NEPTUNE RINGS
          ====================================================== */}

      <group
        ref={ringGroupRef}
        rotation={[
          THREE.MathUtils.degToRad(28),
          0,
          0,
        ]}
      >

        {/* Main faint ring */}
        <Ring
          args={[
            1.28,
            1.39,
            128,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <primitive
            object={ringMaterial}
            attach="material"
          />
        </Ring>

        {/* Outer faint ring */}
        <Ring
          args={[
            1.46,
            1.51,
            128,
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
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

        {/* Extremely faint outer dust ring */}
        <Ring
          args={[
            1.55,
            1.58,
            128,
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
            opacity={0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

      </group>

    </group>
  );
};