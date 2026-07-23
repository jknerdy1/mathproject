import React, { useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";

/* ─────────────────────────────────────────────────────────────
   AMBIENT BACKGROUND — slowly drifting math symbols
   Very low opacity (6%), non-interactive, GPU-animated.
───────────────────────────────────────────────────────────── */

const FLOAT_SYMBOLS = [
  { char: "π",  left: "7%",  top: "22%", size: 22, dx:  12, dy:  8,  dur: 28 },
  { char: "√",  left: "83%", top: "14%", size: 18, dx:  -8, dy:  14, dur: 36 },
  { char: "∞",  left: "13%", top: "60%", size: 20, dx:  10, dy:  -7, dur: 42 },
  { char: "Σ",  left: "72%", top: "50%", size: 16, dx: -12, dy:   8, dur: 33 },
  { char: "∫",  left: "46%", top: "28%", size: 24, dx:   6, dy:  12, dur: 48 },
  { char: "Δ",  left: "58%", top: "76%", size: 14, dx:  -8, dy: -10, dur: 39 },
  { char: "∠",  left: "27%", top: "80%", size: 16, dx:  14, dy:  -6, dur: 44 },
  { char: "+",  left: "87%", top: "68%", size: 26, dx:  -6, dy:  12, dur: 31 },
  { char: "=",  left: "4%",  top: "42%", size: 18, dx:  10, dy:  -8, dur: 37 },
];

function FloatingSymbols() {
  return (
    <>
      {FLOAT_SYMBOLS.map((s) => (
        <motion.div
          key={s.char + s.left}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            fontSize: `${s.size}px`,
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            opacity: 0.06,
            pointerEvents: "none",
            userSelect: "none",
            color: "var(--site-text)",
            willChange: "transform",
            zIndex: 0,
          }}
          animate={{
            x: [0, s.dx, 0, -s.dx, 0],
            y: [0, s.dy, 0, -s.dy, 0],
          }}
          transition={{
            duration: s.dur,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          {s.char}
        </motion.div>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   TILE ART — unchanged from previous pass
───────────────────────────────────────────────────────────── */

function PythagoreanArt() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#ddeeff", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pyth-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#b8d0e8" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pyth-grid)" />
      </svg>
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="100" width="80" height="80" fill="#FFCA8A" fillOpacity="0.7" stroke="#c8883a" strokeWidth="1.5" />
        <rect x="140" y="40" width="55" height="60" fill="#FFB69E" fillOpacity="0.7" stroke="#c86040" strokeWidth="1.5" />
        <polygon points="60,40 140,40 140,100 60,100" fill="#F0FB9B" fillOpacity="0.8" stroke="#8a8a20" strokeWidth="1.5" />
        <polygon points="60,100 140,100 140,40" fill="#5588bb" fillOpacity="0.9" stroke="#1a4488" strokeWidth="2" strokeLinejoin="round" />
        <polyline points="130,100 130,90 140,90" fill="none" stroke="#1a4488" strokeWidth="1.5" />
        <text x="100" y="148" textAnchor="middle" fontSize="14" fontWeight="700" fill="#884422" fontFamily="'Space Grotesk', sans-serif">a²</text>
        <text x="169" y="76"  textAnchor="middle" fontSize="14" fontWeight="700" fill="#882222" fontFamily="'Space Grotesk', sans-serif">b²</text>
        <text x="92"  y="76"  textAnchor="middle" fontSize="14" fontWeight="700" fill="#666600" fontFamily="'Space Grotesk', sans-serif">c²</text>
        <text x="240" y="170" textAnchor="end" fontSize="11" fontWeight="600" fill="#1a4488" fontFamily="'Space Grotesk', sans-serif" opacity="0.7">a² + b² = c²</text>
      </svg>
    </div>
  );
}

function DerivativeArt() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#f0ecfa", position: "relative", overflow: "hidden" }}>
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="deriv-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#d8ccee" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#deriv-grid)" />
        <line x1="30" y1="155" x2="270" y2="155" stroke="#9977cc" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="30" y1="20"  x2="30"  y2="155" stroke="#9977cc" strokeWidth="1.5" strokeOpacity="0.5" />
        <polygon points="270,152 278,155 270,158" fill="#9977cc" opacity="0.5" />
        <polygon points="27,20 30,12 33,20"      fill="#9977cc" opacity="0.5" />
        <path d="M 40,145 C 80,140 120,50 160,40 S 230,70 265,100" fill="none" stroke="#7744bb" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="148" x2="240" y2="28" stroke="#cc5588" strokeWidth="1.8" strokeDasharray="6 4" />
        <circle cx="160" cy="40" r="6"   fill="#7744bb" />
        <circle cx="160" cy="40" r="3.5" fill="white" />
        <text x="158" y="24"  textAnchor="middle" fontSize="11" fontWeight="700" fill="#7744bb" fontFamily="'Space Grotesk', sans-serif">P</text>
        <text x="248" y="24"  textAnchor="start"  fontSize="11" fontWeight="600" fill="#cc5588" fontFamily="'Space Grotesk', sans-serif">f ′(x)</text>
        <text x="264" y="170" textAnchor="end"    fontSize="11" fontWeight="600" fill="#9977cc" fontFamily="'Space Grotesk', sans-serif" opacity="0.7">x</text>
        <text x="44"  y="18"  textAnchor="start"  fontSize="11" fontWeight="600" fill="#9977cc" fontFamily="'Space Grotesk', sans-serif" opacity="0.7">f(x)</text>
      </svg>
    </div>
  );
}

function EulerArt() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1a1f2e", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <circle cx="150" cy="90" r="50"  fill="none" stroke="#2d3a55" strokeWidth="1" />
        <circle cx="150" cy="90" r="80"  fill="none" stroke="#2d3a55" strokeWidth="1" />
        <circle cx="150" cy="90" r="110" fill="none" stroke="#2d3a55" strokeWidth="1" />
      </svg>
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <text x="150" y="108" textAnchor="middle" fontSize="44" fontWeight="800" fill="#d4c07a" fontFamily="'Space Grotesk', sans-serif" letterSpacing="-2">e</text>
        <text x="180" y="84"  textAnchor="start"  fontSize="20" fontWeight="700" fill="#aac4e8" fontFamily="'Space Grotesk', sans-serif">iπ</text>
        <text x="196" y="108" textAnchor="start"  fontSize="44" fontWeight="800" fill="#e0d4a8" fontFamily="'Space Grotesk', sans-serif" letterSpacing="-2">+1=0</text>
        <text x="150" y="155" textAnchor="middle" fontSize="11" fontWeight="500" fill="#7a8aaa" fontFamily="'Space Grotesk', sans-serif">Euler's Identity</text>
      </svg>
    </div>
  );
}

