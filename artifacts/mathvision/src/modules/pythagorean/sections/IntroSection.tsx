import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

/** Beat A — a simple right triangle with labelled sides, shown beside the hook. */
function StaticTriangle() {
  return (
    <svg viewBox="0 0 200 200" className="intro-static" aria-hidden="true">
      <g transform="scale(1, -1) translate(0, -200)">
        <polygon
          points="20,20 120,20 120,120"
          fill="rgba(70,145,206,0.15)"
          stroke="#ECECF1"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polyline
          points="108,20 108,32 120,32"
          fill="none"
          stroke="#D3CAC1"
          strokeWidth="3"
        />
        <circle cx="120" cy="120" r="6" fill="#4691CE" />
        <circle cx="20" cy="20" r="6" fill="#ECECF1" />
        <circle cx="120" cy="20" r="6" fill="#ECECF1" />
      </g>
      <text x="70" y="182" fill="#ECECF1" fontSize="22" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="600">
        a
      </text>
      <text x="128" y="80" fill="#ECECF1" fontSize="22" dominantBaseline="middle" fontFamily="Playfair Display, serif" fontWeight="600">
        b
      </text>
      <text x="64" y="96" fill="#D3CAC1" fontSize="24" textAnchor="end" fontFamily="Playfair Display, serif" fontWeight="600">
        c
      </text>
    </svg>
  );
}

type IntroBeatProps = SectionProps;

