import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// SineWaveDemo
//
// Interactive SVG demonstrating how the unit circle traces out sin(θ).
// - Auto-spins while idle
// - Drag the point on the circle to scrub the angle
// - The sine trace, grid ticks, and live point/axis lines follow along
//
// Fully self-contained: no prop is required, but you may pass a `className` or
// `style` to fit it into any container. Import it directly to drop the demo
// into a page, or copy this file to adapt it into a similar visual.
// ---------------------------------------------------------------------------

// --- Geometry (SVG user-space coordinates) --------------------------------
const CIRCLE_CX = 640;
const CIRCLE_CY = 175;
const CIRCLE_R = 120;
const SINE_LEFT = 20;
const SINE_RIGHT = 460;
const SINE_MID = CIRCLE_CY;
const SINE_AMP = CIRCLE_R;
const SINE_TOP = SINE_MID - SINE_AMP - 6;
const SINE_BOT = SINE_MID + SINE_AMP + 6;
const POINT_R = 6;

const SVG_W = 800;
const SVG_H = 400;

// --- Behavior --------------------------------------------------------------
const VIEW_RANGE = (4 * Math.PI) / 3; // how much of the sine the window shows
const FOLLOW_MARGIN = VIEW_RANGE * 0.25; // keep the point off the left edge

const SPIN_RATE = 0.008; // steady auto-spin speed (radians per frame)
const SPIN_IDLE_MS = 1000; // wait this long after drag before auto-spinning
const SPIN_EASE = 0.018; // ease into the target spin speed

// --- Math helpers ----------------------------------------------------------
function formatAngle(a: number): string {
  const eps = 0.05;
  const n = Math.round(a / (Math.PI / 4));
  if (Math.abs(a - (n * Math.PI) / 4) > eps) return a.toFixed(1);
  if (n === 0) return "0";
  let prefix = "";
  let abs = n;
  if (n < 0) {
    prefix = "-";
    abs = -n;
  }
  if (abs === 1) return prefix + "π/4";
  if (abs === 2) return prefix + "π/2";
  if (abs === 3) return prefix + "3π/4";
  if (abs % 4 === 0) return prefix + `${abs / 4}π`;
  return prefix + `${abs}π/4`;
}

function sineX(theta: number, viewLeft: number): number {
  return SINE_LEFT + ((theta - viewLeft) / VIEW_RANGE) * (SINE_RIGHT - SINE_LEFT);
}

function sinePoint(theta: number, viewLeft: number) {
  return {
    x: sineX(theta, viewLeft),
    y: SINE_MID - Math.sin(theta) * SINE_AMP,
  };
}

function circlePoint(theta: number) {
  return {
    x: CIRCLE_CX + CIRCLE_R * Math.cos(theta),
    y: CIRCLE_CY - CIRCLE_R * Math.sin(theta),
  };
}

function angleArcPath(theta: number): string {
  if (theta < 0.02) return "";
  const r = 28;
  const sx = CIRCLE_CX + r;
  const sy = CIRCLE_CY;
  const ex = CIRCLE_CX + r * Math.cos(theta);
  const ey = CIRCLE_CY - r * Math.sin(theta);
  const la = theta > Math.PI ? 1 : 0;
  return `M${sx} ${sy} A${r} ${r} 0 ${la} 0 ${ex} ${ey}`;
}

// --- Component --------------------------------------------------------------
interface SineWaveDemoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function SineWaveDemo({ className, style }: SineWaveDemoProps) {
  const [cumTheta, setCumTheta] = useState(0); // total swept angle, never resets
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const lastNormRef = useRef(0); // last normalized pointer angle (drag baseline)
  const camRef = useRef(0); // smooth-scrolling camera position
  const spinSpeedRef = useRef(0); // current spin speed
  const lastDragTimeRef = useRef(0); // last time drag ended (for idle spin)
  const draggingRef = useRef(false);

