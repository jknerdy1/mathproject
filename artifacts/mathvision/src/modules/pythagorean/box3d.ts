/**
 * Tiny 3D → 2D projection helpers shared by the prism (6a) and
 * 3D-distance (6b) sections. No WebGL — just a manual isometric-style
 * projection of a rotatable box.
 *
 * Local space: x (length l), y (height h, up), z (width w, depth).
 * Rotation is around the VERTICAL (y) axis only, like a lazy Susan.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Rotate a point around the vertical (y) axis by θ (radians). */
export function rotateY(p: Vec3, theta: number): Vec3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
}

/**
 * Project a rotated coordinate to screen space.
 * screenX = x, screenY = y − z·TILT (z pushes the point up on screen).
 * The TILT factor controls how much "depth" each z-unit tilts the y axis.
 */
const TILT = 0.5;
export function project(p: Vec3): Vec2 {
  return { x: p.x, y: p.y - p.z * TILT };
}

/** Convenience: rotate, then project. */
export function projectRotated(p: Vec3, theta: number): Vec2 {
  return project(rotateY(p, theta));
}

/** Build an axis-aligned box centered at the origin with the given half-widths. */
export function makeBox(
  l: number,
  w: number,
  h: number,
): { verts: Vec3[]; edges: [number, number][] } {
  const verts: Vec3[] = [
    { x: -l / 2, y: -h / 2, z: -w / 2 },
    { x:  l / 2, y: -h / 2, z: -w / 2 },
    { x:  l / 2, y: -h / 2, z:  w / 2 },
    { x: -l / 2, y: -h / 2, z:  w / 2 },
    { x: -l / 2, y:  h / 2, z: -w / 2 },
    { x:  l / 2, y:  h / 2, z: -w / 2 },
    { x:  l / 2, y:  h / 2, z:  w / 2 },
    { x: -l / 2, y:  h / 2, z:  w / 2 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return { verts, edges };
}
