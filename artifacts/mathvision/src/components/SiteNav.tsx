import { useState } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";

export function SiteNav() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [aboutHovered, setAboutHovered] = useState(false);
  const [signInHovered, setSignInHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);

  return (
    <nav
      className="site-nav sticky top-0 z-50"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "56px",
      }}
    >
      {/* Logo / site name */}
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
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        Website Name
      </Link>

      {/* Right-side links */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

        {/* About link — underline slides in on hover */}
        <Link
          href="/about"
          onMouseEnter={() => setAboutHovered(true)}
          onMouseLeave={() => setAboutHovered(false)}
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: aboutHovered ? "var(--site-text)" : "var(--site-text-muted)",
            textDecoration: "none",
            paddingBottom: "2px",
            borderBottom: `2px solid ${aboutHovered ? "var(--site-text)" : "transparent"}`,
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
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "transparent",
              color: signOutHovered ? "var(--site-text)" : "var(--site-text-muted)",
              border: `1.5px solid ${signOutHovered ? "var(--site-text)" : "var(--site-border)"}`,
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
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
            }}
          >
            Sign In
          </button>
        </Show>
      </div>
    </nav>
  );
}
