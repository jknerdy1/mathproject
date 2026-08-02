import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

/* ───────────────────────── Geometry ─────────────────────────
   One floor tile is a 45-45-90 triangle with legs T. The central
   highlighted tile is a real floor tile. The squares on its sides
   are themselves made of tiles:
     a²  → 2 tiles,  b²  → 2 tiles,  c²  → 4 tiles.
   The 4 tiles from the two small squares are dragged into the 4
   tiles of the big square. Scene uses viewBox "150 30 420 420".  */
const T = 120;
const RX = 300;
const RY = 300;
const R: [number, number] = [RX, RY]; // right angle of central tile
const A: [number, number] = [RX + T, RY]; // horizontal-leg end
const B: [number, number] = [RX, RY - T]; // vertical-leg end
const CENTRAL = [R, A, B];

const POLY_STATIC = {
  // static fills for the mosaic (Beats A/B/C)
  a1: [[RX, RY], [RX + T, RY], [RX + T, RY + T]],
  a2: [[RX, RY], [RX + T, RY + T], [RX, RY + T]],
  b1: [[RX, RY], [RX, RY - T], [RX - T, RY - T]],
  b2: [[RX, RY], [RX - T, RY - T], [RX - T, RY]],
  c1: [[RX + T, RY - T], [RX, RY - T], [RX + T, RY - 2 * T]],
  c2: [[RX + T, RY - T], [RX + T, RY - 2 * T], [RX + 2 * T, RY - T]],
  c3: [[RX + T, RY - T], [RX + 2 * T, RY - T], [RX + T, RY]],
  c4: [[RX + T, RY - T], [RX + T, RY], [RX, RY - T]],
};

const SQUARES = [
  { id: "a2", poly: [[RX, RY], [RX + T, RY], [RX + T, RY + T], [RX, RY + T]], label: [RX + T / 2, RY + T / 2], text: "a²" },
  { id: "b2", poly: [[RX, RY], [RX, RY - T], [RX - T, RY - T], [RX - T, RY]], label: [RX - T / 2, RY - T / 2], text: "b²" },
  { id: "c2", poly: [[RX + T, RY], [RX, RY - T], [RX + T, RY - 2 * T], [RX + 2 * T, RY - T]], label: [RX + T + 70, RY - T - 30], text: "c²" },
];

interface Tile {
  id: string;
  color: string;
  pts: number[][];
  gap: [number, number];
  zone: keyof typeof ZONES;
  centroid: [number, number];
}
const ZONES = {
  c1: { pts: POLY_STATIC.c1, centroid: [360, 140] as [number, number] },
  c2: { pts: POLY_STATIC.c2, centroid: [440, 140] as [number, number] },
  c3: { pts: POLY_STATIC.c3, centroid: [440, 220] as [number, number] },
  c4: { pts: POLY_STATIC.c4, centroid: [360, 220] as [number, number] },
};

const TILES: Tile[] = [
  { id: "a1", color: "#1D52AC", pts: POLY_STATIC.a1, gap: [4, -4], zone: "c1", centroid: [380, 340] },
  { id: "a2", color: "#D3CAC1", pts: POLY_STATIC.a2, gap: [-4, 4], zone: "c2", centroid: [340, 380] },
  { id: "b1", color: "#1D52AC", pts: POLY_STATIC.b1, gap: [4, -4], zone: "c3", centroid: [260, 220] },
  { id: "b2", color: "#D3CAC1", pts: POLY_STATIC.b2, gap: [-4, 4], zone: "c4", centroid: [220, 260] },
];

const C2_COLORS: Record<string, string> = {
  c1: "#1D52AC",
  c2: "#D3CAC1",
  c3: "#1D52AC",
  c4: "#D3CAC1",
};

const SNAP_DIST = 20;
const VB = { minX: 150, minY: 30, w: 420, h: 420 };
const GROUT = "#92B1CF";
const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");

/** Faint tiled grid behind the mosaic, so the big tiles read as a floor. */
function FloorGrid() {
  const lines: ReactElement[] = [];
  const gx0 = Math.ceil(VB.minX / T) * T;
  const gy0 = Math.ceil(VB.minY / T) * T;
  for (let x = gx0; x <= VB.minX + VB.w; x += T) {
    lines.push(<line key={`v${x}`} x1={x} y1={VB.minY} x2={x} y2={VB.minY + VB.h} stroke={GROUT} strokeOpacity={0.25} strokeWidth={1.5} />);
  }
  for (let y = gy0; y <= VB.minY + VB.h; y += T) {
    lines.push(<line key={`h${y}`} x1={VB.minX} y1={y} x2={VB.minX + VB.w} y2={y} stroke={GROUT} strokeOpacity={0.25} strokeWidth={1.5} />);
  }
  return <g>{lines}</g>;
}