  // Auto-spin loop: eases up to SPIN_RATE after the user stops dragging.
  useEffect(() => {
    let raf: number;
    const loop = () => {
      const now = Date.now();
      const dt = now - lastDragTimeRef.current;
      if (!draggingRef.current && dt > SPIN_IDLE_MS) {
        spinSpeedRef.current += (SPIN_RATE - spinSpeedRef.current) * SPIN_EASE;
        setCumTheta((prev) => prev + spinSpeedRef.current);
      } else {
        spinSpeedRef.current *= 0.92;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Turn a screen (client) coordinate into an angle on the unit circle.
  const getAngleFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / SVG_W;
    const scaleY = rect.height / SVG_H;
    const cx = rect.left + CIRCLE_CX * scaleX;
    const cy = rect.top + CIRCLE_CY * scaleY;
    const dx = clientX - cx;
    const dy = -(clientY - cy);
    return Math.atan2(dy, dx);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      if (!hasInteracted) setHasInteracted(true);
      lastNormRef.current = getAngleFromEvent(e.clientX, e.clientY);
      setDragging(true);
      draggingRef.current = true;
      spinSpeedRef.current = 0;
    },
    [getAngleFromEvent, hasInteracted]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const rawAngle = getAngleFromEvent(e.clientX, e.clientY);
      let delta = rawAngle - lastNormRef.current;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      lastNormRef.current = rawAngle;
      setCumTheta((prev) => Math.max(0, prev + delta));
    },
    [getAngleFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingRef.current) lastDragTimeRef.current = Date.now();
    setDragging(false);
    draggingRef.current = false;
  }, []);

  // --- Derived rendering values -------------------------------------------
  const targetCam = Math.max(0, cumTheta - VIEW_RANGE + FOLLOW_MARGIN);
  camRef.current += (targetCam - camRef.current) * Math.min(1, 0.1);
  const viewLeft = camRef.current;
  const viewRight = viewLeft + VIEW_RANGE;

  const cp = circlePoint(cumTheta); // point on the circle
  const sp = sinePoint(cumTheta, viewLeft); // matching point on the sine

