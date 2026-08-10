import { useState, useEffect, useRef } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { LogOut } from "lucide-react";

// ---------------------------------------------------------------------------
// Night-sky → campfire → grid hero
//
// A compact (~60-66vh) scene: a vertical night/dusk sky gradient, scattered
// (some twinkling) stars and a Milky Way haze up top, a rolling-hill
// silhouette whose ground fades out into the site's cream grid background,
// and a large animated foreground campfire. Content (site name + tagline)
// sits above the horizon. Subtle parallax moves the stars slower than the
// foreground; prefers-reduced-motion renders everything statically.
// ---------------------------------------------------------------------------

const C = {
  fireOuter: "#e8752b",
  fireInner: "#ffcf6a",
  fireCore: "#ffebba",
  glow: "#ffb15a",
  silhouette: "#1a100e",
  cream: "var(--site-bg)",
  skyText: "#FFF1E7",
  skyTextSoft: "rgba(255, 241, 231, 0.72)",
};

const SKY_GRADIENT =
  "linear-gradient(to bottom, #06081c 0%, #12173f 20%, #372c55 40%, #9a6570 55%, #eab98d 70%, var(--site-bg) 85%, var(--site-bg) 100%)";

const SVG_W = 1440;
const SVG_H = 900;

// --- Deterministic pseudo-random helpers --------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260808);

// ---------------------------------------------------------------------------
// Stars & Milky Way
//
// A single deterministic Catmull-Rom centerline drives BOTH the rendered
// Milky Way band (a true tapering ribbon via a variable-half-width filled
// path, layered core/gradient strokes for internal brightness, and dark dust
// lanes) AND the star-density field — so the densest stars sit exactly where
// the band is, exactly like a real night sky. Field stars vary in size,
// brightness and colour temperature; a handful of brightest ones carry a soft
// glow dot; and faint background stars fill the "empty" areas so nothing reads
// as dead negative space.
// ---------------------------------------------------------------------------
type Star = {
  x: number;
  y: number;
  r: number;
  o: number;
  tw: boolean;
  ph: number;
  c: string;
  glow: boolean;
};

const STAR_COLORS = [
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#fff3dd",
  "#ffe2b0",
  "#d9e4ff",
  "#cfe0ff",
];
function starColor(): string {
  return STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
}

// Milky Way centerline — a diagonal, gently wavy streak sitting in the
// MID-UPPER sky (clear of the top edge), slightly off-center. Its polyline
// drives BOTH the soft-blob band above AND the star-density field, so denser
// stars sit exactly where the glow is.
const MW_CTRL = [
  { x: 150, y: 372 },
  { x: 330, y: 306 },
  { x: 540, y: 260 },
  { x: 750, y: 268 },
  { x: 950, y: 312 },
  { x: 1140, y: 356 },
  { x: 1310, y: 392 },
];

// Catmull-Rom spline sampled into a dense polyline (used for the band's blob
// placement AND distance queries so star density follows the band).
function catmullSample(ctrl: { x: number; y: number }[], stepsPer = 24): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < stepsPer; s++) {
      const t = s / stepsPer;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  const last = ctrl[ctrl.length - 1];
  pts.push({ x: last.x, y: last.y });
  return pts;
}
const MW_POLY = catmullSample(MW_CTRL);

