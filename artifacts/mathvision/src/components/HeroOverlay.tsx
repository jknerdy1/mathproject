import { useState, useEffect } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";
import SineWaveDemo from "@/components/SineWaveDemo";

export default function HeroOverlay() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const [signInHovered, setSignInHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);
  const [aboutHovered, setAboutHovered] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
            <SineWaveDemo />
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