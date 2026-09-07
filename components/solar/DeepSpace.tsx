import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const DeepSpace = () => {
  const materialRef =
    useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0,
          },
        },

        vertexShader: `
          varying vec3 vWorldPosition;

          void main() {
            vec4 worldPosition =
              modelMatrix *
              vec4(position, 1.0);

            vWorldPosition =
              worldPosition.xyz;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `,

        fragmentShader: `
          varying vec3 vWorldPosition;

          uniform float uTime;

          // --------------------------------------------------
          // Hash
          // --------------------------------------------------
          float hash(vec3 p) {
            p =
              fract(
                p * 0.3183099 +
                vec3(
                  0.1,
                  0.2,
                  0.3
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

          // --------------------------------------------------
          // Smooth 3D Noise
          // --------------------------------------------------
          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);

            f =
              f *
              f *
              (
                3.0 -
                2.0 * f
              );

            float n000 =
              hash(i);

            float n100 =
              hash(
                i +
                vec3(
                  1.0,
                  0.0,
                  0.0
                )
              );

            float n010 =
              hash(
                i +
                vec3(
                  0.0,
                  1.0,
                  0.0
                )
              );

            float n110 =
              hash(
                i +
                vec3(
                  1.0,
                  1.0,
                  0.0
                )
              );

            float n001 =
              hash(
                i +
                vec3(
                  0.0,
                  0.0,
                  1.0
                )
              );

            float n101 =
              hash(
                i +
                vec3(
                  1.0,
                  0.0,
                  1.0
                )
              );

            float n011 =
              hash(
                i +
                vec3(
                  0.0,
                  1.0,
                  1.0
                )
              );

            float n111 =
              hash(
                i +
                vec3(
                  1.0,
                  1.0,
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

          // --------------------------------------------------
          // FBM
          // --------------------------------------------------
          float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;

            for (
              int i = 0;
              i < 6;
              i++
            ) {
              value +=
                noise(p) *
                amplitude;

              p *= 2.0;
              amplitude *= 0.5;
            }

            return value;
          }

          // --------------------------------------------------
          // Ridged cloud structure
          // --------------------------------------------------
          float ridgedNoise(vec3 p) {
            float n =
              fbm(p);

            return 1.0 -
              abs(
                n * 2.0 -
                1.0
              );
          }

          void main() {

            // Camera-facing spherical direction
            vec3 p =
              normalize(
                vWorldPosition
              );

            float time =
              uTime *
              0.008;

            // --------------------------------------------------
            // Large scale nebula structure
            // --------------------------------------------------
            float largeCloud =
              fbm(
                p * 1.55 +
                vec3(
                  time,
                  -time * 0.35,
                  time * 0.18
                )
              );

            // --------------------------------------------------
            // Medium scale cloud detail
            // --------------------------------------------------
            float mediumCloud =
              fbm(
                p * 3.6 -
                vec3(
                  time * 0.55,
                  time * 0.18,
                  -time * 0.30
                )
              );

            // --------------------------------------------------
            // Fine wisps
            // --------------------------------------------------
            float fineCloud =
              ridgedNoise(
                p * 8.0 +
                vec3(
                  -time * 0.30,
                  time * 0.20,
                  time * 0.12
                )
              );

            // --------------------------------------------------
            // Combined nebula
            // --------------------------------------------------
            float nebula =
              largeCloud * 0.58 +
              mediumCloud * 0.28 +
              fineCloud * 0.14;

            // --------------------------------------------------
            // Wispy nebula masks
            // --------------------------------------------------
            float violetMask =
              smoothstep(
                0.48,
                0.72,
                nebula
              );

            float cyanMask =
              smoothstep(
                0.54,
                0.78,
                mediumCloud
              );

            float magentaMask =
              smoothstep(
                0.62,
                0.86,
                largeCloud *
                0.72 +
                mediumCloud *
                0.28
              );

            // --------------------------------------------------
            // Deep-space base
            // --------------------------------------------------
            vec3 deepSpace =
              vec3(
                0.0018,
                0.0032,
                0.012
              );

            vec3 blue =
              vec3(
                0.012,
                0.028,
                0.085
              );

            vec3 violet =
              vec3(
                0.075,
                0.018,
                0.125
              );

            vec3 cyan =
              vec3(
                0.008,
                0.065,
                0.105
              );

            vec3 magenta =
              vec3(
                0.105,
                0.012,
                0.085
              );

            vec3 color =
              deepSpace;

            // Very subtle blue cosmic depth
            color +=
              blue *
              violetMask *
              0.32;

            // Main violet nebula
            color +=
              violet *
              pow(
                violetMask,
                1.35
              ) *
              0.42;

            // Cyan gas regions
            color +=
              cyan *
              pow(
                cyanMask,
                1.6
              ) *
              0.30;

            // Extremely subtle magenta highlights
            color +=
              magenta *
              pow(
                magentaMask,
                2.8
              ) *
              0.16;

            // --------------------------------------------------
            // Galactic depth variation
            // --------------------------------------------------
            float horizon =
              1.0 -
              abs(p.y);

            float galacticBand =
              smoothstep(
                0.10,
                0.78,
                horizon
              );

            color +=
              vec3(
                0.006,
                0.009,
                0.025
              ) *
              galacticBand;

            // --------------------------------------------------
            // Dark cloud pockets
            // --------------------------------------------------
            float darkCloud =
              smoothstep(
                0.34,
                0.60,
                largeCloud
              );

            color *=
              0.86 +
              darkCloud * 0.14;

            // --------------------------------------------------
            // Subtle animated cosmic variation
            // --------------------------------------------------
            float shimmer =
              sin(
                uTime * 0.025 +
                p.x * 4.0 +
                p.z * 3.0
              ) *
              0.5 +
              0.5;

            color +=
              vec3(
                0.002,
                0.003,
                0.010
              ) *
              shimmer;

            // --------------------------------------------------
            // Keep background extremely dark
            // --------------------------------------------------
            color =
              max(
                color,
                vec3(
                  0.0015,
                  0.0025,
                  0.009
                )
              );

            gl_FragColor =
              vec4(
                color,
                1.0
              );
          }
        `,

        side: THREE.BackSide,

        depthWrite: false,
        depthTest: false,

        toneMapped: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!materialRef.current)
      return;

    materialRef.current.uniforms.uTime.value =
      clock.getElapsedTime();
  });

  return (
    <mesh
      frustumCulled={false}
      renderOrder={-100}
    >
      <sphereGeometry
        args={[
          2200,
          64,
          64,
        ]}
      />

      <primitive
        ref={materialRef}
        object={material}
        attach="material"
      />
    </mesh>
  );
};