// Distance from a point to the band polyline (for star-density falloff).
function distToPoly(px: number, py: number, pts: { x: number; y: number }[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const A = pts[i - 1];
    const B = pts[i];
    const abx = B.x - A.x;
    const aby = B.y - A.y;
    const len2 = abx * abx + aby * aby || 1;
    let t = ((px - A.x) * abx + (py - A.y) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = A.x + abx * t;
    const cy = A.y + aby * t;
    const d = Math.hypot(px - cx, py - cy);
    if (d < best) best = d;
  }
  return best;
}

// --- Milky Way: many overlapping soft blobs (NOT a single shape) ----------
// Each blob is a low-opacity ellipse; the whole group is blurred with
// feGaussianBlur so the blobs melt together and no individual primitive's
// edge is ever visible anywhere in the band. Colours mix pale blue-white,
// warm dust-tan (#eab98d family) and pale lavender — never flat grey — with a
// couple of brighter warm/white "core" knots where the band is densest.
const mwRand = mulberry32(778899);
type MWBlob = { x: number; y: number; rx: number; ry: number; rot: number; g: string; o: number };

// Local band tangent angle (deg) at a polyline index — orients each blob along
// the streak so the width contrasts properly with the length.
function blobAngle(i: number): number {
  const a = MW_POLY[Math.max(0, i - 1)];
  const b = MW_POLY[Math.min(MW_POLY.length - 1, i + 1)];
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

// 0..1 how "fat" the band is at a given index — pinched near the ends, wide in
// the middle (a true blobby streak, not a uniform ribbon).
function bandFade(i: number): number {
  const t = i / (MW_POLY.length - 1);
  return Math.pow(Math.sin(Math.min(1, Math.max(0, t)) * Math.PI), 0.9);
}

const MW_BLOBS: MWBlob[] = (() => {
  const blobs: MWBlob[] = [];
  const n = MW_POLY.length;
  // Base haze — pale blue-white + lavender, wide soft coverage.
  for (let k = 0; k < 80; k++) {
    const i = Math.floor(mwRand() * n);
    const p = MW_POLY[i];
    const m = bandFade(i);
    blobs.push({
      x: p.x + (mwRand() - 0.5) * 66,
      y: p.y + (mwRand() - 0.5) * 44,
      rx: 52 + m * 160 + mwRand() * 80,
      ry: 18 + m * 58 + mwRand() * 26,
      rot: blobAngle(i),
      g: mwRand() < 0.55 ? "url(#mwCool)" : "url(#mwLav)",
      o: 0.5 + mwRand() * 0.35,
    });
  }
  // Warm dust-tan, concentrated around the densest middle of the band.
  for (let q = 0; q < 46; q++) {
    const i = Math.floor((0.26 + mwRand() * 0.48) * (n - 1));
    const p = MW_POLY[i];
    const m = bandFade(i);
    blobs.push({
      x: p.x + (mwRand() - 0.5) * 56,
      y: p.y + (mwRand() - 0.5) * 34,
      rx: 40 + m * 128 + mwRand() * 62,
      ry: 15 + m * 50 + mwRand() * 24,
      rot: blobAngle(i),
      g: "url(#mwWarm)",
      o: 0.5 + mwRand() * 0.4,
    });
  }
  // Pale lavender wisps scattered along the whole offset-streak.
  for (let q = 0; q < 26; q++) {
    const i = Math.floor(mwRand() * n);
    const p = MW_POLY[i];
    const m = bandFade(i);
    blobs.push({
      x: p.x + (mwRand() - 0.5) * 44,
      y: p.y + (mwRand() - 0.5) * 32,
      rx: 34 + m * 80 + mwRand() * 46,
      ry: 13 + m * 36 + mwRand() * 18,
      rot: blobAngle(i),
      g: "url(#mwLav)",
      o: 0.45 + mwRand() * 0.35,
    });
  }
  // Small brighter warm/white knots (star-dense clumps) near the core.
  for (let q = 0; q < 9; q++) {
    const i = Math.floor((0.34 + mwRand() * 0.32) * (n - 1));
    const p = MW_POLY[i];
    const m = bandFade(i);
    blobs.push({
      x: p.x + (mwRand() - 0.5) * 28,
      y: p.y + (mwRand() - 0.5) * 18,
      rx: 14 + m * 34,
      ry: 8 + m * 15,
      rot: blobAngle(i),
      g: "url(#mwWarm)",
      o: 0.85,
    });
  }
  return blobs;
})();

// Dark dust lanes — semi-transparent dark plum ribbons (30-40% opacity) running
// through the band, offset from its centerline so they read as real dust
// obscuring the starlight, not broad strokes on top.
const MW_DUST: MWBlob[] = (() => {
  const out: MWBlob[] = [];
  const laneOffs = [50, -42];
  laneOffs.forEach((off) => {
    const lane = MW_POLY.map((p, i) => {
      const a = MW_POLY[Math.max(0, i - 1)];
      const b = MW_POLY[Math.min(MW_POLY.length - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const L = Math.hypot(dx, dy) || 1;
      return { x: p.x + (-dy / L) * off, y: p.y + (dx / L) * off };
    });
    for (let q = 0; q < 10; q++) {
      const i = Math.floor((0.18 + mwRand() * 0.64) * (lane.length - 1));
      const p = lane[i];
      const t = i / (lane.length - 1);
      const m = Math.pow(Math.sin(Math.min(1, Math.max(0, t)) * Math.PI), 0.7);
      out.push({
        x: p.x + (mwRand() - 0.5) * 36,
        y: p.y + (mwRand() - 0.5) * 26,
        rx: 30 + m * 90,
        ry: 7 + m * 16,
        rot: blobAngle(i),
        g: "url(#mwDust)",
        o: 0.55 + mwRand() * 0.2,
      });
    }
  });
  return out;
})();

// --- Star generation (density-aware) -----------------------------------
const FIELD_STARS: Star[] = (() => {
  const out: Star[] = [];
  for (let i = 0; i < 210; i++) {
    const x = rand() * SVG_W;
    const y = rand() * 560;
    // Fade stars out toward the horizon (below ~y320).
    const fade = y < 320 ? 1 : Math.max(0.12, 1 - (y - 320) / 240);
    // Density/brightness boost near the band, tapering off into the sky.
    const d = distToPoly(x, y, MW_POLY);
    const bandBoost = Math.max(0.3, 1 - d / 150);
    const o = (0.26 + rand() * 0.55) * fade * (0.6 + 0.6 * bandBoost);
    out.push({
      x,
      y,
      r: 0.5 + rand() * 1.7,
      o,
      tw: rand() < 0.3,
      ph: rand(),
      c: starColor(),
      glow: o > 0.7 && Math.hypot(x - 760, y - 300) > 150 && rand() < 0.5,
    });
  }
  return out;
})();

// Dense, brighter stars that cling to the Milky Way band itself — the cores of
// the clumps visible against the haze. Sampled on/around the centerline.
const BAND_STARS: Star[] = (() => {
  const out: Star[] = [];
  const n = MW_POLY.length;
  for (let i = 0; i < 170; i++) {
    const idx = Math.floor(rand() * n);
    const p = MW_POLY[idx];
    const a = MW_POLY[Math.max(0, idx - 1)];
    const b = MW_POLY[Math.min(n - 1, idx + 1)];
    // Spread perpendicular to the band, densest at its core.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const spread = (rand() - 0.5) * 150;
    const x = p.x + nx * spread;
    const y = p.y + ny * spread;
    const fringe = Math.abs(spread) / 90; // dimmer further from the core
    out.push({
      x,
      y,
      r: 0.6 + rand() * 1.9,
      o: 0.55 + rand() * 0.45 - fringe * 0.35,
      tw: rand() < 0.35,
      ph: rand(),
      c: starColor(),
      glow: rand() < 0.4,
    });
  }
  return out;
})();

// Bright prominent stars sprinkling over the whole upper sky.
const LUMINARIES: Star[] = (() => {
  const out: Star[] = [];
  for (let i = 0; i < 26; i++) {
    const x = rand() * SVG_W;
    const y = 40 + rand() * 300;
    out.push({
      x,
      y,
      r: 1.6 + rand() * 1.6,
      o: 0.75 + rand() * 0.25,
      tw: rand() < 0.4,
      ph: rand(),
      c: starColor(),
      glow: true,
    });
  }
  return out;
})();

// Very-faint background stars scattered even in the "empty" areas.
const FAINT_STARS: Star[] = (() => {
  const out: Star[] = [];
  for (let i = 0; i < 150; i++) {
    const x = rand() * SVG_W;
    const y = rand() * 520;
    out.push({
      x,
      y,
      r: 0.35 + rand() * 0.5,
      o: 0.14 + rand() * 0.22,
      tw: false,
      ph: 0,
      c: starColor(),
      glow: false,
    });
  }
  return out;
})();

// --- Horizon silhouette (taller, more mountainous), ground fades out -----
// The crest is built from cubic-bezier segments so the same segments power
// both the fill path and crestY(x) tree anchoring (every tree sits ON the
// terrain, never floating in the sky). Peaks rise to ~y450-470, valleys ~y520-533.
type HillSeg = { x0: number; y0: number; c1x: number; c1y: number; c2x: number; c2y: number; x1: number; y1: number };
const HILL_SEGS: HillSeg[] = [
  { x0: 0, y0: 530, c1x: 90, c1y: 490, c2x: 110, c2y: 468, x1: 170, y1: 452 },
  { x0: 170, y0: 452, c1x: 240, c1y: 436, c2x: 300, c2y: 505, x1: 360, y1: 522 },
  { x0: 360, y0: 522, c1x: 430, c1y: 538, c2x: 480, c2y: 474, x1: 560, y1: 462 },
  { x0: 560, y0: 462, c1x: 640, c1y: 452, c2x: 700, c2y: 520, x1: 770, y1: 532 },
  { x0: 770, y0: 532, c1x: 840, c1y: 542, c2x: 900, c2y: 476, x1: 980, y1: 468 },
  { x0: 980, y0: 468, c1x: 1060, c1y: 460, c2x: 1120, c2y: 520, x1: 1200, y1: 528 },
  { x0: 1200, y0: 528, c1x: 1280, c1y: 534, c2x: 1340, c2y: 478, x1: 1400, y1: 470 },
  { x0: 1400, y0: 470, c1x: 1430, c1y: 486, c2x: 1430, c2y: 500, x1: 1440, y1: 505 },
];

const HILL_PATH =
  `M${HILL_SEGS[0].x0} ${HILL_SEGS[0].y0} ` +
  HILL_SEGS.map((s) => `C ${s.c1x} ${s.c1y}, ${s.c2x} ${s.c2y}, ${s.x1} ${s.y1}`).join(" ") +
  " L 1440 900 L 0 900 Z";

// Crest height (top of the hill silhouette) at any x — used to anchor trees.
function crestY(x: number): number {
  for (const s of HILL_SEGS) {
    if (x >= s.x0 && x <= s.x1) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const t = (lo + hi) / 2;
        const m = 1 - t;
        const X = m * m * m * s.x0 + 3 * m * m * t * s.c1x + 3 * m * t * t * s.c2x + t * t * t * s.x1;
        if (X < x) lo = t;
        else hi = t;
      }
      const t = (lo + hi) / 2;
      const m = 1 - t;
      return m * m * m * s.y0 + 3 * m * m * t * s.c1y + 3 * m * t * t * s.c2y + t * t * t * s.y1;
    }
  }
  return 505;
}

// --- Background forest: layered depth through the scene -----------------
// Four depth strata, back to front, each built from cluster centres so density
// is deliberate (dense within a cluster, real gaps between clusters), not an
// even scatter:
//   • ridge  — dense tiny canopy-only shapes hugging the crest (tucked behind
//              the hills so only their tops peek into the sky) → solid forest.
//   • slope  — small canopy-only trees covering the visible hillside, so the
//              hill reads as forest down its face, not a dotted line.
//   • mid    — medium trees in loose clusters with genuine gaps, standing ON
//              the hills and lower ground.
//   • near   — largest, most detailed trees framing a perspective clearing —
//              a wedge that is wide at the bottom (viewer) and tapers to the
//              hill. Atmospheric perspective: each back layer is lighter and
//              more desaturated than the one in front of it.
type Tree = { x: number; y: number; h: number; w: number; foliage: string; trunk?: string; op?: number; canopy?: boolean };

const LEFT_X = [18, 468];
const RIGHT_X = [972, 1422];

// Gillson-jittered x slots for even-but-natural coverage.
function spreadX(min: number, max: number, count: number, jitter: number): number[] {
  const xs: number[] = [];
  const step = (max - min) / count;
  for (let i = 0; i < count; i++) {
    xs.push(min + step * (i + 0.5) + (rand() - 0.5) * step * jitter);
  }
  return xs;
}

// Generate trees around a set of deliberate cluster centres: dense overlap
// close to each centre, tailing off, with empty gaps between centres.
function clusterTrees(
  centres: { x: number; baseY: number; r: number; n: number }[],
  mk: (x: number, y: number, h: number, foliage: string, trunk?: string, op?: number, canopy?: boolean) => Tree,
  foliage: string,
  trunk: string | undefined,
  hMin: number,
  hMax: number,
): Tree[] {
  const out: Tree[] = [];
  for (const c of centres) {
    for (let i = 0; i < c.n; i++) {
      // Gaussian-ish spread around the cluster centre (denser at heart).
      const gx = c.x + (rand() + rand() - 1) * c.r;
      const gy = c.baseY + (rand() + rand() - 1) * c.r * 0.6;
      const h = hMin + rand() * (hMax - hMin);
      out.push(mk(gx, gy, h, foliage, trunk, undefined, !trunk));
    }
  }
  return out;
}

const FOREST: { ridge: Tree[]; slope: Tree[]; mid: Tree[]; near: Tree[] } = (() => {
  const mk = (x: number, y: number, h: number, foliage: string, trunk?: string, op?: number, canopy?: boolean): Tree => ({
    x,
    y,
    h,
    w: h * 0.5,
    foliage,
    trunk,
    op,
    canopy,
  });

  const ridge: Tree[] = [];
  const slope: Tree[] = [];
  const mid: Tree[] = [];
  const near: Tree[] = [];

  // ── Ridge canopy — dense trunkless treetops tucked BELOW the crest, so the
    //    hill's own fill hides their bodies and only the tips crest into the sky.
    //    Two interleaved passes fill every gap → a solid forest silhouette.
    for (const x of [
      ...spreadX(0, 1440, 170, 1.6),
      ...spreadX(0, 1440, 95, 1.2),
    ]) {
      const h = 18 + rand() * 20;
      ridge.push(mk(x, crestY(x) + 8 + rand() * 8, h, "#1a2116", undefined, 0.95, true));
    }
    // Deeper second pass hugging just under the crest for continuity.
    for (const x of spreadX(0, 1440, 130, 1.4)) {
      const h = 22 + rand() * 24;
      ridge.push(mk(x, crestY(x) + 4 + rand() * 6, h, "#141b10", undefined, 0.98, true));
    }

    // ── Hillside slope — small canopy-only trees cascading DOWN the visible hill
    //    faces (lighter + more desaturated than mid, per atmospheric perspective).
    const slopeClusters = [
      { x: 90, baseY: 620, r: 85, n: 18 },
      { x: 250, baseY: 660, r: 90, n: 20 },
      { x: 400, baseY: 630, r: 80, n: 15 },
      { x: 1120, baseY: 620, r: 85, n: 18 },
      { x: 1250, baseY: 660, r: 90, n: 20 },
      { x: 1380, baseY: 630, r: 80, n: 15 },
    ];
    slope.push(
      ...clusterTrees(
        slopeClusters,
        (x, y, h, f, t, o, canopy) => ({ x, y, h, w: h * 0.5, foliage: f, trunk: t, op: o, canopy }),
        "#3a4531",
        undefined,
        26,
        54,
      ),
    );

    // ── Mid ground — medium trees with visible trunks, standing as distinct
            //    clusters on the lower hill/ground, with real gaps and a centre clearing.
            const midClusters = [
              { x: 60, baseY: 585, r: 80, n: 11 },
              { x: 180, baseY: 628, r: 70, n: 9 },
              { x: 470, baseY: 592, r: 75, n: 9 },
              { x: 985, baseY: 590, r: 82, n: 11 },
              { x: 1210, baseY: 626, r: 72, n: 9 },
              { x: 1380, baseY: 593, r: 76, n: 9 },
            ];
            mid.push(
              ...clusterTrees(
                midClusters,
                (x, y, h, f, t, o, canopy) => ({ x, y, h, w: h * 0.5, foliage: f, trunk: t, op: o, canopy: false }),
                "#263a22",
                "#4a3322",
                56,
                92,
              ),
            );

          // ── Near foreground — largest trees with clear trunks, framing the clearing.
          //    Pushed toward the flanks/edges so a perspective ground wedge opens at the
          //    bottom and tapers to the hill, all standing on the visible dark ground.
          const nearClusters = [
            { x: 90, baseY: 640, r: 105, n: 13 },
            { x: 225, baseY: 672, r: 90, n: 11 },
            { x: 1335, baseY: 672, r: 95, n: 12 },
            { x: 1405, baseY: 644, r: 95, n: 11 },
          ];
          near.push(
            ...clusterTrees(
              nearClusters,
              (x, y, h, f, t, o, canopy) => ({ x, y, h, w: h * 0.5, foliage: f, trunk: t, op: o, canopy: false }),
              "#2d4b26",
              "#5a4426",
              95,
              150,
            ),
          );

      return { ridge, slope, mid, near };
    })();

    function trunkPath(x: number, y: number, h: number, w: number): string {
      const trunkH = h * 0.3;
      const trunkW = w * 0.3;
      return `M${x - trunkW} ${y} L${x + trunkW} ${y} L${x + trunkW * 0.7} ${y - trunkH} L${x - trunkW * 0.7} ${y - trunkH} Z`;
    }

// `pineTier` (drooping frond) drives the foreground `DetailedPine` accents;
// `pineFoliagePath` (stepped nested triangles) draws every background tree so
// they read as layered pines at any size.

// Layered pine silhouette from N stepped tiers — unmistakably a pine at ANY
// scale, just simpler/smaller at a distance, never a flat single triangle.
// Each tier is a nested triangle that visibly steps outward and downward, so
// the layered silhouette shows even as a one-colour silhouette. Returns all
// tier subpaths as one fillable path string. trunkFrac reserves the bottom
// (canopy trees pass 0 so foliage spans the full height).
function pineFoliagePath(x: number, y: number, h: number, w: number, tiers = 4, trunkFrac = 0.24): string {
  const colTop = y - h;
  const colBot = y - h * trunkFrac;
  const colH = colBot - colTop;
  const halfWmax = w * 0.5;
  const parts: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1);
    const apexY = colTop + f * colH * 0.34;
    const baseY = colTop + colH * (0.42 + f * 0.58);
    const halfW = halfWmax * (0.42 + 0.58 * f);
    parts.push(`M${x} ${apexY.toFixed(1)} L${(x + halfW).toFixed(1)} ${baseY.toFixed(1)} L${(x - halfW).toFixed(1)} ${baseY.toFixed(1)} Z`);
  }
  return parts.join(" ");
}

