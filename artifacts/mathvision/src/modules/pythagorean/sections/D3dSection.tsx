import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";
import { projectRotated, makeBox, type Vec3 } from "../box3d";

/* ───────────────────────── Geometry ─────────────────────────
   Two fixed points p1 (on the floor, z1=0) and p2 float in a 3D
   space with a wireframe x/y/z axis frame. The straight-line
   distance d is built in two steps:
     floor diagonal f² = (x₂−x₁)² + (y₂−y₁)²   (floor triangle)
     then         d² = f² + (z₂−z₁)²            (vertical triangle)
   All 3D points share the box3d rotation (vertical axis only) +
   isometric projection, so everything tracks rotation.
   viewBox "-3 -3 6 6". */
const P1: Vec3 = { x: -1.4, y: -1.0, z: 0 };      // on the floor
const P2: Vec3 = { x: 1.6, y: 1.4, z: 1.6 };      // floating
const P2F: Vec3 = { x: P2.x, y: P2.y, z: 0 };     // floor shadow of p2
const CORNER: Vec3 = { x: P2.x, y: P1.y, z: 0 };  // floor triangle right angle

const AXIS_LEN = 2.1;
const X_END: Vec3 = { x: AXIS_LEN, y: 0, z: 0 };
const Y_END: Vec3 = { x: 0, y: AXIS_LEN, z: 0 };
const Z_END: Vec3 = { x: 0, y: 0, z: AXIS_LEN };
const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

const THETA0 = -0.72;
const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");

// dimmed lingering box anchor (Beat A), reusing shared factory
const { verts: BOX_V, edges: BOX_E } = makeBox(4, 3, 3);

type D3dProps = SectionProps;

