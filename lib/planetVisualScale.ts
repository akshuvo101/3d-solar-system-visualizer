export const PLANET_VISUAL_SCALE: Record<string, number> = {
  Mercury: 0.40,
  Venus: 0.95,
  Earth: 1.0,
  Mars: 0.53,
  Jupiter: 2.8,
  Saturn: 2.45,
  Uranus: 1.65,
  Neptune: 1.6,
};

export const SELECTED_PLANET_CLOSEUP_SIZE = 1.35;
export const PLANET_CLOSEUP_CAMERA_DISTANCE = 15;

export function getSelectedPlanetScale(
  planetName: string,
) {
  const physicalScale =
    PLANET_VISUAL_SCALE[planetName] ?? 1;

  return (
    SELECTED_PLANET_CLOSEUP_SIZE /
    physicalScale
  );
}