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

// --- Stars (some twinkle) ----------------------------------------------
type Star = { x: number; y: number; r: number; o: number; tw: boolean; ph: number };
const STARS: Star[] = [];
for (let i = 0; i < 110; i++) {
  const y = rand() * 560;
  const fade = y < 320 ? 1 : Math.max(0.15, 1 - (y - 320) / 220);
  STARS.push({
    x: rand() * SVG_W,
    y,
    r: 0.6 + rand() * 1.4,
    o: (0.4 + rand() * 0.5) * fade,
    tw: rand() < 0.34,
    ph: rand(),
  });
}

// --- Nested galaxy (three ellipses, one inside another) ----------------
const GALAXY = [
  { cx: 560, cy: 210, rx: 300, ry: 96, rot: -16, o: 0.16 },
  { cx: 570, cy: 205, rx: 188, ry: 60, rot: -12, o: 0.2 },
  { cx: 580, cy: 200, rx: 96, ry: 32, rot: -8, o: 0.28 },
];

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

// --- Background forest: denser, crest-anchored depth bands ---------------
// Trees are placed on even horizontal slots (plus small jitter) so they never
// overlap or bunch. Every tree base is anchored to the local hill crest via
// crestY(x) — far trees tuck behind the ridge, mid/near trees stand on the
// visible slope — so nothing floats above the backdrop. Depth runs strictly
// darker-to-lighter and smaller-to-larger from far to near.
type Tree = { x: number; y: number; h: number; w: number; foliage: string; trunk: string; op?: number };

const LEFT_X = [18, 468];
const RIGHT_X = [972, 1422];

// Evenly spaced x slots across one range with light jitter (slot > max tree
// width so neighbors never touch).
function spreadX(min: number, max: number, count: number, jitter: number): number[] {
  const xs: number[] = [];
  const step = (max - min) / count;
  for (let i = 0; i < count; i++) {
    xs.push(min + step * (i + 0.5) + (rand() - 0.5) * step * jitter);
  }
  return xs;
}

const FOREST: { far: Tree[]; mid: Tree[]; near: Tree[] } = (() => {
  const mk = (x: number, y: number, h: number, foliage: string, trunk: string, op?: number): Tree => ({
    x,
    y,
    h,
    w: h * 0.46,
    foliage,
    trunk,
    op,
  });

  const far: Tree[] = [];
  const mid: Tree[] = [];
  const near: Tree[] = [];

  // Far treeline — many small dark trees hugging the ridge on both flanks
  // (drawn behind the hills, so only their tops peek over the crest), plus a
  // sparse scattering across the center crest so the title stays clean.
  for (const x of [...spreadX(LEFT_X[0], LEFT_X[1], 16, 0.3), ...spreadX(RIGHT_X[0], RIGHT_X[1], 16, 0.3)]) {
    const h = 16 + rand() * 24;
    far.push(mk(x, crestY(x) + 6 + rand() * 8, h, h < 28 ? "#0f150b" : "#171f10", "#1e1812", 0.9));
  }
  for (const x of spreadX(500, 940, 6, 0.3)) {
    const h = 16 + rand() * 24;
    far.push(mk(x, crestY(x) + 6 + rand() * 8, h, h < 28 ? "#0f150b" : "#171f10", "#1e1812", 0.9));
  }

  // Mid band — on the visible slopes (flanks only), moderate greens.
  for (const x of [...spreadX(LEFT_X[0], LEFT_X[1], 8, 0.3), ...spreadX(RIGHT_X[0], RIGHT_X[1], 8, 0.3)]) {
    const h = 56 + rand() * 42;
    mid.push(mk(x, crestY(x) + 18 + rand() * 26, h, h < 80 ? "#1f311e" : "#263c24", "#3a2b1b"));
  }
  // Near/foreground — tallest, greenest, on solid lower ground (flanks only).
  for (const x of [...spreadX(LEFT_X[0], LEFT_X[1], 5, 0.3), ...spreadX(RIGHT_X[0], RIGHT_X[1], 5, 0.3)]) {
    const h = 104 + rand() * 48;
    near.push(mk(x, crestY(x) + 50 + rand() * 40, h, h < 132 ? "#2c4627" : "#33542b", "#4a3622"));
  }
  return { far, mid, near };
})();

function trunkPath(x: number, y: number, h: number, w: number): string {
  const trunkH = h * 0.26;
  const trunkW = w * 0.18;
  return `M${x - trunkW} ${y} L${x + trunkW} ${y} L${x + trunkW * 0.7} ${y - trunkH} L${x - trunkW * 0.7} ${y - trunkH} Z`;
}

