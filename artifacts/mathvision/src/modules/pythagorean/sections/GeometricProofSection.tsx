import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";
import { Slider } from "@/components/ui/slider";

/* ───────────────────────── Geometry ─────────────────────────
   A right triangle with legs a, b and hypotenuse c. Four copies
   form the pinwheel (big square side a+b, empty tilted c² square).
   Rearranged, the same four triangles form two squares a² and b²
   in opposite corners of the same (a+b) boundary.
   Single-scene uses viewBox "-1.5 -1.5 10 10".
   Two-square scene uses viewBox "-1 -1 18 9.5", right square at x+9. */
const AX = 3;
const BX = 4;
const S = AX + BX;
const CC = Math.sqrt(AX * AX + BX * BX);
const RX9 = 9; // right square x-offset
const SINGLE_VB = { minX: -1.5, minY: -1.5, w: 10, h: 10 };
const TWO_VB = { minX: -1, minY: -1, w: 18, h: 9.5 };
const SNAP_DIST = 1.2;
const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");

// ── single (3a) scene ──
const BL = [[0, 0], [AX, 0], [0, BX]];
const BR = [[S, 0], [AX, 0], [S, AX]];
const TR = [[S, S], [BX, S], [S, AX]];
const TL = [[0, S], [0, BX], [BX, S]];
const TRI_FINAL = { BL, BR, TR, TL };
const centroids: Record<string, [number, number]> = {
  BL: [AX / 3, BX / 3],
  BR: [(2 * S + AX) / 3, AX / 3],
  TR: [(2 * S + BX) / 3, (2 * S + AX) / 3],
  TL: [BX / 3, (2 * S + BX) / 3],
};
const CENTER_SQ = [[AX, 0], [S, AX], [BX, S], [0, BX]];
const BIG_SQ = [[0, 0], [S, 0], [S, S], [0, S]];
const ANGLE_LABELS = [
  { x: AX, y: 0.55 },
  { x: S - 0.55, y: AX },
  { x: BX, y: S - 0.55 },
  { x: 0.55, y: BX },
];

// ── two-square (3b) scene ──
const LBIG = [[0, 0], [S, 0], [S, S], [0, S]];
const LTRI = {
  BL: [[0, 0], [AX, 0], [0, BX]],
  BR: [[S, 0], [AX, 0], [S, AX]],
  TR: [[S, S], [BX, S], [S, AX]],
  TL: [[0, S], [0, BX], [BX, S]],
};
const LCENTER = [[AX, 0], [S, AX], [BX, S], [0, BX]];

const RBIG = [[RX9, 0], [RX9 + S, 0], [RX9 + S, S], [RX9, S]];
const R_PIN = {
  BL: [[RX9, 0], [RX9 + AX, 0], [RX9, BX]],
  BR: [[RX9 + S, 0], [RX9 + AX, 0], [RX9 + S, AX]],
  TR: [[RX9 + S, S], [RX9 + BX, S], [RX9 + S, AX]],
  TL: [[RX9, S], [RX9, BX], [RX9 + BX, S]],
};
const R_CENTER = [[RX9 + AX, 0], [RX9 + S, AX], [RX9 + BX, S], [RX9, BX]];
const R_A2 = [[RX9, 0], [RX9 + AX, 0], [RX9 + AX, BX], [RX9, BX]];
const R_B2 = [[RX9 + AX, BX], [RX9 + S, BX], [RX9 + S, S], [RX9 + AX, S]];

interface Zone {
  pts: number[][];
  centroid: [number, number];
}
const ZONES: Record<string, Zone> = {
  BR1: { pts: [[RX9 + AX, 0], [RX9 + S, 0], [RX9 + S, AX]], centroid: [RX9 + (AX + S + S) / 3, AX / 3] },
  BR2: { pts: [[RX9 + AX, 0], [RX9 + S, AX], [RX9 + AX, AX]], centroid: [RX9 + (AX + S + AX) / 3, (AX + AX) / 3] },
  TL1: { pts: [[RX9, AX], [RX9 + AX, AX], [RX9 + AX, S]], centroid: [RX9 + (0 + AX + AX) / 3, (AX + AX + S) / 3] },
  TL2: { pts: [[RX9, AX], [RX9 + AX, S], [RX9, S]], centroid: [RX9 + AX / 3, (AX + S + S) / 3] },
};

