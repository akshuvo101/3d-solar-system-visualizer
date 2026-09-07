import { Ring, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SaturnProps = {
  rotationSpeed?: number;
};

export const Saturn = ({
  rotationSpeed = 0.18,
}: SaturnProps) => {
  const saturnRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // ============================================================
  // SATURN BODY
  // ============================================================

  const saturnMaterial = useMemo(() => {
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
        // MAIN
        // ======================================================

        void main() {

          vec2 uv =
            vUv;

          // Slow Saturn atmospheric movement
          uv.x +=
            uTime *
            0.0025;

          // ====================================================
          // SATURN COLORS
          // ====================================================

          vec3 deepGold =
            vec3(
              0.13,
              0.085,
              0.045
            );

          vec3 darkGold =
            vec3(
              0.30,
              0.21,
              0.12
            );

          vec3 golden =
            vec3(
              0.58,
              0.45,
              0.27
            );

          vec3 paleGold =
            vec3(
              0.76,
              0.66,
              0.48
            );

          vec3 cream =
            vec3(
              0.91,
              0.82,
              0.64
            );

          // ====================================================
          // LARGE CLOUD STRUCTURE
          // ====================================================

          float largeClouds =
            fbm(
              vec2(
                uv.x * 3.0,
                uv.y * 13.0
              )
            );

          float mediumClouds =
            fbm(
              vec2(
                uv.x * 9.0,
                uv.y * 30.0
              )
              +
              vec2(
                uTime * 0.008,
                -uTime * 0.003
              )
            );

          float fineClouds =
            noise(
              uv * 70.0
            );

          // ====================================================
          // HORIZONTAL ATMOSPHERIC BANDS
          // ====================================================

          float latitude =
            uv.y;

          float bandPattern =
            sin(
              latitude *
              42.0
            );

          bandPattern =
            smoothstep(
              -0.15,
              0.65,
              bandPattern
            );

          float bandNoise =
            fbm(
              vec2(
                uv.x * 2.2,
                uv.y * 24.0
              )
              +
              vec2(
                uTime * 0.002,
                0.0
              )
            );

          bandPattern =
            bandPattern *
            0.72 +
            bandNoise *
            0.28;

          // ====================================================
          // BASE COLOR
          // ====================================================

          vec3 surface =
            mix(
              deepGold,
              darkGold,
              bandPattern
            );

          surface =
            mix(
              surface,
              golden,
              smoothstep(
                0.34,
                0.62,
                largeClouds
              ) *
              0.78
            );

          surface =
            mix(
              surface,
              paleGold,
              smoothstep(
                0.52,
                0.76,
                mediumClouds
              ) *
              0.62
            );

          surface =
            mix(
              surface,
              cream,
              smoothstep(
                0.70,
                0.90,
                mediumClouds
              ) *
              0.34
            );

          // ====================================================
          // ATMOSPHERIC STREAKS
          // ====================================================

          float streaks =
            noise(
              vec2(
                uv.x * 6.0 +
                sin(
                  uv.y * 24.0
                ) *
                1.8,

                uv.y * 65.0
              )
            );

          surface *=
            0.84 +
            streaks *
            0.24;

          // ====================================================
          // SUBTLE CLOUD FLOW
          // ====================================================

          float flow =
            fbm(
              vec2(
                uv.x * 15.0 +
                uTime * 0.004,
                uv.y * 42.0
              )
            );

          surface =
            mix(
              surface,
              surface *
              1.08,
              smoothstep(
                0.64,
                0.86,
                flow
              ) *
              0.20
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
              0.74,
              0.98,
              polar
            );

          vec3 polarColor =
            vec3(
              0.31,
              0.25,
              0.17
            );

          surface =
            mix(
              surface,
              polarColor,
              polarMask *
              0.28
            );

          // ====================================================
          // FINE DETAIL
          // ====================================================

          surface +=
            (
              fineClouds -
              0.5
            ) *
            0.024;

          // ====================================================
          // SUN LIGHTING
          // ====================================================

          vec3 normal =
            normalize(
              vNormal
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

          // Smooth terminator
          float daylight =
            smoothstep(
              -0.08,
              0.24,
              NdotL
            );

          float dayIntensity =
            0.075 +
            directLight *
            1.18;

          surface *=
            dayIntensity;

          // ====================================================
          // WARM SUNLIGHT
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
              0.17,
              0.050,
              0.018
            );

          surface +=
            twilightColor *
            twilight *
            0.05;

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

          surface +=
            vec3(
              0.003,
              0.0015,
              0.0007
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
  // SATURN ATMOSPHERE
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
          value: 0.15,
        },

        power: {
          value: 4.4,
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
  // SATURN MAIN RING
  // ============================================================

  const innerRingMaterial = useMemo(() => {
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
          float ringBands =
            sin(
              radial *
              210.0
            ) *
            0.5 +
            0.5;

          // Secondary ring variation
          float secondaryBands =
            sin(
              radial *
              92.0 +
              sin(
                radial *
                28.0
              ) *
              2.5
            ) *
            0.5 +
            0.5;

          float ringNoise =
            noise(
              vec2(
                radial * 75.0,
                uv.y * 15.0
              )
            );

          float brightness =
            ringBands *
            0.34 +
            secondaryBands *
            0.20 +
            ringNoise *
            0.46;

          vec3 darkRing =
            vec3(
              0.15,
              0.115,
              0.075
            );

          vec3 midRing =
            vec3(
              0.48,
              0.39,
              0.27
            );

          vec3 brightRing =
            vec3(
              0.80,
              0.70,
              0.53
            );

          vec3 ringColor =
            mix(
              darkRing,
              midRing,
              smoothstep(
                0.18,
                0.55,
                brightness
              )
            );

          ringColor =
            mix(
              ringColor,
              brightRing,
              smoothstep(
                0.62,
                0.90,
                brightness
              ) *
              0.72
            );

          float innerFade =
            smoothstep(
              0.0,
              0.055,
              radial
            );

          float outerFade =
            1.0 -
            smoothstep(
              0.43,
              0.50,
              radial
            );

          float alpha =
            innerFade *
            outerFade;

          // Cassini-like dark division
          float division =
            smoothstep(
              0.255,
              0.275,
              radial
            )
            *
            (
              1.0 -
              smoothstep(
                0.275,
                0.295,
                radial
              )
            );

          alpha *=
            1.0 -
            division *
            0.82;

          gl_FragColor =
            vec4(
              ringColor,
              alpha *
              0.84
            );
        }
      `,
    });
  }, []);

  // ============================================================
  // OUTER FAINT RING
  // ============================================================

  const outerRingMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#927b59",

      transparent: true,

      opacity: 0.28,

      side: THREE.DoubleSide,

      depthWrite: false,
    });
  }, []);

  // ============================================================
  // ANIMATION
  // ============================================================

  useFrame(
    ({ clock }, delta) => {

      const time =
        clock.getElapsedTime();

      // Saturn rotation
      if (saturnRef.current) {

        saturnRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      // Slow ring rotation
      if (ringGroupRef.current) {

        ringGroupRef.current.rotation.z +=
          delta *
          rotationSpeed *
          0.10;
      }

      // Subtle atmosphere pulse
      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time *
            0.55
          ) *
          0.0012;

        atmosphereRef.current.scale.setScalar(
          pulse
        );
      }

      saturnMaterial.uniforms.uTime.value =
        time;

      innerRingMaterial.uniforms.uTime.value =
        time;
    }
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <group>

      {/* Saturn Body */}

      <Sphere
        ref={saturnRef}
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
            saturnMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* Saturn Atmosphere */}

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

      {/* Saturn Rings */}

      <group
        ref={ringGroupRef}
        rotation={[
          THREE.MathUtils.degToRad(27),
          0,
          0,
        ]}
      >

        {/* Main Detailed Ring */}

        <Ring
          args={[
            1.35,
            2.35,
            128,
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

        {/* Inner Dark Ring */}

        <Ring
          args={[
            1.15,
            1.35,
            128,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#56452f"
            transparent
            opacity={0.68}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

        {/* Outer Faint Ring */}

        <Ring
          args={[
            2.35,
            2.62,
            128,
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

        {/* Bright Inner Ring */}

        <Ring
          args={[
            1.38,
            1.72,
            128,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#c2aa79"
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

      </group>

    </group>
  );
};