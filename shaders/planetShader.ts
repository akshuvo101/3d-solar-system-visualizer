


import * as THREE from "three";

export const createPlanetPlasmaMaterial = (
  texture: THREE.Texture,
  colors: { a: string; b: string; c: string }
) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPlasmaSpeed: { value: 1 },
      uMap: { value: texture },
      uColorA: { value: new THREE.Color(colors.a) },
      uColorB: { value: new THREE.Color(colors.b) },
      uColorC: { value: new THREE.Color(colors.c) },
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;

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

      // simple noise
      float noise(vec2 p){
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;

        // animated distortion
        float n1 = noise(uv * 6.0 + uTime * 0.3);
        float n2 = noise(uv * 12.0 - uTime * 0.2);

        uv.x += (n1 - 0.5) * 0.1;
        uv.y += (n2 - 0.5) * 0.1;

        vec3 tex = texture2D(uMap, uv).rgb;

        // plasma heat calculation
        float heat = tex.r + n1 * 0.4 + n2 * 0.3;

        // color blending
        vec3 color = mix(uColorA, uColorB, heat);
        color = mix(color, uColorC, pow(heat, 2.0));

        // subtle brightness boost
        color += 0.1 * sin(uTime + uv.x * 10.0);

        gl_FragColor = vec4(color, 1.0);
      }
    `,

    toneMapped: false,
  });
};