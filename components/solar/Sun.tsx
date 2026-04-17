import { Sphere, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
// ☀️ Sun
export const Sun = () => {
  const texture = useTexture("/textures/sun.jpg") as THREE.Texture;
  const coreRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.ShaderMaterial>(null);
  const hotCoreRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const plasmaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMap: { value: texture },
          uColorA: { value: new THREE.Color("#ff2200") },
          uColorB: { value: new THREE.Color("#ff8a00") },
          uColorC: { value: new THREE.Color("#ffd36b") },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform sampler2D uMap;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          void main() {
            vec2 uv = vUv;
            float n1 = noise(uv * 7.0 + vec2(uTime * 0.45, -uTime * 0.3));
            float n2 = noise(uv * 14.0 + vec2(-uTime * 0.34, uTime * 0.52));
            vec2 flowUv = uv + (n1 - 0.5) * 0.15 + (n2 - 0.5) * 0.09;

            vec3 tex = texture2D(uMap, flowUv).rgb;
            float heat = smoothstep(0.15, 1.0, tex.r + n1 * 0.5 + n2 * 0.22);
            vec3 fire = mix(uColorA, uColorB, heat);
            fire = mix(fire, uColorC, pow(heat, 2.0) * 0.85);

            gl_FragColor = vec4(fire, 1.0);
          }
        `,
        toneMapped: false,
      }),
    [texture],
  );
  const fresnelMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          glowColor: { value: new THREE.Color("#ff3a1a") },
          intensity: { value: 0.8 },
          power: { value: 2.8 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          uniform vec3 glowColor;
          uniform float intensity;
          uniform float power;
          void main() {
            float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), power);
            gl_FragColor = vec4(glowColor, fresnel * intensity);
          }
        `,
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3.2) * 0.05;
    if (plasmaRef.current) {
      plasmaRef.current.uniforms.uTime.value = t;
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y += delta * 0.45;
    }

    if (hotCoreRef.current) {
      hotCoreRef.current.scale.setScalar(0.95 + Math.sin(t * 4.8) * 0.03);
    }

    if (outerRef.current) {
      outerRef.current.scale.setScalar(1.15 + Math.sin(t * 2.4) * 0.04);
    }
  });

  return (
    <group>
      <Sphere ref={coreRef} args={[5.45, 48, 48]}>
        <primitive ref={plasmaRef} object={plasmaMaterial} attach="material" />
      </Sphere>

      <Sphere ref={hotCoreRef} args={[4.5, 40, 40]}>
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>

      <Sphere ref={outerRef} args={[4.5, 18, 18]}>
        <meshBasicMaterial
          color="#ff1a1a"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>

      <mesh>
        <sphereGeometry args={[5.5, 48, 48]} />
        <primitive object={fresnelMaterial} attach="material" />
      </mesh>
    </group>
  );
};