export default function D3dSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: D3dProps) {
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D 4:E
  const [theta, setTheta] = useState(THETA0);
  const [rotated, setRotated] = useState(false);
  const dragRef = useRef<{ startX: number; startTheta: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // projected scene points (recomputed each rotation frame)
  const S = useMemo(() => {
    const pr = (p: Vec3) => projectRotated(p, theta);
    return {
      p1: pr(P1),
      p2: pr(P2),
      p2f: pr(P2F),
      corner: pr(CORNER),
      x: pr(X_END),
      yE: pr(Y_END),
      z: pr(Z_END),
      o: pr(ORIGIN),
    };
  }, [theta]);

  // floor triangle (A, C, B) and vertical triangle (A, B, D)
  const floorTri = [S.p1, S.corner, S.p2f];
  const vertTri = [S.p1, S.p2f, S.p2];
  const fMid = { x: (S.p1.x + S.p2f.x) / 2, y: (S.p1.y + S.p2f.y) / 2 };
  const dMid = { x: (S.p1.x + S.p2.x) / 2, y: (S.p1.y + S.p2.y) / 2 };
  const p1MidLabel = { x: S.p1.x - 0.45, y: S.p1.y + 0.5 };
  const p2Label = { x: S.p2.x + 0.45, y: S.p2.y - 0.45 };

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    dragRef.current = null;
    setRotated(false);
    if (beat === 0) {
      showBack(true);
      showNext(false);
      setTheta(THETA0);
      timersRef.current.push(setTimeout(() => showNext(true), 1200));
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => setRotated(false), 0));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 600 + 500 + 500 + 400));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 500 + 600 + 500 + 400));
    } else if (beat === 4) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1400));
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat B: Next gated on rotate-or-5s fallback
  useEffect(() => {
    if (beat !== 1) return;
    if (rotated) {
      showNext(true);
      return;
    }
    const t = setTimeout(() => showNext(true), 5000);
    return () => clearTimeout(t);
  }, [beat, rotated, showNext]);

  // ── rotation drag (horizontal) ──
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

  const handleNext = useCallback(() => {
    if (beat === 0) { showNext(false); setBeat(1); }
    else if (beat === 1) { showNext(false); setBeat(2); }
    else if (beat === 2) { showNext(false); setBeat(3); }
    else if (beat === 3) { showNext(false); setBeat(4); }
    else if (beat === 4) { showNext(false); advanceSection(); }
  }, [beat, showNext, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 0) { showNext(false); backSection(); }
    else if (beat === 1) { showNext(false); setBeat(0); }
    else if (beat === 2) { showNext(false); setBeat(1); }
    else if (beat === 3) { showNext(false); setBeat(2); }
    else if (beat === 4) { showNext(false); setBeat(3); }
  }, [beat, showNext, backSection]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  return (
    <div className="pyth-3dspace">
      <div className="space-content">
        {/* ── Text ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="space-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="space-prose">
                That box provided an insight on how to derive the 3d distance formula.
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="space-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <p className="space-prompt">Drag to rotate the view and look around.</p>
              <p className="space-prompt">How do you think we could find the straight-line distance between these two points?</p>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="space-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="space-prose">
                First, find the straight-line distance across the floor, ignoring height — that's just the Pythagorean
                theorem, or, more specifically, the 2d distance formula we've already derived.
              </p>
              <div className="space-eq space-eq--dim"><Eq>f^2 = (x_2 - x_1)^2 + (y_2 - y_1)^2</Eq></div>
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="D" className="space-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="space-prose">
                Now treat that floor distance as one leg of a second right triangle, with the height difference{" "}
                <Eq>(z_2 - z_1)</Eq> as the other leg. Apply the Pythagorean theorem again:{" "}
                <Eq>d^2 = f^2 + (z_2 - z_1)^2</Eq>. Substituting in what <Eq>f^2</Eq> equals gives us the full 3D
                distance formula:
              </p>
              <div className="space-eq"><Eq displayMode>d^2 = (x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2</Eq></div>
            </motion.div>
          )}
          {beat === 4 && (
            <motion.div key="E" className="space-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="space-prose">
                This is the 3D distance formula: for any two points in 3d space, the straight-line distance between
                them is
              </p>
              <div className="space-eq"><Eq displayMode math="d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rotating scene ── */}
        <div className="space-stage" style={{ cursor: dragRef.current ? "grabbing" : "grab" }}>
          <svg
            ref={svgRef}
            viewBox="-3 -3 6 6"
            className="space-svg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Beat A: dimmed lingering box anchor */}
            {beat === 0 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 0.5 }}>
                {BOX_E.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={projectRotated(BOX_V[a], theta).x} y1={projectRotated(BOX_V[a], theta).y}
                    x2={projectRotated(BOX_V[b], theta).x} y2={projectRotated(BOX_V[b], theta).y}
                    stroke="#92B1CF" strokeWidth={0.05}
                  />
                ))}
              </motion.g>
            )}

            {/* Beat B+: axis frame + two fixed points */}
            {beat >= 1 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                {/* axis lines, low opacity */}
                <line x1={S.o.x} y1={S.o.y} x2={S.x.x} y2={S.x.y} stroke="#92B1CF" strokeOpacity={0.45} strokeWidth={0.035} />
                <line x1={S.o.x} y1={S.o.y} x2={S.yE.x} y2={S.yE.y} stroke="#92B1CF" strokeOpacity={0.45} strokeWidth={0.035} />
                <line x1={S.o.x} y1={S.o.y} x2={S.z.x} y2={S.z.y} stroke="#92B1CF" strokeOpacity={0.45} strokeWidth={0.035} />
                <text x={S.x.x} y={S.x.y + 0.3} fill="#92B1CF" fontSize={0.28} textAnchor="middle" fontFamily="Playfair Display, serif">x</text>
                <text x={S.yE.x + 0.25} y={S.yE.y} fill="#92B1CF" fontSize={0.28} textAnchor="middle" fontFamily="Playfair Display, serif">y</text>
                <text x={S.z.x - 0.25} y={S.z.y} fill="#92B1CF" fontSize={0.28} textAnchor="middle" fontFamily="Playfair Display, serif">z</text>
              </motion.g>
            )}

            {/* Beat C+/D+: floor triangle (f) then vertical triangle (d) */}
            {beat >= 2 && (
              <>
                <motion.polygon
                  points={poly(floorTri.map((p) => [p.x, p.y] as [number, number]))}
                  fill="rgba(70,145,206,0.06)" stroke="#1D52AC" strokeWidth={0.08} strokeLinejoin="round"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                />
                <motion.line
                  x1={S.p1.x} y1={S.p1.y} x2={S.p2f.x} y2={S.p2f.y}
                  stroke="#4691CE" strokeWidth={0.055}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <motion.text x={fMid.x} y={fMid.y - 0.25} fill="#4691CE" fontSize={0.3} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}>
                  f
                </motion.text>
              </>
            )}

            {/* Vertical triangle + hypotenuse d (Beat D/E) */}
            {beat >= 3 && (
              <>
                <motion.polygon
                  points={poly(vertTri.map((p) => [p.x, p.y] as [number, number]))}
                  fill="rgba(29,82,172,0.12)" stroke="#1D52AC" strokeWidth={0.08} strokeLinejoin="round"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                />
                <motion.line
                  x1={S.p2f.x} y1={S.p2f.y} x2={S.p2.x} y2={S.p2.y}
                  stroke="#ECECF1" strokeWidth={0.04} strokeDasharray="0.12 0.08"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                <motion.line
                  x1={S.p1.x} y1={S.p1.y} x2={S.p2.x} y2={S.p2.y}
                  stroke="#4691CE" strokeWidth={0.06}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.text x={dMid.x} y={dMid.y - 0.28} fill="#4691CE" fontSize={0.32} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
                  d
                </motion.text>
              </>
            )}

            {/* two fixed points (Beat B+) */}
            {beat >= 1 && (
              <>
                <motion.circle cx={S.p1.x} cy={S.p1.y} r={0.17} fill="#4691CE" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }} style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
                <motion.circle cx={S.p2.x} cy={S.p2.y} r={0.17} fill="#4691CE" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }} style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
                <motion.text x={p1MidLabel.x} y={p1MidLabel.y} fill="#ECECF1" fontSize={0.24} textAnchor="end" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}>
                  (x₁, y₁, z₁)
                </motion.text>
                <motion.text x={p2Label.x} y={p2Label.y} fill="#ECECF1" fontSize={0.24} textAnchor="start" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}>
                  (x₂, y₂, z₂)
                </motion.text>
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