type CourtyardProps = SectionProps;

export default function CourtyardSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: CourtyardProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D
  const [grow, setGrow] = useState(false);

  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [filled, setFilled] = useState<Partial<Record<keyof typeof ZONES, string>>>({});
  const [draggingTile, setDraggingTile] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<keyof typeof ZONES | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showText1, setShowText1] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const completedRef = useRef(false);
  const dragRef = useRef<{ id: string; startX: number; startY: number; pX: number; pY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const resetTiles = useCallback(() => {
    setOffsets({});
    setFilled({});
    setHoverZone(null);
    completedRef.current = false;
    setCompleted(false);
    setShowText1(false);
    setShowText2(false);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    clearTimers();
    setGrow(false);
    if (beat === 0) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1800));
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1100));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      resetTiles();
      timersRef.current.push(setTimeout(() => setGrow(true), 500));
      timersRef.current.push(setTimeout(() => showNext(true), 500 + 700 + 400));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      setGrow(true);
      resetTiles();
    }
  }, [beat, showBack, showNext, clearTimers, resetTiles]);

  const filledCount = Object.keys(filled).length;
  useEffect(() => {
    if (beat === 3 && filledCount === 4 && !completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      setShowText1(true);
      timersRef.current.push(setTimeout(() => setShowText2(true), 800));
      timersRef.current.push(setTimeout(() => showNext(true), 1800));
    }
  }, [beat, filledCount, completed, showNext]);

  const handleNext = useCallback(() => {
    if (beat === 0) { showNext(false); setBeat(1); }
    else if (beat === 1) { showNext(false); setBeat(2); }
    else if (beat === 2) { showNext(false); setBeat(3); }
    else if (beat === 3) { showNext(false); advanceSection(); }
  }, [beat, showNext, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 0) {
      showNext(false);
      backSection();
    } else if (beat === 1) {
      showNext(false);
      setBeat(0);
    } else if (beat === 2) {
      showNext(false);
      setBeat(1);
    } else if (beat === 3) {
      showNext(false);
      clearTimers();
      resetTiles();
    }
  }, [beat, showNext, backSection, clearTimers, resetTiles]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  const sceneFromClient = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: VB.minX + ((clientX - rect.left) / rect.width) * VB.w,
      y: VB.minY + ((clientY - rect.top) / rect.height) * VB.h,
    };
  }, []);

  const startDrag = useCallback(
    (id: string, e: ReactPointerEvent) => {
      if (beat !== 3) return;
      e.preventDefault();
      const pt = sceneFromClient(e.clientX, e.clientY);
      const cur = offsets[id] ?? { x: 0, y: 0 };
      dragRef.current = { id, startX: cur.x, startY: cur.y, pX: pt.x, pY: pt.y };
      svgRef.current?.setPointerCapture?.(e.pointerId);
      setDraggingTile(id);
    },
    [beat, offsets, sceneFromClient],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (beat !== 3 || !dragRef.current) return;
      const pt = sceneFromClient(e.clientX, e.clientY);
      const { id, startX, startY, pX, pY } = dragRef.current;
      const nx = startX + (pt.x - pX);
      const ny = startY + (pt.y - pY);
      setOffsets((prev) => ({ ...prev, [id]: { x: nx, y: ny } }));
      const tile = TILES.find((t) => t.id === id);
      if (!tile) return;
      const relX = tile.centroid[0] + nx;
      const relY = tile.centroid[1] + ny;
      const zc = ZONES[tile.zone].centroid;
      setHoverZone(Math.hypot(relX - zc[0], relY - zc[1]) <= SNAP_DIST ? tile.zone : null);
    },
    [beat, sceneFromClient],
  );

  const handlePointerUp = useCallback(() => {
    if (beat !== 3 || !dragRef.current) return;
    const { id } = dragRef.current;
    const tile = TILES.find((t) => t.id === id);
    if (tile) {
      const cur = offsets[id] ?? { x: 0, y: 0 };
      const relX = tile.centroid[0] + cur.x;
      const relY = tile.centroid[1] + cur.y;
      const zc = ZONES[tile.zone].centroid;
      if (Math.hypot(relX - zc[0], relY - zc[1]) <= SNAP_DIST) {
        setFilled((prev) => ({ ...prev, [tile.zone]: tile.color }));
      }
      setOffsets((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
    }
    dragRef.current = null;
    setDraggingTile(null);
    setHoverZone(null);
  }, [beat, offsets]);

  const displayPts = (t: Tile) => t.pts.map((p) => [p[0] + t.gap[0], p[1] + t.gap[1]]);

  const renderStaticTile = (pts: number[][], color: string, key: string) => (
    <polygon key={key} points={poly(pts)} fill={color} stroke={GROUT} strokeWidth={6} strokeLinejoin="round" />
  );

  return (
    <div className="pyth-courtyard">
      <div className="court-content">
        {/* ── Text beats ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="court-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="court-title">
                Ancient Greeks noticed this rule embedded in everyday tile
                floors. Look at these special right triangles.
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="court-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="court-title">Take a look at this triangle.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rectangular tile viewport ── */}
        <div className="court-stage">
          <svg ref={svgRef} viewBox={`${VB.minX} ${VB.minY} ${VB.w} ${VB.h}`} className="court-svg" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <FloorGrid />

            {/* rotated big-square tiles (4) — static in A/B/C, zones in D */}
            {(Object.keys(ZONES) as (keyof typeof ZONES)[]).map((z) => {
              if (beat === 3) {
                const color = filled[z];
                const highlighted = hoverZone === z;
                return (
                  <polygon
                    key={z}
                    points={poly(ZONES[z].pts)}
                    fill={color ? color : highlighted ? "rgba(70,145,206,0.22)" : "rgba(255,255,255,0.35)"}
                    stroke={color ? "#143371" : "#1D52AC"}
                    strokeOpacity={color ? 1 : 0.5}
                    strokeWidth={color ? 4 : 2}
                    strokeLinejoin="round"
                  />
                );
              }
              return renderStaticTile(ZONES[z].pts, C2_COLORS[z], z);
            })}

            {/* central highlighted tile */}
            <motion.polygon
              points={poly(CENTRAL)}
              fill="#D3CAC1"
              stroke="none"
              animate={reduce ? { opacity: 1 } : { scale: [1, 1.02, 1] }}
              transition={reduce ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
            {beat === 0 ? (
              <motion.polygon
                points={poly(CENTRAL)}
                fill="none"
                stroke="#1D52AC"
                strokeWidth={5}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.7 }}
              />
            ) : (
              <polygon points={poly(CENTRAL)} fill="none" stroke="#1D52AC" strokeWidth={5} strokeLinejoin="round" />
            )}

            {/* a² & b² square tiles — static in A/B/C, draggable in D */}
            {beat === 3
              ? TILES.map((t) => {
                  if (filled[t.zone]) return null;
                  const off = offsets[t.id] ?? { x: 0, y: 0 };
                  const isDrag = draggingTile === t.id;
                  return (
                    <motion.g
                      key={t.id}
                      animate={{ x: off.x, y: off.y, scale: isDrag ? 1.05 : 1 }}
                      transition={isDrag ? { type: "tween", duration: 0.05 } : { type: "spring", stiffness: 280, damping: 18 }}
                      style={{ transformBox: "fill-box", transformOrigin: "50% 50%", cursor: "grab" }}
                      onPointerDown={(e) => startDrag(t.id, e)}
                    >
                      <polygon points={poly(displayPts(t))} fill={t.color} stroke={GROUT} strokeWidth={6} strokeLinejoin="round" style={{ filter: isDrag ? "drop-shadow(0 4px 6px rgba(20,51,113,0.4))" : "none" }} />
                    </motion.g>
                  );
                })
              : TILES.map((t) => renderStaticTile(t.pts, t.color, t.id))}

            {/* square outlines + labels (Beat C & D) */}
            {beat >= 2 &&
              SQUARES.map((s, i) => (
                <motion.g key={s.id} initial={{ opacity: 0 }} animate={{ opacity: grow ? 1 : 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}>
                  <polygon points={poly(s.poly)} fill="none" stroke="#1D52AC" strokeWidth={4} strokeLinejoin="round" />
                  <motion.text x={s.label[0]} y={s.label[1]} fill="#143371" fontSize={26} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: grow ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }}>
                    {s.text}
                  </motion.text>
                </motion.g>
              ))}
          </svg>

          {beat === 3 && completed && !reduce && (
            <motion.div className="court-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }} transition={{ duration: 0.6, times: [0, 0.5, 1] }} />
          )}
        </div>

        {/* ── Beat D completion text ── */}
        {beat === 3 && (
          <div className="court-complete">
            <AnimatePresence>
              {showText1 && (
                <motion.p key="t1" className="court-complete-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  The area of the two smaller squares is exactly equal to the area of the larger square. Since each square is made of tiles, and its area is just its side length squared, this is one case of <Eq>a^2 + b^2 = c^2</Eq> — no algebra required. The law reveals itself just by counting tiles.
                </motion.p>
              )}
              {showText2 && (
                <motion.p key="t2" className="court-complete-text court-complete-text--muted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  But notice — this only worked because the triangle, in this case, is symmetric, and both legs are equal. Most right triangles aren't this tidy. So how do we prove the rule holds for any right triangle?
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}