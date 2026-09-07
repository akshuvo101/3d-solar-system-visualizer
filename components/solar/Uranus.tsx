import { Ring, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type UranusProps = {
  rotationSpeed?: number;
};

export const Uranus = ({
  rotationSpeed = -0.09,
}: UranusProps) => {
  const uranusRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  // ============================================================
  // URANUS BODY
  // ============================================================

  const uranusMaterial = useMemo(() => {
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

          // Extremely slow atmospheric drift
          uv.x +=
            uTime *
            0.0015;

          // ====================================================
          // URANUS COLORS
          // ====================================================

          vec3 deepCyan =
            vec3(
              0.025,
              0.12,
              0.15
            );

          vec3 cyan =
            vec3(
              0.10,
              0.36,
              0.40
            );

          vec3 blueCyan =
            vec3(
              0.22,
              0.57,
              0.61
            );

          vec3 paleCyan =
            vec3(
              0.50,
              0.77,
              0.79
            );

          vec3 icy =
            vec3(
              0.76,
              0.91,
              0.90
            );

          // ====================================================
          // LARGE ATMOSPHERIC VARIATION
          // ====================================================

          float largeNoise =
            fbm(
              vec2(
                uv.x * 2.8,
                uv.y * 8.0
              )
            );

          float mediumNoise =
            fbm(
              vec2(
                uv.x * 8.0,
                uv.y * 20.0
              )
              +
              vec2(
                uTime * 0.004,
                -uTime * 0.002
              )
            );

          float fineNoise =
            noise(
              uv * 55.0
            );

          // ====================================================
          // SUBTLE HORIZONTAL BANDS
          // ====================================================

          float bands =
            sin(
              uv.y *
              28.0
            ) *
            0.5 +
            0.5;

          bands =
            smoothstep(
              0.28,
              0.72,
              bands
            );

          float bandVariation =
            fbm(
              vec2(
                uv.x * 2.0,
                uv.y * 18.0
              )
            );

          bands =
            bands *
            0.72 +
            bandVariation *
            0.28;

          // ====================================================
          // BASE ATMOSPHERE
          // ====================================================

          vec3 surface =
            mix(
              deepCyan,
              cyan,
              bands
            );

          surface =
            mix(
              surface,
              blueCyan,
              smoothstep(
                0.36,
                0.65,
                largeNoise
              ) *
              0.62
            );

          surface =
            mix(
              surface,
              paleCyan,
              smoothstep(
                0.55,
                0.78,
                mediumNoise
              ) *
              0.52
            );

          surface =
            mix(
              surface,
              icy,
              smoothstep(
                0.76,
                0.94,
                mediumNoise
              ) *
              0.25
            );

          // ====================================================
          // CLOUD DETAIL
          // ====================================================

          float cloudStreak =
            noise(
              vec2(
                uv.x * 7.0 +
                sin(
                  uv.y * 18.0
                ) *
                1.4,

                uv.y * 48.0
              )
            );

          surface *=
            0.90 +
            cloudStreak *
            0.16;

          surface +=
            (
              fineNoise -
              0.5
            ) *
            0.016;

          // ====================================================
          // POLAR BRIGHTNESS
          // ====================================================

          float latitude =
            abs(
              uv.y -
              0.5
            ) *
            2.0;

          float polarMask =
            smoothstep(
              0.70,
              0.98,
              latitude
            );

          surface =
            mix(
              surface,
              paleCyan,
              polarMask *
              0.20
            );

          // ====================================================
          // SUBTLE EQUATORIAL HAZE
          // ====================================================

          float equator =
            1.0 -
            smoothstep(
              0.18,
              0.48,
              abs(
                uv.y -
                0.5
              )
            );

          surface =
            mix(
              surface,
              surface *
              1.05,
              equator *
              0.16
            );

          // ====================================================
          // SUN LIGHTING
          // ====================================================

          vec3 normal =
            normalize(
              vNormal
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
            1.12;

          surface *=
            dayIntensity;

          // ====================================================
          // COOL SUNLIGHT TINT
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
              0.12
            );

          // ====================================================
          // TWILIGHT / TERMINATOR
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
              0.025,
              0.10,
              0.12
            );

          surface +=
            twilightColor *
            twilight *
            0.10;

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
              0.001,
              0.004,
              0.005
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
  // URANUS ATMOSPHERE GLOW
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
              "#61d2d8"
            ),
        },

        intensity: {
          value: 0.16,
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
  // URANUS RING MATERIAL
  // ============================================================

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

          // Fine ring structure
          float ringPattern =
            sin(
              radial *
              235.0
            ) *
            0.5 +
            0.5;

          float secondaryPattern =
            sin(
              radial *
              88.0
            ) *
            0.5 +
            0.5;

          float ringNoise =
            noise(
              vec2(
                radial *
                95.0,

                uv.y *
                12.0
              )
            );

          float brightness =
            ringPattern *
            0.34 +
            secondaryPattern *
            0.18 +
            ringNoise *
            0.48;

          vec3 darkRing =
            vec3(
              0.075,
              0.15,
              0.15
            );

          vec3 midRing =
            vec3(
              0.30,
              0.43,
              0.42
            );

          vec3 brightRing =
            vec3(
              0.58,
              0.69,
              0.66
            );

          vec3 ringColor =
            mix(
              darkRing,
              midRing,
              smoothstep(
                0.18,
                0.56,
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
              0.65
            );

          float innerFade =
            smoothstep(
              0.015,
              0.065,
              radial
            );

          float outerFade =
            1.0 -
            smoothstep(
              0.42,
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
              0.48
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

      // Uranus retrograde rotation
      if (uranusRef.current) {

        uranusRef.current.rotation.y +=
          delta *
          rotationSpeed;
      }

      // Very subtle ring motion
      if (ringGroupRef.current) {

        ringGroupRef.current.rotation.z +=
          delta *
          rotationSpeed *
          0.08;
      }

      // Atmosphere pulse
      if (atmosphereRef.current) {

        const pulse =
          1 +
          Math.sin(
            time *
            0.5
          ) *
          0.0012;

        atmosphereRef.current.scale.setScalar(
          pulse
        );
      }

      uranusMaterial.uniforms.uTime.value =
        time;

      ringMaterial.uniforms.uTime.value =
        time;
    }
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <group>

      {/* Uranus Body */}

      <Sphere
        ref={uranusRef}
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
            uranusMaterial
          }
          attach="material"
        />
      </Sphere>

      {/* Uranus Atmosphere */}

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

      {/* Uranus Rings */}

      <group
        ref={ringGroupRef}
        rotation={[
          THREE.MathUtils.degToRad(98),
          0,
          0,
        ]}
      >

        {/* Main Ring */}

        <Ring
          args={[
            1.30,
            1.48,
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
              ringMaterial
            }
            attach="material"
          />
        </Ring>

        {/* Middle Ring */}

        <Ring
          args={[
            1.55,
            1.68,
            128,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#718f8d"
            transparent
            opacity={0.27}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

        {/* Outer Faint Ring */}

        <Ring
          args={[
            1.75,
            1.82,
            128,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <meshBasicMaterial
            color="#9bb0ac"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Ring>

      </group>

    </group>
  );
};