const RIGHT_DRAG = [
  { id: "BL", pts: R_PIN.BL, zone: "BR1", centroid: [RX9 + AX / 3, BX / 3] as [number, number] },
  { id: "BR", pts: R_PIN.BR, zone: "BR2", centroid: [RX9 + (S + AX + S) / 3, AX / 3] as [number, number] },
  { id: "TR", pts: R_PIN.TR, zone: "TL2", centroid: [RX9 + (S + BX + S) / 3, (S + S + AX) / 3] as [number, number] },
  { id: "TL", pts: R_PIN.TL, zone: "TL1", centroid: [RX9 + BX / 3, (S + BX + S) / 3] as [number, number] },
];

const triStyle = { fill: "rgba(29,82,172,0.10)", stroke: "#1D52AC", strokeWidth: 0.14 };

function SingleTriangle() {
  const gx = S / 2 - AX / 3;
  const gy = S / 2 - BX / 3;
  return (
    <g transform={`translate(${gx} ${gy})`}>
      <polygon points={poly(BL)} fill="rgba(29,82,172,0.08)" stroke="#1D52AC" strokeWidth={0.16} strokeLinejoin="round" />
      <text x={AX / 2} y={0.42} fill="#143371" fontSize={0.42} textAnchor="middle" fontFamily="Playfair Display, serif">a</text>
      <text x={0.4} y={BX / 2} fill="#143371" fontSize={0.42} dominantBaseline="middle" fontFamily="Playfair Display, serif">b</text>
      <text x={AX / 2 - 0.42} y={BX / 2} fill="#4691CE" fontSize={0.46} dominantBaseline="middle" textAnchor="end" fontFamily="Playfair Display, serif">c</text>
    </g>
  );
}

type GeoProps = SectionProps;

