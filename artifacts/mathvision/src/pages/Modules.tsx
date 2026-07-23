import React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { Show } from "@clerk/react";

/* ─── Tile art components — one SVG illustration per module ─── */

function PythagoreanArt() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ddeeff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* graph-paper grid */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#b8d0e8" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Geometric construction */}
      <svg
        viewBox="0 0 220 150"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Square on side a (bottom) */}
        <rect x="40" y="95" width="60" height="60" fill="#FFCA8A" fillOpacity="0.7" stroke="#c8883a" strokeWidth="1.5" />
        {/* Square on side b (right) */}
        <rect x="100" y="35" width="40" height="60" fill="#FFB69E" fillOpacity="0.7" stroke="#c86040" strokeWidth="1.5" />
        {/* Square on hypotenuse */}
        <polygon
          points="40,35 100,35 100,95 40,95"
          fill="#F0FB9B"
          fillOpacity="0.75"
          stroke="#8a8a20"
          strokeWidth="1.5"
        />
        {/* Triangle — the star */}
        <polygon
          points="40,95 100,95 100,35"
          fill="#5588bb"
          fillOpacity="0.85"
          stroke="#1a4488"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Right angle mark */}
        <polyline
          points="92,95 92,87 100,87"
          fill="none"
          stroke="#1a4488"
          strokeWidth="1.5"
        />
        {/* Labels */}
        <text x="70" y="132" textAnchor="middle" fontSize="13" fontWeight="700" fill="#884422" fontFamily="Georgia,serif">a²</text>
        <text x="121" y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill="#882222" fontFamily="Georgia,serif">b²</text>
        <text x="65" y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill="#666600" fontFamily="Georgia,serif">c²</text>
        {/* Formula */}
        <text x="175" y="140" textAnchor="end" fontSize="11" fill="#1a4488" fontFamily="Georgia,serif" fontStyle="italic">
          a² + b² = c²
        </text>
      </svg>
    </div>
  );
}

function DerivativeArt() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#f5f0fa", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg viewBox="0 0 200 130" style={{ width: "90%", height: "90%" }} xmlns="http://www.w3.org/2000/svg">
        {/* Axes */}
        <line x1="20" y1="110" x2="180" y2="110" stroke="#bbb" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="20" y2="110" stroke="#bbb" strokeWidth="1.5" />
        {/* Parabola */}
        <path d="M 30,105 Q 100,10 170,60" fill="none" stroke="#9966cc" strokeWidth="2.5" strokeLinecap="round" />
        {/* Tangent line */}
        <line x1="60" y1="100" x2="140" y2="30" stroke="#cc6688" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Point on curve */}
        <circle cx="100" cy="35" r="5" fill="#9966cc" />
        <circle cx="100" cy="35" r="3" fill="white" />
        {/* Label */}
        <text x="100" y="125" textAnchor="middle" fontSize="11" fill="#9966cc" fontFamily="Georgia,serif" fontStyle="italic">f′(x)</text>
      </svg>
    </div>
  );
}

function EulerArt() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1a1f2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 200 100" style={{ width: "90%" }} xmlns="http://www.w3.org/2000/svg">
        <text x="100" y="65" textAnchor="middle" fontSize="28" fontFamily="Georgia,serif" fontStyle="italic" fill="#d4c07a" letterSpacing="-1">
          e
        </text>
        <text x="126" y="48" textAnchor="start" fontSize="14" fontFamily="Georgia,serif" fontStyle="italic" fill="#aac4e8">
          iπ
        </text>
        <text x="138" y="65" textAnchor="start" fontSize="28" fontFamily="Georgia,serif" fill="#e0d0a0">
          +1 = 0
        </text>
      </svg>
    </div>
  );
}

function PrimesArt() {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const all = Array.from({ length: 48 }, (_, i) => i + 2);
  return (
    <div style={{ width: "100%", height: "100%", background: "#fff8f2", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
        {all.map((n) => (
          <div
            key={n}
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "4px",
              background: primes.includes(n) ? "#e84040" : "#eee",
              color: primes.includes(n) ? "#fff" : "#999",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Module data ─── */

const MODULES = [
  {
    id: "pythagorean",
    title: "The Pythagorean Theorem",
    category: "Geometry",
    time: "25 min",
    href: "/modules/pythagorean",
    art: <PythagoreanArt />,
    available: true,
    tileBg: "#eef5fc",
    tileFooterBg: "#e4f0fb",
    border: "#b8d0e8",
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
    tileFooterBg: "#ede8f5",
    border: "#c8b8e8",
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
    tileFooterBg: "#1e2438",
    border: "#3a4060",
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
    tileFooterBg: "#fdf0e8",
    border: "#e0c8b0",
    titleColor: "#4a1a0a",
    catColor: "#883820",
  },
] as const;

/* ─── Page ─── */

export default function Modules() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--site-bg)",
        color: "var(--site-text)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <SiteNav />

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: "40px" }}
        >
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3rem)",
              letterSpacing: "-0.04em",
              color: "var(--site-text)",
              marginBottom: "6px",
              lineHeight: 1.1,
            }}
          >
            Website Name
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--site-text-muted)" }}>
            interactive math for curious students
          </p>
        </motion.div>

        {/* Module grid — 2 columns on md+, 1 on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {MODULES.map((mod, i) => {
            const inner = (
              <div
                className={`module-tile${mod.available ? "" : " module-tile--locked"}`}
                style={{
                  background: mod.tileBg,
                  border: `1.5px solid ${mod.border}`,
                  borderRadius: "14px",
                }}
              >
                {/* Visual area */}
                <div style={{ aspectRatio: "5/3", overflow: "hidden", position: "relative" }}>
                  {mod.art}
                  {!mod.available && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,248,242,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(255,255,255,0.88)",
                          border: "1.5px solid var(--site-border)",
                          borderRadius: "20px",
                          padding: "4px 14px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--site-text-muted)",
                        }}
                      >
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer label */}
                <div
                  style={{
                    background: mod.tileFooterBg,
                    borderTop: `1.5px solid ${mod.border}`,
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: mod.catColor,
                      marginBottom: "3px",
                    }}
                  >
                    {mod.category}
                    {mod.available ? ` · ${mod.time}` : ""}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: mod.titleColor,
                      lineHeight: 1.25,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {mod.title}
                  </div>
                </div>
              </div>
            );

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                {mod.available && mod.href ? (
                  <Link href={mod.href} style={{ textDecoration: "none", display: "block" }}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </motion.div>
            );
          })}
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
        <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--site-text)" }}>
          Website Name
        </span>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/about" style={{ fontSize: "0.85rem", color: "var(--site-text-muted)", textDecoration: "none" }}>
            About
          </Link>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--site-text-muted)" }}>
          © {new Date().getFullYear()} Website Name
        </span>
      </footer>
    </div>
  );
}
