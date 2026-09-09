import { Sphere } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export const Jupiter = () => {
  const jupiterMaterial = useMemo(() => {
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
        varying vec3 vLocalDirection;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform vec3 uSunPosition;

        float hash3(vec3 p) {
          p =
            fract(
              p * 0.3183099 +
              vec3(
                0.71,
                0.113,
                0.419
              )
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
            hash3(
              i +
              vec3(0.0, 0.0, 0.0)
            );

          float n100 =
            hash3(
              i +
              vec3(1.0, 0.0, 0.0)
            );

          float n010 =
            hash3(
              i +
              vec3(0.0, 1.0, 0.0)
            );

          float n110 =
            hash3(
              i +
              vec3(1.0, 1.0, 0.0)
            );

          float n001 =
            hash3(
              i +
              vec3(0.0, 0.0, 1.0)
            );

          float n101 =
            hash3(
              i +
              vec3(1.0, 0.0, 1.0)
            );

          float n011 =
            hash3(
              i +
              vec3(0.0, 1.0, 1.0)
            );

          float n111 =
            hash3(
              i +
              vec3(1.0, 1.0, 1.0)
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

        float stretchedNoise(
          vec3 direction,
          float scale
        ) {
          vec3 p =
            direction *
            vec3(
              scale,
              scale * 4.2,
              scale
            );

          return fbm3(p);
        }

        float bandStructure(
          vec3 direction
        ) {
          float latitude =
            direction.y;

          float broad =
            sin(
              latitude * 30.0
            );

          float medium =
            sin(
              latitude * 58.0 +
              0.35
            );

          float fine =
            sin(
              latitude * 108.0 +
              1.2
            );

          float turbulence =
            fbm3(
              direction *
              vec3(
                3.2,
                18.0,
                3.2
              )
            );

          float structure =
            broad * 0.52 +
            medium * 0.28 +
            fine * 0.10;

          structure +=
            (
              turbulence -
              0.5
            ) * 0.65;

          return structure;
        }

        float greatRedSpot(
          vec3 direction
        ) {
          float latitude =
            direction.y;

          float longitude =
            atan(
              direction.z,
              direction.x
            );

          float targetLatitude =
            -0.22;

          float targetLongitude =
            -0.95;

          float latitudeDistance =
            latitude -
            targetLatitude;

          float longitudeDistance =
            atan(
              sin(
                longitude -
                targetLongitude
              ),
              cos(
                longitude -
                targetLongitude
              )
            );

          float ellipse =
            sqrt(
              longitudeDistance *
              longitudeDistance *
              0.55 +
              latitudeDistance *
              latitudeDistance *
              3.4
            );

          float spot =
            1.0 -
            smoothstep(
              0.08,
              0.28,
              ellipse
            );

          float turbulence =
            fbm3(
              direction *
              22.0 +
              vec3(
                4.0,
                -2.0,
                7.0
              )
            );

          spot *=
            0.72 +
            turbulence * 0.42;

          return clamp(
            spot,
            0.0,
            1.0
          );
        }

        float spotSwirl(
          vec3 direction
        ) {
          float latitude =
            direction.y;

          float longitude =
            atan(
              direction.z,
              direction.x
            );

          float targetLatitude =
            -0.22;

          float targetLongitude =
            -0.95;

          float dx =
            atan(
              sin(
                longitude -
                targetLongitude
              ),
              cos(
                longitude -
                targetLongitude
              )
            );

          float dy =
            latitude -
            targetLatitude;

          float radius =
            length(
              vec2(
                dx * 1.35,
                dy * 2.1
              )
            );

          float angle =
            atan(
              dy,
              dx
            );

          float swirl =
            sin(
              angle * 7.0 +
              radius * 48.0
            );

          return
            smoothstep(
              -0.25,
              0.72,
              swirl
            );
        }

        void main() {
          vec3 direction =
            normalize(
              vLocalDirection
            );

          vec3 deepBrown =
            vec3(
              0.105,
              0.052,
              0.028
            );

          vec3 darkBrown =
            vec3(
              0.22,
              0.115,
              0.060
            );

          vec3 warmBrown =
            vec3(
              0.39,
              0.205,
              0.105
            );

          vec3 orangeBrown =
            vec3(
              0.61,
              0.355,
              0.185
            );

          vec3 cream =
            vec3(
              0.80,
              0.67,
              0.49
            );

          vec3 paleCream =
            vec3(
              0.93,
              0.84,
              0.68
            );

          float bands =
            bandStructure(
              direction
            );

          float bandMask =
            bands * 0.5 + 0.5;

          float largeCloud =
            stretchedNoise(
              direction,
              1.65
            );

          float mediumCloud =
            stretchedNoise(
              direction +
              vec3(
                2.4,
                -1.7,
                3.1
              ),
              4.0
            );

          float fineCloud =
            fbm3(
              direction *
              vec3(
                11.0,
                48.0,
                11.0
              ) +
              vec3(
                -3.2,
                5.1,
                1.8
              )
            );

          float turbulentCloud =
            fbm3(
              direction *
              vec3(
                22.0,
                72.0,
                22.0
              ) +
              vec3(
                6.1,
                -3.8,
                2.7
              )
            );

          float cloudField =
            largeCloud * 0.44 +
            mediumCloud * 0.34 +
            fineCloud * 0.16 +
            turbulentCloud * 0.06;

          float bandVariation =
            smoothstep(
              0.22,
              0.78,
              bandMask
            );

          vec3 surface =
            mix(
              deepBrown,
              darkBrown,
              bandVariation
            );

          surface =
            mix(
              surface,
              warmBrown,
              smoothstep(
                0.32,
                0.62,
                cloudField
              ) * 0.72
            );

          surface =
            mix(
              surface,
              orangeBrown,
              smoothstep(
                0.44,
                0.72,
                cloudField
              ) * 0.55
            );

          float brightClouds =
            smoothstep(
              0.58,
              0.80,
              cloudField
            );

          surface =
            mix(
              surface,
              cream,
              brightClouds *
              0.66
            );

          float highClouds =
            smoothstep(
              0.74,
              0.93,
              cloudField
            );

          surface =
            mix(
              surface,
              paleCream,
              highClouds *
              0.46
            );

          float latitudeFlow =
            fbm3(
              direction *
              vec3(
                8.0,
                34.0,
                8.0
              ) +
              vec3(
                1.7,
                -4.3,
                5.2
              )
            );

          float flowMask =
            smoothstep(
              0.50,
              0.82,
              latitudeFlow
            );

          surface =
            mix(
              surface,
              surface *
              vec3(
                1.08,
                1.04,
                0.98
              ),
              flowMask *
              0.20
            );

          float fineStructure =
            noise3(
              direction *
              vec3(
                28.0,
                95.0,
                28.0
              ) +
              vec3(
                4.1,
                -6.2,
                2.5
              )
            );

          surface +=
            (
              fineStructure -
              0.5
            ) *
            0.028;

          float spot =
            greatRedSpot(
              direction
            );

          vec3 spotDark =
            vec3(
              0.30,
              0.055,
              0.022
            );

          vec3 spotBase =
            vec3(
              0.52,
              0.125,
              0.048
            );

          vec3 spotLight =
            vec3(
              0.70,
              0.245,
              0.095
            );

          float spotTexture =
            fbm3(
              direction *
              vec3(
                30.0,
                30.0,
                30.0
              ) +
              vec3(
                2.0,
                -5.0,
                4.0
              )
            );

          vec3 spotColor =
            mix(
              spotDark,
              spotBase,
              spotTexture
            );

          spotColor =
            mix(
              spotColor,
              spotLight,
              smoothstep(
                0.58,
                0.86,
                spotTexture
              ) *
              0.40
            );

          surface =
            mix(
              surface,
              spotColor,
              spot *
              0.90
            );

          float swirl =
            spotSwirl(
              direction
            );

          surface =
            mix(
              surface,
              spotLight,
              spot *
              swirl *
              0.12
            );

          float polarLatitude =
            abs(
              direction.y
            );

          float polarMask =
            smoothstep(
              0.70,
              0.97,
              polarLatitude
            );

          float polarNoise =
            fbm3(
              direction *
              vec3(
                7.0,
                22.0,
                7.0
              ) +
              vec3(
                -2.0,
                3.4,
                6.2
              )
            );

          vec3 polarColor =
            vec3(
              0.30,
              0.24,
              0.18
            );

          surface =
            mix(
              surface,
              polarColor,
              polarMask *
              (
                0.22 +
                polarNoise *
                0.18
              )
            );

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 jupiterToSun =
            normalize(
              uSunPosition -
              vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              jupiterToSun
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

          float daylight =
            smoothstep(
              -0.08,
              0.24,
              NdotL
            );

          float dayIntensity =
            0.075 +
            directLight *
            1.22;

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
              surface *
              sunlightTint,
              daylight *
              0.14
            );

          float twilight =
            smoothstep(
              -0.20,
              0.08,
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

          surface +=
            vec3(
              0.18,
              0.055,
              0.022
            ) *
            twilight *
            0.055;

          float night =
            1.0 -
            daylight;

          surface *=
            0.16 +
            daylight *
            0.84;

          surface +=
            vec3(
              0.0035,
              0.0017,
              0.0008
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
              3.6
            );

          surface +=
            vec3(
              0.075,
              0.030,
              0.012
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
          value: new THREE.Color(
            "#d6a06a"
          ),
        },

        intensity: {
          value: 0.17,
        },

        power: {
          value: 4.2,
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
          object={jupiterMaterial}
          attach="material"
        />
      </Sphere>

      <Sphere
        args={[1.028, 64, 64]}
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