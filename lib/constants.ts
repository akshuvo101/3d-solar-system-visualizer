export const STAR_POSITIONS = (() => {
  const count = 9000;
  const data = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const a = i * 12.9898;
    const b = i * 78.233;
    const c = i * 37.719;
    const d = i * 45.164;

    // 🌌 Multiple depth layers
    const layer = Math.abs(Math.sin(d)) % 1;

    let minRadius: number;
    let maxRadius: number;

    if (layer < 0.55) {
      // ✨ Dense middle space
      minRadius = 150;
      maxRadius = 500;
    } else if (layer < 0.85) {
      // 🌠 Deep space
      minRadius = 500;
      maxRadius = 1000;
    } else {
      // 🌌 Very distant stars
      minRadius = 1000;
      maxRadius = 1800;
    }

    const randomRadius =
      Math.abs(Math.sin(a)) % 1;

    const radius =
      minRadius +
      randomRadius * (maxRadius - minRadius);

    const theta =
      (Math.abs(Math.sin(b)) % 1) *
      Math.PI *
      2;

    const phi =
      Math.acos(
        2 * (Math.abs(Math.sin(c)) % 1) - 1
      );

    data[i * 3] =
      radius *
      Math.sin(phi) *
      Math.cos(theta);

    data[i * 3 + 1] =
      radius * Math.cos(phi);

    data[i * 3 + 2] =
      radius *
      Math.sin(phi) *
      Math.sin(theta);
  }

  return data;
})();