function foliagePath(x: number, y: number, h: number, w: number): string {
  const trunkH = h * 0.26;
  const colH = h - trunkH;
  const upper = `M${x} ${y - trunkH - colH} L${x + w * 0.34} ${y - trunkH - colH * 0.42} L${x - w * 0.34} ${y - trunkH - colH * 0.42} Z`;
  const lower = `M${x} ${y - trunkH - colH * 0.6} L${x + w * 0.56} ${y - trunkH} L${x - w * 0.56} ${y - trunkH} Z`;
  return lower + upper;
}

function treeEl(t: Tree, key: number) {
  return (
    <g key={key} opacity={t.op ?? 1}>
      <path d={trunkPath(t.x, t.y, t.h, t.w)} fill={t.trunk} />
      <path d={foliagePath(t.x, t.y, t.h, t.w)} fill={t.foliage} />
    </g>
  );
}

function StarField({ reduceMotion, bgY }: { reduceMotion: boolean; bgY: any }) {
  const wayEls = GALAXY.map((m, i) => (
    <ellipse
      key={i}
      cx={m.cx}
      cy={m.cy}
      rx={m.rx}
      ry={m.ry}
      fill="#cfd6ff"
      opacity={m.o}
      transform={`rotate(${m.rot} ${m.cx} ${m.cy})`}
    />
  ));

  const starEls = STARS.map((s, i) => {
    if (reduceMotion || !s.tw) {
      return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />;
    }
    const dur = 1.8 + s.ph * 2.4;
    return (
      <motion.circle
        key={i}
        cx={s.x}
        cy={s.y}
        r={s.r}
        fill="#ffffff"
        initial={{ opacity: s.o }}
        animate={{ opacity: [s.o, s.o * 0.2, s.o] }}
        transition={{ duration: dur, delay: s.ph * dur, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  });

  if (reduceMotion) {
    return (
      <g>
        {wayEls}
        {starEls}
      </g>
    );
  }
  return (
    <motion.g style={{ y: bgY }}>
      {wayEls}
      {starEls}
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

function flicker(path: React.ReactNode, reduce: boolean, amplitude: number, duration: number, delay: number) {
  if (reduce) return path;
  return (
    <motion.g
      animate={{ y: [0, -amplitude, 0] }}
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
      {flicker(<path d={OUTER_FLAME} fill={C.fireOuter} opacity={0.95} />, reduceMotion, 6, 3.6, 0)}
      {flicker(<path d={INNER_FLAME} fill={C.fireInner} opacity={0.98} />, reduceMotion, 8, 2.9, 0.6)}
      {flicker(<path d={CORE_FLAME} fill={C.fireCore} />, reduceMotion, 5, 2.2, 1.1)}
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
            {/* Ground gradient: opaque dark from the (taller) hill line down
                past every tree base, then fading to transparent so it dissolves
                into the cream grid below. */}
            <linearGradient id="siteGround" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="760">
              <stop offset="0" stopColor={C.silhouette} stopOpacity="1" />
              <stop offset="0.66" stopColor={C.silhouette} stopOpacity="1" />
              <stop offset="1" stopColor={C.silhouette} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Layer 1 — stars + galaxy + far treeline (slowest, drawn behind hills) */}
          <StarField reduceMotion={reduceMotion} bgY={bgY} />
          {reduceMotion ? (
            <g>{FOREST.far.map(treeEl)}</g>
          ) : (
            <motion.g style={{ y: bgY }}>{FOREST.far.map(treeEl)}</motion.g>
          )}

          {/* Layer 2 — rolling hills + mid-band trees (middle speed) */}
          {reduceMotion ? (
            <g>
              <path d={HILL_PATH} fill="url(#siteGround)" />
              {FOREST.mid.map(treeEl)}
            </g>
          ) : (
            <motion.g style={{ y: midY }}>
              <path d={HILL_PATH} fill="url(#siteGround)" />
              {FOREST.mid.map(treeEl)}
            </motion.g>
          )}

          {/* Layer 3 — near/foreground trees (fastest, drawn on top) */}
          {reduceMotion ? (
            <g>{FOREST.near.map(treeEl)}</g>
          ) : (
            <motion.g style={{ y: fgY }}>{FOREST.near.map(treeEl)}</motion.g>
          )}
        </svg>

        {/* ── Bottom cream blend: guarantees the ground dissolves into the
            cream grid, regardless of how the SVG is center-cropped on wide
            screens (this overlay lives in container space, not SVG space). ── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "30%",
            zIndex: 2,
            pointerEvents: "none",
            background: "linear-gradient(to top, var(--site-bg) 0%, var(--site-bg) 38%, rgba(255, 241, 231, 0) 100%)",
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
