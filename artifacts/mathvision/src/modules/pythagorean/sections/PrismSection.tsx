import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";
import { projectRotated, type Vec3 } from "../box3d";

/* ───────────────────────── Geometry ─────────────────────────
   A rectangular box centered at the origin, with half-extents
   l/2 (x), h/2 (y, up), w/2 (z, depth). Rendered as wireframe via
   a vertical-axis-only rotation + isometric projection from box3d.
   Variable naming (l/w/h/f/d) deliberately avoids module's a/b/c.
   viewBox "-3 -3 6 6". */
const L = 4; // length (x)
const W = 3; // width (z)
const H = 3; // height (y)

const V: Vec3[] = [
  { x: -L / 2, y: -H / 2, z: -W / 2 }, // 0 = V000 (starting corner)
  { x:  L / 2, y: -H / 2, z: -W / 2 }, // 1 = V100
  { x:  L / 2, y: -H / 2, z:  W / 2 }, // 2 = V101
  { x: -L / 2, y: -H / 2, z:  W / 2 }, // 3 = V001
  { x: -L / 2, y:  H / 2, z: -W / 2 }, // 4 = V010
  { x:  L / 2, y:  H / 2, z: -W / 2 }, // 5 = V110
  { x:  L / 2, y:  H / 2, z:  W / 2 }, // 6 = V111 (opposite top corner)
  { x: -L / 2, y:  H / 2, z:  W / 2 }, // 7 = V011
];

// 12 wireframe edges (bottom, top, vertical)
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// faint face fills for depth (top + two front/right faces)
const FACES: [number, number, number, number][] = [
  [4, 5, 6, 7], // top
  [0, 1, 5, 4], // front
  [1, 2, 6, 5], // right
];

// edges to label l / w / h (bottom-front, bottom-side, vertical from corner 0)
const LABEL_EDGES = [
  { id: "l", edge: [0, 1] as [number, number], dx: 0, dy: 0.42 },
  { id: "w", edge: [0, 3] as [number, number], dx: 0, dy: -0.42 },
  { id: "h", edge: [0, 4] as [number, number], dx: 0.45, dy: 0 },
];

const THETA0 = -0.62;
const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");

type PrismProps = SectionProps;

