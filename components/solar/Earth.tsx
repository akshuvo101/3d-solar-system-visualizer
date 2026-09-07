import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type EarthProps = {
    rotationSpeed?: number;
};

export const Earth = ({
    rotationSpeed = 0.12,
}: EarthProps) => {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);

    /*
     * ============================================================
     * 🌍 EARTH SURFACE
     * ============================================================
     */

    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
            },

            vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {

          vUv = uv;

          /*
           * Convert normal into world space.
           */
          vNormal =
            normalize(
              mat3(modelMatrix) * normal
            );

          /*
           * World-space position.
           */
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
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform float uTime;

        /*
         * ========================================================
         * RANDOM / NOISE
         * ========================================================
         */

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

        float fbm(vec2 p) {

          float value =
            0.0;

          float amplitude =
            0.5;

          for(int i = 0; i < 5; i++) {

            value +=
              noise(p) *
              amplitude;

            p *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        void main() {

          vec2 uv =
            vUv;

          /*
           * ======================================================
           * 🌊 OCEAN
           * ======================================================
           */

          vec3 oceanDeep =
            vec3(
              0.004,
              0.025,
              0.085
            );

          vec3 ocean =
            vec3(
              0.008,
              0.12,
              0.30
            );

          vec3 oceanLight =
            vec3(
              0.025,
              0.30,
              0.55
            );

          float oceanNoise =
            fbm(
              uv *
              8.0
            );

          vec3 surface =
            mix(
              oceanDeep,
              ocean,
              oceanNoise
            );

          surface =
            mix(
              surface,
              oceanLight,
              smoothstep(
                0.63,
                0.90,
                oceanNoise
              )
            );

          /*
           * ======================================================
           * 🌎 CONTINENTS
           * ======================================================
           */

          float continentNoise =
            fbm(
              uv *
              3.8 +
              vec2(
                4.0,
                1.5
              )
            );

          float land =
            smoothstep(
              0.53,
              0.62,
              continentNoise
            );

          /*
           * Forest.
           */

          vec3 forest =
            vec3(
              0.018,
              0.145,
              0.035
            );

          /*
           * Vegetation.
           */

          vec3 vegetation =
            vec3(
              0.055,
              0.29,
              0.065
            );

          /*
           * Desert.
           */

          vec3 desert =
            vec3(
              0.42,
              0.275,
              0.105
            );

          vec3 landColor =
            mix(
              forest,
              vegetation,
              noise(
                uv *
                18.0
              )
            );

          landColor =
            mix(
              landColor,
              desert,
              smoothstep(
                0.68,
                0.85,
                noise(
                  uv *
                  7.0
                )
              )
            );

          /*
           * Small terrain variation.
           */

          landColor +=
            (
              noise(
                uv *
                35.0
              ) -
              0.5
            ) *
            0.025;

          surface =
            mix(
              surface,
              landColor,
              land
            );

          /*
           * ======================================================
           * 🧊 POLAR ICE
           * ======================================================
           */

          float polar =
            smoothstep(
              0.84,
              0.98,
              abs(
                uv.y -
                0.5
              ) *
              2.0
            );

          vec3 ice =
            vec3(
              0.78,
              0.89,
              0.98
            );

          surface =
            mix(
              surface,
              ice,
              polar *
              0.82
            );

          /*
           * ======================================================
           * ✨ MICRO SURFACE DETAIL
           * ======================================================
           */

          float detail =
            noise(
              uv *
              55.0
            );

          surface +=
            (
              detail -
              0.5
            ) *
            0.018;

          /*
           * ======================================================
           * ☀️ REAL SUN LIGHT
           * ======================================================
           *
           * Sun is positioned at world origin.
           */

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 earthToSun =
            normalize(
              -vWorldPosition
            );

          float NdotL =
            dot(
              normal,
              earthToSun
            );

          float diffuse =
            max(
              NdotL,
              0.0
            );

          /*
           * ======================================================
           * 🌅 DAY / TWILIGHT / NIGHT
           * ======================================================
           */

          /*
           * Harder daylight boundary.
           */

          float day =
            smoothstep(
              0.02,
              0.45,
              diffuse
            );

          /*
           * Twilight band.
           */

          float twilight =
            smoothstep(
              -0.12,
              0.22,
              NdotL
            )
            *
            (
              1.0 -
              smoothstep(
                0.18,
                0.42,
                NdotL
              )
            );

          /*
           * ======================================================
           * 🌞 DAYLIGHT
           * ======================================================
           */

          float daylight =
            pow(
              diffuse,
              0.72
            );

          /*
           * Base daylight illumination.
           */

          float dayIntensity =
            0.16 +
            daylight *
            1.08;

          surface *=
            dayIntensity;

          /*
           * Slight warm solar response
           * on the fully illuminated side.
           */

          vec3 sunlightTint =
            vec3(
              1.0,
              0.965,
              0.91
            );

          surface =
            mix(
              surface,
              surface *
              sunlightTint,
              day *
              0.16
            );

          /*
           * ======================================================
           * 🌅 TWILIGHT
           * ======================================================
           *
           * Subtle warm atmospheric transition.
           */

          vec3 twilightColor =
            vec3(
              0.34,
              0.17,
              0.07
            );

          surface +=
            twilightColor *
            twilight *
            0.035;

          /*
           * ======================================================
           * 🌑 NIGHT SIDE
           * ======================================================
           */

          float night =
            1.0 -
            day;

          /*
           * Keep night side genuinely dark.
           */

          surface *=
            0.32 +
            day *
            0.68;

          /*
           * Very subtle blue ambient
           * from Earth's atmosphere.
           */

          vec3 nightBlue =
            vec3(
              0.002,
              0.006,
              0.018
            );

          surface +=
            nightBlue *
            night *
            0.55;

          /*
           * ======================================================
           * 🌊 OCEAN NIGHT RESPONSE
           * ======================================================
           *
           * Deepens oceans on the dark hemisphere.
           */

          float oceanMask =
            1.0 -
            land;

          surface *=
            1.0 -
            (
              oceanMask *
              night *
              0.16
            );

          /*
           * ======================================================
           * ✨ FINAL CONTRAST
           * ======================================================
           */

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

    /*
     * ============================================================
     * ☁️ CLOUD SHADER
     * ============================================================
     */

    const cloudMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,

            uniforms: {
                uTime: {
                    value: 0,
                },
            },

            vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {

          vUv = uv;

          vNormal =
            normalize(
              mat3(modelMatrix) *
              normal
            );

          vec4 worldPosition =
            modelMatrix *
            vec4(
              position,
              1.0
            );

          vWorldPosition =
            worldPosition.xyz;

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
            43758.5453
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
            vUv +
            vec2(
              uTime *
              0.006,
              0.0
            );

          /*
           * Multi-scale clouds.
           */

          float clouds =
            noise(
              uv *
              7.0
            );

          clouds +=
            noise(
              uv *
              14.0
            ) *
            0.45;

          clouds +=
            noise(
              uv *
              28.0
            ) *
            0.15;

          clouds =
            smoothstep(
              0.55,
              0.73,
              clouds
            );

          /*
           * Sun direction.
           */

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 earthToSun =
            normalize(
              -vWorldPosition
            );

          float sunlight =
            max(
              dot(
                normal,
                earthToSun
              ),
              0.0
            );

          /*
           * Clouds are bright on day side
           * and significantly darker at night.
           */

          float cloudLight =
            0.08 +
            pow(
              sunlight,
              0.7
            ) *
            0.92;

          vec3 cloudDay =
            vec3(
              0.92,
              0.97,
              1.0
            );

          vec3 cloudNight =
            vec3(
              0.035,
              0.055,
              0.085
            );

          vec3 cloudColor =
            mix(
              cloudNight,
              cloudDay,
              smoothstep(
                0.04,
                0.45,
                sunlight
              )
            );

          /*
           * Slight silver highlight
           * around illuminated clouds.
           */

          float cloudHighlight =
            pow(
              sunlight,
              3.0
            );

          cloudColor +=
            vec3(
              0.06,
              0.07,
              0.08
            ) *
            cloudHighlight;

          gl_FragColor =
            vec4(
              cloudColor,
              clouds *
              0.34
            );
        }
      `,
        });
    }, []);

    /*
     * ============================================================
     * 🌫️ PREMIUM ATMOSPHERE
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
                    value:
                        new THREE.Color(
                            "#3d9cff"
                        ),
                },

                intensity: {
                    value: 0.30,
                },

                power: {
                    value: 4.8,
                },
            },

            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPosition;

        void main() {

          vec4 worldPosition =
            modelMatrix *
            vec4(
              position,
              1.0
            );

          vWorldPosition =
            worldPosition.xyz;

          vNormal =
            normalize(
              mat3(modelMatrix) *
              normal
            );

          vec4 mvPosition =
            modelViewMatrix *
            vec4(
              position,
              1.0
            );

          vViewDir =
            normalize(
              cameraPosition -
              worldPosition.xyz
            );

          gl_Position =
            projectionMatrix *
            mvPosition;
        }
      `,

            fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPosition;

        uniform vec3 glowColor;
        uniform float intensity;
        uniform float power;

        void main() {

          vec3 normal =
            normalize(
              vNormal
            );

          vec3 viewDir =
            normalize(
              vViewDir
            );

          /*
           * ------------------------------------------------------
           * Edge / Fresnel
           * ------------------------------------------------------
           */

          float viewDot =
            max(
              dot(
                normal,
                viewDir
              ),
              0.0
            );

          float fresnel =
            pow(
              1.0 -
              viewDot,
              power
            );

          /*
           * ------------------------------------------------------
           * ☀️ Sun-facing atmospheric scattering
           * ------------------------------------------------------
           */

          vec3 earthToSun =
            normalize(
              -vWorldPosition
            );

          float sunLight =
            max(
              dot(
                normal,
                earthToSun
              ),
              0.0
            );

          /*
           * Atmosphere is strongest
           * around illuminated limb.
           */

          float sunScatter =
            pow(
              sunLight,
              0.55
            );

          /*
           * Keep night-side atmosphere
           * extremely subtle.
           */

          float nightScatter =
            fresnel *
            0.16;

          float finalGlow =
            (
              fresnel *
              0.72 +
              sunScatter *
              fresnel *
              0.55 +
              nightScatter
            ) *
            intensity;

          /*
           * Reduce blue shell toward
           * the center of the planet.
           */

          finalGlow =
            smoothstep(
              0.035,
              0.72,
              finalGlow
            );

          gl_FragColor =
            vec4(
              glowColor,
              finalGlow
            );
        }
      `,
        });
    }, []);

    /*
     * ============================================================
     * 🌀 ANIMATION
     * ============================================================
     */

    useFrame(
        ({ clock }, delta) => {
            const time =
                clock.getElapsedTime();

            /*
             * 🌍 Earth rotation.
             */

            if (earthRef.current) {
                earthRef.current.rotation.y +=
                    delta *
                    rotationSpeed;
            }

            /*
             * ☁️ Cloud rotation.
             */

            if (cloudRef.current) {
                cloudRef.current.rotation.y +=
                    delta *
                    rotationSpeed *
                    1.12;
            }

            /*
             * 🌫️ Very subtle atmospheric motion.
             */

            if (atmosphereRef.current) {
                const pulse =
                    1 +
                    Math.sin(
                        time *
                        0.8
                    ) *
                    0.002;

                atmosphereRef.current.scale.setScalar(
                    pulse
                );
            }

            /*
             * Shader time.
             */

            earthMaterial.uniforms.uTime.value =
                time;

            cloudMaterial.uniforms.uTime.value =
                time;
        }
    );

    return (
        <group>

            {/* ======================================================
                🌍 EARTH SURFACE
                ====================================================== */}

            <Sphere
                ref={earthRef}
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
                        earthMaterial
                    }
                    attach="material"
                />
            </Sphere>

            {/* ======================================================
                ☁️ CLOUD LAYER
                ====================================================== */}

            <Sphere
                ref={cloudRef}
                args={[
                    1.018,
                    64,
                    64,
                ]}
            >
                <primitive
                    object={
                        cloudMaterial
                    }
                    attach="material"
                />
            </Sphere>

            {/* ======================================================
                🌫️ ATMOSPHERE
                ====================================================== */}

            <Sphere
                ref={
                    atmosphereRef
                }
                args={[
                    1.035,
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

        </group>
    );
};