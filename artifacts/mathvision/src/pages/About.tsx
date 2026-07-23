import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { DerivativeDemo } from '@/components/DerivativeDemo';
import { SiteNav } from '@/components/SiteNav';
import {
  Telescope,
  Lightbulb,
  Puzzle,
  ArrowRight,
  Sparkles,
  FunctionSquare,
  Network,
} from 'lucide-react';

const FadeIn = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.65, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function About() {
  const bg = 'var(--site-bg)';
  const text = 'var(--site-text)';
  const muted = 'var(--site-text-muted)';
  const border = 'var(--site-border)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        fontFamily: "'Space Grotesk', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <SiteNav />

      {/* Hero */}
      <section
        style={{
          padding: 'clamp(64px,10vw,120px) 24px clamp(48px,8vw,96px)',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '999px',
              border: `1.5px solid ${border}`,
              background: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: muted,
              marginBottom: '28px',
            }}
          >
            <Sparkles size={14} color="var(--site-text-muted)" />
            A new way to experience mathematics
          </div>

          <h1
            style={{
              fontWeight: 800,
              fontSize: 'clamp(2.4rem, 7vw, 5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              color: text,
              marginBottom: '24px',
            }}
          >
            See the math,{' '}
            <span style={{ color: '#6644cc' }}>don't just memorize it.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              color: muted,
              maxWidth: '640px',
              margin: '0 auto 40px',
              lineHeight: 1.65,
            }}
          >
            Where math stops being a chore and starts being an adventure.
            Guided discovery for the curious student who wants to know{' '}
            <em style={{ color: text, fontStyle: 'italic' }}>why</em> it works.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--site-text)',
                color: 'var(--site-bg)',
                padding: '14px 32px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Explore Modules
              <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 32px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                color: text,
                border: `1.5px solid ${border}`,
                background: '#fff',
              }}
            >
              Try the Demo
            </a>
          </div>
        </motion.div>
      </section>

      {/* Philosophy */}
      <section
        id="philosophy"
        style={{
          padding: 'clamp(48px,8vw,96px) 24px',
          borderTop: `1.5px solid ${border}`,
          borderBottom: `1.5px solid ${border}`,
          background: '#fff',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  letterSpacing: '-0.03em',
                  color: text,
                  marginBottom: '16px',
                }}
              >
                Understanding over memorization.
              </h2>
              <p style={{ fontSize: '1.1rem', color: muted, maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
                We believe every student is capable of discovering mathematical truths. We don't hand
                you the formula — we provide the map so you can find it yourself.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: <Telescope size={28} color="#6644cc" />,
                title: 'Guided Discovery',
                desc: "Don't just accept formulas blindly. Follow the breadcrumbs and logically discover the relationships yourself.",
                accent: '#ede8ff',
              },
              {
                icon: <Lightbulb size={28} color="#d4860a" />,
                title: 'Visual Intuition',
                desc: "If you can't see it, you don't fully understand it. We translate abstract symbols into interactive, living geometry.",
                accent: '#fff8e8',
              },
              {
                icon: <Puzzle size={28} color="#cc3355" />,
                title: 'Connected Concepts',
                desc: "Math isn't a list of isolated tricks. It's a single, beautiful web of interconnected ideas. We show you the threads.",
                accent: '#ffeeee',
              },
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div
                  className="content-card"
                  style={{ height: '100%' }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: feature.accent,
                      border: `1.5px solid ${border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: '10px', color: text }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: muted, lineHeight: 1.65 }}>{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section
        id="demo"
        style={{ padding: 'clamp(48px,8vw,96px) 24px' }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ marginBottom: '40px', maxWidth: '600px' }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  letterSpacing: '-0.03em',
                  color: text,
                  marginBottom: '20px',
                }}
              >
                Play with concepts,
                <br />
                not just symbols.
              </h2>
              <div style={{ color: muted, fontSize: '1rem', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '16px' }}>Textbooks define the derivative as a cold, abstract limit:</p>
                <div
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${border}`,
                    borderRadius: '10px',
                    padding: '14px 20px',
                    fontFamily: "'Spline Sans Mono', monospace",
                    fontSize: '0.95rem',
                    display: 'inline-block',
                    marginBottom: '16px',
                    color: text,
                  }}
                >
                  <span style={{ color: '#6644cc' }}>f′(x)</span>
                  {' = '}
                  <span style={{ color: '#d4860a' }}>lim</span>
                  <sub style={{ fontSize: '0.7rem', marginRight: '4px', color: muted }}>h→0</sub>
                  <span>[ f(x+h) − f(x) ] / h</span>
                </div>
                <p>
                  We define it as a visual story. Drag the point below. Watch the secant line
                  gracefully become the tangent line in real-time. Feel the math.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <DerivativeDemo />
          </FadeIn>
        </div>
      </section>

      {/* Story / philosophy */}
      <section
        style={{
          padding: 'clamp(48px,8vw,96px) 24px',
          borderTop: `1.5px solid ${border}`,
          borderBottom: `1.5px solid ${border}`,
          background: '#fff',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <FadeIn>
            {/* Visual accent */}
            <div
              style={{
                aspectRatio: '1',
                borderRadius: '24px',
                border: `1.5px solid ${border}`,
                background: '#f8f4ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
              }}
            >
              <div
                style={{
                  fontFamily: "'Spline Sans Mono', monospace",
                  fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                  fontWeight: 700,
                  color: text,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                }}
              >
                e<sup style={{ fontSize: '0.55em', color: '#6644cc' }}>iπ</sup> + 1 = 0
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                letterSpacing: '-0.03em',
                marginBottom: '20px',
                color: text,
              }}
            >
              Every formula is a story waiting to be told.
            </h2>
            <div style={{ color: muted, lineHeight: 1.75, fontSize: '1.05rem' }}>
              <p style={{ marginBottom: '16px' }}>
                Mathematics wasn't handed down on stone tablets. It was fiercely debated, slowly
                uncovered, and born out of necessity by real people trying to solve real problems.
              </p>
              <p>
                Our modules don't just teach you the mechanics. They teach you the context. When you
                understand the historical problem they were trying to solve, the solution suddenly
                makes perfect sense.
              </p>
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '28px',
                fontWeight: 700,
                fontSize: '1rem',
                color: '#6644cc',
                textDecoration: 'none',
              }}
            >
              Browse the modules
              <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Curriculum overview */}
      <section id="curriculum" style={{ padding: 'clamp(48px,8vw,96px) 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  letterSpacing: '-0.03em',
                  color: text,
                  marginBottom: '14px',
                }}
              >
                The Curriculum
              </h2>
              <p style={{ color: muted, maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
                Comprehensive, immersive journeys through the core pillars of mathematics.
                No rote memorization required.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: <FunctionSquare size={24} color="#3377cc" />,
                title: 'Pre-Calculus',
                desc: 'Master functions, trigonometry, and the fundamental shapes of mathematics before the dive.',
                accent: '#eef4ff',
                borderC: '#b8d0f0',
              },
              {
                icon: <ArrowRight size={24} color="#6644cc" />,
                title: 'Calculus I',
                desc: 'Limits, derivatives, and the gorgeous mathematics of continuous change and motion.',
                accent: '#f0ecff',
                borderC: '#c8b8f0',
              },
              {
                icon: <Network size={24} color="#d4860a" />,
                title: 'Linear Algebra',
                desc: 'Vectors, matrices, and navigating multi-dimensional spaces with absolute clarity.',
                accent: '#fff8e8',
                borderC: '#e8d090',
              },
            ].map((mod, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div
                  style={{
                    background: mod.accent,
                    border: `1.5px solid ${mod.borderC}`,
                    borderRadius: '16px',
                    padding: '28px',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: '#fff',
                      border: `1.5px solid ${mod.borderC}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    {mod.icon}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', marginBottom: '8px', color: text }}>
                    {mod.title}
                  </h3>
                  <p style={{ color: muted, lineHeight: 1.65, fontSize: '0.95rem' }}>{mod.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: 'clamp(48px,8vw,96px) 24px',
          borderTop: `1.5px solid ${border}`,
          background: '#fff',
          textAlign: 'center',
        }}
      >
        <FadeIn>
          <h2
            style={{
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.04em',
              color: text,
              marginBottom: '16px',
            }}
          >
            Ready to see math differently?
          </h2>
          <p style={{ color: muted, fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.65 }}>
            Join students who have discovered the profound beauty of true mathematical understanding.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--site-text)',
              color: 'var(--site-bg)',
              padding: '16px 40px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '1.05rem',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Start Exploring
            <ArrowRight size={18} />
          </Link>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1.5px solid ${border}`,
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link href="/" style={{ fontWeight: 800, letterSpacing: '-0.02em', color: text, textDecoration: 'none' }}>
          Website Name
        </Link>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['About', 'For Teachers', 'Privacy', 'Terms'].map((l) => (
            <a key={l} href="#" style={{ fontSize: '0.85rem', color: muted, textDecoration: 'none' }}>
              {l}
            </a>
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', color: muted }}>
          © {new Date().getFullYear()} Website Name
        </span>
      </footer>
    </div>
  );
}
