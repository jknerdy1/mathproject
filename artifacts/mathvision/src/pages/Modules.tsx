import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";

const MODULES = [
  {
    id: "pythagorean",
    title: "Pythagorean Theorem",
    kicker: "Geometry",
    href: "/modules/pythagorean",
  },
];

const PLACEHOLDER_TILES = Array.from({ length: 11 }, (_, i) => ({
  id: `coming-soon-${i + 1}`,
}));

function ModuleTile({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.04 }}
      style={{ height: "100%" }}
    >
      <Link
        href="/modules/pythagorean"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          height: "100%",
          minHeight: "130px",
          background: "#fff",
          border: "1.5px solid var(--site-border)",
          borderRadius: "14px",
          textDecoration: "none",
          color: "var(--site-text)",
          transition: "transform 0.16s ease, box-shadow 0.16s ease",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            textAlign: "center",
            padding: "0 12px",
          }}
        >
          {MODULES[0].title}
        </span>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--site-text-muted)",
          }}
        >
          {MODULES[0].kicker}
        </span>
      </Link>
    </motion.div>
  );
}

function PlaceholderTile({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.04 }}
      style={{
        background: "#f5f3ef",
        border: "1.5px solid #e8e4dc",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "130px",
        minHeight: "130px",
        cursor: "default",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8b7d6b",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        COMING SOON
      </span>
    </motion.div>
  );
}

export default function Modules() {
  return (
    <div
      className="modules-page"
      style={{
        minHeight: "100vh",
        background: "var(--site-bg)",
        color: "var(--site-text)",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
        overflowX: "clip",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <SiteNav />

        <div style={{ position: "relative" }}>
          <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px 96px" }}>

          {/* ── Module grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "22px",
              alignItems: "start",
            }}
          >
            {[
              <ModuleTile key="pythagorean" index={0} />,
              ...PLACEHOLDER_TILES.map((tile, i) => (
                <PlaceholderTile key={tile.id} index={i + 1} />
              )),
            ]}
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
        <div className="modules-wallpaper" />
      </div>
    </div>
    </div>
  );
}