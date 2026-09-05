import { STAR_POSITIONS } from "@/lib/constants";

export const StarField = () => {
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[STAR_POSITIONS, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#c9d6ff"
        size={0.7}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
};