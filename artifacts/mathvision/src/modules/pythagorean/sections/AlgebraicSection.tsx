import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SectionProps } from "../frame";
import { Math as Eq } from "../Math";

/* ───────────────────────── Geometry ─────────────────────────
   A right triangle with legs a (horizontal), b (vertical) and
   hypotenuse c. Four copies pinwheel inside a big square of side
   S = a + b, leaving a tilted inner square of side c. This is the
   single-scene (Chunk 3a) arrangement, kept as the working diagram
   for the whole algebraic proof.
   ViewBox "-1.5 -1.5 10 10". */
const AX = 3;
const BX = 4;
const S = AX + BX;
const CC = Math.sqrt(AX * AX + BX * BX);

const BL = [[0, 0], [AX, 0], [0, BX]];
const BR = [[S, 0], [AX, 0], [S, AX]];
const TR = [[S, S], [BX, S], [S, AX]];
const TL = [[0, S], [0, BX], [BX, S]];
const TRI_FINAL: Record<string, number[][]> = { BL, BR, TR, TL };
const CENTROIDS: Record<string, [number, number]> = {
  BL: [AX / 3, BX / 3],
  BR: [(2 * S + AX) / 3, AX / 3],
  TR: [(2 * S + BX) / 3, (2 * S + AX) / 3],
  TL: [BX / 3, (2 * S + BX) / 3],
};
const CENTER_SQ = [[AX, 0], [S, AX], [BX, S], [0, BX]];
const BIG_SQ = [[0, 0], [S, 0], [S, S], [0, S]];

const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");
const triFill = { fill: "rgba(29,82,172,0.08)", stroke: "#1D52AC", strokeWidth: 0.1 } as const;

/* ───────────────────── Equation tokens ─────────────────────
   The algebra line is built from individual tokens so the
   cancellation term (2ab) can be struck, faded, and slid away
   independently on both sides. */
type Token = { key: string; src?: string; op?: boolean; side: "l" | "r" | "c"; becomeRemoved?: boolean };
const TOKENS: Token[] = [
  { key: "l_a2", src: "a^2", side: "l" },
  { key: "l_plus1", op: true, side: "l" },
  { key: "l_2ab", src: "2ab", side: "l", becomeRemoved: true },
  { key: "l_plus2", op: true, side: "l", becomeRemoved: true },
  { key: "l_b2", src: "b^2", side: "l" },
  { key: "eq", op: true, side: "c" },
  { key: "r_2ab", src: "2ab", side: "r", becomeRemoved: true },
  { key: "r_plus", op: true, side: "r", becomeRemoved: true },
  { key: "r_c2", src: "c^2", side: "r" },
];

type AlgProps = SectionProps;

