export const STAR_POSITIONS = (() => {
  const count = 4500;
  const data = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const a = i * 12.9898;
    const b = i * 78.233;
    const c = i * 37.719;

    const radius = 110 + (Math.abs(Math.sin(a)) % 1) * 420;
    const theta = (Math.abs(Math.sin(b)) % 1) * Math.PI * 2;
    const phi = Math.acos(2 * (Math.abs(Math.sin(c)) % 1) - 1);

    data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    data[i * 3 + 1] = radius * Math.cos(phi);
    data[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  return data;
})();