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
     * Brightness-enhanced version.
     *
     * Important:
     * - No UV based terrain noise
     * - No animated surface noise
     * - Uses local spherical direction
     * - Prevents longitude / column artifacts
     * - Brighter daylight while preserving night contrast
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
           *
           * Slightly brighter than the previous version.
           */

          vec3 deepOcean =
            vec3(
              0.003,
              0.024,
              0.080
            );

          vec3 ocean =
            vec3(
              0.006,
              0.075,
              0.185
            );

          vec3 shallowOcean =
            vec3(
              0.015,
              0.155,
              0.310
            );

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
              0.38
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
           * 🌲 VEGETATION
           * ========================================================
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
           *
           * Slightly brighter land colors.
           */

          vec3 rock =
            vec3(
              0.30,
              0.285,
              0.245
            );

          vec3 rockLight =
            vec3(
              0.48,
              0.445,
              0.355
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
              0.59,
              0.395,
              0.18
            );

          desertColor =
            mix(
              desertColor,
              vec3(
                0.76,
                0.575,
                0.32
              ),
              smoothstep(
                0.58,
                0.82,
                terrain
              ) *
              0.38
            );

          /*
           * ========================================================
           * 🌿 VEGETATION COLORS
           * ========================================================
           */

          vec3 grassland =
            vec3(
              0.225,
              0.335,
              0.105
            );

          vec3 forest =
            vec3(
              0.055,
              0.205,
              0.065
            );

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

          landColor =
            mix(
              landColor,
              vegetationColor,
              vegetation * 0.72
            );

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
              0.84,
              0.93,
              0.985
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
              0.30,
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
           * ☀️ BRIGHTER DAYLIGHT
           * ========================================================
           *
           * Previous:
           *   0.18 + daylight * 1.04
           *
           * New:
           *   stronger direct illumination
           */

          float daylight =
            pow(
              diffuse,
              0.68
            );

          float dayIntensity =
            0.24 +
            daylight * 1.20;

          surface *=
            dayIntensity;

          /*
           * ========================================================
           * ☀️ SOLAR WARMTH
           * ========================================================
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
              surface * sunlightTint,
              day * 0.13
            );

          /*
           * ========================================================
           * ✨ SUBTLE DAYLIGHT BOOST
           * ========================================================
           *
           * Gives Earth a more visually readable appearance
           * without simply multiplying the entire planet.
           */

          surface +=
            surface *
            day *
            0.065;

          /*
           * ========================================================
           * 🌅 TWILIGHT
           * ========================================================
           */

          vec3 twilightColor =
            vec3(
              0.40,
              0.16,
              0.050
            );

          surface +=
            twilightColor *
            twilight *
            0.052;

          /*
           * ========================================================
           * 🌑 NIGHT SIDE
           * ========================================================
           *
           * Slightly lifted from the previous version so Earth
           * remains visible in cinematic shots.
           */

          surface *=
            0.31 +
            day * 0.69;

          /*
           * ========================================================
           * 🌌 NIGHT AMBIENT
           * ========================================================
           */

          surface +=
            vec3(
              0.003,
              0.009,
              0.026
            )
            *
            night
            *
            0.55;

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
              0.09
            );

          /*
           * ========================================================
           * ✨ FINAL VISUAL LIFT
           * ========================================================
           *
           * Prevents very dark surfaces from becoming visually lost.
           */

          surface =
            max(
              surface,
              vec3(
                0.0015
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
     * Brighter and slightly more visible cloud layer.
     * ============================================================
     */

    const cloudMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,

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
           * Slightly stronger cloud definition.
           */

          clouds =
            smoothstep(
              0.47,
              0.65,
              clouds
            );

          /*
           * Reduce clouds near poles.
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

          float cloudLight =
            0.13 +
            pow(
              sunlight,
              0.68
            ) *
            0.96;

          /*
           * Cloud colors.
           */

          vec3 cloudDay =
            vec3(
              0.96,
              0.985,
              1.0
            );

          vec3 cloudNight =
            vec3(
              0.022,
              0.040,
              0.075
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
           * Silver edge highlight.
           */

          float highlight =
            pow(
              sunlight,
              3.0
            );

          cloudColor +=
            vec3(
              0.065,
              0.075,
              0.085
            )
            *
            highlight;

          /*
           * Slightly stronger cloud visibility.
           */

          float alpha =
            clouds *
            0.33 *
            cloudLight;

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
     *
     * Slightly stronger blue atmospheric rim for more visual impact.
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
                    value: 0.30,
                },

                power: {
                    value: 4.0,
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
              1.0 - viewDot,
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
              0.55
            );

          /*
           * Stronger illuminated rim.
           */

          float illuminatedRim =
            fresnel *
            sunScatter;

          /*
           * Very subtle night-side atmospheric glow.
           */

          float nightGlow =
            fresnel *
            0.13;

          float finalGlow =
            (
              fresnel *
              0.72
              +
              illuminatedRim *
              0.78
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
              0.012,
              0.62,
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
     * Earth itself is NOT rotated here.
     * Planet.tsx controls astronomical rotation.
     *
     * Only clouds receive a very slow independent motion.
     * ============================================================
     */

    useFrame(
        ({}, delta) => {

            /*
             * ☁️ Very slow cloud drift.
             */
            if (cloudRef.current) {
                cloudRef.current.rotation.y +=
                    delta * 0.006;
            }

            /*
             * 🌫️ Atmosphere remains almost static.
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