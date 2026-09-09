import { Sphere } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export const Mars = () => {
  const marsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: {
          value: new THREE.Vector3(0, 0, 0),
        },
      },

      vertexShader: `
        varying vec3 vLocalDirection;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vLocalDirection = normalize(position);

          vec4 worldPosition =
            modelMatrix *
            vec4(position, 1.0);

          vWorldPosition = worldPosition.xyz;

          vNormal =
            normalize(
              mat3(modelMatrix) * normal
            );

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        varying vec3 vLocalDirection;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform vec3 uSunPosition;

        float hash3(vec3 p) {
          p =
            fract(
              p * 0.3183099 +
              vec3(0.71, 0.113, 0.419)
            );

          p +=
            dot(
              p,
              p.yzx + 19.19
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);

          f =
            f * f *
            (3.0 - 2.0 * f);

          float n000 =
            hash3(i + vec3(0.0, 0.0, 0.0));

          float n100 =
            hash3(i + vec3(1.0, 0.0, 0.0));

          float n010 =
            hash3(i + vec3(0.0, 1.0, 0.0));

          float n110 =
            hash3(i + vec3(1.0, 1.0, 0.0));

          float n001 =
            hash3(i + vec3(0.0, 0.0, 1.0));

          float n101 =
            hash3(i + vec3(1.0, 0.0, 1.0));

          float n011 =
            hash3(i + vec3(0.0, 1.0, 1.0));

          float n111 =
            hash3(i + vec3(1.0, 1.0, 1.0));

          float x00 =
            mix(n000, n100, f.x);

          float x10 =
            mix(n010, n110, f.x);

          float x01 =
            mix(n001, n101, f.x);

          float x11 =
            mix(n011, n111, f.x);

          float y0 =
            mix(x00, x10, f.y);

          float y1 =
            mix(x01, x11, f.y);

          return mix(y0, y1, f.z);
        }

        float fbm3(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;

          for (int i = 0; i < 5; i++) {
            value +=
              noise3(p) *
              amplitude;

            p *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        float ridgedNoise(vec3 p) {
          float n = noise3(p);

          n =
            1.0 -
            abs(n * 2.0 - 1.0);

          return n * n;
        }

        float rockField(vec3 direction) {
          float broad =
            fbm3(
              direction * 2.7 +
              vec3(2.1, -1.4, 3.7)
            );

          float medium =
            fbm3(
              direction * 7.5 +
              vec3(-4.0, 2.6, 1.5)
            );

          float fine =
            fbm3(
              direction * 19.0 +
              vec3(3.4, -5.2, 2.8)
            );

          return
            broad * 0.56 +
            medium * 0.29 +
            fine * 0.15;
        }

        float craterField(
          vec3 direction,
          float scale,
          float threshold,
          float strength
        ) {
          vec3 p =
            direction * scale;

          vec3 cell =
            floor(p);

          vec3 local =
            fract(p) - 0.5;

          float crater = 0.0;

          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              for (int z = -1; z <= 1; z++) {
                vec3 offset =
                  vec3(
                    float(x),
                    float(y),
                    float(z)
                  );

                vec3 cellId =
                  cell + offset;

                float seed =
                  hash3(cellId);

                float seed2 =
                  hash3(
                    cellId +
                    vec3(
                      17.3,
                      -9.1,
                      5.7
                    )
                  );

                float seed3 =
                  hash3(
                    cellId +
                    vec3(
                      -4.7,
                      12.8,
                      21.4
                    )
                  );

                vec3 center =
                  vec3(
                    seed,
                    seed2,
                    seed3
                  ) - 0.5;

                float existence =
                  step(
                    threshold,
                    seed
                  );

                vec3 difference =
                  local +
                  offset -
                  center;

                float distanceToCenter =
                  length(difference);

                float radius =
                  mix(
                    0.055,
                    0.19,
                    seed2
                  );

                float craterShape =
                  1.0 -
                  smoothstep(
                    radius * 0.45,
                    radius,
                    distanceToCenter
                  );

                float centerHole =
                  smoothstep(
                    radius * 0.18,
                    radius * 0.52,
                    distanceToCenter
                  );

                craterShape *= centerHole;

                float rim =
                  smoothstep(
                    radius * 0.58,
                    radius * 0.84,
                    distanceToCenter
                  ) *
                  (
                    1.0 -
                    smoothstep(
                      radius * 0.84,
                      radius,
                      distanceToCenter
                    )
                  );

                crater +=
                  (
                    craterShape * 0.72 +
                    rim * 0.36
                  ) *
                  existence;
              }
            }
          }

          return clamp(
            crater * strength,
            0.0,
            1.0
          );
        }

        float polarField(vec3 direction) {
          float latitude =
            abs(direction.y);

          float polar =
            smoothstep(
              0.82,
              0.975,
              latitude
            );

          float edgeNoise =
            fbm3(
              direction * 13.0 +
              vec3(
                2.7,
                -3.4,
                5.1
              )
            );

          float irregularEdge =
            smoothstep(
              0.38,
              0.70,
              edgeNoise
            );

          return
            polar *
            (
              0.72 +
              irregularEdge * 0.28
            );
        }

        void main() {
          vec3 direction =
            normalize(
              vLocalDirection
            );

          vec3 darkMars =
            vec3(
              0.045,
              0.008,
              0.004
            );

          vec3 deepRed =
            vec3(
              0.15,
              0.022,
              0.009
            );

          vec3 rust =
            vec3(
              0.36,
              0.065,
              0.022
            );

          vec3 orangeRust =
            vec3(
              0.56,
              0.125,
              0.040
            );

          vec3 dustyRock =
            vec3(
              0.70,
              0.245,
              0.095
            );

          float terrain =
            rockField(direction);

          vec3 surface =
            mix(
              darkMars,
              deepRed,
              smoothstep(
                0.18,
                0.48,
                terrain
              )
            );

          surface =
            mix(
              surface,
              rust,
              smoothstep(
                0.40,
                0.67,
                terrain
              )
            );

          float highlands =
            ridgedNoise(
              direction * 5.8 +
              vec3(
                2.4,
                -3.1,
                4.7
              )
            );

          float highlandMask =
            smoothstep(
              0.46,
              0.76,
              highlands
            );

          surface =
            mix(
              surface,
              dustyRock,
              highlandMask * 0.20
            );

          float mediumRock =
            fbm3(
              direction * 14.0 +
              vec3(
                5.0,
                2.1,
                -3.6
              )
            );

          surface =
            mix(
              surface,
              orangeRust,
              smoothstep(
                0.57,
                0.82,
                mediumRock
              ) * 0.46
            );

          float valleys =
            fbm3(
              direction * 8.0 +
              vec3(
                -3.0,
                4.4,
                1.7
              )
            );

          float valleyMask =
            smoothstep(
              0.24,
              0.55,
              valleys
            );

          surface *=
            0.72 +
            valleyMask * 0.38;

          float fineDetail =
            noise3(
              direction * 54.0 +
              vec3(
                1.2,
                -6.0,
                3.8
              )
            );

          surface +=
            (
              fineDetail - 0.5
            ) * 0.028;

          float largeCraters =
            craterField(
              direction,
              6.5,
              0.72,
              1.0
            );

          float mediumCraters =
            craterField(
              direction,
              15.0,
              0.70,
              0.72
            );

          float smallCraters =
            craterField(
              direction,
              34.0,
              0.79,
              0.32
            );

          float craterTotal =
            clamp(
              largeCraters * 0.56 +
              mediumCraters * 0.30 +
              smallCraters * 0.14,
              0.0,
              1.0
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                0.54,
                0.46,
                0.40
              ),
              craterTotal * 0.26
            );

          float craterRim =
            clamp(
              largeCraters * 0.70 +
              mediumCraters * 0.30,
              0.0,
              1.0
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.12,
                1.08,
                1.02
              ),
              craterRim * 0.12
            );

          float polarIce =
            polarField(direction);

          float iceDetail =
            fbm3(
              direction * 25.0 +
              vec3(
                -2.3,
                5.1,
                -4.2
              )
            );

          polarIce *=
            0.78 +
            iceDetail * 0.22;

          vec3 iceColor =
            vec3(
              0.72,
              0.70,
              0.67
            );

          surface =
            mix(
              surface,
              iceColor,
              polarIce * 0.88
            );

          float dust =
            fbm3(
              direction * 4.0 +
              vec3(
                7.1,
                -2.6,
                1.9
              )
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.06,
                0.90,
                0.78
              ),
              smoothstep(
                0.52,
                0.78,
                dust
              ) * 0.16
            );

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 marsToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              marsToSun
            );

          float directLight =
            max(
              NdotL,
              0.0
            );

          directLight =
            pow(
              directLight,
              0.70
            );

          float daylight =
            smoothstep(
              -0.08,
              0.25,
              NdotL
            );

          float dayIntensity =
            0.105 +
            directLight * 1.16;

          surface *=
            dayIntensity;

          vec3 sunlightTint =
            vec3(
              1.0,
              0.91,
              0.78
            );

          surface =
            mix(
              surface,
              surface * sunlightTint,
              daylight * 0.14
            );

          float twilight =
            smoothstep(
              -0.18,
              0.10,
              NdotL
            ) *
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
              0.20,
              0.045,
              0.014
            );

          surface +=
            twilightColor *
            twilight *
            0.060;

          float night =
            1.0 -
            daylight;

          surface *=
            0.17 +
            daylight * 0.83;

          surface +=
            vec3(
              0.0035,
              0.0011,
              0.0005
            ) *
            night;

          vec3 viewDirection =
            normalize(
              cameraPosition -
              vWorldPosition
            );

          float viewFacing =
            max(
              dot(
                normal,
                viewDirection
              ),
              0.0
            );

          float limb =
            pow(
              1.0 -
              viewFacing,
              3.8
            );

          surface +=
            vec3(
              0.050,
              0.018,
              0.008
            ) *
            limb *
            daylight;

          surface =
            max(
              surface,
              vec3(0.001)
            );

          gl_FragColor =
            vec4(
              surface,
              1.0
            );
        }
      `,

      toneMapped: false,
      lights: false,
    });
  }, []);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,

      uniforms: {
        glowColor: {
          value: new THREE.Color("#d66a42"),
        },

        intensity: {
          value: 0.145,
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
            vec4(position, 1.0);

          vNormal =
            normalize(
              normalMatrix * normal
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
              1.0 - viewDot,
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

      lights: false,
    });
  }, []);

  return (
    <group>
      <Sphere
        args={[1, 64, 64]}
        castShadow
        receiveShadow
      >
        <primitive
          object={marsMaterial}
          attach="material"
        />
      </Sphere>

      <Sphere
        args={[1.025, 64, 64]}
        castShadow={false}
        receiveShadow={false}
      >
        <primitive
          object={atmosphereMaterial}
          attach="material"
        />
      </Sphere>
    </group>
  );
};