export default function PrismSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: PrismProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D
  const [theta, setTheta] = useState(THETA0);
  const [rotated, setRotated] = useState(false);
  const [dq, setDq] = useState(0); // beat D substitution phase
  const [line2, setLine2] = useState(false);
  const dragRef = useRef<{ startX: number; startTheta: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // projected coordinates (recomputed on every frame of rotation)
  const P = useMemo(() => V.map((v) => projectRotated(v, theta)), [theta]);
  const mid = (a: number, b: number) => ({ x: (P[a].x + P[b].x) / 2, y: (P[a].y + P[b].y) / 2 });

  // key segments
  const spaceDiag = [P[0], P[6]]; // space diagonal d
  const floorDiag = [P[0], P[2]]; // floor diagonal f
  const vertTri = [P[0], P[2], P[6]]; // second right triangle V000→V101→V111
  const floorFace = [P[0], P[1], P[2], P[3]];

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    dragRef.current = null;
    setRotated(false);
    if (beat === 0) {
      showBack(true);
      showNext(false);
      setTheta(THETA0);
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 500 + 500 + 500 + 400));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 500 + 500 + 600));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      setDq(0);
      setLine2(false);
      timersRef.current.push(setTimeout(() => setDq(1), 1200));
      timersRef.current.push(setTimeout(() => setLine2(true), 1900));
      timersRef.current.push(setTimeout(() => showNext(true), 1900 + 600 + 400));
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat A: Next gated on rotate-or-4s fallback
  useEffect(() => {
    if (beat !== 0) return;
    if (rotated) {
      showNext(true);
      return;
    }
    const t = setTimeout(() => showNext(true), 4000);
    return () => clearTimeout(t);
  }, [beat, rotated, showNext]);

  // ── rotation (horizontal drag across the scene) ──
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      svgRef.current?.setPointerCapture?.(e.pointerId);
      dragRef.current = { startX: e.clientX, startTheta: theta };
    },
    [theta],
  );
  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      setTheta(dragRef.current.startTheta + dx * 0.01);
      if (!rotated) setRotated(true);
    },
    [rotated],
  );
  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // dim "d" only in Beat B
  const dOpacity = beat === 1 ? 0.4 : 1;

  const handleNext = useCallback(() => {
    if (beat === 0) { showNext(false); setBeat(1); }
    else if (beat === 1) { showNext(false); setBeat(2); }
    else if (beat === 2) { showNext(false); setBeat(3); }
    else if (beat === 3) { showNext(false); advanceSection(); }
  }, [beat, showNext, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 0) { showNext(false); backSection(); }
    else if (beat === 1) { showNext(false); setBeat(0); }
    else if (beat === 2) { showNext(false); setBeat(1); }
    else if (beat === 3) { showNext(false); setBeat(2); }
  }, [beat, showNext, backSection]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  return (
    <div className="pyth-prism">
      <div className="prism-content">
        {/* ── Text ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="prism-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="prism-prose">
                Picture a rectangular box. Its edges have lengths <Eq>l</Eq>, <Eq>w</Eq>, and <Eq>h</Eq>. What's the
                length of the diagonal line running from one corner, straight through the inside of the box, to the
                opposite corner? Drag to rotate and look at it from different angles.
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="prism-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="prism-prose">
                First, find the diagonal across just the floor, ignoring height entirely. This is a flat right triangle
                with legs <Eq>l</Eq> and <Eq>w</Eq> — the exact same setup as the Pythagorean theorem proofs from
                earlier in this module: <Eq>f^2 = l^2 + w^2</Eq>.
              </p>
              <p className="prism-callback">(same idea as <Eq>a^2 + b^2 = c^2</Eq>)</p>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="prism-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="prism-prose">
                Now treat that floor diagonal as one leg of a second right triangle, with the height <Eq>h</Eq> as the
                other leg. Apply the Pythagorean theorem again: <Eq>d^2 = f^2 + h^2</Eq>.
              </p>
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="D" className="prism-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="prism-prose">
                Substituting in what <Eq>f^2</Eq> equals gives us the full diagonal formula for any rectangular box:
              </p>
              <div className="prism-eq">
                <AnimatePresence mode="wait">
                  {dq === 0 ? (
                    <motion.div key="merge" className="prism-merge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <span className="pmerge"><Eq>f^2 = l^2 + w^2</Eq></span>
                      <span className="pmerge"><Eq>d^2 = f^2 + h^2</Eq></span>
                    </motion.div>
                  ) : (
                    <motion.div key="combined" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                      <Eq displayMode>l^2 + w^2 + h^2 = d^2</Eq>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rotating box stage ── */}
        <div className="prism-stage" style={{ cursor: dragRef.current ? "grabbing" : "grab" }}>
          <svg
            ref={svgRef}
            viewBox="-3 -3 6 6"
            className="prism-svg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* faint face fills for depth */}
            {FACES.map((f, i) => (
              <polygon key={i} points={poly(f.map((idx) => [P[idx].x, P[idx].y] as [number, number]))} fill="rgba(70,145,206,0.07)" stroke="none" />
            ))}

            {/* wireframe */}
            <g>
              {EDGES.map(([a, b], i) => (
                <motion.line
                  key={i}
                  x1={P[a].x} y1={P[a].y} x2={P[b].x} y2={P[b].y}
                  stroke="#92B1CF" strokeWidth={0.05}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 + i * 0.02 }}
                />
              ))}
            </g>

            {/* Beat B: floor face highlight */}
            {beat === 1 && (
              <motion.polygon
                points={poly(floorFace.map((p) => [p.x, p.y] as [number, number]))}
                fill="none" stroke="#1D52AC" strokeWidth={0.09} strokeLinejoin="round"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              />
            )}

            {/* space diagonal d (dimmed in beat B) */}
            <motion.line
              x1={spaceDiag[0].x} y1={spaceDiag[0].y} x2={spaceDiag[1].x} y2={spaceDiag[1].y}
              stroke="#4691CE" strokeWidth={0.06}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1, strokeOpacity: dOpacity }} transition={{ duration: 0.4, ease: "easeInOut" }}
            />
            {/* d label */}
            <motion.text
              x={mid(0, 6).x} y={mid(0, 6).y - 0.3} fill="#4691CE" fontSize={0.34} textAnchor="middle" fontFamily="Playfair Display, serif"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}
            >
              d
            </motion.text>

            {/* floor diagonal f (beat B+) */}
            <motion.line
              x1={floorDiag[0].x} y1={floorDiag[0].y} x2={floorDiag[1].x} y2={floorDiag[1].y}
              stroke="#4691CE" strokeWidth={0.06}
              initial={false} animate={{ pathLength: beat >= 1 ? 1 : 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}
            />
            {beat >= 1 && (
              <motion.text
                x={mid(0, 2).x - 0.35} y={mid(0, 2).y - 0.1} fill="#4691CE" fontSize={0.32} textAnchor="end" dominantBaseline="middle" fontFamily="Playfair Display, serif"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}
              >
                f
              </motion.text>
            )}

            {/* Beat C: second right triangle (floor diagonal + height + space diagonal) */}
            {beat === 2 && (
              <motion.polygon
                points={poly(vertTri.map((p) => [p.x, p.y] as [number, number]))}
                fill="rgba(29,82,172,0.12)" stroke="#1D52AC" strokeWidth={0.09} strokeLinejoin="round"
                initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: 1, pathLength: 1 }} transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            )}

            {/* l / w / h labels on their edges */}
            {LABEL_EDGES.map((le) => {
              const [a, b] = le.edge;
              return (
                <motion.text
                  key={le.id}
                  x={mid(a, b).x + le.dx} y={mid(a, b).y + le.dy}
                  fill="#ECECF1" fontSize={0.34} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}
                >
                  {le.id}
                </motion.text>
              );
            })}
          </svg>
        </div>

        {/* Beat D second text line */}
        {beat === 3 && line2 && (
          <motion.div key="D2" className="prism-text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="prism-callback">
              This is the same law as before — just applied twice: once for the floor, once for the height.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
