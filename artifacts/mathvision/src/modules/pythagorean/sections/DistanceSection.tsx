import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

/* ───────────────────────── Geometry ─────────────────────────
   Two draggable points (p1, p2) on a 10×10 coordinate grid.
   The horizontal distance is |x2-x1|, vertical is |y2-y1|, and
   the straight line between them (d) is the hypotenuse of a right
   triangle whose right angle sits at (x2, y1).
   viewBox "0 0 10 10", y-up (flip). */
const DEFAULTS = { p1: { x: 2, y: 2 }, p2: { x: 7, y: 6 } };
const svgY = (y: number) => 10 - y;

type PointId = "p1" | "p2";
type DistProps = SectionProps;

export default function DistanceSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: DistProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D
  const [points, setPoints] = useState(DEFAULTS);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragging, setDragging] = useState<PointId | null>(null);
  const dragRef = useRef<{ id: PointId; startX: number; startY: number; pX: number; pY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    setDragging(null);
    dragRef.current = null;
    if (beat === 0) {
      showBack(true);
      showNext(false);
      setPoints(DEFAULTS);
      setHasDragged(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1300));
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      setPoints(DEFAULTS);
      setHasDragged(false);
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      // line 400ms + dashed triangle 300ms + labels + eq readout
      timersRef.current.push(setTimeout(() => showNext(true), 400 + 350 + 500 + 500));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1500));
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat B: Next gated on drag-or-4s fallback
  useEffect(() => {
    if (beat !== 1) return;
    if (hasDragged) {
      showNext(true);
      return;
    }
    const t = setTimeout(() => showNext(true), 4000);
    return () => clearTimeout(t);
  }, [beat, hasDragged, showNext]);

  // ── dragging ──
  const sceneFromClient = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 10,
      y: 10 - ((clientY - rect.top) / rect.height) * 10,
    };
  }, []);

  const startDrag = useCallback(
    (id: PointId, e: ReactPointerEvent) => {
      if (beat < 1) return;
      e.preventDefault();
      const pt = sceneFromClient(e.clientX, e.clientY);
      const cur = points[id];
      dragRef.current = { id, startX: cur.x, startY: cur.y, pX: pt.x, pY: pt.y };
      svgRef.current?.setPointerCapture?.(e.pointerId);
      setDragging(id);
    },
    [beat, points, sceneFromClient],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (beat < 1 || !dragRef.current) return;
      const pt = sceneFromClient(e.clientX, e.clientY);
      const { id, startX, startY, pX, pY } = dragRef.current;
      const nx = Math.max(0.3, Math.min(9.7, Math.round((startX + (pt.x - pX)) * 10) / 10));
      const ny = Math.max(0.3, Math.min(9.7, Math.round((startY + (pt.y - pY)) * 10) / 10));
      setPoints((prev) => ({ ...prev, [id]: { x: nx, y: ny } }));
      if (!hasDragged) {
        setHasDragged(true);
        setDragging(id);
      }
    },
    [beat, sceneFromClient, hasDragged],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
  }, []);

  // ── derived values (abs distances for readouts/labels) ──
  const dx = Math.abs(points.p2.x - points.p1.x);
  const dy = Math.abs(points.p2.y - points.p1.y);
  const d = Math.sqrt(dx * dx + dy * dy);

  const rx = points.p2.x;
  const ry = points.p1.y; // right-angle vertex
  const midX = (points.p1.x + points.p2.x) / 2;
  const midY = (points.p1.y + points.p2.y) / 2;

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

  const pointDrag = (id: PointId, px: number, py: number) => {
    const isDrag = dragging === id;
    return (
      <motion.g
        key={id}
        animate={{ scale: isDrag ? 1.3 : 1 }}
        transition={isDrag ? { type: "tween", duration: 0.05 } : { type: "spring", stiffness: 280, damping: 18 }}
        style={{ cursor: "grab", transformBox: "fill-box", transformOrigin: "50% 50%" }}
        onPointerDown={(e) => startDrag(id, e)}
      >
        <circle cx={px} cy={svgY(py)} r={0.3} fill="transparent" />
        <circle cx={px} cy={svgY(py)} r={0.17} fill="#4691CE" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
      </motion.g>
    );
  };

  return (
    <div className="pyth-dist">
      <div className="dist-content">
        {/* ── Text beats ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="dist-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4 }}>
              <p className="dist-title">
                So why is this one theorem so important? Because it turns out to be the hidden engine behind ideas
                that don't even look like triangles.
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="dist-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              Drag either point to explore.
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="dist-prose-wrap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="dist-prose">
                The horizontal distance between the two points is just the difference between their x-coordinates:{" "}
                <Eq>(x_2 - x_1)</Eq>. The vertical distance is the difference between their y-coordinates:{" "}
                <Eq>(y_2 - y_1)</Eq>.
              </p>
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="D" className="dist-prose-wrap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="dist-prose">
                Finding the straight-line distance between two points is really just finding the hypotenuse of this
                triangle. Applying the theorem gives us <Eq>d^2 = (x_2 - x_1)^2 + (y_2 - y_1)^2</Eq>. Taking the
                square root of both sides gives the standard distance formula — and it works for any two points on a
                flat plane.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid stage (beats B, C, D) ── */}
        {beat >= 1 && (
          <div className="dist-stage">
            <svg
              ref={svgRef}
              viewBox="0 0 10 10"
              className="dist-svg"
              style={{ cursor: dragging ? "grabbing" : "grab" }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* coordinate grid */}
              <g>
                {Array.from({ length: 11 }, (_, i) => (
                  <g key={`g${i}`}>
                    <line x1={i} y1={0} x2={i} y2={10} stroke="#92B1CF" strokeOpacity={0.13} strokeWidth={0.02} />
                    <line x1={0} y1={10 - i} x2={10} y2={10 - i} stroke="#92B1CF" strokeOpacity={0.13} strokeWidth={0.02} />
                  </g>
                ))}
              </g>

              {/* dashed legs + hypotenuse (Beat C/D) */}
              {beat >= 2 && (
                <>
                  <motion.line
                    x1={points.p1.x} y1={svgY(ry)} x2={rx} y2={svgY(ry)}
                    stroke="#92B1CF" strokeWidth={0.03} strokeDasharray="0.12 0.08"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                  <motion.line
                    x1={rx} y1={svgY(ry)} x2={rx} y2={svgY(points.p2.y)}
                    stroke="#92B1CF" strokeWidth={0.03} strokeDasharray="0.12 0.08"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
                  />
                  {/* leg labels */}
                  <motion.text
                    x={midX} y={svgY(ry) + 0.42} fill="#ECECF1" fontSize={0.3} textAnchor="middle" fontFamily="Playfair Display, serif"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    (x₂ − x₁)
                  </motion.text>
                  <motion.text
                    x={rx + 0.38} y={svgY(midY)} fill="#ECECF1" fontSize={0.3} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    (y₂ − y₁)
                  </motion.text>
                  {/* hypotenuse d */}
                  <motion.line
                    x1={points.p1.x} y1={svgY(points.p1.y)} x2={points.p2.x} y2={svgY(points.p2.y)}
                    stroke="#4691CE" strokeWidth={0.05}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                  <motion.text
                    x={(points.p1.x + points.p2.x) / 2 - 0.45} y={svgY((points.p1.y + points.p2.y) / 2) + 0.05}
                    fill="#4691CE" fontSize={0.4} textAnchor="end" dominantBaseline="middle" fontFamily="Playfair Display, serif"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    d
                  </motion.text>
                </>
              )}

              {/* draggable points */}
              {pointDrag("p1", points.p1.x, points.p1.y)}
              {pointDrag("p2", points.p2.x, points.p2.y)}

              {/* point labels */}
              <motion.text
                x={points.p1.x - 0.3} y={svgY(points.p1.y) + 0.5} fill="#ECECF1" fontSize={0.26} textAnchor="end" fontFamily="Playfair Display, serif"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              >
                (x₁, y₁)
              </motion.text>
              <motion.text
                x={points.p2.x + 0.3} y={svgY(points.p2.y) - 0.4} fill="#ECECF1" fontSize={0.26} textAnchor="start" fontFamily="Playfair Display, serif"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              >
                (x₂, y₂)
              </motion.text>
            </svg>

            {/* Live equation readout (Beats C/D) */}
            {beat >= 2 && (
              <motion.div className="dist-eqpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="eq-line">
                  <Eq>x^2 + y^2 = d^2</Eq>
                </div>
                <div className="eq-line" style={{ marginTop: "10px" }}>
                  <span className="eq-num">{dx.toFixed(1)}</span>
                  <span className="eq-sym">²</span> +
                  <span className="eq-num">{dy.toFixed(1)}</span>
                  <span className="eq-sym">²</span> =
                  <span className="eq-num">{d.toFixed(1)}</span>
                  <span className="eq-sym">²</span>
                </div>
                <div className="eq-line" style={{ fontSize: "1.05rem", marginTop: "6px" }}>
                  <span className="eq-num">{(dx * dx).toFixed(1)}</span> +
                  <span className="eq-num">{(dy * dy).toFixed(1)}</span> =
                  <span className="eq-num">{(dx * dx + dy * dy).toFixed(1)}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
