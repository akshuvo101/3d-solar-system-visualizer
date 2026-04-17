import * as THREE from "three";

export const createSunMaterial = (texture: THREE.Texture) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: texture },
    },
    vertexShader: `...`,
    fragmentShader: `...`,
  });
};