  // Polyline for the drawn portion of the sine trace.
  const sinePathD = (() => {
    if (cumTheta < 0.001) return "";
    const drawStart = Math.max(0, viewLeft);
    const drawEnd = cumTheta;
    const range = drawEnd - drawStart;
    if (range < 0.01) return "";
    const stepSize = 0.025;
    const steps = Math.ceil(range / stepSize);
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = drawStart + (i / steps) * range;
      const p = sinePoint(t, viewLeft);
      pts.push(`${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    return pts.join("");
  })();

  // Grid ticks / angle labels along the sine axis.
  const gridTicks: { x: number; label: string }[] = [];
  if (viewRight - viewLeft > 0.01) {
    const step = Math.PI / 4;
    let tick = Math.ceil(viewLeft / step) * step;
    while (tick <= viewRight + 0.001) {
      const x = sineX(tick, viewLeft);
      if (x >= SINE_LEFT && x <= SINE_RIGHT) {
        gridTicks.push({ x, label: formatAngle(tick) });
      }
      tick += step;
    }
  }

  const hasTrace = cumTheta > 0.005;
  const arcAngle = cumTheta % (2 * Math.PI);
  const arcFadeStart = (7 * Math.PI) / 4;
  const arcOpacity =
    arcAngle < arcFadeStart
      ? 1
      : Math.max(
          0,
          (2 * Math.PI - arcAngle) / (2 * Math.PI - arcFadeStart)
        );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className={className}
      style={{
        width: "100%",
        height: "auto",
        touchAction: "none",
        userSelect: "none",
        display: "block",
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Sine plot frame */}
      <rect
        x={SINE_LEFT - 4}
        y={SINE_TOP - 4}
        width={SINE_RIGHT - SINE_LEFT + 8}
        height={SINE_BOT - SINE_TOP + 8}
        fill="none"
        stroke="var(--site-border)"
        strokeWidth="1"
        rx="4"
        opacity={0.4}
      />
      <line
        x1={SINE_LEFT}
        y1={SINE_MID}
        x2={SINE_RIGHT}
        y2={SINE_MID}
        stroke="var(--site-border)"
        strokeWidth="1.5"
      />
      <text
        x={SINE_RIGHT + 8}
        y={SINE_MID + 6}
        fill="var(--site-text)"
        fontSize="16"
        fontFamily="'STIX Two Math', serif"
        fontStyle="italic"
        fontWeight="bold"
      >
        θ
      </text>

      {gridTicks.map((gt, i) => (
        <g key={i}>
          <line
            x1={gt.x}
            y1={SINE_TOP}
            x2={gt.x}
            y2={SINE_BOT}
            stroke="var(--site-border)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={gt.x}
            y={SINE_BOT + 18}
            textAnchor="middle"
            fill="var(--site-text-muted)"
            fontSize="10"
            fontFamily="'Space Grotesk', sans-serif"
          >
            {gt.label}
          </text>
        </g>
      ))}

      {/* Sine trace */}
      {hasTrace && (
        <path
          d={sinePathD}
          fill="none"
          stroke="var(--site-text)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Live point + vertical drop line on the sine */}
      {hasTrace && (
        <circle
          cx={sp.x}
          cy={sp.y}
          r={POINT_R}
          fill="var(--site-accent-2)"
          stroke="var(--site-text)"
          strokeWidth="1.5"
        />
      )}
      {hasTrace && (
        <line
          x1={sp.x}
          y1={sp.y}
          x2={sp.x}
          y2={SINE_MID}
          stroke="#FF8C42"
          strokeWidth="2.5"
          opacity={0.85}
        />
      )}
      {hasTrace && (
        <line
          x1={cp.x}
          y1={cp.y}
          x2={sp.x}
          y2={cp.y}
          stroke="var(--site-text-muted)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity={0.55}
        />
      )}

      {/* Unit circle */}
      <circle
        cx={CIRCLE_CX}
        cy={CIRCLE_CY}
        r={CIRCLE_R}
        fill="none"
        stroke="var(--site-border)"
        strokeWidth="2"
      />
      <line
        x1={CIRCLE_CX - CIRCLE_R - 6}
        y1={CIRCLE_CY}
        x2={CIRCLE_CX + CIRCLE_R + 6}
        y2={CIRCLE_CY}
        stroke="var(--site-border)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle
        cx={CIRCLE_CX}
        cy={CIRCLE_CY}
        r="3"
        fill="var(--site-text-muted)"
      />

      {/* Swept angle arc + label (fades near a full rotation) */}
      {hasTrace && arcOpacity > 0 && (
        <>
          <path
            d={angleArcPath(arcAngle)}
            fill="none"
            stroke="var(--site-text)"
            strokeWidth="2"
            opacity={arcOpacity}
          />
          {arcAngle > 0.04 && (
            <text
              x={
                CIRCLE_CX +
                36 * Math.cos(Math.min(arcAngle, arcFadeStart) / 2)
              }
              y={
                CIRCLE_CY -
                36 * Math.sin(Math.min(arcAngle, arcFadeStart) / 2) +
                5
              }
              textAnchor="middle"
              fill="var(--site-text)"
              fontSize="13"
              fontFamily="'STIX Two Math', serif"
              fontStyle="italic"
              fontWeight="bold"
              opacity={arcOpacity}
            >
              θ
            </text>
          )}
        </>
      )}

      {/* Radius + vertical drop line on the circle */}
      {hasTrace && (
        <line
          x1={CIRCLE_CX}
          y1={CIRCLE_CY}
          x2={cp.x}
          y2={cp.y}
          stroke="var(--site-text-muted)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity={0.5}
        />
      )}
      {hasTrace && (
        <line
          x1={cp.x}
          y1={cp.y}
          x2={cp.x}
          y2={CIRCLE_CY}
          stroke="#FF8C42"
          strokeWidth="2.5"
          opacity={0.85}
        />
      )}

      {/* Draggable handle on the circle */}
      <circle
        cx={cp.x}
        cy={cp.y}
        r={POINT_R}
        fill="var(--site-accent-2)"
        stroke="var(--site-text)"
        strokeWidth="2"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      />
      <circle
        cx={cp.x}
        cy={cp.y}
        r="44"
        fill="transparent"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
      />

      {!hasInteracted && (
        <text
          x={cp.x + 20}
          y={cp.y - 14}
          fill="var(--site-text-muted)"
          fontSize="12"
          fontFamily="'Space Grotesk', sans-serif"
          fontStyle="italic"
          opacity={0.7}
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        >
          drag me
        </text>
      )}

      <text
        x={SVG_W / 2}
        y={SVG_H - 14}
        textAnchor="middle"
        fill="var(--site-text-muted)"
        fontSize="12"
        fontFamily="'Space Grotesk', sans-serif"
        fontStyle="italic"
      >
        Watch as the circle traces out sin(θ) perfectly.
      </text>
    </svg>
  );
}
