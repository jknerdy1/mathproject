import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";
import { projectRotated, type Vec3 } from "../box3d";

/* ───────────────────────── Geometry ─────────────────────────
   A translucent wireframe sphere of fixed radius SPHERE_R centered
   at C, plus a draggable surface point. The surface point sits at
   distance `dist` from the center; dist is free in Beat A and locked
   to SPHERE_R from Beat B onward. Center C is draggable in A/B, then
   fixed (symbolically (3,4,5)). Drag empty space to rotate the view.
   viewBox "-3 -3 6 6"; geometry is projected via box3d. */
const VB = { minX: -3, minY: -3, w: 6, h: 6 };
const SPHERE_R = 1.7;
const VIEW0 = 0.4;
const CENTER_LOCK: Vec3 = { x: 0.15, y: 0.05, z: 0.1 };

const MERIDIAN_LONS = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const RING_LATS = [-0.7, -0.4, 0, 0.4, 0.7];

const polyline = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

type DragMode = "center" | "surface" | "rotate";
type SphereProps = SectionProps;

export default function SphereSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: SphereProps) {
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D 4:E 5:F
  const [view, setView] = useState(VIEW0);
  const [C, setC] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [az, setAz] = useState(0.6);
  const [el, setEl] = useState(0.25);
  const [dist, setDist] = useState(SPHERE_R);
  const [cSub, setCSub] = useState(0); // beat C subscript-drop sub-state
  const [bPhase, setBPhase] = useState(0);
  const [dPhase, setDPhase] = useState(0);
  const [interacted, setInteracted] = useState(false);

  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startView: number;
    startC: Vec3;
    startAz: number;
    startEl: number;
    startDist: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cRef = useRef(C);
  cRef.current = C;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // surface point world position
  const dir = { x: Math.cos(el) * Math.cos(az), y: Math.sin(el), z: Math.cos(el) * Math.sin(az) };
  const S: Vec3 = { x: C.x + dist * dir.x, y: C.y + dist * dir.y, z: C.z + dist * dir.z };
  const pc = projectRotated(C, view);
  const ps = projectRotated(S, view);
  const radiusMid = { x: (pc.x + ps.x) / 2, y: (pc.y + ps.y) / 2 };

  // sphere wireframe (meridians + latitude rings), all projected
  const wire = useMemo(() => {
    const pr = (p: Vec3) => projectRotated(p, view);
    const meridians = MERIDIAN_LONS.map((lon) => {
      const pts: { x: number; y: number }[] = [];
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const la = -Math.PI / 2 + (Math.PI * i) / N;
        pts.push(pr({ x: C.x + SPHERE_R * Math.cos(la) * Math.cos(lon), y: C.y + SPHERE_R * Math.sin(la), z: C.z + SPHERE_R * Math.cos(la) * Math.sin(lon) }));
      }
      return pts;
    });
    const rings = RING_LATS.map((lat) => {
      const pts: { x: number; y: number }[] = [];
      const N = 36;
      for (let i = 0; i < N; i++) {
        const lon = (2 * Math.PI * i) / N;
        pts.push(pr({ x: C.x + SPHERE_R * Math.cos(lat) * Math.cos(lon), y: C.y + SPHERE_R * Math.sin(lat), z: C.z + SPHERE_R * Math.cos(lat) * Math.sin(lon) }));
      }
      return pts;
    });
    return { meridians, rings };
  }, [view, C]);

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    dragRef.current = null;
    if (beat === 0) {
      showBack(true);
      showNext(false);
      setC({ x: 0, y: 0, z: 0 });
      setAz(0.6);
      setEl(0.25);
      setDist(SPHERE_R);
      setInteracted(false);
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      setDist(SPHERE_R); // lock radius
      setBPhase(0);
      timersRef.current.push(setTimeout(() => setBPhase(1), 1900));
      timersRef.current.push(setTimeout(() => showNext(true), 1900 + 500));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      setCSub(0);
      const start = { ...cRef.current };
      const controls = animate(start, CENTER_LOCK, {
        duration: 0.5,
        ease: "easeOut",
        onUpdate: (v) => setC({ x: v.x, y: v.y, z: v.z }),
      });
      timersRef.current.push(setTimeout(() => { controls.stop(); setC(CENTER_LOCK); }, 600));
      timersRef.current.push(setTimeout(() => setCSub(1), 1500));
      timersRef.current.push(setTimeout(() => showNext(true), 1500 + 600 + 400));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      setDPhase(0);
      timersRef.current.push(setTimeout(() => setDPhase(1), 1600));
      timersRef.current.push(setTimeout(() => showNext(true), 1600 + 500));
    } else if (beat === 4) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 300 * 3 + 500 + 300));
    } else if (beat === 5) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1000));
    }
  }, [beat, showBack, showNext, clearTimers]);

  // Beat A: Next gated on interaction-or-4s fallback
  useEffect(() => {
    if (beat !== 0) return;
    if (interacted) {
      showNext(true);
      return;
    }
    const t = setTimeout(() => showNext(true), 4000);
    return () => clearTimeout(t);
  }, [beat, interacted, showNext]);

  // ── dragging / rotating ──
  const sceneFromClient = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: VB.minX + ((clientX - rect.left) / rect.width) * VB.w,
      y: VB.minY + ((clientY - rect.top) / rect.height) * VB.h,
    };
  }, []);

  const hit = (p: { x: number; y: number }, t: { x: number; y: number }) => Math.hypot(p.x - t.x, p.y - t.y);

  const beginDrag = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      const p = sceneFromClient(e.clientX, e.clientY);
      let mode: DragMode = "rotate";
      const centerDraggable = beat <= 1;
      if (centerDraggable && hit(p, pc) <= 0.5) mode = "center";
      else if (hit(p, ps) <= 0.5) mode = "surface";
      svgRef.current?.setPointerCapture?.(e.pointerId);
      dragRef.current = { mode, startX: p.x, startY: p.y, startView: view, startC: { ...C }, startAz: az, startEl: el, startDist: dist };
    },
    [beat, sceneFromClient, pc, ps, view, C, az, el, dist],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current) return;
      const p = sceneFromClient(e.clientX, e.clientY);
      const d = dragRef.current;
      const dx = p.x - d.startX;
      const dy = p.y - d.startY;
      if (d.mode === "rotate") {
        setView(d.startView + dx * 0.6);
      } else if (d.mode === "center") {
        setC({ x: d.startC.x + dx, y: d.startC.y + dy, z: d.startC.z });
      } else {
        setAz(d.startAz + dx * 0.4);
        setEl(Math.max(-1.2, Math.min(1.2, d.startEl + dy * 0.4)));
        if (beat === 0) {
          setDist(Math.max(0.5, Math.min(2.4, d.startDist + dy * 0.25)));
        }
      }
      setInteracted(true);
    },
    [beat, sceneFromClient],
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
    else if (beat === 4) { showNext(false); setBeat(5); }
    else if (beat === 5) { showNext(false); advanceSection(); }
  }, [beat, showNext, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 0) { showNext(false); backSection(); }
    else if (beat === 1) { showNext(false); setBeat(0); }
    else if (beat === 2) { showNext(false); setBeat(1); }
    else if (beat === 3) { showNext(false); setBeat(2); }
    else if (beat === 4) { showNext(false); setBeat(3); }
    else if (beat === 5) { showNext(false); setBeat(4); }
  }, [beat, showNext, backSection]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  // current on-screen equation
  const eqMath = useMemo(() => {
    if (beat >= 4) return "(x - h)^2 + (y - k)^2 + (z - l)^2 = r^2";
    if (beat === 3) return dPhase === 0
      ? "5 = \\sqrt{(x-3)^2 + (y-4)^2 + (z-5)^2}"
      : "5^2 = (x - 3)^2 + (y - 4)^2 + (z - 5)^2";
    if (beat === 2) return "5 = \\sqrt{(x-3)^2 + (y-4)^2 + (z-5)^2}";
    if (beat === 1) return bPhase === 0
      ? "d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}"
      : "5 = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}";
    return "d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}";
  }, [beat, bPhase, dPhase]);

  const eqKey = `${beat}-${bPhase}-${dPhase}`;

  const centerLabel = beat <= 1 ? "(x\u2081, y\u2081, z\u2081)" : "(3, 4, 5)";
  const surfLabel = beat >= 2 && cSub >= 1 ? "(x, y, z)" : "(x\u2082, y\u2082, z\u2082)";
  const radiusLabel = beat >= 5 ? "r" : "5";

  return (
    <div className="pyth-sphere">
      <div className="sp-content">
        {/* ── Text ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="sp-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="sp-title">
                And since we already extended distance into 3D, we can do the exact same thing here. A sphere is just
                every point a fixed distance from a center point in 3D space. If we take the 3D distance formula we
                derived earlier:
              </p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="sp-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="sp-prose">
                ...and fix the distance, <Eq>d</Eq>, to any arbitrary value — let's say 5.
              </p>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="sp-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="sp-prose">
                Now let's fix the center point to any arbitrary point — say, <Eq>(3, 4, 5)</Eq>.
              </p>
              <AnimatePresence>
                {cSub >= 1 && (
                  <motion.p key="C2" className="sp-prose" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    Since this applies to any point on the sphere, we can drop the subscript and just call it{" "}
                    <Eq>(x, y, z)</Eq>.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="D" className="sp-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="sp-prose">Squaring both sides removes the square root:</p>
            </motion.div>
          )}
          {beat === 4 && (
            <motion.div key="E" className="sp-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="sp-prose">
                Generalizing to any center <Eq>(h, k, l)</Eq> and radius <Eq>r</Eq> gives the standard sphere
                equation:{" "}
              </p>
              <p className="sp-prose sp-prose--muted">
                It's just the 3D distance formula with a fixed radius — the exact same move we made for circles, one
                dimension up.
              </p>
            </motion.div>
          )}
          {beat === 5 && (
            <motion.div key="F" className="sp-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="sp-closing">Same law. One more dimension.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sphere stage ── */}
        <div className="sp-stage" style={{ cursor: "grab" }}>
          <svg
            ref={svgRef}
            viewBox={`${VB.minX} ${VB.minY} ${VB.w} ${VB.h}`}
            className="sp-svg"
            onPointerDown={beginDrag}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* wireframe sphere (meridians + rings) */}
            <g opacity={0.55}>
              {wire.rings.map((r, i) => (
                <polyline key={`ring${i}`} points={polyline(r)} fill="none" stroke="#92B1CF" strokeWidth={0.04} />
              ))}
              {wire.meridians.map((m, i) => (
                <polyline key={`mer${i}`} points={polyline(m)} fill="none" stroke="#92B1CF" strokeWidth={0.04} />
              ))}
            </g>

            {/* radius line */}
            <motion.line
              x1={pc.x} y1={pc.y} x2={ps.x} y2={ps.y}
              stroke="#4691CE" strokeWidth={0.06}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            />
            {/* radius label */}
            <motion.text
              x={radiusMid.x + 0.15} y={radiusMid.y - 0.25} fill="#4691CE" fontSize={0.3} textAnchor="start" fontFamily="Playfair Display, serif"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: beat <= 1 ? 1.8 : 0.4 }}
            >
              {radiusLabel}
            </motion.text>

            {/* center point */}
            <motion.g
              animate={{ scale: 1 }}
              style={{ cursor: centerDraggable ? "grab" : "default", pointerEvents: "none", transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              <circle cx={pc.x} cy={pc.y} r={0.18} fill="#4691CE" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
            </motion.g>
            {/* surface point (draggable) */}
            <motion.g
              animate={{ scale: 1 }}
              style={{ cursor: "grab", transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              <circle cx={ps.x} cy={ps.y} r={0.5} fill="transparent" />
              <circle cx={ps.x} cy={ps.y} r={0.18} fill="#4691CE" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
            </motion.g>

            {/* labels */}
            <motion.text
              x={pc.x - 0.35} y={pc.y + 0.55} fill="#ECECF1" fontSize={0.26} textAnchor="end" fontFamily="Playfair Display, serif"
              animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.3 }}
            >
              {centerLabel}
            </motion.text>
            <motion.text
              x={ps.x + 0.35} y={ps.y - 0.4} fill="#ECECF1" fontSize={0.26} textAnchor="start" fontFamily="Playfair Display, serif"
              animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.3 }}
            >
              {surfLabel}
            </motion.text>
          </svg>
        </div>

        {/* ── Equation readout ── */}
        <div className="sp-eq">
          <AnimatePresence mode="wait">
            <motion.div
              key={eqKey}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06 }}
              transition={{ duration: 0.35 }}
            >
              <Eq displayMode math={eqMath} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Beat E: comparison to circle equation + brackets ── */}
        {beat >= 4 && (
          <motion.div key="compare" className="sp-compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="sp-brackets">
              <Bracket d={0} />
              <Bracket d={0.3} />
              <Bracket d={0.6} />
            </div>
            <div className="sp-line sp-line--dim"><Eq displayMode math="(x-h)^2 + (y-k)^2 = r^2" /></div>
            <div className="sp-new"><span className="sp-new-tag">new</span></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** A small bracket connector used to align the sphere & circle equations. */
function Bracket({ d }: { d: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width="16" height="30" viewBox="0 0 16 30" className="sp-bracket" aria-hidden="true">
      <motion.path
        d="M 8 1 L 8 29 M 2 1 L 14 1 M 2 29 L 14 29"
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
