import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const KUIPER_COUNT = 850;
const FEATURED_COUNT = 12;
const DUST_COUNT = 1000;

type KuiperObject = {
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

export const KuiperBelt = () => {
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

  /*
   * ============================================================
   * 🧊 MAIN KUIPER BELT OBJECTS
   * ============================================================
   */

  const kuiperObjects =
    useMemo<KuiperObject[]>(() => {

      const icyColors = [
        "#596a73",
        "#687b84",
        "#788b94",
        "#8a9da5",
        "#9aaeb5",
        "#6d7f87",
        "#82959d",
        "#a1b1b7",
      ];

      return Array.from(
        {
          length: KUIPER_COUNT,
        },
        () => {

          const angle =
            Math.random() *
            Math.PI *
            2;

          /*
           * Neptune ends around the outer
           * planetary region in this simulation.
           */

          const radius =
            43 +
            Math.random() *
              19;

          /*
           * Slightly flattened distribution.
           */

          const height =
            (
              Math.random() -
              0.5
            ) *
            (
              1.5 +
              Math.random() *
                3.0
            );

          /*
           * Very small number of larger bodies.
           */

          const largeObject =
            Math.random() <
            0.028;

          const size =
            largeObject
              ? 0.075 +
                Math.random() *
                  0.12
              : 0.016 +
                Math.random() *
                  0.052;

          return {
            angle,

            radius,

            height,

            size,

            speed:
              0.016 +
              Math.random() *
                0.042,

            rotationSpeed:
              0.14 +
              Math.random() *
                0.65,

            rotationX:
              Math.random() *
              Math.PI,

            rotationY:
              Math.random() *
              Math.PI,

            rotationZ:
              Math.random() *
              Math.PI,

            color:
              new THREE.Color(
                icyColors[
                  Math.floor(
                    Math.random() *
                      icyColors.length
                  )
                ]
              ),
          };
        }
      );
    }, []);

  /*
   * ============================================================
   * 🧊 IRREGULAR ICE GEOMETRY
   * ============================================================
   */

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
        0.76 +
        Math.random() *
          0.48;

      position.setXYZ(
        i,

        x *
          variation,

        y *
          (
            0.70 +
            Math.random() *
              0.42
          ),

        z *
          (
            0.78 +
            Math.random() *
              0.42
          )
      );
    }

    position.needsUpdate = true;

    geo.computeVertexNormals();

    return geo;
  }, []);

  /*
   * ============================================================
   * 🪨 MAIN KUIPER MATERIAL
   * ============================================================
   */

  const material = useMemo(() => {

    return new THREE.MeshStandardMaterial({
      color: "#ffffff",

      roughness: 0.96,

      metalness: 0,

      flatShading: true,

      emissive: "#000000",

      emissiveIntensity: 0,

      envMapIntensity: 0.18,
    });
  }, []);

  /*
   * ============================================================
   * ✨ FEATURED DISTANT OBJECTS
   * ============================================================
   */

  const featuredObjects =
    useMemo<KuiperObject[]>(() => {

      const colors = [
        "#879ba4",
        "#9aadb4",
        "#a9b9bf",
        "#72868f",
        "#b5c2c7",
        "#81959e",
      ];

      return Array.from(
        {
          length:
            FEATURED_COUNT,
        },
        (_, index) => {

          return {
            angle:
              (
                index /
                FEATURED_COUNT
              ) *
                Math.PI *
                2 +
              (
                Math.random() -
                0.5
              ) *
                0.45,

            radius:
              44 +
              Math.random() *
                17,

            height:
              (
                Math.random() -
                0.5
              ) *
              3.6,

            size:
              0.15 +
              Math.random() *
                0.25,

            speed:
              0.011 +
              Math.random() *
                0.024,

            rotationSpeed:
              0.10 +
              Math.random() *
                0.50,

            rotationX:
              Math.random() *
              Math.PI,

            rotationY:
              Math.random() *
              Math.PI,

            rotationZ:
              Math.random() *
              Math.PI,

            color:
              new THREE.Color(
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

  /*
   * ============================================================
   * 💎 FEATURED HIGH DETAIL GEOMETRY
   * ============================================================
   */

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
          0.74 +
          Math.random() *
            0.52;

        position.setXYZ(
          i,

          x *
            variation,

          y *
            (
              0.68 +
              Math.random() *
                0.46
            ),

          z *
            (
              0.76 +
              Math.random() *
                0.44
            )
        );
      }

      position.needsUpdate = true;

      geo.computeVertexNormals();

      return geo;
    }, []);

  /*
   * ============================================================
   * ✨ FEATURED MATERIAL
   * ============================================================
   */

  const featuredMaterial =
    useMemo(() => {

      return new THREE.MeshStandardMaterial({
        color: "#ffffff",

        roughness: 0.92,

        metalness: 0,

        flatShading: true,

        emissive: "#000000",

        emissiveIntensity: 0,

        envMapIntensity: 0.22,
      });
    }, []);

  /*
   * ============================================================
   * 🌫️ KUIPER DUST
   * ============================================================
   */

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
          42 +
          Math.random() *
            21;

        const height =
          (
            Math.random() -
            0.5
          ) *
          4.2;

        positions[
          i * 3
        ] =
          Math.cos(angle) *
          radius;

        positions[
          i * 3 + 1
        ] =
          height;

        positions[
          i * 3 + 2
        ] =
          Math.sin(angle) *
          radius;
      }

      return positions;
    }, []);

  const dustGeometry =
    useMemo(() => {

      const geo =
        new THREE.BufferGeometry();

      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          dustPositions,
          3
        )
      );

      return geo;
    }, [dustPositions]);

  /*
   * ============================================================
   * 🌫️ SUBTLE DUST MATERIAL
   * ============================================================
   */

  const dustMaterial =
    useMemo(() => {

      return new THREE.PointsMaterial({
        color: "#7e949e",

        size: 0.025,

        sizeAttenuation: true,

        transparent: true,

        opacity: 0.085,

        depthWrite: false,

        blending:
          THREE.AdditiveBlending,
      });
    }, []);

  /*
   * ============================================================
   * 🎨 INSTANCE COLORS
   * ============================================================
   */

  useMemo(() => {

    if (!meshRef.current)
      return;

    kuiperObjects.forEach(
      (object, index) => {

        meshRef.current!.setColorAt(
          index,
          object.color
        );
      }
    );

    if (
      meshRef.current.instanceColor
    ) {

      meshRef.current.instanceColor.needsUpdate =
        true;
    }
  }, [kuiperObjects]);

  /*
   * ============================================================
   * 🎨 FEATURED COLORS
   * ============================================================
   */

  useMemo(() => {

    if (
      !featuredMeshRef.current
    )
      return;

    featuredObjects.forEach(
      (object, index) => {

        featuredMeshRef.current!.setColorAt(
          index,
          object.color
        );
      }
    );

    if (
      featuredMeshRef.current
        .instanceColor
    ) {

      featuredMeshRef.current
        .instanceColor
        .needsUpdate = true;
    }
  }, [featuredObjects]);

  /*
   * ============================================================
   * 🚀 ANIMATION
   * ============================================================
   */

  useFrame(
    ({ clock, camera }) => {

      const time =
        clock.getElapsedTime();

      /*
       * ======================================================
       * 🧊 MAIN KUIPER OBJECTS
       * ======================================================
       */

      if (meshRef.current) {

        kuiperObjects.forEach(
          (
            object,
            index
          ) => {

            const angle =
              object.angle +
              time *
                object.speed;

            const x =
              Math.cos(angle) *
              object.radius;

            const z =
              Math.sin(angle) *
              object.radius;

            const y =
              object.height +
              Math.sin(
                time * 0.08 +
                object.angle
              ) *
                0.035;

            dummy.position.set(
              x,
              y,
              z
            );

            dummy.scale.set(
              object.size,

              object.size *
                0.82,

              object.size *
                0.92
            );

            dummy.rotation.set(

              object.rotationX +
                time *
                  object.rotationSpeed *
                  0.08,

              object.rotationY +
                time *
                  object.rotationSpeed *
                  0.12,

              object.rotationZ +
                time *
                  object.rotationSpeed *
                  0.06
            );

            dummy.updateMatrix();

            meshRef.current!.setMatrixAt(
              index,
              dummy.matrix
            );
          }
        );

        meshRef.current
          .instanceMatrix
          .needsUpdate = true;
      }

      /*
       * ======================================================
       * ✨ FEATURED OBJECTS
       * ======================================================
       */

      if (
        featuredMeshRef.current
      ) {

        featuredObjects.forEach(
          (
            object,
            index
          ) => {

            const angle =
              object.angle +
              time *
                object.speed;

            const x =
              Math.cos(angle) *
              object.radius;

            const z =
              Math.sin(angle) *
              object.radius;

            const y =
              object.height +
              Math.sin(
                time * 0.06 +
                object.angle
              ) *
                0.05;

            dummy.position.set(
              x,
              y,
              z
            );

            dummy.scale.set(
              object.size *
                1.15,

              object.size *
                0.90,

              object.size
            );

            dummy.rotation.set(

              object.rotationX +
                time *
                  object.rotationSpeed *
                  0.06,

              object.rotationY +
                time *
                  object.rotationSpeed *
                  0.10,

              object.rotationZ +
                time *
                  object.rotationSpeed *
                  0.05
            );

            dummy.updateMatrix();

            featuredMeshRef.current!.setMatrixAt(
              index,
              dummy.matrix
            );
          }
        );

        featuredMeshRef.current
          .instanceMatrix
          .needsUpdate = true;
      }

      /*
       * ======================================================
       * 🌫️ DUST ROTATION + DISTANCE FADE
       * ======================================================
       */

      if (dustRef.current) {

        dustRef.current.rotation.y =
          time * 0.011;

        dustRef.current.rotation.x =
          Math.sin(
            time * 0.04
          ) *
          0.003;

        const cameraDistance =
          camera.position.length();

        const fadeStart =
          210;

        const fadeEnd =
          650;

        const fade =
          THREE.MathUtils.clamp(
            1 -
              (
                cameraDistance -
                fadeStart
              ) /
                (
                  fadeEnd -
                  fadeStart
                ),
            0,
            1
          );

        const dustMaterial =
          dustRef.current
            .material as THREE.PointsMaterial;

        dustMaterial.opacity =
          0.085 * fade;
      }
    }
  );

  /*
   * ============================================================
   * 🎨 RENDER
   * ============================================================
   */

  return (
    <>

      {/* ======================================================
          🌫️ ICY DUST
          ====================================================== */}

      <points
        ref={dustRef}
        geometry={dustGeometry}
        frustumCulled={false}
      >
        <primitive
          object={dustMaterial}
          attach="material"
        />
      </points>

      {/* ======================================================
          🧊 MAIN KUIPER OBJECTS
          ====================================================== */}

      <instancedMesh
        ref={meshRef}
        args={[
          geometry,
          material,
          KUIPER_COUNT,
        ]}
        frustumCulled={false}
      />

      {/* ======================================================
          ✨ FEATURED ICY OBJECTS
          ====================================================== */}

      <instancedMesh
        ref={featuredMeshRef}
        args={[
          featuredGeometry,
          featuredMaterial,
          FEATURED_COUNT,
        ]}
        frustumCulled={false}
      />

    </>
  );
};