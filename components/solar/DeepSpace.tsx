import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const DeepSpace = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
        },

        vertexShader: `
          varying vec3 vWorldPosition;

          void main() {
            vec4 worldPosition =
              modelMatrix *
              vec4(position, 1.0);

            vWorldPosition = worldPosition.xyz;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `,

        fragmentShader: `
          varying vec3 vWorldPosition;

          uniform float uTime;

          // -----------------------------
          // Random
          // -----------------------------
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(
              p.x * p.y * p.z *
              (p.x + p.y + p.z)
            );
          }

          // -----------------------------
          // 3D Noise
          // -----------------------------
          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);

            f = f * f * (3.0 - 2.0 * f);

            float n000 = hash(i);
            float n100 = hash(i + vec3(1.0, 0.0, 0.0));
            float n010 = hash(i + vec3(0.0, 1.0, 0.0));
            float n110 = hash(i + vec3(1.0, 1.0, 0.0));

            float n001 = hash(i + vec3(0.0, 0.0, 1.0));
            float n101 = hash(i + vec3(1.0, 0.0, 1.0));
            float n011 = hash(i + vec3(0.0, 1.0, 1.0));
            float n111 = hash(i + vec3(1.0, 1.0, 1.0));

            float x00 = mix(n000, n100, f.x);
            float x10 = mix(n010, n110, f.x);
            float x01 = mix(n001, n101, f.x);
            float x11 = mix(n011, n111, f.x);

            float y0 = mix(x00, x10, f.y);
            float y1 = mix(x01, x11, f.y);

            return mix(y0, y1, f.z);
          }

          // -----------------------------
          // Fractal Brownian Motion
          // -----------------------------
          float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;

            for (int i = 0; i < 5; i++) {
              value += noise(p) * amplitude;
              p *= 2.0;
              amplitude *= 0.5;
            }

            return value;
          }

          void main() {

            // Camera-facing direction
            vec3 p =
              normalize(vWorldPosition);

            float time =
              uTime * 0.015;

            // Large cosmic clouds
            float cloud1 =
              fbm(
                p * 2.2 +
                vec3(
                  time,
                  -time * 0.6,
                  time * 0.35
                )
              );

            // Smaller details
            float cloud2 =
              fbm(
                p * 5.0 -
                vec3(
                  time * 0.7,
                  time * 0.35,
                  -time
                )
              );

            float cloud =
              cloud1 * 0.75 +
              cloud2 * 0.25;

            // -----------------------------
            // Nebula regions
            // -----------------------------
            float nebulaA =
              smoothstep(
                0.48,
                0.82,
                cloud
              );

            float nebulaB =
              smoothstep(
                0.52,
                0.78,
                cloud2
              );

            // -----------------------------
            // Cosmic colors
            // -----------------------------
            vec3 deepBlue =
              vec3(
                0.008,
                0.015,
                0.055
              );

            vec3 violet =
              vec3(
                0.12,
                0.025,
                0.20
              );

            vec3 cyan =
              vec3(
                0.015,
                0.10,
                0.18
              );

            vec3 magenta =
              vec3(
                0.20,
                0.025,
                0.16
              );

            vec3 color =
              deepBlue;

            color +=
              violet *
              nebulaA *
              0.45;

            color +=
              cyan *
              nebulaB *
              0.30;

            color +=
              magenta *
              pow(nebulaA, 3.0) *
              0.20;

            // -----------------------------
            // Subtle central depth
            // -----------------------------
            float depthFade =
              smoothstep(
                0.0,
                1.0,
                abs(p.y)
              );

            color *=
              0.72 +
              depthFade * 0.28;

            // Keep background dark
            color =
              max(
                color,
                vec3(0.002, 0.003, 0.012)
              );

            gl_FragColor =
              vec4(color, 1.0);
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
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value =
      clock.getElapsedTime();
  });

  return (
    <mesh
      frustumCulled={false}
      renderOrder={-100}
    >
      <sphereGeometry args={[2200, 64, 64]} />

      <primitive
        ref={materialRef}
        object={material}
        attach="material"
      />
    </mesh>
  );
};