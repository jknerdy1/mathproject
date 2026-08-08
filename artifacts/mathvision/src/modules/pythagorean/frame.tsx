import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import "./theme.css";
import { SECTIONS } from "./sections";

/** Handlers the frame's Back/Next buttons should invoke while a section is
 *  active. Each section registers how advancing/going-back should behave —
 *  a section may advance its own internal beats before exiting to the next
 *  section, so the frame simply forwards the button press. */
export interface SectionNav {
  onNext?: () => void;
  onBack?: () => void;
}

/** Props handed to every section by the module frame. */
export interface SectionProps {
  /** Show / hide the Next (bottom-right) button. */
  showNext: (visible: boolean) => void;
  /** Show / hide the Back (bottom-left) button. */
  showBack: (visible: boolean) => void;
  /** Register the handlers the frame buttons call while this section is active. */
  registerNav: (handlers: SectionNav) => void;
  /** Ask the frame to move to the next section. */
  advanceSection: () => void;
  /** Ask the frame to move to the previous section. */
  backSection: () => void;
}

export interface SectionDef {
  id: string;
  title: string;
  component: React.ComponentType<SectionProps>;
}

export default function PythagoreanModule() {
  const [step, setStep] = useState(0);
  const [nextVisible, setNextVisible] = useState(false);
  const [backVisible, setBackVisible] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const navRef = useRef<SectionNav>({});
  const reduce = useReducedMotion();

  const total = SECTIONS.length;
  const Current = total > 0 ? SECTIONS[step].component : null;

  const advanceSection = useCallback(() => {
    setNextVisible(false);
    setBackVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.min(total - 1, s + 1));
  }, [total]);

  const backSection = useCallback(() => {
    setNextVisible(false);
    setBackVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const registerNav = useCallback((handlers: SectionNav) => {
    navRef.current = handlers;
  }, []);

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navRef.current?.onNext?.();
  };
  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navRef.current?.onBack?.();
  };

  return (
    <div className="pyth-module">
      {/* ── Fixed top-left: return home + module name (no full bar) ── */}
      <header className="pyth-topbar">
        <div className="pyth-topbar__brand">
          <Link
            href="/"
            className="pyth-home-btn"
            aria-label="Return home"
            onClick={() => window.scrollTo({ top: 0 })}
          >
            <Home size={15} />
            <span>Return home</span>
          </Link>
          <span className="pyth-module-tag">The Pythagorean Theorem</span>
        </div>
      </header>

      {/* ── Clickable progress dots, top-right ── */}
      {total > 0 && (
        <div className="pyth-dots pyth-dots--top" aria-label={`Step ${step + 1} of ${total}`}>
          {SECTIONS.map((s, i) => (
            <motion.button
              key={s.id}
              layout
              type="button"
              title={s.title}
              aria-label={`Go to ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              className={`pyth-dot ${
                i === step ? "pyth-dot--active" : i < step ? "pyth-dot--done" : ""
              }`}
              onClick={() => {
                setNextVisible(false);
                setBackVisible(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
                setStep(i);
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              animate={{ width: hover === i ? (i === step ? 24 : 18) : i === step ? 22 : 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
            />
          ))}
        </div>
      )}

      {/* ── Beat area — sections render full-bleed here ── */}
      <main className="pyth-main">
        {Current ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="pyth-beat"
            >
              <Current
                showNext={setNextVisible}
                showBack={setBackVisible}
                registerNav={registerNav}
                advanceSection={advanceSection}
                backSection={backSection}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className="pth-panel"
            style={{
              minHeight: "100dvh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 56px",
              textAlign: "center",
            }}
          >
            <p
              className="pth-display"
              style={{ fontSize: "1.6rem", margin: "0 0 8px" }}
            >
              The Pythagorean Theorem
            </p>
            <p className="pth-muted" style={{ margin: 0 }}>
              The module frame is ready — sections are being built next.
            </p>
          </div>
        )}
      </main>

      {/* ── Back FAB (hidden on the very first beat) ── */}
      <AnimatePresence>
        {backVisible && (
          <motion.button
            key="fab-back"
            type="button"
            className="pyth-fab pyth-fab--back"
            aria-label="Go back"
            onClick={handleBackClick}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            <ArrowLeft size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Next FAB (appears only when the current beat is ready) ── */}
      <AnimatePresence>
        {nextVisible && (
          <motion.button
            key="fab-next"
            type="button"
            className="pyth-fab pyth-fab--next"
            aria-label="Next"
            onClick={handleNextClick}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            <ArrowRight size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}