import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const KUIPER_COUNT = 1800;
const FEATURED_COUNT = 24;
const DUST_COUNT = 2200;

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
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const featuredMeshRef =
    useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const dummy = useMemo(
    () => new THREE.Object3D(),
    []
  );

  /*
   * 🧊 Main Kuiper Belt
   */
  const kuiperObjects = useMemo<KuiperObject[]>(() => {
    const icyColors = [
      "#8fa8b8",
      "#a9bdc8",
      "#c4d4dc",
      "#78909c",
      "#b8cbd4",
      "#d5e1e5",
      "#6f8794",
    ];

    return Array.from(
      { length: KUIPER_COUNT },
      () => {
        const angle =
          Math.random() * Math.PI * 2;

        // Neptune is around 38 units in this simulation.
        // Kuiper Belt begins farther out.
        const radius =
          43 + Math.random() * 18;

        // Much thinner than a normal sphere,
        // but still slightly vertically scattered.
        const height =
          (Math.random() - 0.5) *
          (1.8 + Math.random() * 2.8);

        const largeObject =
          Math.random() < 0.025;

        const size = largeObject
          ? 0.075 + Math.random() * 0.11
          : 0.018 + Math.random() * 0.055;

        return {
          angle,
          radius,
          height,
          size,
          speed:
            0.018 + Math.random() * 0.045,
          rotationSpeed:
            0.15 + Math.random() * 0.65,
          rotationX:
            Math.random() * Math.PI,
          rotationY:
            Math.random() * Math.PI,
          rotationZ:
            Math.random() * Math.PI,
          color: new THREE.Color(
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
   * 🧊 Irregular icy geometry
   */
  const geometry = useMemo(() => {
    const geo =
      new THREE.IcosahedronGeometry(1, 1);

    const position =
      geo.attributes.position;

    for (
      let i = 0;
      i < position.count;
      i++
    ) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      const variation =
        0.78 + Math.random() * 0.44;

      position.setXYZ(
        i,
        x * variation,
        y *
          (0.72 +
            Math.random() * 0.4),
        z *
          (0.8 +
            Math.random() * 0.4)
      );
    }

    position.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }, []);

  /*
   * ❄️ Main icy material
   */
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    });
  }, []);

  /*
   * ✨ Featured distant objects
   */
  const featuredObjects =
    useMemo<KuiperObject[]>(() => {
      const colors = [
        "#c9dce5",
        "#dce8ed",
        "#9eb6c2",
        "#b7ccd5",
        "#e1e9ec",
      ];

      return Array.from(
        { length: FEATURED_COUNT },
        (_, index) => {
          return {
            angle:
              (index /
                FEATURED_COUNT) *
                Math.PI *
                2 +
              (Math.random() -
                0.5) *
                0.45,

            radius:
              44 +
              Math.random() * 16,

            height:
              (Math.random() -
                0.5) *
              3.8,

            size:
              0.16 +
              Math.random() * 0.25,

            speed:
              0.012 +
              Math.random() * 0.025,

            rotationSpeed:
              0.12 +
              Math.random() * 0.5,

            rotationX:
              Math.random() * Math.PI,

            rotationY:
              Math.random() * Math.PI,

            rotationZ:
              Math.random() * Math.PI,

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

  /*
   * 💎 Higher detail featured geometry
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
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        const variation =
          0.76 +
          Math.random() * 0.5;

        position.setXYZ(
          i,
          x * variation,
          y *
            (0.7 +
              Math.random() * 0.45),
          z *
            (0.78 +
              Math.random() * 0.42)
        );
      }

      position.needsUpdate = true;
      geo.computeVertexNormals();

      return geo;
    }, []);

  const featuredMaterial =
    useMemo(() => {
      return new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.84,
        metalness: 0,
        flatShading: true,
      });
    }, []);

  /*
   * 🌫️ Subtle Kuiper dust
   */
  const dustPositions = useMemo(() => {
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
        Math.random() * 20;

      const height =
        (Math.random() - 0.5) *
        4.5;

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

  const dustMaterial =
    useMemo(() => {
      return new THREE.PointsMaterial({
        color: "#b9d2dc",
        size: 0.028,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending:
          THREE.AdditiveBlending,
      });
    }, []);

  /*
   * 🎨 Main object colors
   */
  useMemo(() => {
    if (!meshRef.current) return;

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
   * 🎨 Featured object colors
   */
  useMemo(() => {
    if (!featuredMeshRef.current)
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
      featuredMeshRef.current.instanceColor.needsUpdate =
        true;
    }
  }, [featuredObjects]);

  /*
   * 🚀 Animation
   */
  useFrame(({ clock, camera }) => {
    const time =
      clock.getElapsedTime();

    /*
     * Main Kuiper objects
     */
    if (meshRef.current) {
      kuiperObjects.forEach(
        (object, index) => {
          const angle =
            object.angle +
            time * object.speed;

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

      meshRef.current.instanceMatrix.needsUpdate =
        true;
    }

    /*
     * Featured objects
     */
    if (
      featuredMeshRef.current
    ) {
      featuredObjects.forEach(
        (object, index) => {
          const angle =
            object.angle +
            time * object.speed;

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
              0.9,
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
                0.1,

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

      featuredMeshRef.current.instanceMatrix.needsUpdate =
        true;
    }

    /*
     * 🌫️ Dust rotation + distance fade
     */
    if (dustRef.current) {
      dustRef.current.rotation.y =
        time * 0.012;

      dustRef.current.rotation.x =
        Math.sin(time * 0.04) *
        0.004;

      const cameraDistance =
        camera.position.length();

      const fadeStart = 220;
      const fadeEnd = 650;

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
        0.12 * fade;
    }
  });

  return (
    <>
      {/* 🌫️ Icy Dust */}
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

      {/* 🧊 Main Kuiper Objects */}
      <instancedMesh
        ref={meshRef}
        args={[
          geometry,
          material,
          KUIPER_COUNT,
        ]}
        frustumCulled={false}
      />

      {/* ✨ Featured Icy Objects */}
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