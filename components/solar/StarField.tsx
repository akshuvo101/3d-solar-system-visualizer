import { STAR_POSITIONS } from "@/lib/constants";

export const StarField = () => {
  return (
    <points
      frustumCulled={false}
      renderOrder={-10}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[STAR_POSITIONS, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#dbe6ff"
        size={0.42}
        sizeAttenuation
        transparent
        opacity={0.72}
        depthWrite={false}
        depthTest
      />
    </points>
  );
};