function PrimesArt() {
  const primes = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71]);
  const nums = Array.from({ length: 72 }, (_, i) => i + 2);
  return (
    <div style={{ width: "100%", height: "100%", background: "#fff8f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        {nums.map((n, i) => {
          const col = i % 12;
          const row = Math.floor(i / 12);
          const x = 14 + col * 23;
          const y = 14 + row * 30;
          const isPrime = primes.has(n);
          return (
            <g key={n}>
              <rect x={x} y={y} width="19" height="19" rx="3" fill={isPrime ? "#e84040" : "#eeebe8"} />
              <text x={x + 9.5} y={y + 13} textAnchor="middle" fontSize="8" fontWeight={isPrime ? "700" : "500"} fill={isPrime ? "#fff" : "#aaa"} fontFamily="'Space Grotesk', sans-serif">
                {n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODULE DATA
───────────────────────────────────────────────────────────── */

const MODULES = [
  {
    id: "pythagorean",
    title: "The Pythagorean Theorem",
    category: "Geometry",
    time: "25 min",
    href: "/modules/pythagorean" as string | null,
    art: <PythagoreanArt />,
    available: true,
    tileBg: "#eef5fc",
    footerBg: "#e4f0fb",
    border: "#b8d0e8",
    hoverBorder: "#6aaad8",       // more saturated on hover
    titleColor: "#1a3a5c",
    catColor: "#3a6898",
  },
  {
    id: "derivative",
    title: "The Derivative",
    category: "Calculus",
    time: "30 min",
    href: null,
    art: <DerivativeArt />,
    available: false,
    tileBg: "#f5f0fa",
    footerBg: "#ede8f5",
    border: "#c8b8e8",
    hoverBorder: "#c8b8e8",
    titleColor: "#3a1a5c",
    catColor: "#7755aa",
  },
  {
    id: "euler",
    title: "Euler's Identity",
    category: "Complex Numbers",
    time: "35 min",
    href: null,
    art: <EulerArt />,
    available: false,
    tileBg: "#1a1f2e",
    footerBg: "#1e2438",
    border: "#3a4060",
    hoverBorder: "#3a4060",
    titleColor: "#d4c07a",
    catColor: "#7a8aaa",
  },
  {
    id: "primes",
    title: "Prime Numbers",
    category: "Number Theory",
    time: "20 min",
    href: null,
    art: <PrimesArt />,
    available: false,
    tileBg: "#fff8f2",
    footerBg: "#fdf0e8",
    border: "#e0c8b0",
    hoverBorder: "#e0c8b0",
    titleColor: "#4a1a0a",
    catColor: "#883820",
  },
];

/* ─────────────────────────────────────────────────────────────
   CONSTANTS — shared across all tiles
───────────────────────────────────────────────────────────── */

const ART_HEIGHT   = 178;
const FOOTER_PAD   = "14px 16px";

const PILL_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1.5px solid rgba(0,0,0,0.12)",
  borderRadius: "999px",
  padding: "5px 16px",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#5a4a38",
  fontFamily: "'Space Grotesk', sans-serif",
  whiteSpace: "nowrap",
};

/* ─────────────────────────────────────────────────────────────
   MODULE TILE — extracted component with hover state
   Handles: lift/scale, border saturation, box-shadow,
   and cursor-follow "Explore →" label (direct DOM, no re-render).
───────────────────────────────────────────────────────────── */

type Mod = typeof MODULES[number];

function ModuleTile({ mod }: { mod: Mod }) {
  const [hovered, setHovered] = useState(false);

  // Cursor-follow label — updated via ref to avoid re-renders
  const labelRef  = useRef<HTMLDivElement>(null);
  const tileRef   = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!labelRef.current || !tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    labelRef.current.style.left = `${e.clientX - rect.left + 14}px`;
    labelRef.current.style.top  = `${e.clientY - rect.top  - 14}px`;
  }, []);

  const borderColor  = hovered && mod.available ? mod.hoverBorder : mod.border;
  const shadowStyle  = hovered && mod.available
    ? "0 10px 30px rgba(0,0,0,0.11)"
    : "0 2px 8px rgba(0,0,0,0.04)";

  return (
    <motion.div
      ref={tileRef}
      whileHover={mod.available ? { y: -5, scale: 1.025 } : {}}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={mod.available ? handleMouseMove : undefined}
      style={{ position: "relative", cursor: mod.available ? "none" : "default" }}
    >
      {/* Card */}
      <div
        style={{
          background: mod.tileBg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: shadowStyle,
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Illustration area */}
        <div style={{ height: `${ART_HEIGHT}px`, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", opacity: mod.available ? 1 : 0.25, transition: "opacity 0.2s" }}>
            {mod.art}
          </div>

          {!mod.available && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={PILL_STYLE}>Coming Soon</span>
            </div>
          )}
        </div>

        {/* Footer label band */}
        <div style={{ background: mod.footerBg, borderTop: `1.5px solid ${borderColor}`, padding: FOOTER_PAD, flexShrink: 0, transition: "border-color 0.15s" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: mod.catColor, marginBottom: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {mod.category}{mod.available ? ` · ${mod.time}` : ""}
          </div>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: mod.titleColor, lineHeight: 1.25, letterSpacing: "-0.02em", fontFamily: "'Space Grotesk', sans-serif" }}>
            {mod.title}
          </div>
        </div>
      </div>

      {/* Cursor-follow "Explore →" label — available tiles only */}
      {mod.available && (
        <div
          ref={labelRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            pointerEvents: "none",
            background: "var(--site-text)",
            color: "var(--site-bg)",
            padding: "4px 11px",
            borderRadius: "6px",
            fontSize: "0.72rem",
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            zIndex: 20,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.12s",
            top: 0,
            left: 0,
          }}
        >
          Explore →
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MOCK STATS — replace value with real analytics later
───────────────────────────────────────────────────────────── */
const MOCK_LESSONS_COMPLETED = 4_218;

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function Modules() {
  const [, navigate] = useLocation();

  // "Surprise me" — picks a random available module
  const availableModules = MODULES.filter((m) => m.available && m.href);
  const handleSurprise = () => {
    const pick = availableModules[Math.floor(Math.random() * availableModules.length)];
    if (pick?.href) navigate(pick.href);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--site-bg)",
        color: "var(--site-text)",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Ambient floating symbols — sit behind all content */}
      <FloatingSymbols />

      <div style={{ position: "relative", zIndex: 1 }}>
        <SiteNav />

        <main style={{ maxWidth: "980px", margin: "0 auto", padding: "40px 24px 96px" }}>

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            {/* Tagline */}
            <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", fontWeight: 500, color: "var(--site-text-muted)", letterSpacing: "-0.01em", marginBottom: "16px" }}>
              interactive math for curious students
            </p>

            {/* Controls row: mock stat + Surprise me */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              {/* Mock engagement counter */}
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--site-text-muted)",
                  letterSpacing: "0.01em",
                  opacity: 0.7,
                }}
              >
                ✦ {MOCK_LESSONS_COMPLETED.toLocaleString()} concepts explored
              </span>

              {/* Separator dot */}
              <span style={{ color: "var(--site-border)", fontSize: "0.6rem" }}>●</span>

              {/* Surprise me pill */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14 }}
                onClick={handleSurprise}
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--site-border)",
                  borderRadius: "999px",
                  padding: "5px 16px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--site-text-muted)",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: "-0.01em",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--site-text)";
                  e.currentTarget.style.color = "var(--site-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--site-border)";
                  e.currentTarget.style.color = "var(--site-text-muted)";
                }}
              >
                Surprise me ✦
              </motion.button>
            </div>
          </motion.div>

          {/* ── Module grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
              alignItems: "start",
            }}
          >
            {MODULES.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                {mod.available && mod.href ? (
                  <Link href={mod.href} style={{ textDecoration: "none", display: "block" }}>
                    <ModuleTile mod={mod} />
                  </Link>
                ) : (
                  <ModuleTile mod={mod} />
                )}
              </motion.div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1.5px solid var(--site-border)",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--site-text)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Website Name
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/about" style={{ fontSize: "0.85rem", color: "var(--site-text-muted)", textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif" }}>
              About
            </Link>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--site-text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
            © {new Date().getFullYear()} Website Name
          </span>
        </footer>
      </div>
    </div>
  );
}
