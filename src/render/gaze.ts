/** Convert a world-space target into a restrained local face offset. */
export function gazeOffset(x: number, y: number, rotation: number, target: { x: number; y: number } | null) {
  if (!target) return { x: 0, y: 0 };
  const dx = target.x - x;
  const dy = target.y - y;
  const distance = Math.max(100, Math.hypot(dx, dy));
  return { x: (dx * Math.cos(rotation) + dy * Math.sin(rotation)) / distance, y: (-dx * Math.sin(rotation) + dy * Math.cos(rotation)) / distance };
}
