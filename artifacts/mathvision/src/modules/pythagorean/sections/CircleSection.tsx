import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

/* ───────────────────────── Geometry ─────────────────────────
   A circle centre + a point on its perimeter, both draggable.
   perimeter = centre + radius·(cos θ, sin θ). Radius is free in
   Beat A, locked to 5 from Beat B, and the centre is locked to
   (2, 3) from Beat C. Grid region 0..10 on both axes, rendered in
   a wide viewBox ("-3 -3 16 16") so a radius-5 circle centred at
   (2,3) always fits. y-up: viewY = 10 - mathY. */
const VB = { minX: -3, minY: -3, w: 16, h: 16 };
const svgY = (my: number) => 10 - my;
const CENTER_LOCK = { x: 2, y: 3 };

type DragTarget = "center" | "perim";
type CircleProps = SectionProps;

export default function CircleSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: CircleProps) {
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D 4:E
  const [center, setCenter] = useState({ x: 3, y: 4 });
  const [radius, setRadius] = useState(2.5);
  const [angle, setAngle] = useState(0.6);
  const [hasDragged, setHasDragged] = useState(false);
  const [bPhase, setBPhase] = useState(0); // beat B equation morph
  const [dPhase, setDPhase] = useState(0); // beat D equation morph

  const dragRef = useRef<{ target: DragTarget } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerRef = useRef(center);
  centerRef.current = center;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // derived perimeter
  const perimeter = useMemo(
    () => ({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) }),
    [center, radius, angle],
  );
  const radiusMid = { x: (center.x + perimeter.x) / 2, y: (center.y + perimeter.y) / 2 };
  const rLineMid = { x: radiusMid.x, y: svgY(radiusMid.y) };

  // Beat D right-triangle (centre fixed at (2,3), perimeter point)
  const triCorner = { x: center.x, y: perimeter.y };
  const triLegX = { x1: center.x, y1: center.y, x2: triCorner.x, y2: triCorner.y };
  const triLegY = { x1: triCorner.x, y1: triCorner.y, x2: perimeter.x, y2: perimeter.y };

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    dragRef.current = null;
    if (beat === 0) {
      showBack(true);
      showNext(false);
      setCenter({ x: 3, y: 4 });
      setRadius(2.5);
      setAngle(0.6);
      setHasDragged(false);
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      setRadius(5); // lock radius
      setBPhase(0);
      timersRef.current.push(setTimeout(() => setBPhase(1), 2200));
      timersRef.current.push(setTimeout(() => showNext(true), 2200 + 500));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      setRadius(5);
      const start = { ...centerRef.current };
      const controls = animate(start, CENTER_LOCK, {
        duration: 0.5,
        ease: "easeOut",
        onUpdate: (v) => setCenter({ x: v.x, y: v.y }),
      });
      timersRef.current.push(setTimeout(() => { controls.stop(); setCenter(CENTER_LOCK); }, 600));
      timersRef.current.push(setTimeout(() => showNext(true), 500 + 500 + 400));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      setDPhase(0);
      timersRef.current.push(setTimeout(() => setDPhase(1), 1600));
      timersRef.current.push(setTimeout(() => showNext(true), 1600 + 500));
    } else if (beat === 4) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 900 + 500 + 400));
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat A: Next gated on drag-or-4s fallback
  useEffect(() => {
    if (beat !== 0) return;
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
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    const viewX = VB.minX + fx * VB.w;
    const viewY = VB.minY + fy * VB.h;
    return { x: viewX, y: 10 - viewY }; // math coordinates (y-up)
  }, []);

  const beginDrag = useCallback((target: DragTarget, e: ReactPointerEvent) => {
    e.preventDefault();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = { target };
    if (!hasDragged) setHasDragged(true);
  }, [hasDragged]);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current) return;
      const pt = sceneFromClient(e.clientX, e.clientY);
      if (dragRef.current.target === "center" && beat <= 1) {
        setCenter({
          x: Math.max(0.5, Math.min(10.5, pt.x)),
          y: Math.max(0.5, Math.min(10.5, pt.y)),
        });
      } else if (dragRef.current.target === "perim") {
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        setAngle(Math.atan2(dy, dx));
        if (beat === 0) {
          setRadius(Math.max(0.6, Math.min(6, Math.hypot(dx, dy))));
        }
      }
    },
    [beat, center, sceneFromClient],
  );
  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const centerDraggable = beat <= 1;

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
    <div className="pyth-circle">
      <div className="cc-content">
        {/* ── Text ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="cc-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4 }}>
              <p className="cc-title">
                The theorem is also hiding inside circles. Mathematically, a circle is just every point that sits a
                fixed distance from a center point. How would we write an equation for that?
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="cc-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="cc-prose">
                Let's reuse the distance formula from before:{" "}
                <Eq math="d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}" />. Since we want every point to sit the same
                distance from the center, let's fix <Eq>d</Eq> at some constant — say, 5.
              </p>
              <div className="cc-eq">
                <AnimatePresence mode="wait">
                  {bPhase === 0 ? (
                    <motion.div key="d" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.3 }} style={{ display: "inline-block" }}>
                      <Eq math="d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}" />
                    </motion.div>
                  ) : (
                    <motion.div key="five" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: "inline-block" }}>
                      <Eq math="5 = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="cc-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="cc-prose">
                Now let's fix the center point too — say, at <Eq>(2, 3)</Eq>. Every point <Eq>(x_2, y_2)</Eq> that
                satisfies this equation must lie on a circle of radius 5 centered at <Eq>(2, 3)</Eq>.
              </p>
              <div className="cc-eq"><Eq math="5 = \sqrt{(x_2 - 2)^2 + (y_2 - 3)^2}" /></div>
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="D" className="cc-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="cc-prose">
                Squaring both sides removes the square root, and since this applies to any point on the circle, we can
                rename <Eq>(x_2, y_2)</Eq> to the general <Eq>(x, y)</Eq>:
              </p>
              <div className="cc-eq">
                <AnimatePresence mode="wait">
                  {dPhase === 0 ? (
                    <motion.div key="rad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <Eq math="5 = \sqrt{(x - 2)^2 + (y - 3)^2}" />
                    </motion.div>
                  ) : (
                    <motion.div key="sq" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.06 }} transition={{ duration: 0.35 }}>
                      <Eq displayMode math="5^2 = (x - 2)^2 + (y - 3)^2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {beat === 4 && (
            <motion.div key="E" className="cc-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="cc-prose">
                Generalizing to any center <Eq>(h, k)</Eq> and radius <Eq>r</Eq> gives the standard circle equation:{" "}
                <Eq>(x - h)^2 + (y - k)^2 = r^2</Eq>. It's just the distance formula with a fixed radius — which means
                it's just the Pythagorean theorem, wearing a different outfit.
              </p>
              <div className="cc-align">
                <div className="eq-align">
                  <span className="ea-cell ea-row1 ea-col1"><Eq>(x-h)^2</Eq></span>
                  <span className="ea-cell ea-row1 ea-col2">+</span>
                  <span className="ea-cell ea-row1 ea-col3"><Eq>(y-k)^2</Eq></span>
                  <span className="ea-cell ea-row1 ea-col4">=</span>
                  <span className="ea-cell ea-row1 ea-col5"><Eq>r^2</Eq></span>

                  <div className="ea-cell ea-row2 ea-col1"><Bracket d={0} /></div>
                  <div className="ea-cell ea-row2 ea-col2" />
                  <div className="ea-cell ea-row2 ea-col3"><Bracket d={0.3} /></div>
                  <div className="ea-cell ea-row2 ea-col4" />
                  <div className="ea-cell ea-row2 ea-col5"><Bracket d={0.6} /></div>

                  <span className="ea-cell ea-row3 ea-col1"><Eq>a^2</Eq></span>
                  <span className="ea-cell ea-row3 ea-col2">+</span>
                  <span className="ea-cell ea-row3 ea-col3"><Eq>b^2</Eq></span>
                  <span className="ea-cell ea-row3 ea-col4">=</span>
                  <span className="ea-cell ea-row3 ea-col5"><Eq>c^2</Eq></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid + circle ── */}
        <div className="cc-stage">
          <svg
            ref={svgRef}
            viewBox={`${VB.minX} ${VB.minY} ${VB.w} ${VB.h}`}
            className="cc-svg"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* coordinate grid (region 0..10) */}
            <g>
              {Array.from({ length: 11 }, (_, i) => (
                <g key={`g${i}`}>
                  <line x1={i} y1={0} x2={i} y2={10} stroke="#92B1CF" strokeOpacity={0.14} strokeWidth={0.03} />
                  <line x1={0} y1={10 - i} x2={10} y2={10 - i} stroke="#92B1CF" strokeOpacity={0.14} strokeWidth={0.03} />
                </g>
              ))}
            </g>

            {/* Beat D: dashed right triangle (center → (x,3) → perimeter) */}
            {beat >= 3 && (
              <>
                <motion.line
                  x1={triLegX.x1} y1={svgY(triLegX.y1)} x2={triLegX.x2} y2={svgY(triLegX.y2)}
                  stroke="#92B1CF" strokeWidth={0.04} strokeDasharray="0.25 0.18"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                <motion.line
                  x1={triLegY.x1} y1={svgY(triLegY.y1)} x2={triLegY.x2} y2={svgY(triLegY.y2)}
                  stroke="#92B1CF" strokeWidth={0.04} strokeDasharray="0.25 0.18"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
                />
                {/* triangle labels (x-2)/(y-3)/5 */}
                <motion.text x={(center.x + triCorner.x) / 2} y={svgY(center.y) - 0.45} fill="#ECECF1" fontSize={0.32} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
                  (x − 2)
                </motion.text>
                <motion.text x={triCorner.x + 0.4} y={svgY((triCorner.y + perimeter.y) / 2)} fill="#ECECF1" fontSize={0.32} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
                  (y − 3)
                </motion.text>
                <motion.text x={rLineMid.x} y={svgY(radiusMid.y) - 0.35} fill="#ECECF1" fontSize={0.34} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
                  5
                </motion.text>
              </>
            )}

            {/* radius line (center → perimeter) */}
            <motion.line
              x1={center.x} y1={svgY(center.y)} x2={perimeter.x} y2={svgY(perimeter.y)}
              stroke="#4691CE" strokeWidth={0.06}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            />
            {/* radius label — live in A, "5" in B+ */}
            {beat >= 1 && (
              <motion.text
                x={rLineMid.x + 0.15} y={svgY(radiusMid.y) - 0.25} fill="#4691CE" fontSize={0.32} textAnchor="start" fontFamily="Playfair Display, serif"
                animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.3, delay: beat >= 3 ? 0.6 : 2.2 }}
              >
                5
              </motion.text>
            )}

            {/* circle outline */}
            <motion.circle
              cx={center.x}
              cy={svgY(center.y)}
              r={radius}
              fill="none"
              stroke="#1D52AC"
              strokeWidth={0.06}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {/* perimeter point (draggable) */}
            <motion.g
              animate={{ scale: 1 }}
              style={{ cursor: "grab", transformBox: "fill-box", transformOrigin: "50% 50%" }}
              onPointerDown={(e) => beginDrag("perim", e)}
            >
              <circle cx={perimeter.x} cy={svgY(perimeter.y)} r={0.42} fill="transparent" />
              <circle cx={perimeter.x} cy={svgY(perimeter.y)} r={0.18} fill="#4691CE" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
            </motion.g>

            {/* center point (draggable in beats A/B) */}
            <motion.g
              animate={{ scale: 1 }}
              style={{ cursor: centerDraggable ? "grab" : "default", pointerEvents: centerDraggable ? "auto" : "none", transformBox: "fill-box", transformOrigin: "50% 50%" }}
              onPointerDown={(e) => beginDrag("center", e)}
            >
              <circle cx={center.x} cy={svgY(center.y)} r={0.42} fill="transparent" />
              <circle cx={center.x} cy={svgY(center.y)} r={0.18} fill="#4691CE" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
            </motion.g>

            {/* labels */}
            <motion.text
              x={center.x - 0.35} y={svgY(center.y) + 0.55} fill="#ECECF1" fontSize={0.26} textAnchor="end" fontFamily="Playfair Display, serif"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            >
              (x₁, y₁)
            </motion.text>
            <motion.text
              x={perimeter.x + 0.35} y={svgY(perimeter.y) - 0.4} fill="#ECECF1" fontSize={0.26} textAnchor="start" fontFamily="Playfair Display, serif"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            >
              (x₂, y₂)
            </motion.text>
          </svg>
        </div>
      </div>
    </div>
  );
}

/** A small bracket connector used to align the two equations in Beat E. */
function Bracket({ d }: { d: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width="18" height="34" viewBox="0 0 18 34" className="cc-bracket" aria-hidden="true">
      <motion.path
        d="M 9 1 L 9 33 M 3 1 L 15 1 M 3 33 L 15 33"
        fill="none"
        stroke="#1D52AC"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut", delay: d }}
      />
    </svg>
  );
}