function treeEl(t: Tree, key: number) {
  return (
    <g key={key} opacity={t.op ?? 1}>
      {!t.canopy && t.trunk && <path d={trunkPath(t.x, t.y, t.h, t.w)} fill={t.trunk} />}
      <path d={pineFoliagePath(t.x, t.y, t.h, t.w, t.canopy ? 3 : 4, t.canopy ? 0 : 0.24)} fill={t.foliage} />
    </g>
  );
}

// --- Detailed foreground pines (accent trees) --------------------------
// Two pines stand close to the fire on its left, one on the far right. Unlike
// the distant treeline (which is all packed silhouettes), these have a visible
// trunk and layered frond tiers, and they carry warm firelight on the side
// that faces the campfire — leaning the scene forward and catching the glow.
// warm='right' means the fire is to the tree's right (trees left of the fire).

type PineAccent = { x: number; baseY: number; h: number; warm: "left" | "right" };
// Scaled up + brought closer to read as clearly foreground-most, larger and
// more detailed than any other tree in the scene.
const PINE_ACCENTS: PineAccent[] = [
  { x: 150, baseY: 690, h: 300, warm: "right" },
  { x: 305, baseY: 706, h: 220, warm: "right" },
  { x: 1358, baseY: 698, h: 272, warm: "left" },
];

