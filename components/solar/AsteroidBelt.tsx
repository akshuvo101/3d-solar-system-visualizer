import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ASTEROID_COUNT = 650;
const DUST_COUNT = 1000;
const FEATURED_COUNT = 10;

type Asteroid = {
    angle: number;
    radius: number;
    height: number;
    size: number;

    speed: number;
    rotationSpeed: number;

    rotationX: number;
    rotationY: number;
    rotationZ: number;

    color: THREE.Color;
};

type FeaturedAsteroid = {
    angle: number;
    radius: number;
    height: number;
    size: number;

    speed: number;
    rotationSpeed: number;

    rotationX: number;
    rotationY: number;
    rotationZ: number;

    color: THREE.Color;
};

export const AsteroidBelt = () => {
    const meshRef =
        useRef<THREE.InstancedMesh>(null);

    const featuredMeshRef =
        useRef<THREE.InstancedMesh>(null);

    const dustRef =
        useRef<THREE.Points>(null);

    const dummy = useMemo(
        () => new THREE.Object3D(),
        []
    );

    // =====================================================
    // 🪨 MAIN ASTEROID BELT
    // =====================================================

    const asteroids = useMemo<Asteroid[]>(() => {
        const rockColors = [
            "#3f3a35",
            "#4b4540",
            "#575049",
            "#625a52",
            "#514b45",
            "#6b6259",
            "#45413c",
        ];

        return Array.from(
            { length: ASTEROID_COUNT },
            () => {
                const angle =
                    Math.random() *
                    Math.PI *
                    2;

                const radius =
                    26.8 +
                    Math.random() * 5.2;

                const height =
                    (Math.random() - 0.5) *
                    2.4;

                const largeRock =
                    Math.random() < 0.055;

                const size = largeRock
                    ? 0.09 +
                    Math.random() * 0.13
                    : 0.025 +
                    Math.random() * 0.075;

                return {
                    angle,
                    radius,
                    height,
                    size,

                    speed:
                        0.075 +
                        Math.random() * 0.17,

                    rotationSpeed:
                        0.3 +
                        Math.random() * 1.4,

                    rotationX:
                        Math.random() *
                        Math.PI,

                    rotationY:
                        Math.random() *
                        Math.PI,

                    rotationZ:
                        Math.random() *
                        Math.PI,

                    color: new THREE.Color(
                        rockColors[
                        Math.floor(
                            Math.random() *
                            rockColors.length
                        )
                        ]
                    ),
                };
            }
        );
    }, []);

    // =====================================================
    // 🪨 MAIN ROCK GEOMETRY
    // =====================================================

    const geometry = useMemo(() => {
        const geo =
            new THREE.IcosahedronGeometry(
                1,
                1
            );

        const position =
            geo.attributes.position;

        for (
            let i = 0;
            i < position.count;
            i++
        ) {
            const x =
                position.getX(i);

            const y =
                position.getY(i);

            const z =
                position.getZ(i);

            const variation =
                0.82 +
                Math.random() * 0.36;

            position.setXYZ(
                i,
                x * variation,
                y *
                (0.82 +
                    Math.random() *
                    0.36),
                z * variation
            );
        }

        position.needsUpdate = true;

        geo.computeVertexNormals();

        return geo;
    }, []);

    // =====================================================
    // 🪨 REALISTIC ROCK MATERIAL
    // =====================================================

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#302d2a",

            roughness: 1,
            metalness: 0,

            flatShading: true,

            emissive: "#000000",
            emissiveIntensity: 0,

            envMapIntensity: 0,
        });
    }, []);

    // =====================================================
    // 🌟 FEATURED ASTEROIDS
    // =====================================================

    const featuredAsteroids =
        useMemo<FeaturedAsteroid[]>(() => {
            return Array.from(
                {
                    length: FEATURED_COUNT,
                },
                (_, index) => {
                    const colors = [
                        "#625a52",
                        "#6e645b",
                        "#554e47",
                        "#766b60",
                        "#49443f",
                    ];

                    return {
                        angle:
                            (index /
                                FEATURED_COUNT) *
                            Math.PI *
                            2 +
                            Math.random() *
                            0.4,

                        radius:
                            27.2 +
                            Math.random() * 4.4,

                        height:
                            (Math.random() - 0.5) *
                            2.2,

                        size:
                            0.18 +
                            Math.random() * 0.25,

                        speed:
                            0.055 +
                            Math.random() * 0.09,

                        rotationSpeed:
                            0.25 +
                            Math.random() * 0.7,

                        rotationX:
                            Math.random() *
                            Math.PI,

                        rotationY:
                            Math.random() *
                            Math.PI,

                        rotationZ:
                            Math.random() *
                            Math.PI,

                        color: new THREE.Color(
                            colors[
                            Math.floor(
                                Math.random() *
                                colors.length
                            )
                            ]
                        ),
                    };
                }
            );
        }, []);

    // =====================================================
    // 🌟 FEATURED ASTEROID GEOMETRY
    // =====================================================

    const featuredGeometry =
        useMemo(() => {
            const geo =
                new THREE.IcosahedronGeometry(
                    1,
                    2
                );

            const position =
                geo.attributes.position;

            for (
                let i = 0;
                i < position.count;
                i++
            ) {
                const x =
                    position.getX(i);

                const y =
                    position.getY(i);

                const z =
                    position.getZ(i);

                const variation =
                    0.72 +
                    Math.random() * 0.55;

                position.setXYZ(
                    i,
                    x * variation,
                    y *
                    (0.65 +
                        Math.random() *
                        0.55),
                    z *
                    (0.78 +
                        Math.random() *
                        0.4)
                );
            }

            position.needsUpdate = true;

            geo.computeVertexNormals();

            return geo;
        }, []);

    // =====================================================
    // 🪨 FEATURED ROCK MATERIAL
    // =====================================================

    const featuredMaterial =
        useMemo(() => {
            return new THREE.MeshStandardMaterial({
                color: "#38332f",

                roughness: 1,
                metalness: 0,

                flatShading: true,

                emissive: "#000000",
                emissiveIntensity: 0,

                envMapIntensity: 0,
            });
        }, []);

    // =====================================================
    // ✨ COSMIC DUST
    // =====================================================

    const dustPositions =
        useMemo(() => {
            const positions =
                new Float32Array(
                    DUST_COUNT * 3
                );

            for (
                let i = 0;
                i < DUST_COUNT;
                i++
            ) {
                const angle =
                    Math.random() *
                    Math.PI *
                    2;

                const radius =
                    26.5 +
                    Math.random() * 5.8;

                const height =
                    (Math.random() - 0.5) *
                    2.8;

                positions[i * 3] =
                    Math.cos(angle) *
                    radius;

                positions[i * 3 + 1] =
                    height;

                positions[i * 3 + 2] =
                    Math.sin(angle) *
                    radius;
            }

            return positions;
        }, []);

    const dustMaterial =
        useMemo(() => {
            return new THREE.PointsMaterial({
                color: "#8d8175",

                size: 0.04,

                sizeAttenuation: true,

                transparent: true,

                opacity: 0.10,

                depthWrite: false,

                blending:
                    THREE.AdditiveBlending,
            });
        }, []);

    // =====================================================
    // 🎨 MAIN ASTEROID COLORS
    // =====================================================

    useMemo(() => {
        if (!meshRef.current) return;

        asteroids.forEach(
            (asteroid, index) => {
                meshRef.current!.setColorAt(
                    index,
                    asteroid.color
                );
            }
        );

        if (
            meshRef.current.instanceColor
        ) {
            meshRef.current.instanceColor.needsUpdate =
                true;
        }
    }, [asteroids]);

    // =====================================================
    // 🎨 FEATURED ASTEROID COLORS
    // =====================================================

    useMemo(() => {
        if (!featuredMeshRef.current)
            return;

        featuredAsteroids.forEach(
            (asteroid, index) => {
                featuredMeshRef.current!.setColorAt(
                    index,
                    asteroid.color
                );
            }
        );

        if (
            featuredMeshRef.current
                .instanceColor
        ) {
            featuredMeshRef.current.instanceColor.needsUpdate =
                true;
        }
    }, [featuredAsteroids]);

    // =====================================================
    // 📍 INITIAL MAIN ASTEROID POSITION
    // =====================================================

    useMemo(() => {
        if (!meshRef.current) return;

        asteroids.forEach(
            (asteroid, index) => {
                const x =
                    Math.cos(
                        asteroid.angle
                    ) *
                    asteroid.radius;

                const z =
                    Math.sin(
                        asteroid.angle
                    ) *
                    asteroid.radius;

                dummy.position.set(
                    x,
                    asteroid.height,
                    z
                );

                dummy.scale.set(
                    asteroid.size * 0.9,
                    asteroid.size * 0.78,
                    asteroid.size
                );

                dummy.rotation.set(
                    asteroid.rotationX,
                    asteroid.rotationY,
                    asteroid.rotationZ
                );

                dummy.updateMatrix();

                meshRef.current!.setMatrixAt(
                    index,
                    dummy.matrix
                );
            }
        );

        meshRef.current.instanceMatrix.needsUpdate =
            true;
    }, [asteroids, dummy]);

    // =====================================================
    // 📍 INITIAL FEATURED ASTEROIDS
    // =====================================================

    useMemo(() => {
        if (!featuredMeshRef.current)
            return;

        featuredAsteroids.forEach(
            (asteroid, index) => {
                const x =
                    Math.cos(
                        asteroid.angle
                    ) *
                    asteroid.radius;

                const z =
                    Math.sin(
                        asteroid.angle
                    ) *
                    asteroid.radius;

                dummy.position.set(
                    x,
                    asteroid.height,
                    z
                );

                dummy.scale.set(
                    asteroid.size * 1.15,
                    asteroid.size * 0.85,
                    asteroid.size
                );

                dummy.rotation.set(
                    asteroid.rotationX,
                    asteroid.rotationY,
                    asteroid.rotationZ
                );

                dummy.updateMatrix();

                featuredMeshRef.current!.setMatrixAt(
                    index,
                    dummy.matrix
                );
            }
        );

        featuredMeshRef.current.instanceMatrix.needsUpdate =
            true;
    }, [featuredAsteroids, dummy]);

    // =====================================================
    // 🔄 ANIMATION
    // =====================================================

    useFrame(({ clock, camera }) => {
        const time =
            clock.getElapsedTime();

        // =================================================
        // 🪨 MAIN ASTEROIDS
        // =================================================

        if (meshRef.current) {
            asteroids.forEach(
                (asteroid, index) => {
                    const angle =
                        asteroid.angle +
                        time *
                        asteroid.speed;

                    const x =
                        Math.cos(angle) *
                        asteroid.radius;

                    const z =
                        Math.sin(angle) *
                        asteroid.radius;

                    const y =
                        asteroid.height +
                        Math.sin(
                            time * 0.18 +
                            asteroid.angle
                        ) *
                        0.025;

                    dummy.position.set(
                        x,
                        y,
                        z
                    );

                    dummy.scale.set(
                        asteroid.size * 0.9,
                        asteroid.size * 0.78,
                        asteroid.size
                    );

                    dummy.rotation.set(
                        asteroid.rotationX +
                        time *
                        asteroid.rotationSpeed *
                        0.16,

                        asteroid.rotationY +
                        time *
                        asteroid.rotationSpeed *
                        0.24,

                        asteroid.rotationZ +
                        time *
                        asteroid.rotationSpeed *
                        0.12
                    );

                    dummy.updateMatrix();

                    meshRef.current!.setMatrixAt(
                        index,
                        dummy.matrix
                    );
                }
            );

            meshRef.current.instanceMatrix.needsUpdate =
                true;
        }

        // =================================================
        // 🌟 FEATURED ASTEROIDS
        // =================================================

        if (
            featuredMeshRef.current
        ) {
            featuredAsteroids.forEach(
                (asteroid, index) => {
                    const angle =
                        asteroid.angle +
                        time *
                        asteroid.speed;

                    const x =
                        Math.cos(angle) *
                        asteroid.radius;

                    const z =
                        Math.sin(angle) *
                        asteroid.radius;

                    const y =
                        asteroid.height +
                        Math.sin(
                            time * 0.12 +
                            asteroid.angle
                        ) *
                        0.035;

                    dummy.position.set(
                        x,
                        y,
                        z
                    );

                    dummy.scale.set(
                        asteroid.size * 1.15,
                        asteroid.size * 0.85,
                        asteroid.size
                    );

                    dummy.rotation.set(
                        asteroid.rotationX +
                        time *
                        asteroid.rotationSpeed *
                        0.12,

                        asteroid.rotationY +
                        time *
                        asteroid.rotationSpeed *
                        0.18,

                        asteroid.rotationZ +
                        time *
                        asteroid.rotationSpeed *
                        0.08
                    );

                    dummy.updateMatrix();

                    featuredMeshRef.current!.setMatrixAt(
                        index,
                        dummy.matrix
                    );
                }
            );

            featuredMeshRef.current.instanceMatrix.needsUpdate =
                true;
        }

        // =================================================
        // ✨ DUST
        // =================================================

        if (dustRef.current) {
            dustRef.current.rotation.y =
                time * 0.025;

            dustRef.current.rotation.x =
                Math.sin(
                    time * 0.08
                ) * 0.008;

            const cameraDistance =
                camera.position.length();

            const fadeStart = 180;
            const fadeEnd = 500;

            const fade =
                THREE.MathUtils.clamp(
                    1 -
                    (cameraDistance -
                        fadeStart) /
                    (fadeEnd -
                        fadeStart),
                    0,
                    1
                );

            const dustMaterial =
                dustRef.current
                    .material as THREE.PointsMaterial;

            dustMaterial.opacity =
                0.10 * fade;
        }
    });

    return (
        <>
            {/* ✨ Fine cosmic dust */}

            <points
                ref={dustRef}
                geometry={
                    new THREE.BufferGeometry().setAttribute(
                        "position",
                        new THREE.Float32BufferAttribute(
                            dustPositions,
                            3
                        )
                    )
                }
                frustumCulled={false}
            >
                <primitive
                    object={dustMaterial}
                    attach="material"
                />
            </points>

            {/* 🪨 Main asteroid population */}

            <instancedMesh
                ref={meshRef}
                args={[
                    geometry,
                    material,
                    ASTEROID_COUNT,
                ]}
                frustumCulled={false}
                castShadow
                receiveShadow
            />

            {/* 🌟 Featured larger asteroids */}

            <instancedMesh
                ref={featuredMeshRef}
                args={[
                    featuredGeometry,
                    featuredMaterial,
                    FEATURED_COUNT,
                ]}
                frustumCulled={false}
                castShadow
                receiveShadow
            />
        </>
    );
};