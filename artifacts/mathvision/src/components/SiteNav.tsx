import { useUser, useClerk, Show } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";

export function SiteNav() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
        }}
      >
        Website Name
      </Link>

      {/* Right-side links */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link
          href="/about"
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--site-text-muted)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--site-text)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--site-text-muted)")}
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "transparent",
              color: "var(--site-text-muted)",
              border: "1.5px solid var(--site-border)",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </Show>

        <Show when="signed-out">
          <button
            onClick={() => navigate("/sign-in")}
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
            }}
          >
            Sign In
          </button>
        </Show>
      </div>
    </nav>
  );
}