// A single layered pine frond tier. Rich enough to read as needle clumps: the
// main drooping triangle plus small outward-jutting frond bumps at its sides.
function pineTier(cx: number, topY: number, halfW: number, depth: number) {
  const drp = depth * 0.9;
    const side = halfW * 0.22;
    return `M${cx} ${topY}
    C ${cx + halfW * 0.28} ${topY + drp * 0.34}, ${cx + halfW * 0.6} ${topY + drp * 0.6}, ${cx + halfW} ${topY + drp}
    L ${cx + halfW + side} ${topY + drp + drp * 0.12}
    L ${cx + halfW} ${topY + drp + drp * 0.05}
    L ${cx - halfW} ${topY + drp + drp * 0.05}
    L ${cx - halfW - side} ${topY + drp + drp * 0.12}
    Z`;
}

function DetailedPine({ x, baseY, h, warm }: PineAccent) {
  const tiers = 6;
  const tierH = (h * 0.78) / tiers;
  const topY = baseY - h;
  const wide = h * 0.4;
  const trunkTop = baseY - h * 0.3;
  const warmSide = warm === "right";
  const uid = `pine${Math.round(x)}`;
  const rimId = `pineRim${Math.round(x)}`;

  const tierPaths = [];
  for (let i = 0; i < tiers; i++) {
    const ty = topY + i * tierH;
    const halfW = wide * (0.3 + (i / (tiers - 1)) * 0.7);
    const depth = (i / (tiers - 1)) * 0.55 + 0.6;
    tierPaths.push(pineTier(x, ty, halfW, tierH * depth));
  }

  // Soft rim-light: a radial gradient whose focus sits on the fire-facing edge
  // and fades gradually across the canopy — a blurred, glowing edge rather than
  // a hard flat recolour band.
  const fireFocus = warmSide ? x + wide * 0.45 : x - wide * 0.45;

  return (
    <g>
      <defs>
        <radialGradient id={rimId} cx={warmSide ? "85%" : "15%"} cy="45%" r="75%">
          <stop offset="0%" stopColor="#ff9d4d" stopOpacity="0.62" />
          <stop offset="45%" stopColor="#ff8a34" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ff8a34" stopOpacity="0" />
        </radialGradient>
        <clipPath id={uid}>
          {tierPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>
      {/* Trunk */}
      <path
        d={`M${x - wide * 0.055} ${baseY} L${x + wide * 0.055} ${baseY} L${x + wide * 0.03} ${trunkTop} L${x - wide * 0.03} ${trunkTop} Z`}
        fill={warmSide ? "#5a4030" : "#4a3523"}
      />
      {/* Foliage: dark shadow pass first, then lit layered pass on top */}
      {tierPaths.map((d, i) => (
        <path key={`s${i}`} d={d} fill={warmSide ? "#12260f" : "#0c1c0d"} />
      ))}
      {tierPaths.map((d, i) => (
        <path
          key={`l${i}`}
          d={d}
          fill={warmSide ? "#27421f" : "#1e3520"}
          stroke={warmSide ? "#3d6829" : "#2e5422"}
          strokeWidth={0.8}
          opacity={i === 0 ? 0.94 : 0.86}
        />
      ))}
      {/* Soft warm rim-light along the fire-facing edge, clipped to the tree */}
      <g clipPath={`url(#${uid})`}>
        <rect x={fireFocus - wide * 0.9} y={topY} width={wide * 1.8} height={h} fill={`url(#${rimId})`} />
      </g>
    </g>
  );
}

function StarField({ reduceMotion, bgY }: { reduceMotion: boolean; bgY: any }) {
  // Milky Way: overlapping radial-gradient blobs, each soft at its own edge, so
  // no single primitive's outline is visible while warm/cool colour separation
  // and mottled internal texture are preserved. Dark dust-lane blobs run through.
  const milkyWay = (
    <g>
      {MW_BLOBS.map((b, i) => (
        <ellipse key={`b${i}`} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={b.g} opacity={b.o} transform={`rotate(${b.rot} ${b.x} ${b.y})`} />
      ))}
      {MW_DUST.map((d, i) => (
        <ellipse key={`d${i}`} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill={d.g} opacity={d.o} transform={`rotate(${d.rot} ${d.x} ${d.y})`} />
      ))}
    </g>
  );

  // A single star: optional soft glow halo + colored core dot, with twinkle.
  const renderStar = (s: Star, i: number): React.ReactNode => {
    const core = s.tw && !reduceMotion ? (
      <motion.circle
        key={i}
        cx={s.x}
        cy={s.y}
        r={s.r}
        fill={s.c}
        initial={{ opacity: s.o }}
        animate={{ opacity: [s.o, s.o * 0.25, s.o] }}
        transition={{ duration: 1.8 + s.ph * 2.4, delay: s.ph * 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    ) : (
      <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={s.o} />
    );
    if (s.glow) {
      return (
        <g key={`g${i}`}>
          <circle cx={s.x} cy={s.y} r={s.r * 4.2} fill="url(#starGlow)" opacity={s.o * 0.55} />
          {core}
        </g>
      );
    }
    return core;
  };

  const faintEls = FAINT_STARS.map(renderStar);
  const bandEls = BAND_STARS.map(renderStar);
  const fieldEls = FIELD_STARS.map(renderStar);
  const lumiEls = LUMINARIES.map(renderStar);

  if (reduceMotion) {
    return (
      <g>
        {milkyWay}
        {faintEls}
        {bandEls}
        {fieldEls}
        {lumiEls}
      </g>
    );
  }
  return (
    <motion.g style={{ y: bgY }}>
      {milkyWay}
      {faintEls}
      {bandEls}
      {fieldEls}
      {lumiEls}
    </motion.g>
  );
}

// --- Big animated foreground campfire ----------------------------------
const FIRE_BASE = 196;

// The campfire's box and the derived position of the flame centre, in CSS.
// Used by BOTH the campfire and the continuous glow so the glow always sits
// directly on the flame at any screen size (a fixed-position glow would drift
// right of the fire because the fire width is min(38vw, px)-capped).
const FIRE_LEFT = "13%";
const FIRE_WIDTH = "min(38vw, 300px)";
const FIRE_HEIGHT = `calc(${FIRE_WIDTH} * 1.2)`; // viewBox 200x240 -> height ratio
const FIRE_CX = `calc(${FIRE_LEFT} + ${FIRE_WIDTH} / 2)`;
const HERO_H = "clamp(500px, 64vh, 68vh)";
const FIRE_CY = `calc(${HERO_H} - 6px - 0.46 * ${FIRE_HEIGHT})`;

const OUTER_FLAME =
  "M100 70 C 84 108, 70 132, 68 156 C 66 176, 80 190, 100 190 C 120 190, 134 176, 132 156 C 130 132, 116 108, 100 70 Z";
const INNER_FLAME =
  "M100 106 C 90 130, 82 146, 81 162 C 80 175, 89 184, 100 184 C 111 184, 120 175, 119 162 C 118 146, 110 130, 100 106 Z";
const CORE_FLAME =
  "M100 134 C 96 149, 92 159, 92 167 C 92 175, 96 180, 100 180 C 104 180, 108 175, 108 167 C 108 159, 104 149, 100 134 Z";

type Ember = { x: number; delay: number; dur: number; dist: number; r: number };
const EMBERS: Ember[] = [
  { x: 92, delay: 0, dur: 2.2, dist: 70, r: 2.2 },
  { x: 104, delay: 0.5, dur: 2.6, dist: 88, r: 2 },
  { x: 112, delay: 1.1, dur: 2.0, dist: 64, r: 1.8 },
  { x: 86, delay: 1.6, dur: 2.4, dist: 95, r: 2.4 },
];

function flicker(
  path: React.ReactNode,
  reduce: boolean,
  amplitude: number,
  duration: number,
  delay: number,
  sway = 0,
) {
  if (reduce) return path;
  // Real flames both breathe (vertical) and sway side-to-side as air moves past
  // them. Each layer gets its own sway amount and timing so the flame leans/recovers
  // irregularly — like responding to shifting air — rather than pulsing in place.
  const hasSway = sway > 0;
  const animate: any = hasSway
    ? { y: [0, -amplitude, 0], x: [0, sway, 0, -sway * 0.7, 0], rotate: [0, sway * 0.62, 0, -sway * 0.5, 0] }
    : { y: [0, -amplitude, 0] };
  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      animate={animate}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {path}
    </motion.g>
  );
}

type Log = { x1: number; y1: number; x2: number; y2: number; c: string; w: number };
// A genuine teepee: logs rise from all around the full circle — including the
// front facing the viewer — and converge at a center apex. Back logs are
// darker/distant, front logs warmer/closer. Warm browns so they read clearly
// as wood rather than black shapes.
const LOGS: Log[] = [
  // Back ring (behind the fire)
  { x1: 52, y1: 216, x2: 94, y2: 151, c: "#4a311a", w: 10 },
  { x1: 148, y1: 216, x2: 106, y2: 151, c: "#4a311a", w: 10 },
  { x1: 56, y1: 206, x2: 96, y2: 149, c: "#4a311a", w: 9 },
  { x1: 144, y1: 206, x2: 104, y2: 149, c: "#4a311a", w: 9 },
  // Mid ring
  { x1: 46, y1: 210, x2: 92, y2: 150, c: "#5a3d22", w: 11 },
  { x1: 154, y1: 210, x2: 108, y2: 150, c: "#5a3d22", w: 11 },
  { x1: 60, y1: 196, x2: 95, y2: 148, c: "#5a3d22", w: 10 },
  { x1: 140, y1: 196, x2: 105, y2: 148, c: "#5a3d22", w: 10 },
  // Rear corners of the front ring — part of the near layer, drawn behind fire
  { x1: 66, y1: 188, x2: 96, y2: 147, c: "#6d4c2c", w: 10 },
  { x1: 134, y1: 188, x2: 104, y2: 147, c: "#6d4c2c", w: 10 },
];

// The rest of the front ring, drawn AFTER the flames so the teepee reads fully
// closed — logs wrap all the way around to the front edge, converging at the
// apex, with the fire peeking through the gaps.
const FRONT_LOGS: Log[] = [
  { x1: 50, y1: 222, x2: 90, y2: 149, c: "#6d4c2c", w: 11 },
  { x1: 150, y1: 222, x2: 110, y2: 149, c: "#6d4c2c", w: 11 },
  { x1: 58, y1: 212, x2: 91, y2: 148, c: "#7d5a36", w: 11 },
  { x1: 142, y1: 212, x2: 109, y2: 148, c: "#7d5a36", w: 11 },
  { x1: 64, y1: 224, x2: 98, y2: 150, c: "#7d5a36", w: 10 },
  { x1: 136, y1: 224, x2: 102, y2: 150, c: "#7d5a36", w: 10 },
  { x1: 76, y1: 214, x2: 97, y2: 148, c: "#8a6137", w: 10 },
  { x1: 124, y1: 214, x2: 103, y2: 148, c: "#8a6137", w: 10 },
  // Center front — logs crossing over the innermost fire gap
  { x1: 84, y1: 220, x2: 98, y2: 149, c: "#8a6137", w: 10 },
  { x1: 116, y1: 220, x2: 102, y2: 149, c: "#8a6137", w: 10 },
  { x1: 94, y1: 215, x2: 99, y2: 149, c: "#96704a", w: 9 },
  { x1: 106, y1: 215, x2: 101, y2: 149, c: "#96704a", w: 9 },
];

function Campfire({ reduceMotion }: { reduceMotion: boolean }) {
  const logs = (
    <g>
      {LOGS.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </g>
  );

  const frontLogs = (
    <g>
      {FRONT_LOGS.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </g>
  );

  const flames = (
    <>
      {flicker(<path d={OUTER_FLAME} fill={C.fireOuter} opacity={0.95} />, reduceMotion, 6, 4.6, 0, 3.8)}
            {flicker(<path d={INNER_FLAME} fill={C.fireInner} opacity={0.98} />, reduceMotion, 8, 3.8, 0.6, 2.8)}
            {flicker(<path d={CORE_FLAME} fill={C.fireCore} />, reduceMotion, 5, 2.9, 1.1, 1.8)}
    </>
  );

  const embers = EMBERS.map((e, i) =>
    reduceMotion ? (
      <circle key={i} cx={e.x} cy={FIRE_BASE - 6} r={e.r} fill="#ffbf6e" opacity={0.7} />
    ) : (
      <motion.circle
        key={i}
        cx={e.x}
        cy={FIRE_BASE - 6}
        r={e.r}
        fill="#ffcf8a"
        initial={{ opacity: 0.85 }}
        animate={{ y: [0, -e.dist], opacity: [0.85, 0] }}
        transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
      />
    )
  );

  return (
    <div style={{ position: "absolute", left: FIRE_LEFT, bottom: "6px", width: FIRE_WIDTH, zIndex: 3, pointerEvents: "none" }}>
      <svg viewBox="0 0 200 240" style={{ width: "100%", height: "auto", display: "block", position: "relative" }}>
        {logs}
        {frontLogs}
        {flames}
        {embers}
      </svg>
    </div>
  );
}

export default function HeroOverlay() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [signInHovered, setSignInHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);
  const [aboutHovered, setAboutHovered] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Multi-layer parallax: background (stars/galaxy) slowest, trees+hills
  // in the middle, campfire foreground fastest.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, -90]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 130);
      setScrolled(window.scrollY > 90);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinkColor = scrolled ? "var(--site-text-muted)" : C.skyText;
  const navHoverColor = scrolled ? "var(--site-text)" : "#ffffff";
  const navBorderColor = scrolled ? "var(--site-border)" : "rgba(255,255,255,0.22)";
  const navBg = scrolled ? "rgba(255, 248, 242, 0.95)" : "transparent";
  const navBlur = scrolled ? "blur(16px)" : "none";

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={heroRef}
        className="hero-section"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "clamp(500px, 64vh, 68vh)",
          overflow: "hidden",
          background: SKY_GRADIENT,
        }}
      >
        {/* ── SVG scene (base layer) ── */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        >
          <defs>
                      {/* Ground gradient: opaque dark from the (taller) hill line down past every
                                                tree base, holding a solid dark ground band, then fading to
                                                transparent only at the very bottom so it dissolves into the
                                                cream grid below. */}
                                            <linearGradient id="siteGround" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="860">
                                              <stop offset="0" stopColor={C.silhouette} stopOpacity="1" />
                                              <stop offset="0.82" stopColor={C.silhouette} stopOpacity="1" />
                                              <stop offset="1" stopColor={C.silhouette} stopOpacity="0" />
                                            </linearGradient>
                      {/* Soft halo around the brightest stars. */}
                                                                  <radialGradient id="starGlow">
                                                                    <stop offset="0%" stopColor="#fff8ea" stopOpacity="0.9" />
                                                                    <stop offset="55%" stopColor="#ffe9c6" stopOpacity="0.28" />
                                                                    <stop offset="100%" stopColor="#ffe9c6" stopOpacity="0" />
                                                                  </radialGradient>
                                                                  {/* Milky Way gradient blobs — each fades to transparent at its
                                                                      own edge, so layered overlapping blobs produce soft mottled
                                                                      texture with no visible primitives, while keeping warm vs cool
                                                                      colour separation intact. */}
                                                                  <radialGradient id="mwCool">
                                                                    <stop offset="0%" stopColor="#d6e0ff" stopOpacity="0.9" />
                                                                    <stop offset="55%" stopColor="#aeb9ee" stopOpacity="0.45" />
                                                                    <stop offset="100%" stopColor="#9aa6e6" stopOpacity="0" />
                                                                  </radialGradient>
                                                                  <radialGradient id="mwWarm">
                                                                    <stop offset="0%" stopColor="#ffe4b3" stopOpacity="0.9" />
                                                                    <stop offset="50%" stopColor="#efc591" stopOpacity="0.5" />
                                                                    <stop offset="100%" stopColor="#dfae86" stopOpacity="0" />
                                                                  </radialGradient>
                                                                  <radialGradient id="mwLav">
                                                                    <stop offset="0%" stopColor="#e6dcfa" stopOpacity="0.85" />
                                                                    <stop offset="55%" stopColor="#cbbcf0" stopOpacity="0.42" />
                                                                    <stop offset="100%" stopColor="#c0b1e8" stopOpacity="0" />
                                                                  </radialGradient>
                                                                  <radialGradient id="mwDust">
                                                                    <stop offset="0%" stopColor="#5a3345" stopOpacity="0.9" />
                                                                    <stop offset="55%" stopColor="#46283a" stopOpacity="0.55" />
                                                                    <stop offset="100%" stopColor="#3a2040" stopOpacity="0" />
                                                                  </radialGradient>
                                                                </defs>

          {/* Layer 1 — stars + ridge canopy treetops (slowest, behind hills) */}
                    <StarField reduceMotion={reduceMotion} bgY={bgY} />
                    {reduceMotion ? (
                      <g>{FOREST.ridge.map(treeEl)}</g>
                    ) : (
                      <motion.g style={{ y: bgY }}>{FOREST.ridge.map(treeEl)}</motion.g>
                    )}

                    {/* Layer 2 — rolling hills + hillside slope trees + mid-ground clusters */}
                    {reduceMotion ? (
                      <g>
                        <path d={HILL_PATH} fill="url(#siteGround)" />
                        {FOREST.slope.map(treeEl)}
                        {FOREST.mid.map(treeEl)}
                      </g>
                    ) : (
                      <motion.g style={{ y: midY }}>
                        <path d={HILL_PATH} fill="url(#siteGround)" />
                        {FOREST.slope.map(treeEl)}
                        {FOREST.mid.map(treeEl)}
                      </motion.g>
                    )}

          {/* Layer 3 — near/foreground trees + accent pines (fastest, top) */}
                    {reduceMotion ? (
                      <g>
                        {FOREST.near.map(treeEl)}
                        {PINE_ACCENTS.map((p, i) => <DetailedPine key={`pine${i}`} {...p} />)}
                      </g>
                    ) : (
                      <motion.g style={{ y: fgY }}>
                        {FOREST.near.map(treeEl)}
                        {PINE_ACCENTS.map((p, i) => <DetailedPine key={`pine${i}`} {...p} />)}
                      </motion.g>
                    )}
        </svg>

        {/* ── Bottom cream blend: a narrow strip that dissolves the very bottom of the
                    dark ground into the cream grid below. Kept thin so the foreground
                    trees and their ground stay clearly visible above it. ── */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "12%",
                    zIndex: 2,
                    pointerEvents: "none",
                    background: "linear-gradient(to top, var(--site-bg) 0%, var(--site-bg) 20%, rgba(255, 241, 231, 0) 100%)",
                  }}
                />

        {/* Layer 3 — big animated foreground campfire (fastest) */}
        {reduceMotion ? (
          <Campfire reduceMotion />
        ) : (
          <motion.div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", y: fgY }}>
            <Campfire reduceMotion={reduceMotion} />
          </motion.div>
        )}

        {/* ── Centered content (above the horizon) ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "56%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: C.skyText,
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0,
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            [ Site Name ]
          </h1>
          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)",
              fontWeight: 500,
              color: C.skyTextSoft,
              maxWidth: "520px",
              lineHeight: 1.4,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            [ Short tagline — final copy coming soon ]
          </p>
        </div>

        {/* ── Transparent nav pinned to the top of the hero ── */}
        <nav
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: "56px",
            zIndex: 2,
            background: navBg,
            backdropFilter: navBlur,
            borderBottom: `1.5px solid ${scrolled ? "var(--site-border)" : "transparent"}`,
            transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: scrolled ? "var(--site-text)" : C.skyText,
              textDecoration: "none",
              letterSpacing: "-0.03em",
              transition: "opacity 0.15s, color 0.3s",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            [ Site Name ]
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link
              href="/about"
              onMouseEnter={() => setAboutHovered(true)}
              onMouseLeave={() => setAboutHovered(false)}
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: aboutHovered ? navHoverColor : navLinkColor,
                textDecoration: "none",
                paddingBottom: "2px",
                borderBottom: `2px solid ${aboutHovered ? navHoverColor : "transparent"}`,
                transition: "color 0.15s, border-color 0.15s, background 0.3s",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              About
            </Link>

            <Show when="signed-in">
              <span
                style={{
                  fontSize: "0.88rem",
                  color: navLinkColor,
                  fontWeight: 500,
                }}
              >
                {user?.firstName ?? "Explorer"}
              </span>
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                onMouseEnter={() => setSignOutHovered(true)}
                onMouseLeave={() => setSignOutHovered(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  background: "transparent",
                  color: signOutHovered ? navHoverColor : navLinkColor,
                  border: `1.5px solid ${signOutHovered ? navHoverColor : navBorderColor}`,
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s, background 0.3s",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </Show>

            <Show when="signed-out">
              <button
                onClick={() => navigate("/sign-in")}
                onMouseEnter={() => setSignInHovered(true)}
                onMouseLeave={() => setSignInHovered(false)}
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  background: signInHovered ? "#2d2010" : "#1c1108",
                  color: "#FFF1E7",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  transform: signInHovered ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.15s, background 0.15s",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Sign In
              </button>
            </Show>
          </div>
        </nav>
      </div>

      {/* ── Continuous campfire glow laid over BOTH the hero and the grid ──
          Rendered outside the overflow-hidden hero so the same warm light field
          spans the hero's lower area and the module grid below — no seam at the
          boundary. The wrapper has no z-index, so these stack at the page level
          (zIndex 5) above Modules' content container (zIndex 1) rendered after. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 5,
          pointerEvents: "none",
          left: `calc(${FIRE_CX} - 24vw)`,
          width: "48vw",
          top: `calc(${FIRE_CY} - 13.44vh)`,
          height: "84vh",
          background:
            "radial-gradient(42% 40% at 50% 16%, rgba(255,177,90,0.42), rgba(255,164,84,0.18) 44%, rgba(255,160,80,0.06) 62%, transparent 76%)",
          filter: "blur(10px)",
        }}
      >
        {!reduceMotion && (
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(42% 40% at 50% 16%, rgba(255,168,86,0.5), transparent 70%)",
            }}
            animate={{ opacity: [0.4, 1, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 5,
          pointerEvents: "none",
          left: `calc(${FIRE_CX} - 30vw)`,
          width: "60vw",
          top: `calc(${FIRE_CY} - 19.2vh)`,
          height: "120vh",
          background:
            "radial-gradient(46% 42% at 50% 16%, rgba(255,170,90,0.13), transparent 68%)",
          filter: "blur(16px)",
        }}
      />

      {/* Scroll-to-top button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          zIndex: 999,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "var(--site-text)",
          color: "var(--site-bg)",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0)" : "translateY(12px)",
          pointerEvents: showScrollTop ? "auto" : "none",
          transition: "opacity 0.3s, transform 0.3s",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        ▲
      </button>
    </div>
  );
}
