import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

type CloseProps = SectionProps;

/* Reconstructs the original interactive triangle (Chunk 1 Beat C):
   grid, draggable vertex, labelled legs a/b/c, live readouts, and the
   live a² + b² = c² equation panel. Default position a=3, b=4 (cross-
   section state from the Introduction is not preserved). */
function TriScene({ active }: { active: boolean }) {
  const [point, setPoint] = useState({ x: 3, y: 4 });
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const a = point.x;
  const b = point.y;
  const c = Math.sqrt(a * a + b * b);
  const labelA = { x: a / 2, y: 10 - 0.45 };
  const labelB = { x: a + 0.4, y: 10 - b / 2 };
  const labelC = { x: a / 2 - 0.45, y: 10 - b / 2 };

  const updateFromEvent = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * 10;
    const rawY = 10 - ((clientY - rect.top) / rect.height) * 10;
    const nx = Math.max(0.5, Math.min(10, Math.round(rawX * 10) / 10));
    const ny = Math.max(0.5, Math.min(8, Math.round(rawY * 10) / 10));
    setPoint({ x: nx, y: ny });
  }, []);

  const handleMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragging) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [dragging, updateFromEvent],
  );
  const handleDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    setDragging(true);
  }, []);
  const handleUp = useCallback(() => setDragging(false), []);

  return (
    <div className="intro-stage">
      <svg
        ref={svgRef}
        viewBox="0 0 10 10"
        className="intro-svg"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      >
        {/* coordinate grid */}
        <g>
          {Array.from({ length: 11 }, (_, i) => (
            <g key={`g${i}`}>
              <line x1={i} y1={0} x2={i} y2={10} stroke="#92B1CF" strokeOpacity={0.16} strokeWidth={0.02} />
              <line x1={0} y1={10 - i} x2={10} y2={10 - i} stroke="#92B1CF" strokeOpacity={0.16} strokeWidth={0.02} />
            </g>
          ))}
        </g>

        {/* triangle (y-up) */}
        <g transform="scale(1, -1) translate(0, -10)">
          <line x1={0} y1={0} x2={a} y2={0} stroke="#ECECF1" strokeWidth={0.05} />
          <line x1={a} y1={0} x2={a} y2={b} stroke="#ECECF1" strokeWidth={0.05} />
          <line x1={0} y1={0} x2={a} y2={b} stroke="#4691CE" strokeWidth={0.07} />
          <motion.g
            animate={{ scale: dragging ? 1.03 : 1 }}
            transition={dragging ? { type: "tween", duration: 0.1 } : { type: "spring", stiffness: 300, damping: 14 }}
            style={{ cursor: active ? "grab" : "default", pointerEvents: active ? "auto" : "none", transformBox: "fill-box", transformOrigin: "50% 50%" }}
            onPointerDown={handleDown}
          >
            <circle cx={a + 0.03} cy={0.03} r={0.1} fill="rgba(0,0,0,0.25)" />
            <circle cx={a} cy={b} r={0.9} fill="transparent" />
            <circle cx={a} cy={b} r={0.22} fill="#4691CE" />
          </motion.g>
        </g>

        {/* labels */}
        <g fill="#ECECF1" fontSize={0.42} textAnchor="middle" fontFamily="Playfair Display, serif">
          <text x={labelA.x} y={labelA.y}>a</text>
          <text x={labelB.x} y={labelB.y} dominantBaseline="middle">b</text>
          <text x={labelC.x} y={labelC.y} dominantBaseline="middle" fill="#D3CAC1">c</text>
        </g>
      </svg>

      {/* readouts + live equation */}
      <div className="intro-live" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
        <div className="intro-readouts">
          <div className="readout"><span className="readout__label">a</span><span className="readout__value">{a.toFixed(2)}</span></div>
          <div className="readout"><span className="readout__label">b</span><span className="readout__value">{b.toFixed(2)}</span></div>
          <div className="readout"><span className="readout__label">c</span><span className="readout__value">{c.toFixed(2)}</span></div>
        </div>
        <div className="intro-eqpanel">
          <div className="eq-line"><Eq>a^2 + b^2 = c^2</Eq></div>
          <div className="eq-line" style={{ marginTop: "10px" }}>
            <span className="eq-num">{a.toFixed(1)}</span>
            <span className="eq-sym">²</span> +
            <span className="eq-num">{b.toFixed(1)}</span>
            <span className="eq-sym">²</span> =
            <span className="eq-num">{c.toFixed(1)}</span>
            <span className="eq-sym">²</span>
          </div>
          <div className="eq-line" style={{ fontSize: "1.05rem", marginTop: "6px" }}>
            <span className="eq-num">{(a * a).toFixed(1)}</span> +
            <span className="eq-num">{(b * b).toFixed(1)}</span> =
            <span className="eq-num">{(a * a + b * b).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClosingSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: CloseProps) {
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D
  const [showHome, setShowHome] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    setShowHome(false);
    if (beat === 0) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 900));
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 700 + 500));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 400 + 600)); // longer pause
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => setShowHome(true), 400 + 700));
    }
  }, [beat, showBack, showNext, clearTimers]);

  const handleNext = useCallback(() => {
    if (beat === 0) { showNext(false); setBeat(1); }
    else if (beat === 1) { showNext(false); setBeat(2); }
    else if (beat === 2) { showNext(false); setBeat(3); }
    // beat 3: no Next — Return to Home is the only forward action
  }, [beat, showNext]);

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
    <div className="pyth-intro pyth-close">
      {/* ── Text beats ── */}
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.div key="A" className="intro-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <p className="intro-title">Let's go back to where we started.</p>
          </motion.div>
        )}
        {beat === 1 && (
          <motion.div key="B" className="intro-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <p className="intro-prose">Our very first triangle, back at work.</p>
          </motion.div>
        )}
        {beat === 2 && (
          <motion.div key="C" className="intro-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <p className="intro-prose">
              This is what we meant at the beginning — the Pythagorean theorem isn't a formula only for triangles.
              Now you've seen why: this one relationship is also the distance between any two points on a coordinate
              plane, the relationship that describes the equation of every circle and sphere. It forms the foundation
              of geometry.
            </p>
          </motion.div>
        )}
        {beat === 3 && (
          <motion.div key="D" className="intro-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
            <p className="close-final">
              It's not a rule for triangles. It's a rule about space itself — and once you know how to see it, it
              shows up almost everywhere.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Triangle scene (beats B, C, D) — dimmed in Beat C ── */}
      {beat >= 1 && (
        <motion.div
          className="close-scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: beat === 2 ? 0.6 : 1 }}
          transition={{ duration: 0.6 }}
        >
          <TriScene active={beat !== 2} />
        </motion.div>
      )}

      {/* ── Return to Home (final beat only) ── */}
      <AnimatePresence>
        {beat === 3 && showHome && (
          <motion.div className="pyth-close-homewrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/" className="pyth-close-home" onClick={() => window.scrollTo({ top: 0 })}>
              Return to Home
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