export default function GeometricProofSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: GeoProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0); // 0..4 (A..E)

  // Beat D
  const [filled, setFilled] = useState<Partial<Record<string, string>>>({});
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTile, setDraggingTile] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [showDragText, setShowDragText] = useState(false);
  const [placeLabels, setPlaceLabels] = useState(false);
  const [showDText2, setShowDText2] = useState(false);
  const [pulsed, setPulsed] = useState(false);
  const completedRef = useRef(false);
  const dragRef = useRef<{ id: string; startX: number; startY: number; pX: number; pY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Beat E
  const [slideT, setSlideT] = useState(1);
  const [sliderTouched, setSliderTouched] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const resetRight = useCallback(() => {
    setFilled({});
    setOffsets({});
    setHoverZone(null);
    completedRef.current = false;
    setPlaceLabels(false);
    setShowDText2(false);
    setPulsed(false);
  }, []);

  // ── beat 0..2 (3a) timing ──
  useEffect(() => {
    if (beat <= 2) {
      clearTimers();
      if (beat === 0) {
        showBack(true); showNext(false);
        timersRef.current.push(setTimeout(() => showNext(true), 500 + 400));
      } else if (beat === 1) {
        showBack(true); showNext(false);
        timersRef.current.push(setTimeout(() => showNext(true), 700 + 600 + 400));
      } else {
        showBack(true); showNext(false);
        timersRef.current.push(setTimeout(() => showNext(true), 1000));
      }
    }
  }, [beat, showBack, showNext, clearTimers]);

  // ── Beat D completion ──
  const filledCount = Object.keys(filled).length;
  useEffect(() => {
    if (beat === 3 && filledCount === 4 && !completedRef.current) {
      completedRef.current = true;
      setPlaceLabels(true);
      setPulsed(true);
      timersRef.current.push(
        setTimeout(() => {
          setShowDText2(true);
          timersRef.current.push(setTimeout(() => showNext(true), 400 + 400));
        }, 800),
      );
    }
  }, [beat, filledCount, showNext]);

  // ── navigation ──
  const enterD = useCallback(() => {
    setBeat(3);
    resetRight();
    setShowDragText(true);
    showBack(true);
    showNext(false);
  }, [resetRight, showBack, showNext]);

  const enterE = useCallback(() => {
    setBeat(4);
    setSlideT(1);
    setSliderTouched(false);
    showBack(true);
    showNext(false);
  }, [showBack, showNext]);

  // Beat E: Next appears after the slider is touched, or after 4s.
  useEffect(() => {
    if (beat !== 4 || sliderTouched) return;
    const t = setTimeout(() => showNext(true), 4000);
    return () => clearTimeout(t);
  }, [beat, sliderTouched, showNext]);

  const enterDCompleted = useCallback(() => {
    setBeat(3);
    setSlideT(1);
    setShowDragText(false);
    setPlaceLabels(true);
    setShowDText2(true);
    showBack(true);
    showNext(true);
  }, [showBack, showNext]);

  const handleNext = useCallback(() => {
    if (beat === 0) { showNext(false); setBeat(1); }
    else if (beat === 1) { showNext(false); setBeat(2); }
    else if (beat === 2) { showNext(false); enterD(); }
    else if (beat === 3) { showNext(false); enterE(); }
    else if (beat === 4) { showNext(false); advanceSection(); }
  }, [beat, showNext, enterD, enterE, advanceSection]);

  const handleBack = useCallback(() => {
    if (beat === 0) { showNext(false); backSection(); }
    else if (beat === 1) { showNext(false); setBeat(0); }
    else if (beat === 2) { showNext(false); setBeat(1); }
    else if (beat === 3) { showNext(false); setBeat(2); }
    else if (beat === 4) { showNext(false); enterDCompleted(); }
  }, [beat, showNext, backSection, enterDCompleted]);

  useEffect(() => {
    registerNav({ onNext: handleNext, onBack: handleBack });
  }, [registerNav, handleNext, handleBack]);

  // ── Beat D drag ──
  const sceneFromClient = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: TWO_VB.minX + ((clientX - rect.left) / rect.width) * TWO_VB.w,
      y: TWO_VB.minY + ((clientY - rect.top) / rect.height) * TWO_VB.h,
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
      const t = RIGHT_DRAG.find((d) => d.id === id);
      if (!t) return;
      const relX = t.centroid[0] + nx;
      const relY = t.centroid[1] + ny;
      const zc = ZONES[t.zone].centroid;
      setHoverZone(Math.hypot(relX - zc[0], relY - zc[1]) <= SNAP_DIST ? t.zone : null);
    },
    [beat, sceneFromClient],
  );

  const handlePointerUp = useCallback(() => {
    if (beat !== 3 || !dragRef.current) return;
    const { id } = dragRef.current;
    const t = RIGHT_DRAG.find((d) => d.id === id);
    if (t && !filled[t.zone]) {
      const cur = offsets[id] ?? { x: 0, y: 0 };
      const relX = t.centroid[0] + cur.x;
      const relY = t.centroid[1] + cur.y;
      const zc = ZONES[t.zone].centroid;
      if (Math.hypot(relX - zc[0], relY - zc[1]) <= SNAP_DIST) {
        setFilled((prev) => ({ ...prev, [t.zone]: "filled" }));
      }
      setOffsets((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
    }
    dragRef.current = null;
    setDraggingTile(null);
    setHoverZone(null);
  }, [beat, offsets, filled]);

  const viewBox = beat <= 2 ? `${SINGLE_VB.minX} ${SINGLE_VB.minY} ${SINGLE_VB.w} ${SINGLE_VB.h}` : `${TWO_VB.minX} ${TWO_VB.minY} ${TWO_VB.w} ${TWO_VB.h}`;

  // Beats 0..2 text
  const beatText: [number, string][] = [
    [0, "Counting tiles is neat, but how do we prove this law holds for a triangle of any proportions?"],
    [1, "Notice how these four triangles fit perfectly inside a square boundary, leaving an empty tilted square in the middle."],
    [2, "Since it's a square, the empty space in the center has an area of "],
  ];

  return (
    <div className="pyth-geo">
      <div className="geo-content">
        <AnimatePresence mode="wait">
          {beat <= 2 && (
            <motion.div key={String(beat)} className="geo-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="geo-title">
                {beat === 2 ? (
                  <>
                    Since it's a square, the empty space in the center has an area of <Eq>c^2</Eq>.
                  </>
                ) : (
                  beatText[beat][1]
                )}
              </p>
            </motion.div>
          )}

          {beat === 3 && showDragText && (
            <motion.div key="D" className="geo-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="geo-title">Drag these four triangles into their new positions.</p>
            </motion.div>
          )}

          {beat === 4 && (
            <motion.div key="Ehold" className="geo-text" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
              <p className="geo-title" style={{ display: "none" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scene ── */}
        <div className="geo-stage">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className="geo-svg"
            style={beat >= 4 ? { transform: `scale(${slideT})`, transformOrigin: "center" } : undefined}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {beat <= 2 && (
              <>
                {beat === 0 && (
                  <motion.g initial={{ x: -2.2, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
                    <SingleTriangle />
                  </motion.g>
                )}
                {beat >= 1 && (
                  <>
                    <polygon points={poly(BIG_SQ)} fill="none" stroke="#92B1CF" strokeWidth={0.12} strokeDasharray="0.5 0.25" />
                    {Object.entries(TRI_FINAL).map(([key, pts], i) => {
                      const c = centroids[key];
                      return (
                        <motion.g key={key} initial={{ x: S / 2 - c[0], y: S / 2 - c[1], rotate: 150 - i * 80, opacity: 0.001 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
                          <polygon points={poly(pts)} fill="rgba(29,82,172,0.08)" stroke="#1D52AC" strokeWidth={0.16} strokeLinejoin="round" />
                        </motion.g>
                      );
                    })}
                    <polygon points={poly(CENTER_SQ)} fill="#ECECF1" stroke="#143371" strokeWidth={0.16} strokeLinejoin="round" />
                    {beat === 1 &&
                      ANGLE_LABELS.map((p, i) => (
                        <motion.text key={i} x={p.x} y={p.y} fill="#143371" fontSize={0.4} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }}>
                          90°
                        </motion.text>
                      ))}
                    {beat === 2 && (
                      <motion.text x={S / 2} y={S / 2} fill="#143371" fontSize={0.8} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                        c²
                      </motion.text>
                    )}
                  </>
                )}
              </>
            )}

            {beat >= 3 && (
              <>
                {/* left: frozen pinwheel reference */}
                <motion.g initial={{ x: -1.5, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
                  <polygon points={poly(LBIG)} fill="none" stroke="#143371" strokeWidth={0.16} />
                  {Object.values(LTRI).map((pts, i) => (
                    <polygon key={i} points={poly(pts)} {...triStyle} strokeLinejoin="round" />
                  ))}
                  <polygon points={poly(LCENTER)} fill="#ECECF1" stroke="#143371" strokeWidth={0.16} strokeLinejoin="round" />
                  <text x={S / 2} y={S / 2} fill="#143371" fontSize={beat === 4 ? 0.5 : 0.7} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif">
                    {beat === 4 ? `c² = ${((CC * slideT) ** 2).toFixed(1)}` : "c²"}
                  </text>
                </motion.g>

                {/* right: interactive (Beat D) / rearranged (Beat E) */}
                <motion.g initial={{ x: 1.5, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
                  <polygon points={poly(RBIG)} fill="none" stroke="#143371" strokeWidth={0.16} />

                  {/* goal zones */}
                  {Object.entries(ZONES).map(([zk, zn]) => {
                    const isFilled = !!filled[zk];
                    const isHover = hoverZone === zk;
                    return (
                      <polygon
                        key={zk}
                        points={poly(zn.pts)}
                        fill={isFilled ? "rgba(29,82,172,0.12)" : isHover ? "rgba(70,145,206,0.2)" : "rgba(70,145,206,0.05)"}
                        stroke={isFilled ? "#1D52AC" : "#4691CE"}
                        strokeOpacity={isFilled ? 1 : isHover ? 0.6 : 0.3}
                        strokeWidth={0.12}
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {/* right center c² (until a triangle is disturbed) */}
                  {beat === 3 && filledCount === 0 && !draggingTile && (
                    <polygon points={poly(R_CENTER)} fill="#ECECF1" stroke="#143371" strokeWidth={0.14} strokeLinejoin="round" />
                  )}

                  {/* draggable triangles (Beat D) */}
                  {beat === 3 &&
                    RIGHT_DRAG.map((t) => {
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
                          <polygon points={poly(t.pts)} {...triStyle} strokeLinejoin="round" style={{ filter: isDrag ? "drop-shadow(0 4px 6px rgba(20,51,113,0.4))" : "none" }} />
                        </motion.g>
                      );
                    })}

                  {/* a² / b² squares + labels after rearrangement */}
                  {placeLabels && (
                    <>
                      <polygon points={poly(R_A2)} fill="none" stroke="#4691CE" strokeWidth={0.16} strokeLinejoin="round" />
                      <text x={RX9 + AX / 2} y={BX / 2} fill="#143371" fontSize={beat === 4 ? 0.45 : 0.6} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif">
                        {beat === 4 ? `a² = ${((AX * slideT) ** 2).toFixed(1)}` : "a²"}
                      </text>
                      <polygon points={poly(R_B2)} fill="none" stroke="#4691CE" strokeWidth={0.16} strokeLinejoin="round" />
                      <text x={RX9 + AX + (S - AX) / 2} y={BX + (S - BX) / 2} fill="#143371" fontSize={beat === 4 ? 0.45 : 0.6} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif">
                        {beat === 4 ? `b² = ${((BX * slideT) ** 2).toFixed(1)}` : "b²"}
                      </text>
                    </>
                  )}
                </motion.g>
              </>
            )}
          </svg>

          {/* completion flash */}
          {beat === 3 && pulsed && !reduce && (
            <motion.div className="geo-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 0.5, times: [0, 0.5, 1] }} />
          )}
        </div>

        {/* ── Beat D completion text ── */}
        {beat === 3 && showDText2 && (
          <motion.div className="geo-text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="geo-title geo-title--small">
              We didn't add or remove anything — we just slid the same four triangles around inside the exact same boundary. Because the triangles' total area never changed, the leftover "empty" space has to be identical in both arrangements. Therefore, <Eq>c^2 = a^2 + b^2</Eq>.
            </p>
          </motion.div>
        )}

        {/* ── Beat D completion text (persists in Beat E) ── */}
        {beat === 4 && (
          <div className="geo-text">
            <p className="geo-title geo-title--small">
              We didn't add or remove anything — we just slid the same four triangles around inside the exact same boundary. Therefore, <Eq>c^2 = a^2 + b^2</Eq>.
            </p>
          </div>
        )}

        {/* ── Beat E: slider ── */}
        {beat === 4 && (
          <motion.div className="geo-slider-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="geo-slider-labels">
              <span>Scale × {slideT.toFixed(2)}</span>
              <span>
                a = {(AX * slideT).toFixed(1)} · b = {(BX * slideT).toFixed(1)} · c = {(CC * slideT).toFixed(1)}
              </span>
            </div>
            <Slider
              className="geo-slider"
              value={[slideT]}
              min={0.7}
              max={1.3}
              step={0.01}
              onValueChange={(v) => {
                setSlideT(v[0]);
                if (!sliderTouched) {
                  setSliderTouched(true);
                  showNext(true);
                }
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}