export default function AlgebraicSection({
  showNext,
  showBack,
  registerNav,
  advanceSection,
  backSection,
}: AlgProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0); // 0:A 1:B 2:C 3:D 4:E

  // diagram highlight states
  const [outerHi, setOuterHi] = useState(false);
  const [innerHi, setInnerHi] = useState(false);
  const [triHi, setTriHi] = useState(0); // 0..4 → which triangles highlighted
  // algebra states (beats D/E)
  const [fadeCancel, setFadeCancel] = useState(false);
  const [result, setResult] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── enter-beat orchestration ──
  useEffect(() => {
    clearTimers();
    setOuterHi(false);
    setInnerHi(false);
    setTriHi(0);
    setFadeCancel(false);
    setResult(false);

    if (beat === 0) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 1500));
    } else if (beat === 1) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => setOuterHi(true), 100));
      timersRef.current.push(setTimeout(() => showNext(true), 100 + 500 + 500 + 400));
    } else if (beat === 2) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => setInnerHi(true), 100));
      [1, 2, 3, 4].forEach((i) => {
        timersRef.current.push(setTimeout(() => setTriHi(i), 100 + 400 + 320 + (i - 1) * 260));
      });
      timersRef.current.push(setTimeout(() => showNext(true), 100 + 400 + 320 + 800 + 500 + 400));
    } else if (beat === 3) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => showNext(true), 2200));
    } else if (beat === 4) {
      showBack(true);
      showNext(false);
      timersRef.current.push(setTimeout(() => setFadeCancel(true), 300)); // after strike
      timersRef.current.push(setTimeout(() => setResult(true), 300 + 360 + 80)); // slide close
      timersRef.current.push(setTimeout(() => showNext(true), 300 + 360 + 80 + 1600));
    }
  }, [beat, showBack, showNext, clearTimers]);

  const showToken = (t: Token) => {
    if (beat < 3) return false;
    if (t.becomeRemoved) return !result;
    return true;
  };
  const tokenOpacity = (t: Token) => (t.becomeRemoved && fadeCancel ? 0 : 1);
  const tokenX = (side: string) => (side === "l" ? -44 : side === "r" ? 44 : 0);

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

  const showStrike = beat === 4 && !fadeCancel;

  return (
    <div className="pyth-alg">
      <div className="alg-content">
        {/* ── Text (above stage: beats A, B, C) ── */}
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="A" className="alg-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="alg-title">If that geometric proof wasn't convincing enough, here's an algebraic proof.</p>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="B" className="alg-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="alg-prose">
                The big square's outer edge has length <Eq>(a + b)</Eq>, so its total area is{" "}
                <Eq>(a + b)^2</Eq>. Expanding this gives <Eq>a^2 + 2ab + b^2</Eq>.
              </p>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="C" className="alg-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="alg-prose">
                We can also find the same total area by adding up the inner shapes. The inner square has area{" "}
                <Eq>c^2</Eq>. Each triangle has area <Eq>(b \\times h)/2</Eq>, or{" "}
                <Eq>ab/2</Eq> — and there are four of them, so together they add up to <Eq>2ab</Eq>. That gives us
                a second expression for the same total area: <Eq>c^2 + 2ab</Eq>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage ── */}
        <div className={`alg-stage ${beat >= 3 ? "alg-stage--split" : ""}`}>
          <motion.div
            className="alg-diagram"
            animate={{ width: beat >= 3 ? 190 : 300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <svg viewBox="-1.5 -1.5 10 10" className="alg-svg" aria-hidden="true">
              {/* big square outline */}
              <polygon points={poly(BIG_SQ)} fill="none" stroke="#143371" strokeWidth={0.1} />

              {/* four pinwheel triangles assemble toward the centre (~500ms) */}
              {Object.keys(TRI_FINAL).map((key, i) => {
                const c = CENTROIDS[key];
                return (
                  <motion.g
                    key={key}
                    initial={{ x: S / 2 - c[0], y: S / 2 - c[1], rotate: 150 - i * 80, opacity: 0.001 }}
                    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                  >
                    <polygon points={poly(TRI_FINAL[key])} {...triFill} strokeLinejoin="round" />
                  </motion.g>
                );
              })}

              {/* tilted inner square */}
              <motion.polygon
                points={poly(CENTER_SQ)}
                fill="#ECECF1"
                stroke="#143371"
                strokeWidth={0.12}
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              />

              {/* Beat B: outer edge highlight (crisp outline reveal) */}
              {beat >= 1 && (
                <motion.polygon
                  points={poly(BIG_SQ)}
                  fill="none"
                  stroke="#1D52AC"
                  strokeWidth={0.13}
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: outerHi ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              )}

              {/* Beat C: inner sq highlight, then triangles in sequence */}
              {beat === 2 && (
                <>
                  <motion.polygon
                    points={poly(CENTER_SQ)}
                    fill="none"
                    stroke="#1D52AC"
                    strokeWidth={0.13}
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: innerHi ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                  {Object.keys(TRI_FINAL).map((key, i) => (
                    <motion.polygon
                      key={`${key}-hi`}
                      points={poly(TRI_FINAL[key])}
                      fill="none"
                      stroke="#1D52AC"
                      strokeWidth={0.11}
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: triHi >= i + 1 ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </>
              )}

              {/* labels (fade in after the merge) */}
              <g fill="#143371">
                <motion.text x={S / 2} y={S + 0.55} fontSize={0.34} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 }}>
                  a + b
                </motion.text>
                <motion.text x={-0.55} y={S / 2} fontSize={0.34} textAnchor="middle" dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 }}>
                  a + b
                </motion.text>
              </g>
              <motion.text x={AX / 2} y={0.42} fill="#143371" fontSize={0.36} textAnchor="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 }}>
                a
              </motion.text>
              <motion.text x={0.4} y={BX / 2} fill="#143371" fontSize={0.36} dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 }}>
                b
              </motion.text>
              <motion.text x={1.05} y={1.5} fill="#4691CE" fontSize={0.4} dominantBaseline="middle" fontFamily="Playfair Display, serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 }}>
                c
              </motion.text>
            </svg>
          </motion.div>

          {/* Beat D/E: equation area */}
          {beat >= 3 && (
            <motion.div
              className="alg-eq-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="alg-eq" aria-label="a squared plus 2ab plus b squared equals 2ab plus c squared">
                {TOKENS.map((t) =>
                  showToken(t) ? (
                    <motion.span
                      key={t.key}
                      layout={beat === 4}
                      className={`alg-token${t.becomeRemoved ? " alg-token--cancel" : ""}${t.op ? " alg-token--op" : ""}`}
                      style={{ position: "relative" }}
                      initial={{ x: tokenX(t.side), opacity: 0 }}
                      animate={{ x: 0, opacity: tokenOpacity(t) }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {t.op ? <span className="alg-op">{t.src === undefined ? "=" : "+"}</span> : <Eq>{t.src}</Eq>}
                      {t.becomeRemoved && showStrike && <StrikeLine />}
                    </motion.span>
                  ) : null
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Text (below stage: beats D, E) ── */}
        <AnimatePresence mode="wait">
          {beat === 3 && (
            <motion.div key="D" className="alg-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="alg-prose">
                Because both expressions describe the area of the exact same square, we can set them equal — and once
                we cancel the matching <Eq>2ab</Eq> term from each side, we're left with the clean result:{" "}
                <Eq>a^2 + b^2 = c^2</Eq>.
              </p>
            </motion.div>
          )}
          {beat === 4 && (
            <motion.div key="E" className="alg-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
              <p className="alg-prose">
                These are just a couple proofs out of hundreds. While we won't be going over any more in this module,
                the point is that this relationship isn't a coincidence someone stumbled on; it's mathematically
                inevitable. Now let's see where else it shows up.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** A crisp strike line drawn left-to-right across a cancellation term. */
function StrikeLine() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="alg-strike"
      initial={reduce ? { opacity: 1, scaleX: 1 } : { scaleX: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ transformOrigin: "left center" }}
      aria-hidden="true"
    />
  );
}
