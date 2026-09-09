import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type EarthProps = {};

export const Earth = ({}: EarthProps) => {
    const cloudRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);

    /*
     * ============================================================
     * 🌍 EARTH SURFACE MATERIAL
     *
     * Important:
     * - No UV based terrain noise
     * - No animated surface noise
     * - Uses local spherical direction
     * - Prevents longitude/column artifacts
     * ============================================================
     */

    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {},

            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        void main() {

          /*
           * Local spherical direction.
           *
           * This is the key fix for the previous
           * vertical / column-wise artifacts.
           *
           * It does not depend on UV coordinates.
           */
          vLocalDirection =
            normalize(position);

          /*
           * World-space normal for lighting.
           */
          vNormal =
            normalize(
              mat3(modelMatrix) * normal
            );

          /*
           * World position for Sun direction.
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
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        /*
         * ==========================================================
         * 🌐 STABLE 3D HASH
         * ==========================================================
         *
         * Unlike the old UV noise, this works directly on the
         * spherical surface.
         *
         * Therefore:
         * - no UV seam
         * - no vertical columns
         * - no longitude stretching
         */

        float hash31(vec3 p) {

          p =
            fract(
              p * 0.1031
            );

          p +=
            dot(
              p,
              p.yzx + 33.33
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        /*
         * ==========================================================
         * 🌊 3D VALUE NOISE
         * ==========================================================
         */

        float noise3D(vec3 p) {

          vec3 i =
            floor(p);

          vec3 f =
            fract(p);

          /*
           * Smooth interpolation.
           */
          f =
            f * f *
            (
              3.0 -
              2.0 * f
            );

          float n000 =
            hash31(
              i + vec3(0.0, 0.0, 0.0)
            );

          float n100 =
            hash31(
              i + vec3(1.0, 0.0, 0.0)
            );

          float n010 =
            hash31(
              i + vec3(0.0, 1.0, 0.0)
            );

          float n110 =
            hash31(
              i + vec3(1.0, 1.0, 0.0)
            );

          float n001 =
            hash31(
              i + vec3(0.0, 0.0, 1.0)
            );

          float n101 =
            hash31(
              i + vec3(1.0, 0.0, 1.0)
            );

          float n011 =
            hash31(
              i + vec3(0.0, 1.0, 1.0)
            );

          float n111 =
            hash31(
              i + vec3(1.0, 1.0, 1.0)
            );

          float nx00 =
            mix(
              n000,
              n100,
              f.x
            );

          float nx10 =
            mix(
              n010,
              n110,
              f.x
            );

          float nx01 =
            mix(
              n001,
              n101,
              f.x
            );

          float nx11 =
            mix(
              n011,
              n111,
              f.x
            );

          float nxy0 =
            mix(
              nx00,
              nx10,
              f.y
            );

          float nxy1 =
            mix(
              nx01,
              nx11,
              f.y
            );

          return mix(
            nxy0,
            nxy1,
            f.z
          );
        }

        /*
         * ==========================================================
         * 🌎 FRACTAL BROWNIAN MOTION
         * ==========================================================
         *
         * Kept deliberately low-frequency.
         *
         * High frequency FBM was one of the reasons the surface
         * could visually shimmer.
         */

        float fbm(vec3 p) {

          float value = 0.0;

          float amplitude = 0.5;

          for(int i = 0; i < 4; i++) {

            value +=
              noise3D(p) *
              amplitude;

            p *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        /*
         * ==========================================================
         * 🌍 MAIN
         * ==========================================================
         */

        void main() {

          /*
           * Normalized spherical coordinate.
           */
          vec3 direction =
            normalize(
              vLocalDirection
            );

          /*
           * ========================================================
           * 🗺️ CONTINENT MASK
           * ========================================================
           *
           * Large-scale noise creates broad land masses.
           *
           * Threshold is deliberately conservative so Earth
           * remains ocean-dominant.
           */

          float continentBase =
            fbm(
              direction * 1.65
            );

          float continentDetail =
            fbm(
              direction * 3.2 +
              vec3(
                17.2,
                4.7,
                9.1
              )
            );

          float continentShape =
            continentBase * 0.78 +
            continentDetail * 0.22;

          /*
           * Conservative land threshold.
           *
           * This prevents the "green planet" look.
           */
          float land =
            smoothstep(
              0.555,
              0.625,
              continentShape
            );

          /*
           * ========================================================
           * 🌊 OCEAN
           * ========================================================
           */

          vec3 deepOcean =
            vec3(
              0.002,
              0.018,
              0.060
            );

          vec3 ocean =
            vec3(
              0.004,
              0.055,
              0.145
            );

          vec3 shallowOcean =
            vec3(
              0.012,
              0.125,
              0.255
            );

          /*
           * Subtle ocean variation.
           *
           * Low frequency only.
           */
          float oceanVariation =
            fbm(
              direction * 5.0 +
              vec3(
                2.0,
                8.0,
                3.0
              )
            );

          vec3 oceanColor =
            mix(
              deepOcean,
              ocean,
              smoothstep(
                0.28,
                0.70,
                oceanVariation
              )
            );

          oceanColor =
            mix(
              oceanColor,
              shallowOcean,
              smoothstep(
                0.68,
                0.90,
                oceanVariation
              ) *
              0.35
            );

          /*
           * ========================================================
           * 🏔️ LAND ELEVATION
           * ========================================================
           */

          float terrain =
            fbm(
              direction * 5.5 +
              vec3(
                11.0,
                3.0,
                19.0
              )
            );

          /*
           * Mountain / rocky mask.
           */
          float mountain =
            smoothstep(
              0.66,
              0.84,
              terrain
            );

          /*
           * ========================================================
           * 🌡️ LATITUDE / CLIMATE
           * ========================================================
           */

          float latitude =
            abs(
              direction.y
            );

          /*
           * Tropical zone.
           *
           * Green is limited mostly to warmer + wetter regions.
           */
          float tropical =
            1.0 -
            smoothstep(
              0.18,
              0.72,
              latitude
            );

          /*
           * ========================================================
           * 💧 MOISTURE
           * ========================================================
           */

          float moisture =
            fbm(
              direction * 4.2 +
              vec3(
                31.0,
                7.0,
                13.0
              )
            );

          /*
           * ========================================================
           * 🏜️ DESERT
           * ========================================================
           */

          float dryRegion =
            smoothstep(
              0.54,
              0.73,
              1.0 - moisture
            );

          /*
           * Keep deserts mostly in warmer latitudes.
           */
          float desert =
            dryRegion *
            smoothstep(
              0.05,
              0.35,
              1.0 - latitude
            ) *
            (1.0 - mountain * 0.65);

          /*
           * ========================================================
           * 🌲 FOREST / VEGETATION
           * ========================================================
           *
           * Forest is intentionally restrained.
           */

          float vegetation =
            smoothstep(
              0.40,
              0.70,
              moisture
            ) *
            smoothstep(
              0.18,
              0.78,
              tropical
            ) *
            (1.0 - desert);

          /*
           * ========================================================
           * 🪨 ROCK
           * ========================================================
           */

          vec3 rock =
            vec3(
              0.27,
              0.26,
              0.22
            );

          vec3 rockLight =
            vec3(
              0.42,
              0.39,
              0.31
            );

          vec3 landRock =
            mix(
              rock,
              rockLight,
              smoothstep(
                0.48,
                0.82,
                terrain
              )
            );

          /*
           * ========================================================
           * 🟫 DESERT COLOR
           * ========================================================
           */

          vec3 desertColor =
            vec3(
              0.55,
              0.36,
              0.16
            );

          /*
           * Slight sand highlight.
           */
          desertColor =
            mix(
              desertColor,
              vec3(
                0.72,
                0.54,
                0.30
              ),
              smoothstep(
                0.58,
                0.82,
                terrain
              ) *
              0.35
            );

          /*
           * ========================================================
           * 🌿 VEGETATION COLORS
           * ========================================================
           */

          vec3 grassland =
            vec3(
              0.20,
              0.30,
              0.095
            );

          vec3 forest =
            vec3(
              0.045,
              0.18,
              0.055
            );

          /*
           * Forest is darker and less saturated.
           */
          vec3 vegetationColor =
            mix(
              grassland,
              forest,
              smoothstep(
                0.58,
                0.82,
                moisture
              )
            );

          /*
           * ========================================================
           * 🌍 FINAL LAND COLOR
           * ========================================================
           */

          vec3 landColor =
            landRock;

          /*
           * Add vegetation.
           */
          landColor =
            mix(
              landColor,
              vegetationColor,
              vegetation * 0.72
            );

          /*
           * Add desert.
           */
          landColor =
            mix(
              landColor,
              desertColor,
              desert * 0.88
            );

          /*
           * ========================================================
           * 🧊 POLAR ICE
           * ========================================================
           */

          float polarIce =
            smoothstep(
              0.78,
              0.96,
              latitude
            );

          /*
           * Ice slightly varies naturally.
           */
          float iceVariation =
            fbm(
              direction * 7.0 +
              vec3(
                4.0,
                15.0,
                2.0
              )
            );

          float iceMask =
            polarIce *
            smoothstep(
              0.34,
              0.70,
              iceVariation
            );

          vec3 ice =
            vec3(
              0.78,
              0.89,
              0.96
            );

          /*
           * ========================================================
           * 🌊 + 🌎 COMBINE SURFACE
           * ========================================================
           */

          vec3 surface =
            mix(
              oceanColor,
              landColor,
              land
            );

          /*
           * Ice should dominate both land and polar ocean.
           */
          surface =
            mix(
              surface,
              ice,
              iceMask * 0.90
            );

          /*
           * ========================================================
           * ☀️ SUN LIGHT
           * ========================================================
           *
           * Sun is at the world origin.
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
           * ========================================================
           * 🌅 DAY / NIGHT
           * ========================================================
           */

          float day =
            smoothstep(
              0.015,
              0.32,
              diffuse
            );

          float twilight =
            smoothstep(
              -0.12,
              0.20,
              NdotL
            )
            *
            (
              1.0 -
              smoothstep(
                0.16,
                0.42,
                NdotL
              )
            );

          float night =
            1.0 -
            day;

          /*
           * ========================================================
           * ☀️ DAYLIGHT
           * ========================================================
           */

          float daylight =
            pow(
              diffuse,
              0.72
            );

          float dayIntensity =
            0.18 +
            daylight *
            1.04;

          surface *=
            dayIntensity;

          /*
           * Slight solar warmth.
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
              day * 0.10
            );

          /*
           * ========================================================
           * 🌅 TWILIGHT
           * ========================================================
           */

          vec3 twilightColor =
            vec3(
              0.38,
              0.15,
              0.045
            );

          surface +=
            twilightColor *
            twilight *
            0.045;

          /*
           * ========================================================
           * 🌑 NIGHT SIDE
           * ========================================================
           *
           * Keep the night side dark but still recognizable.
           */

          surface *=
            0.26 +
            day * 0.74;

          /*
           * Very subtle blue atmospheric ambient.
           */
          surface +=
            vec3(
              0.002,
              0.007,
              0.020
            )
            *
            night
            *
            0.42;

          /*
           * ========================================================
           * 🌊 OCEAN NIGHT RESPONSE
           * ========================================================
           */

          float oceanMask =
            1.0 -
            land;

          surface *=
            1.0 -
            (
              oceanMask *
              night *
              0.12
            );

          /*
           * ========================================================
           * ✨ FINAL STABILITY
           * ========================================================
           *
           * No high-frequency animated detail.
           * This helps eliminate shimmer/flicker.
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
     * ☁️ CLOUD MATERIAL
     *
     * Static spherical cloud pattern.
     *
     * The mesh itself rotates slowly, so the shader does not need
     * animated noise. This removes crawling/flickering artifacts.
     * ============================================================
     */

    const cloudMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,

            /*
             * Clouds don't write depth.
             * This avoids hard depth conflicts with the Earth.
             */
            depthWrite: false,

            depthTest: true,

            side: THREE.FrontSide,

            uniforms: {},

            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        void main() {

          vLocalDirection =
            normalize(position);

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
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vLocalDirection;

        /*
         * ==========================================================
         * CLOUD HASH
         * ==========================================================
         */

        float hash31(vec3 p) {

          p =
            fract(
              p * 0.1031
            );

          p +=
            dot(
              p,
              p.yzx + 33.33
            );

          return fract(
            (p.x + p.y) * p.z
          );
        }

        /*
         * ==========================================================
         * CLOUD NOISE
         * ==========================================================
         */

        float noise3D(vec3 p) {

          vec3 i =
            floor(p);

          vec3 f =
            fract(p);

          f =
            f * f *
            (
              3.0 -
              2.0 * f
            );

          float n000 =
            hash31(
              i
            );

          float n100 =
            hash31(
              i + vec3(1.0, 0.0, 0.0)
            );

          float n010 =
            hash31(
              i + vec3(0.0, 1.0, 0.0)
            );

          float n110 =
            hash31(
              i + vec3(1.0, 1.0, 0.0)
            );

          float n001 =
            hash31(
              i + vec3(0.0, 0.0, 1.0)
            );

          float n101 =
            hash31(
              i + vec3(1.0, 0.0, 1.0)
            );

          float n011 =
            hash31(
              i + vec3(0.0, 1.0, 1.0)
            );

          float n111 =
            hash31(
              i + vec3(1.0, 1.0, 1.0)
            );

          float nx00 =
            mix(
              n000,
              n100,
              f.x
            );

          float nx10 =
            mix(
              n010,
              n110,
              f.x
            );

          float nx01 =
            mix(
              n001,
              n101,
              f.x
            );

          float nx11 =
            mix(
              n011,
              n111,
              f.x
            );

          float nxy0 =
            mix(
              nx00,
              nx10,
              f.y
            );

          float nxy1 =
            mix(
              nx01,
              nx11,
              f.y
            );

          return mix(
            nxy0,
            nxy1,
            f.z
          );
        }

        /*
         * ==========================================================
         * CLOUD FBM
         * ==========================================================
         */

        float cloudFbm(vec3 p) {

          float value = 0.0;

          float amplitude = 0.5;

          for(int i = 0; i < 3; i++) {

            value +=
              noise3D(p) *
              amplitude;

            p *= 2.0;

            amplitude *= 0.5;
          }

          return value;
        }

        void main() {

          vec3 direction =
            normalize(
              vLocalDirection
            );

          /*
           * Large cloud formations.
           */
          float largeClouds =
            cloudFbm(
              direction * 2.7 +
              vec3(
                7.0,
                2.0,
                11.0
              )
            );

          /*
           * Secondary detail.
           */
          float cloudDetail =
            noise3D(
              direction * 7.0 +
              vec3(
                12.0,
                4.0,
                8.0
              )
            );

          float clouds =
            largeClouds * 0.82 +
            cloudDetail * 0.18;

          /*
           * Soft cloud threshold.
           *
           * Avoid very thin noisy pixels.
           */
          clouds =
            smoothstep(
              0.48,
              0.67,
              clouds
            );

          /*
           * Slightly reduce clouds near poles.
           */
          float latitude =
            abs(
              direction.y
            );

          float polarReduction =
            smoothstep(
              0.70,
              0.96,
              latitude
            );

          clouds *=
            1.0 -
            polarReduction *
            0.20;

          /*
           * ========================================================
           * ☀️ CLOUD LIGHTING
           * ========================================================
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
           * Clouds are bright on the day side.
           */
          float cloudLight =
            0.10 +
            pow(
              sunlight,
              0.72
            ) *
            0.90;

          /*
           * Cloud colors.
           */
          vec3 cloudDay =
            vec3(
              0.92,
              0.965,
              1.0
            );

          vec3 cloudNight =
            vec3(
              0.018,
              0.032,
              0.060
            );

          vec3 cloudColor =
            mix(
              cloudNight,
              cloudDay,
              smoothstep(
                0.025,
                0.40,
                sunlight
              )
            );

          /*
           * Subtle silver edge highlight.
           */
          float highlight =
            pow(
              sunlight,
              3.0
            );

          cloudColor +=
            vec3(
              0.055,
              0.065,
              0.075
            )
            *
            highlight;

          /*
           * Final opacity.
           *
           * Kept controlled so clouds don't hide the continents.
           */
          float alpha =
            clouds *
            0.30 *
            cloudLight;

          /*
           * Remove extremely weak fragments.
           */
          if(alpha < 0.008) {
            discard;
          }

          gl_FragColor =
            vec4(
              cloudColor,
              alpha
            );
        }
      `,
        });
    }, []);

    /*
     * ============================================================
     * 🌫️ ATMOSPHERE
     * ============================================================
     */

    const atmosphereMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,

            side: THREE.BackSide,

            blending:
                THREE.AdditiveBlending,

            depthWrite: false,

            depthTest: true,

            uniforms: {
                glowColor: {
                    value:
                        new THREE.Color(
                            "#3b9dff",
                        ),
                },

                intensity: {
                    value: 0.25,
                },

                power: {
                    value: 4.2,
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

          vViewDir =
            normalize(
              cameraPosition -
              worldPosition.xyz
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
           * ========================================================
           * ✨ FRESNEL EDGE
           * ========================================================
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
           * ========================================================
           * ☀️ SUN SCATTER
           * ========================================================
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

          float sunScatter =
            pow(
              sunLight,
              0.58
            );

          /*
           * Stronger blue around illuminated limb.
           */
          float illuminatedRim =
            fresnel *
            sunScatter;

          /*
           * Very subtle night-side glow.
           */
          float nightGlow =
            fresnel *
            0.11;

          float finalGlow =
            (
              fresnel *
              0.68
              +
              illuminatedRim *
              0.72
              +
              nightGlow
            )
            *
            intensity;

          /*
           * Keep center transparent.
           */
          finalGlow =
            smoothstep(
              0.015,
              0.64,
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
     *
     * IMPORTANT:
     *
     * Earth itself is NOT rotated here.
     *
     * Planet.tsx controls the absolute astronomical rotation.
     *
     * Only clouds have a very slow independent atmospheric motion.
     * ============================================================
     */

    useFrame(
        ({ clock }, delta) => {
            /*
             * ☁️ Very slow cloud drift.
             *
             * This is intentionally independent from Earth rotation.
             *
             * The old version used:
             *
             * rotationSpeed * 1.12
             *
             * which could fight with the Planet rotation system.
             */
            if (cloudRef.current) {
                cloudRef.current.rotation.y +=
                    delta * 0.006;
            }

            /*
             * 🌫️ Atmosphere remains static.
             *
             * No pulsing scale.
             *
             * This removes subtle edge jitter caused by constantly
             * changing the shell size.
             */
            if (atmosphereRef.current) {
                atmosphereRef.current.rotation.y +=
                    delta * 0.0004;
            }
        },
    );

    return (
        <group>
            {/* ======================================================
                🌍 EARTH SURFACE
                ====================================================== */}

            <Sphere
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