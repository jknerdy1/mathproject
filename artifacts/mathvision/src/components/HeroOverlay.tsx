import { useState, useRef, useEffect, useCallback } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";

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

const VIEW_RANGE = 4 * Math.PI / 3;
const FOLLOW_MARGIN = VIEW_RANGE * 0.25;

const SPIN_RATE = 0.008;
const SPIN_IDLE_MS = 1000;
const SPIN_EASE = 0.018;

function formatAngle(a: number): string {
  const eps = 0.05;
  const n = Math.round(a / (Math.PI / 4));
  if (Math.abs(a - n * Math.PI / 4) > eps) return a.toFixed(1);
  if (n === 0) return "0";
  let prefix = "";
  let abs = n;
  if (n < 0) { prefix = "-"; abs = -n; }
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

export default function HeroOverlay() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [signInHovered, setSignInHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);

  const [cumTheta, setCumTheta] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [aboutHovered, setAboutHovered] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastNormRef = useRef(0);
  const camRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const draggingRef = useRef(false);

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

  useEffect(() => {
    const handler = () => {
      setShowScrollTop(window.scrollY > 130);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return 0;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = rect.width / SVG_W;
      const scaleY = rect.height / SVG_H;
      const cx = rect.left + CIRCLE_CX * scaleX;
      const cy = rect.top + CIRCLE_CY * scaleY;
      const dx = clientX - cx;
      const dy = -(clientY - cy);
      return Math.atan2(dy, dx);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      if (!hasInteracted) setHasInteracted(true);
      const rawAngle = getAngleFromEvent(e.clientX, e.clientY);
      lastNormRef.current = rawAngle;
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
    if (draggingRef.current) {
      lastDragTimeRef.current = Date.now();
    }
    setDragging(false);
    draggingRef.current = false;
  }, []);

  const targetCam = Math.max(0, cumTheta - VIEW_RANGE + FOLLOW_MARGIN);
  camRef.current += (targetCam - camRef.current) * Math.min(1, 0.1);
  const viewLeft = camRef.current;
  const viewRight = viewLeft + VIEW_RANGE;

  const cp = circlePoint(cumTheta);
  const sp = sinePoint(cumTheta, viewLeft);

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
  const arcFadeStart = 7 * Math.PI / 4;
  const arcOpacity = arcAngle < arcFadeStart ? 1 : Math.max(0, (2 * Math.PI - arcAngle) / (2 * Math.PI - arcFadeStart));

  return (
    <>
      <div className="hero-section" style={{ background: "var(--site-bg)", position: "relative", zIndex: 1 }}>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: "56px",
            borderBottom: "1.5px solid var(--site-border)",
            background: "var(--site-bg)",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "var(--site-text)",
              textDecoration: "none",
              letterSpacing: "-0.03em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "0.6")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "1")
            }
          >
            Website Name
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link
              href="/about"
              onMouseEnter={() => setAboutHovered(true)}
              onMouseLeave={() => setAboutHovered(false)}
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: aboutHovered
                  ? "var(--site-text)"
                  : "var(--site-text-muted)",
                textDecoration: "none",
                paddingBottom: "2px",
                borderBottom: `2px solid ${
                  aboutHovered ? "var(--site-text)" : "transparent"
                }`,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              About
            </Link>

            <Show when="signed-in">
              <span
                style={{
                  fontSize: "0.88rem",
                  color: "var(--site-text-muted)",
                  fontWeight: 500,
                }}
              >
                {user?.firstName ?? "Explorer"}
              </span>
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                onMouseEnter={() => setSignOutHovered(true)}
                onMouseLeave={() => setSignOutHovered(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
gap: "16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  background: "transparent",
                  color: signOutHovered
                    ? "var(--site-text)"
                    : "var(--site-text-muted)",
                  border: `1.5px solid ${
                    signOutHovered ? "var(--site-text)" : "var(--site-border)"
                  }`,
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </Show>

            <Show when="signed-out">
              <button
                onClick={() => navigate("/sign-in")}
                onMouseEnter={() => setSignInHovered(true)}
                onMouseLeave={() => setSignInHovered(false)}
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  background: "var(--site-text)",
                  color: "var(--site-bg)",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  transform: signInHovered ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.15s",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Sign In
              </button>
            </Show>
          </div>
        </nav>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 24px 12px",
            gap: "24px",
            maxWidth: "960px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--site-text)",
              textAlign: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0,
            }}
          >
            The math you were never shown.
          </h1>

          <p
            style={{
              fontSize: "clamp(0.72rem, 1.1vw, 0.85rem)",
              fontWeight: 500,
              color: "var(--site-text-muted)",
              textAlign: "center",
              maxWidth: "540px",
              lineHeight: 1.35,
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0,
            }}
          >
            I created interactive modules teaching concepts the way I wish they
            were taught to me.
          </p>

          <div
            style={{
              background: "#FFF8F2",
              borderRadius: "20px",
              padding: "12px 20px 10px",
              width: "100%",
              maxWidth: "840px",
              boxSizing: "border-box",
              border: "1px solid var(--site-border)",
              boxShadow: "0 10px 44px rgba(0,0,0,0.12)",
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{
                width: "100%",
                height: "auto",
                touchAction: "none",
                userSelect: "none",
                display: "block",
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
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
                      x={CIRCLE_CX + 36 * Math.cos(Math.min(arcAngle, arcFadeStart) / 2)}
                      y={CIRCLE_CY - 36 * Math.sin(Math.min(arcAngle, arcFadeStart) / 2) + 5}
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
          </div>
        </div>
      </div>

      {/* Scroll-to-top button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          zIndex: 999,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "var(--site-text)",
          color: "var(--site-bg)",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0)" : "translateY(12px)",
          pointerEvents: showScrollTop ? "auto" : "none",
          transition: "opacity 0.3s, transform 0.3s",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        ▲
      </button>
    </>
  );
}