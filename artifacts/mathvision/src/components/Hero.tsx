"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Link } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";

const CIRCLE_RADIUS = 120;
const WAVE_WIDTH = 480;
const WAVE_HEIGHT = 240;
const MAX_THETA = Math.PI * 2;

function CircleToSineDemo() {
  const [theta, setTheta] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const circleRef = useRef<SVGCircleElement>(null);
  const wavePathRef = useRef<SVGPathElement>(null);
  const guideLineRef = useRef<SVGLineElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const wavePointRef = useRef<SVGCircleElement>(null);
  const isDraggingRef = useRef(false);

  const getPointOnCircle = (t: number) => ({
    x: CIRCLE_RADIUS * Math.cos(t),
    y: -CIRCLE_RADIUS * Math.sin(t),
  });

  const getWavePath = (currentTheta: number) => {
    const points: number[] = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * currentTheta;
      const x = (t / MAX_THETA) * WAVE_WIDTH;
      const y = WAVE_HEIGHT / 2 - Math.sin(t) * (WAVE_HEIGHT / 2 - 20);
      points.push(x, y);
    }
    return `M ${points.join(" ")}`;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setHasInteracted(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !circleRef.current) return;

    const svg = circleRef.current.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const newTheta = Math.atan2(-dy, dx);
    const normalizedTheta = newTheta < 0 ? newTheta + MAX_THETA : newTheta;

    setTheta(normalizedTheta);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const pointPos = getPointOnCircle(theta);
  const waveX = (theta / MAX_THETA) * WAVE_WIDTH;
  const waveY = WAVE_HEIGHT / 2 - Math.sin(theta) * (WAVE_HEIGHT / 2 - 20);
  const wavePath = getWavePath(theta);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "40px",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {/* Left Panel: Circle */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg
            width={CIRCLE_RADIUS * 2 + 40}
            height={CIRCLE_RADIUS * 2 + 40}
            viewBox={`-${CIRCLE_RADIUS + 20} -${CIRCLE_RADIUS + 20} ${CIRCLE_RADIUS * 2 + 40} ${CIRCLE_RADIUS * 2 + 40}`}
            style={{ display: "block" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <circle
              cx={0}
              cy={0}
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="#d6c4af"
              strokeWidth="2"
            />
            <circle cx={0} cy={0} r={3} fill="#6b5742" />
            <line
              x1={0}
              y1={0}
              x2={pointPos.x}
              y2={pointPos.y}
              stroke="#6b5742"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <line
              ref={guideLineRef}
              x1={pointPos.x}
              y1={pointPos.y}
              x2={CIRCLE_RADIUS + 20}
              y2={pointPos.y}
              stroke="#6644cc"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={0.7}
            />
            {theta > 0.05 && (
              <path
                d={`M ${CIRCLE_RADIUS * 0.3},0 A ${CIRCLE_RADIUS * 0.3} ${CIRCLE_RADIUS * 0.3} 0 0 1 ${CIRCLE_RADIUS * 0.3 * Math.cos(theta)} ${-CIRCLE_RADIUS * 0.3 * Math.sin(theta)}`}
                fill="none"
                stroke="#6644cc"
                strokeWidth="1.5"
                opacity={0.5}
              />
            )}
            {theta > 0.1 && (
              <text
                x={CIRCLE_RADIUS * 0.35 * Math.cos(theta / 2)}
                y={-CIRCLE_RADIUS * 0.35 * Math.sin(theta / 2) - 5}
                fill="#6644cc"
                fontSize="14"
                fontWeight="600"
                fontFamily="'Space Grotesk', sans-serif"
                textAnchor="middle"
              >
                θ
              </text>
            )}
            <circle
              ref={pointRef}
              cx={pointPos.x}
              cy={pointPos.y}
              r={12}
              fill="#fff"
              stroke="#6644cc"
              strokeWidth="3"
              cursor="grab"
              onPointerDown={handlePointerDown}
              style={{
                transition: "r 0.1s",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }}
            />
            {!hasInteracted && (
              <text
                x={pointPos.x + 20}
                y={pointPos.y - 20}
                fill="#9a8a72"
                fontSize="12"
                fontWeight="500"
                fontFamily="'Space Grotesk', sans-serif"
                opacity={0.8}
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                drag me
              </text>
            )}
            <defs>
              <style>
                {`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                  }
                `}
              </style>
            </defs>
          </svg>
        </div>

        {/* Right Panel: Sine Wave */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg
            width={WAVE_WIDTH + 40}
            height={WAVE_HEIGHT + 40}
            viewBox={`-20 -20 ${WAVE_WIDTH + 40} ${WAVE_HEIGHT + 40}`}
            style={{ display: "block" }}
          >
            <line
              x1={0}
              y1={WAVE_HEIGHT / 2}
              x2={WAVE_WIDTH}
              y2={WAVE_HEIGHT / 2}
              stroke="#d6c4af"
              strokeWidth="1.5"
            />
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={WAVE_HEIGHT}
              stroke="#d6c4af"
              strokeWidth="1.5"
            />
            <text x={0} y={WAVE_HEIGHT / 2 + 20} fill="#9a8a72" fontSize="11" fontFamily="'Space Grotesk', sans-serif" textAnchor="start">0</text>
            <text x={WAVE_WIDTH / 2} y={WAVE_HEIGHT / 2 + 20} fill="#9a8a72" fontSize="11" fontFamily="'Space Grotesk', sans-serif" textAnchor="middle">π</text>
            <text x={WAVE_WIDTH} y={WAVE_HEIGHT / 2 + 20} fill="#9a8a72" fontSize="11" fontFamily="'Space Grotesk', sans-serif" textAnchor="end">2π</text>
            <text x={-10} y={20} fill="#9a8a72" fontSize="11" fontFamily="'Space Grotesk', sans-serif" textAnchor="end" dominantBaseline="middle">1</text>
            <text x={-10} y={WAVE_HEIGHT - 20} fill="#9a8a72" fontSize="11" fontFamily="'Space Grotesk', sans-serif" textAnchor="end" dominantBaseline="middle">-1</text>
            <path
              ref={wavePathRef}
              d={wavePath}
              fill="none"
              stroke="#6644cc"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1={CIRCLE_RADIUS + 20}
              y1={pointPos.y}
              x2={20}
              y2={waveY}
              stroke="#6644cc"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <circle
              ref={wavePointRef}
              cx={waveX}
              cy={waveY}
              r={8}
              fill="#fff"
              stroke="#6644cc"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
            />
            <line
              x1={waveX}
              y1={waveY}
              x2={waveX}
              y2={WAVE_HEIGHT / 2}
              stroke="#6644cc"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity={0.4}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ScrollIndicator({ scrollProgress }: { scrollProgress: any }) {
  const opacity = useTransform(scrollProgress, [0, 0.2], [1, 0]);
  
  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        pointerEvents: "none",
        opacity,
      }}
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9a8a72",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        scroll to explore
      </span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a8a72" strokeWidth="1.5">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </motion.div>
  );
}

function NavAnchorRow({ 
  scrollProgress,
  isScrolledPast 
}: { 
  scrollProgress: any;
  isScrolledPast: boolean;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [signInHovered, setSignInHovered] = useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  // Nav anchor transitions from hero style to navbar style
  const navBg = useTransform(scrollProgress, [0, 0.8, 1], ["transparent", "rgba(255, 248, 242, 0.95)", "rgba(255, 248, 242, 0.95)"]);
  const navBorder = useTransform(scrollProgress, [0, 0.8, 1], ["transparent", "#d6c4af", "#d6c4af"]);
  const navBlur = useTransform(scrollProgress, [0, 0.8, 1], ["none", "blur(20px)", "blur(20px)"]);
  const navHeight = useTransform(scrollProgress, [0, 0.8, 1], ["auto", "56px", "56px"]);
  const navPadding = useTransform(scrollProgress, [0, 0.8, 1], ["20px 32px", "0 32px", "0 32px"]);
  const logoFontSize = useTransform(scrollProgress, [0, 0.8, 1], ["1.25rem", "1.15rem", "1.15rem"]);
  const logoLetterSpacing = useTransform(scrollProgress, [0, 0.8, 1], ["-0.02em", "-0.03em", "-0.03em"]);

  return (
    <motion.header
      style={{
        position: isScrolledPast ? "fixed" : "relative",
        top: isScrolledPast ? 0 : undefined,
        left: 0,
        right: 0,
        zIndex: isScrolledPast ? 100 : 10,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: navBg,
        backdropFilter: navBlur,
        borderBottom: `1.5px solid ${navBorder}`,
        height: navHeight,
        padding: navPadding,
        transition: "background 0.3s, border-bottom 0.3s, height 0.3s, padding 0.3s",
      }}
    >
      <motion.a
        href="/"
        style={{
          fontWeight: 800,
          fontSize: logoFontSize,
          letterSpacing: logoLetterSpacing,
          color: "#1c1108",
          textDecoration: "none",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Website Name
      </motion.a>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Show when="signed-in">
          <Link
            href="/about"
            style={{
              fontSize: "0.85rem",
              color: "#6b5742",
              textDecoration: "none",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}
          >
            About
          </Link>
          <span
            style={{
              fontSize: "0.85rem",
              color: "#1c1108",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}
          >
            {user?.firstName || user?.username || "User"}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#6b5742",
              background: "none",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f5ece3";
              e.currentTarget.style.color = "#1c1108";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "#6b5742";
            }}
          >
            Sign Out
          </button>
        </Show>

        <Show when="signed-out">
          <Link
            href="/about"
            style={{
              fontSize: "0.85rem",
              color: "#6b5742",
              textDecoration: "none",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}
          >
            About
          </Link>
          <button
            onClick={() => window.location.href = "/sign-in"}
            onMouseEnter={() => setSignInHovered(true)}
            onMouseLeave={() => setSignInHovered(false)}
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              background: signInHovered ? "#2d2010" : "#1c1108",
              color: "#FFF1E7",
              border: "none",
              padding: "8px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
              transform: signInHovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.15s, background 0.15s",
            }}
          >
            Sign In
          </button>
        </Show>
      </div>
    </motion.header>
  );
}

export function Hero() {
  // Track window scroll progress (0 to 1 over 100vh)
  const scrollYProgress = useMotionValue(0);
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / vh, 1);
      scrollYProgress.set(progress);
      setIsScrolledPast(progress >= 1);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollYProgress]);

  // Content fades out as user scrolls through hero (0-100vh)
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [1, 0.5, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const contentTranslateY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Demo specific
  const demoOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7], [1, 1, 0]);
  const demoTranslateY = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 100]);
  const demoScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  // Scroll indicator fades early
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Hero is in normal flow - 100vh tall, content fades/translates based on scroll
  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        background: "#FFF8F2",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <NavAnchorRow scrollProgress={scrollYProgress} isScrolledPast={isScrolledPast} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 24px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          style={{
            textAlign: "center",
            maxWidth: "800px",
            width: "100%",
            marginBottom: "32px",
            opacity: contentOpacity,
            y: contentTranslateY,
            scale: contentScale,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#1c1108",
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0,
            }}
          >
            The math you were never shown.
          </h1>
        </motion.div>

        <motion.div
          style={{
            textAlign: "center",
            maxWidth: "700px",
            width: "100%",
            marginBottom: "48px",
            opacity: contentOpacity,
            y: contentTranslateY,
            scale: contentScale,
          }}
        >
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#6b5742",
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0,
            }}
          >
            I created interactive modules teaching concepts the way I wish they were taught to me.
          </p>
        </motion.div>

        <motion.div
          style={{ width: "100%", maxWidth: "900px", opacity: demoOpacity, y: demoTranslateY, scale: demoScale }}
        >
          <CircleToSineDemo />
        </motion.div>
      </div>

      <ScrollIndicator scrollProgress={scrollYProgress} />
    </div>
  );
}