export default function IntroSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
}: IntroBeatProps) {
  // 0 = A (hook), 1 = B (law + grid), 2 = C (interactive), 3 = D (dim + question)
  const [beat, setBeat] = useState(0);
  const [bShort, setBShort] = useState(false); // Beat B transitional line
  const [gridFade, setGridFade] = useState(0); // 0..1 stage opacity
  const [cStep, setCStep] = useState(0); // Beat C reveal timeline
  const [revealReady, setRevealReady] = useState(false); // 4s fallback for Beat C

  // interactive triangle
  const [point, setPoint] = useState({ x: 3, y: 4 });
  const [dragging, setDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const movedRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── Enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    setCStep(0);
    setRevealReady(false);
    setHasDragged(false);
    movedRef.current = false;
    setBShort(false);

    if (beat === 0) {
      showBack(false);
      showNext(false);
      setGridFade(0);
      const t = setTimeout(() => showNext(true), 600 + 400);
      timersRef.current.push(t);
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      setGridFade(0);
      requestAnimationFrame(() => setGridFade(1));
      const t = setTimeout(() => showNext(true), 600 + 400);
      timersRef.current.push(t);
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      setGridFade(1);
      setPoint({ x: 3, y: 4 });
      // reveal timeline
      timersRef.current.push(
        setTimeout(() => setCStep(1), 450),
        setTimeout(() => setCStep(2), 900),
        setTimeout(() => setCStep(3), 1350),
        setTimeout(() => setCStep(4), 1950),
        setTimeout(() => setCStep(5), 2900),
      );
      // 4 second fallback so the beat is never a dead end
      timersRef.current.push(setTimeout(() => setRevealReady(true), 4000));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      setGridFade(0.5);
      setDragging(false);
      const t = setTimeout(() => showNext(true), 600 + 400);
      timersRef.current.push(t);
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat C: Next may appear once the user has dragged, OR after the fallback.
  useEffect(() => {
    if (beat === 2 && (hasDragged || revealReady)) showNext(true);
  }, [beat, hasDragged, revealReady, showNext]);

  // ── Pointer drag for the triangle ──
  const updateFromEvent = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * 10;
    const rawY = 10 - ((clientY - rect.top) / rect.height) * 10;
    const nx = Math.max(0.5, Math.min(10, Math.round(rawX * 10) / 10));
    const ny = Math.max(0.5, Math.min(8, Math.round(rawY * 10) / 10));
    setPoint({ x: nx, y: ny });
    if (!movedRef.current) {
      movedRef.current = true;
      setHasDragged(true);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (beat !== 2 || !dragging) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [beat, dragging, updateFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (beat !== 2) return;
      e.preventDefault();
      svgRef.current?.setPointerCapture?.(e.pointerId);
      setDragging(true);
    },
    [beat],
  );

  // ── Navigation handlers (registered with the frame) ──
  const handleNext = useCallback(() => {
    if (beat === 0) {
      showNext(false);
      setBeat(1);
    } else if (beat === 1) {
      if (!bShort) {
        // reveal the short transitional line, then roll into Beat C
        setBShort(true);
        showNext(false);
        timersRef.current.push(
          setTimeout(() => {
            setBShort(false);
            setBeat(2);
          }, 1400),
        );
      }
    } else if (beat === 2) {
      showNext(false);
      setDragging(false);
      setBeat(3);
    } else if (beat === 3) {
      showNext(false);
      advanceSection();
    }
  }, [beat, bShort, showNext, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 1) {
      showNext(false);
      setBeat(0);
    } else if (beat === 2) {
      showNext(false);
      setDragging(false);
      setBeat(1);
    } else if (beat === 3) {
      showNext(false);
      setBeat(2);
    }
  }, [beat, showNext]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  // ── Live values ──
  const a = point.x;
  const b = point.y;
  const c = Math.sqrt(a * a + b * b);

  // label positions (svg coords, y-down) — origin at bottom-left of a 10x10 box
  const labelA = { x: a / 2, y: 10 - 0.45 };
  const labelB = { x: a + 0.4, y: 10 - b / 2 };
  const labelC = { x: a / 2 - 0.45, y: 10 - b / 2 };

  const showDiagram = beat >= 1;

  return (
    <div className="pyth-intro">
      {/* ── Text beats (A, B, D) — cross-faded ── */}
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.div
            key="A"
            className="intro-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <StaticTriangle />
            <p className="intro-title intro-title--hook">
              You were told that <Eq>a^2 + b^2 = c^2</Eq> is a triangle
              formula.{" "}
              <span className="intro-accent">You were lied to.</span>
            </p>
          </motion.div>
        )}

        {beat === 1 && (
          <motion.div
            key="B"
            className="intro-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {bShort ? (
              <p className="intro-prose">
                First, let's get a feel for the theorem.
              </p>
            ) : (
              <p className="intro-prose">
                The Pythagorean theorem isn't just a formula to plug numbers
                into for a test. It's a fundamental law of geometry and space
                itself — and by the end of this module, you'll see it hiding
                inside things that have nothing to do with triangles.
              </p>
            )}
          </motion.div>
        )}

        {beat === 3 && (
          <motion.div
            key="D"
            className="intro-center"
            style={{ position: "relative", zIndex: 2 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <p className="intro-title" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
              But how did we discover this law? And how far does it really
              reach?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Diagram stage: grid from B; triangle+point from C ── */}
      {showDiagram && (
        <div
          className="intro-stage"
          style={{
            opacity: gridFade,
            transition: "opacity 0.5s ease",
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 10 10"
            className="intro-svg"
            style={{ cursor: beat === 2 ? (dragging ? "grabbing" : "grab") : "default" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* coordinate grid */}
            <g>
              {Array.from({ length: 11 }, (_, i) => (
                <g key={`g${i}`}>
                  <line
                    x1={i}
                    y1={0}
                    x2={i}
                    y2={10}
                    stroke="#92B1CF"
                    strokeOpacity={0.16}
                    strokeWidth={0.02}
                  />
                  <line
                    x1={0}
                    y1={10 - i}
                    x2={10}
                    y2={10 - i}
                    stroke="#92B1CF"
                    strokeOpacity={0.16}
                    strokeWidth={0.02}
                  />
                </g>
              ))}
            </g>

            {/* triangle (y-up) */}
            {beat >= 2 && (
              <g transform="scale(1, -1) translate(0, -10)">
                <motion.line
                  x1={0}
                  y1={0}
                  x2={a}
                  y2={0}
                  stroke="#ECECF1"
                  strokeWidth={0.05}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: cStep >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                <motion.line
                  x1={a}
                  y1={0}
                  x2={a}
                  y2={b}
                  stroke="#ECECF1"
                  strokeWidth={0.05}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: cStep >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                <motion.line
                  x1={0}
                  y1={0}
                  x2={a}
                  y2={b}
                  stroke="#4691CE"
                  strokeWidth={0.07}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: cStep >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />

                {/* draggable vertex */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: dragging ? 1.03 : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.4 },
                    scale: dragging
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 300, damping: 14 },
                  }}
                  onPointerDown={handlePointerDown}
                  style={{
                    cursor: beat === 2 ? "grab" : "default",
                    pointerEvents: beat === 2 ? "auto" : "none",
                  }}
                >
                  <ellipse
                    cx={a + 0.03}
                    cy={0.03}
                    rx={0.16}
                    ry={0.1}
                    fill="rgba(0,0,0,0.25)"
                  />
                  <circle cx={a} cy={b} r={0.9} fill="transparent" />
                  <circle cx={a} cy={b} r={0.22} fill="#4691CE" />
                </motion.g>
              </g>
            )}

            {/* labels (svg y-down) */}
            {beat >= 2 && cStep >= 2 && (
              <g fill="#ECECF1" fontSize={0.42} textAnchor="middle">
                <text x={labelA.x} y={labelA.y}>
                  a
                </text>
                <text x={labelB.x} y={labelB.y} dominantBaseline="middle">
                  b
                </text>
                <text x={labelC.x} y={labelC.y} dominantBaseline="middle">
                  c
                </text>
              </g>
            )}
          </svg>

          {/* Beat C: readouts + live equation + prompt */}
          {beat === 2 && (
            <AnimatePresence>
              {cStep >= 3 && (
                <motion.div
                  key="panels"
                  className="intro-live"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "18px",
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="intro-readouts">
                    <div className="readout">
                      <span className="readout__label">a</span>
                      <span className="readout__value">{a.toFixed(2)}</span>
                    </div>
                    <div className="readout">
                      <span className="readout__label">b</span>
                      <span className="readout__value">{b.toFixed(2)}</span>
                    </div>
                    <div className="readout">
                      <span className="readout__label">c</span>
                      <span className="readout__value">{c.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="intro-eqpanel">
                    <div className="eq-line">
                      <Eq displayMode={false}>a^2 + b^2 = c^2</Eq>
                    </div>
                    <div className="eq-line" style={{ marginTop: "10px" }}>
                      <span className="eq-num">{a.toFixed(1)}</span>
                      <span className="eq-sym">²</span> +
                      <span className="eq-num">{b.toFixed(1)}</span>
                      <span className="eq-sym">²</span> =
                      <span className="eq-num">{c.toFixed(1)}</span>
                      <span className="eq-sym">²</span>
                    </div>
                    <div
                      className="eq-line"
                      style={{ fontSize: "1.05rem", marginTop: "6px" }}
                    >
                      <span className="eq-num">{(a * a).toFixed(1)}</span> +
                      <span className="eq-num">{(b * b).toFixed(1)}</span> =
                      <span className="eq-num">{(a * a + b * b).toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Beat C prompts */}
          {beat === 2 && cStep >= 4 && (
            <motion.div
              key="prompt"
              className="intro-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Try to break it. Drag the point anywhere — see if you can make
              this equation false.
            </motion.div>
          )}
          {beat === 2 && cStep >= 5 && (
            <motion.div
              key="reveal"
              className="intro-reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              You can't.
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}