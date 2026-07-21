import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';

// --- SUB-COMPONENTS --- //

function TriangleExplorer() {
  const [p, setP] = useState({ x: 3, y: 4 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      // Convert SVG coordinates to math coordinates
      // Viewbox is -2 to 10 on x, and -2 to 10 on y. Width is 12.
      const rawX = (clientX / rect.width) * 12 - 2;
      const rawY = 10 - ((clientY / rect.height) * 12 - 2); 
      
      const newX = Math.max(1, Math.min(8, Math.round(rawX * 10) / 10));
      const newY = Math.max(1, Math.min(8, Math.round(rawY * 10) / 10));
      setP({ x: newX, y: newY });
    }
  };

  const a = p.x;
  const b = p.y;
  const c = Math.sqrt(a * a + b * b);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
      <div className="w-full aspect-square md:aspect-[4/3] bg-background/50 rounded-2xl border border-white/10 glass-panel overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
        <svg
          ref={svgRef}
          viewBox="-2 -2 12 12"
          className="w-full h-full touch-none select-none drop-shadow-[0_0_15px_hsla(250,85%,65%,0.3)]"
          onPointerMove={handlePointerMove}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
        >
          <g transform="scale(1, -1)">
            {/* Axis */}
            <line x1="-2" y1="0" x2="10" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.05" />
            <line x1="0" y1="-10" x2="0" y2="2" stroke="rgba(255,255,255,0.2)" strokeWidth="0.05" />

            {/* Triangle */}
            <polygon 
              points={`0,0 ${a},0 ${a},${-b}`} 
              fill="hsla(250,85%,65%,0.2)" 
              stroke="hsl(250,85%,65%)" 
              strokeWidth="0.1" 
              strokeLinejoin="round" 
            />

            {/* Right angle symbol */}
            <polyline points={`${a-0.5},0 ${a-0.5},${-0.5} ${a},${-0.5}`} fill="none" stroke="white" strokeWidth="0.05" />

            {/* Fixed Points */}
            <circle cx="0" cy="0" r="0.15" fill="white" />
            <circle cx={a} cy="0" r="0.15" fill="white" />

            {/* Draggable Point */}
            <g 
              onPointerDown={(e) => { setIsDragging(true); (e.target as Element).setPointerCapture(e.pointerId); }}
              className="cursor-grab active:cursor-grabbing"
            >
              <circle cx={a} cy={-b} r="0.8" fill="transparent" />
              <circle cx={a} cy={-b} r="0.2" fill="hsl(40,90%,55%)" />
            </g>
          </g>
          
          {/* Labels - scaling differently so they don't flip vertically */}
          <text x={a/2} y="0.5" fill="white" fontSize="0.4" textAnchor="middle">a = {a.toFixed(1)}</text>
          <text x={a + 0.3} y={b/2} fill="white" fontSize="0.4" dominantBaseline="middle">b = {b.toFixed(1)}</text>
          <text x={a/2 - 0.3} y={b/2 - 0.3} fill="hsl(40,90%,55%)" fontSize="0.4" textAnchor="end">c = {c.toFixed(1)}</text>
        </svg>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-white/10 w-full text-center">
        <div className="text-3xl md:text-5xl font-mono text-white mb-2 tracking-tight">
          <span className="text-primary">{a.toFixed(1)}²</span> + <span className="text-primary">{b.toFixed(1)}²</span> = <span className="text-accent">{c.toFixed(1)}²</span>
        </div>
        <div className="text-xl md:text-2xl text-muted-foreground font-mono">
          {(a*a).toFixed(2)} + {(b*b).toFixed(2)} = {(c*c).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function FloorTiles({ showSquares = false, showDrag = false }) {
  // Greek blue #1a4fa8 and white #f5f5f5
  return (
    <div className="w-full max-w-4xl mx-auto aspect-square md:aspect-video relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-white">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="med-tile" viewBox="0 0 20 20" width="10%" height="10%">
            <rect width="20" height="20" fill="#f5f5f5" />
            <polygon points="0,0 20,0 0,20" fill="#1a4fa8" />
            <polygon points="20,20 20,0 0,20" fill="#1a4fa8" opacity="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#med-tile)" />
        
        <g transform="translate(50, 50)">
          {/* Highlight central triangle */}
          <polygon points="0,0 10,0 0,10" fill="transparent" stroke="#ffeb3b" strokeWidth="1" />
          
          {showSquares && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {/* a^2 square (bottom) */}
              <polygon points="0,10 10,10 10,20 0,20" fill="rgba(255,235,59,0.2)" stroke="#ffeb3b" strokeWidth="0.5" strokeDasharray="2 1"/>
              {/* b^2 square (left) */}
              <polygon points="0,0 -10,0 -10,10 0,10" fill="rgba(255,235,59,0.2)" stroke="#ffeb3b" strokeWidth="0.5" strokeDasharray="2 1"/>
              {/* c^2 square (hypotenuse diagonal) */}
              <polygon points="10,0 20,10 10,20 0,10" fill="rgba(255,235,59,0.4)" stroke="#ffeb3b" strokeWidth="0.8"/>
            </motion.g>
          )}

          {showDrag && (
            <motion.text 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              x="10" y="10" 
              fill="black" 
              fontSize="4" 
              fontWeight="bold" 
              textAnchor="middle" 
              dominantBaseline="middle"
            >
              Count the tiles! 
            </motion.text>
          )}
        </g>
      </svg>
    </div>
  );
}

function GeometricProof({ split = false }) {
  const [aSize, setASize] = useState(4);
  const bSize = 10 - aSize;
  const c = Math.sqrt(aSize*aSize + bSize*bSize);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {split && (
        <div className="w-full max-w-md mb-4 px-4 glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-4">
          <span className="text-white font-mono whitespace-nowrap">Side (a)</span>
          <input 
            type="range" 
            min="2" 
            max="8" 
            step="0.1"
            value={aSize} 
            onChange={(e) => setASize(parseFloat(e.target.value))}
            className="flex-grow accent-primary"
          />
        </div>
      )}

      <div className={`w-full flex ${split ? 'flex-col md:flex-row' : 'justify-center'} gap-8 items-center`}>
        {/* Layout 1: Outer Square with c^2 in middle */}
        <div className="w-full max-w-[300px] aspect-square relative glass-panel rounded-xl overflow-hidden border border-white/20">
          <svg viewBox="0 0 10 10" className="w-full h-full drop-shadow-xl">
            {/* Background container square */}
            <rect width="10" height="10" fill="hsla(0,0%,100%,0.05)" />
            
            {/* c^2 inner square (implied by triangles) */}
            <polygon points={`${aSize},0 10,${aSize} ${bSize},10 0,${bSize}`} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="0.05"/>
            <text x="5" y="5" fill="white" fontSize="1" textAnchor="middle" dominantBaseline="middle">c²</text>

            {/* 4 Triangles */}
            <polygon points={`0,0 ${aSize},0 0,${bSize}`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
            <polygon points={`${aSize},0 10,0 10,${aSize}`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
            <polygon points={`10,${aSize} 10,10 ${bSize},10`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
            <polygon points={`${bSize},10 0,10 0,${bSize}`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
          </svg>
        </div>

        {split && (
          <>
            <div className="text-4xl font-bold text-white/50">=</div>
            {/* Layout 2: Rearranged into two squares */}
            <div className="w-full max-w-[300px] aspect-square relative glass-panel rounded-xl overflow-hidden border border-white/20">
              <svg viewBox="0 0 10 10" className="w-full h-full drop-shadow-xl">
                <rect width="10" height="10" fill="hsla(0,0%,100%,0.05)" />
                
                {/* a^2 square */}
                <rect x="0" y="0" width={aSize} height={aSize} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="0.05" />
                <text x={aSize/2} y={aSize/2} fill="white" fontSize="1" textAnchor="middle" dominantBaseline="middle">a²</text>
                
                {/* b^2 square */}
                <rect x={aSize} y={aSize} width={bSize} height={bSize} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="0.05" />
                <text x={aSize + bSize/2} y={aSize + bSize/2} fill="white" fontSize="1" textAnchor="middle" dominantBaseline="middle">b²</text>

                {/* 4 Triangles rearranged */}
                <polygon points={`${aSize},0 10,0 ${aSize},${bSize}`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
                <polygon points={`10,0 10,${bSize} ${aSize},${bSize}`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
                <polygon points={`0,${aSize} ${aSize},${aSize} 0,10`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
                <polygon points={`${aSize},${aSize} ${aSize},10 0,10`} fill="hsl(250,85%,65%)" stroke="#fff" strokeWidth="0.05"/>
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AlgebraicProof({ showCancel = false }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center w-full max-w-4xl mx-auto">
      <div className="text-3xl md:text-5xl font-mono space-y-12">
        <motion.div 
          className="flex justify-center items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-panel p-6 rounded-xl border border-primary/30 text-primary">
            Area = (a+b)²
          </div>
          <div className="text-white">=</div>
          <div className="glass-panel p-6 rounded-xl border border-white/20 text-white">
            a² + 2ab + b²
          </div>
        </motion.div>

        <motion.div 
          className="flex justify-center items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="glass-panel p-6 rounded-xl border border-accent/30 text-accent">
            Pieces = c² + 4(½ab)
          </div>
          <div className="text-white">=</div>
          <div className="glass-panel p-6 rounded-xl border border-white/20 text-white">
            c² + 2ab
          </div>
        </motion.div>

        <motion.div 
          className="mt-16 text-4xl md:text-6xl text-white font-bold"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          a² + <span className="relative inline-block">
            2ab
            {showCancel && <motion.span 
              initial={{ width: 0 }} animate={{ width: "100%" }} 
              className="absolute left-0 top-1/2 h-1 bg-red-500 rounded-full"
            />}
          </span> + b² = c² + <span className="relative inline-block">
            2ab
            {showCancel && <motion.span 
              initial={{ width: 0 }} animate={{ width: "100%" }} 
              className="absolute left-0 top-1/2 h-1 bg-red-500 rounded-full"
            />}
          </span>
        </motion.div>
        
        {showCancel && (
          <motion.div 
            className="text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-bold mt-12 drop-shadow-[0_0_20px_hsla(250,85%,65%,0.5)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            a² + b² = c²
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DistanceExplorer() {
  const [p1, setP1] = useState({ x: 2, y: 2 });
  const [p2, setP2] = useState({ x: 7, y: 6 });
  const [activePoint, setActivePoint] = useState<1 | 2 | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePoint || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width * 10;
    const rawY = 10 - ((e.clientY - rect.top) / rect.height * 10);
    const newX = Math.max(0.5, Math.min(9.5, Math.round(rawX * 10) / 10));
    const newY = Math.max(0.5, Math.min(9.5, Math.round(rawY * 10) / 10));

    if (activePoint === 1) setP1({ x: newX, y: newY });
    else setP2({ x: newX, y: newY });
  };

  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const d = Math.sqrt(dx*dx + dy*dy);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      <div className="w-full aspect-[2/1] bg-background/50 rounded-2xl border border-white/10 glass-panel overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
        <svg
          ref={svgRef}
          viewBox="0 0 10 10"
          className="w-full h-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={() => setActivePoint(null)}
          onPointerLeave={() => setActivePoint(null)}
        >
          <g transform="scale(1, -1) translate(0, -10)">
            {/* Triangle underneath */}
            <polygon points={`${p1.x},${p1.y} ${p2.x},${p1.y} ${p2.x},${p2.y}`} fill="hsla(250,85%,65%,0.1)" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p1.y} stroke="hsl(250,85%,65%)" strokeWidth="0.05" strokeDasharray="0.2 0.2" />
            <line x1={p2.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="hsl(250,85%,65%)" strokeWidth="0.05" strokeDasharray="0.2 0.2" />
            
            {/* Distance line */}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="white" strokeWidth="0.08" />

            {/* Draggable Points */}
            <g 
              onPointerDown={(e) => { setActivePoint(1); (e.target as Element).setPointerCapture(e.pointerId); }}
              className="cursor-grab active:cursor-grabbing"
            >
              <circle cx={p1.x} cy={p1.y} r="0.6" fill="transparent" />
              <circle cx={p1.x} cy={p1.y} r="0.15" fill="hsl(40,90%,55%)" />
            </g>
            <g 
              onPointerDown={(e) => { setActivePoint(2); (e.target as Element).setPointerCapture(e.pointerId); }}
              className="cursor-grab active:cursor-grabbing"
            >
              <circle cx={p2.x} cy={p2.y} r="0.6" fill="transparent" />
              <circle cx={p2.x} cy={p2.y} r="0.15" fill="hsl(40,90%,55%)" />
            </g>
          </g>

          <text x={(p1.x + p2.x)/2} y={10 - p1.y + 0.5} fill="hsl(250,85%,65%)" fontSize="0.4" textAnchor="middle">|x₂ - x₁| = {dx.toFixed(1)}</text>
          <text x={p2.x + 0.3} y={10 - (p1.y + p2.y)/2} fill="hsl(250,85%,65%)" fontSize="0.4" dominantBaseline="middle">|y₂ - y₁| = {dy.toFixed(1)}</text>
        </svg>
      </div>
      
      <div className="glass-panel p-6 rounded-2xl border-white/10 text-center w-full">
        <div className="text-3xl font-mono text-white mb-2">
          d² = <span className="text-primary">({dx.toFixed(1)})²</span> + <span className="text-primary">({dy.toFixed(1)})²</span>
        </div>
        <div className="text-xl text-muted-foreground font-mono">
          d = {d.toFixed(2)}
        </div>
      </div>
    </div>
  );
}


// --- MAIN PAGE COMPONENT --- //

const SECTIONS = [
  { id: 0, title: "The Hook" },
  { id: 1, title: "The Fundamental Law" },
  { id: 2, title: "Interactive Triangle" },
  { id: 3, title: "Mediterranean Courtyard" },
  { id: 4, title: "Square Expansion" },
  { id: 5, title: "Counting Tiles" },
  { id: 6, title: "Geometric Abstraction" },
  { id: 7, title: "Four Triangles" },
  { id: 8, title: "The Rearrangement" },
  { id: 9, title: "Algebraic Proof" },
  { id: 10, title: "The Equation" },
  { id: 11, title: "Distance in Space" },
  { id: 12, title: "Distance Formula" },
  { id: 13, title: "Equation of a Circle" },
  { id: 14, title: "The Circle Derivation" },
  { id: 15, title: "Conclusion" }
];

export default function PythagoreanModule() {
  const [step, setStep] = useState(0);

  // Auto-advance logic for step 0
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.min(SECTIONS.length - 1, s + 1));
  };
  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.max(0, s - 1));
  };

  const currentSection = SECTIONS[step];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 selection:text-primary-foreground relative">
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none fixed z-0"></div>

      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 py-4 px-6 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/modules" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-0.5">Geometry</div>
            <div className="text-sm font-semibold text-white">The Pythagorean Theorem</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground font-mono">Step {step + 1} of {SECTIONS.length}</div>
          <div className="flex gap-1">
            {SECTIONS.map((s, i) => (
              <div 
                key={s.id} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary shadow-[0_0_8px_hsla(250,85%,65%,0.8)]' : i < step ? 'w-2 bg-primary/50' : 'w-2 bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={step === SECTIONS.length - 1}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-[0_0_15px_hsla(250,85%,65%,0.3)] disabled:shadow-none flex items-center gap-2"
        >
          Next <ChevronRight size={16} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-32 px-6 md:px-12 relative z-10 w-full max-w-7xl mx-auto min-h-[100dvh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center justify-center"
          >
            {/* Step 0: Hook */}
            {step === 0 && (
              <div className="text-center max-w-4xl mx-auto space-y-12">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white/90">
                  You were taught that a² + b² = c² is a triangle formula.
                </h1>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 1 }}
                  className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-destructive to-accent drop-shadow-xl"
                >
                  You were lied to.
                </motion.div>
              </div>
            )}

            {/* Step 1: Fundamental Law */}
            {step === 1 && (
              <div className="text-center max-w-3xl mx-auto glass-panel p-12 rounded-[2rem] border-primary/20">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-primary border border-primary/30 rotate-3">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-2xl md:text-4xl font-medium leading-relaxed text-white/90">
                  The Pythagorean theorem isn't just a formula to plug numbers into for school tests. 
                  It is a <span className="text-primary font-bold glow-text">fundamental law</span> of geometry and space itself.
                </p>
                <p className="text-xl text-muted-foreground mt-8">
                  Let's see where it comes from.
                </p>
              </div>
            )}

            {/* Step 2: Interactive Triangle */}
            {step === 2 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-2xl">
                  <h2 className="text-3xl font-bold mb-4">The Triangle Explorer</h2>
                  <p className="text-xl text-muted-foreground">Drag the highlighted vertex to stretch the triangle. The law always holds.</p>
                </div>
                <TriangleExplorer />
              </div>
            )}

            {/* Step 3: Mediterranean Courtyard */}
            {step === 3 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">The Mediterranean Courtyard</h2>
                  <p className="text-xl text-muted-foreground">Ancient Greeks noticed this rule embedded in everyday tile floors. Look at the central highlighted triangle.</p>
                </div>
                <FloorTiles showSquares={false} />
              </div>
            )}

            {/* Step 4: Square Expansion */}
            {step === 4 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Squares on Sides</h2>
                  <p className="text-xl text-muted-foreground">If we draw a square on each side of the right triangle, something magical happens.</p>
                </div>
                <FloorTiles showSquares={true} />
              </div>
            )}

            {/* Step 5: Counting Tiles */}
            {step === 5 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4 text-primary">Tile Counting</h2>
                  <p className="text-xl text-white/80 leading-relaxed bg-primary/10 p-6 rounded-2xl border border-primary/20">
                    The area of the two smaller squares is exactly equal to the area of the larger square. The law reveals itself just by counting the tiles — no algebra required.
                    <br/><br/>
                    <strong className="text-2xl">a² + b² = c²</strong>
                  </p>
                </div>
                <FloorTiles showSquares={true} showDrag={true} />
              </div>
            )}

            {/* Step 6: Geometric Abstraction */}
            {step === 6 && (
              <div className="text-center max-w-3xl mx-auto">
                <div className="text-6xl text-primary mb-8 font-serif">"</div>
                <p className="text-3xl md:text-5xl font-medium leading-relaxed text-white">
                  Counting tiles is neat, but how do we prove this holds for <i className="text-accent">any</i> triangle proportions?
                </p>
              </div>
            )}

            {/* Step 7: Four Triangles */}
            {step === 7 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">The Arrangement</h2>
                  <p className="text-xl text-muted-foreground">Take four identical copies of any right triangle. They arrange perfectly into a large square. The empty center must be a square too — its area is c².</p>
                </div>
                <GeometricProof split={false} />
              </div>
            )}

            {/* Step 8: Rearrangement */}
            {step === 8 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">The Slide Comparison</h2>
                  <p className="text-xl text-muted-foreground mb-6">We just slid the pieces inside the same boundary. The total triangle area didn't change — so the leftover empty space must be equal.</p>
                  <div className="inline-block bg-white/10 px-6 py-2 rounded-full font-mono text-xl text-white font-bold border border-white/20">
                    c² = a² + b²
                  </div>
                </div>
                <GeometricProof split={true} />
              </div>
            )}

            {/* Step 9: Algebraic Proof */}
            {step === 9 && (
              <div className="w-full flex flex-col items-center gap-8">
                <div className="text-center max-w-3xl mb-8">
                  <h2 className="text-3xl font-bold mb-4">Let's be formal</h2>
                  <p className="text-xl text-muted-foreground">We can prove the exact same thing with pure algebra by calculating the area of the large square in two different ways.</p>
                </div>
                <AlgebraicProof showCancel={false} />
              </div>
            )}

            {/* Step 10: The Cancel */}
            {step === 10 && (
              <div className="w-full flex flex-col items-center gap-8">
                <div className="text-center max-w-3xl mb-8">
                  <h2 className="text-3xl font-bold mb-4">The Grand Reveal</h2>
                  <p className="text-xl text-muted-foreground">Since both expressions equal the area of the same large square, set them equal to each other. Cancel the 2ab from both sides.</p>
                </div>
                <AlgebraicProof showCancel={true} />
              </div>
            )}

            {/* Step 11: Distance */}
            {step === 11 && (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="text-center max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4 text-accent">Beyond Triangles</h2>
                  <p className="text-xl text-muted-foreground">Finding the straight-line distance between two points on a grid is just the Pythagorean theorem in disguise. Draw a right triangle beneath them.</p>
                </div>
                <DistanceExplorer />
              </div>
            )}

            {/* Step 12: Distance Formula */}
            {step === 12 && (
              <div className="text-center max-w-4xl mx-auto glass-panel p-16 rounded-[3rem] border border-accent/20">
                <p className="text-2xl text-muted-foreground mb-8">This works for any two points in space. The distance formula <strong className="text-white">IS</strong> the Pythagorean theorem.</p>
                <div className="text-4xl md:text-6xl font-mono text-white font-bold tracking-tight">
                  d = √(<span className="text-accent">x₂-x₁</span>)² + (<span className="text-accent">y₂-y₁</span>)²
                </div>
              </div>
            )}

            {/* Step 13: Equation of a circle */}
            {step === 13 && (
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-primary">The Equation of a Circle</h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-12">
                  What is a circle? It's just the set of all points (x, y) that are the same distance (r) from a center point (h, k).
                </p>
                <div className="text-3xl font-mono text-white mb-6">
                  r = √(<span className="text-primary">x-h</span>)² + (<span className="text-primary">y-k</span>)²
                </div>
              </div>
            )}

            {/* Step 14: Circle Derivation */}
            {step === 14 && (
              <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-8 text-primary">Square Both Sides</h2>
                <div className="text-4xl md:text-6xl font-mono text-white mb-16 font-bold">
                  r² = (<span className="text-primary">x-h</span>)² + (<span className="text-primary">y-k</span>)²
                </div>
                <div className="glass-panel p-8 rounded-2xl border-white/10">
                  <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                    We just derived the equation of a circle. It's the distance formula with a fixed radius. And the distance formula is the Pythagorean theorem in disguise.
                  </p>
                  <div className="text-2xl font-mono text-white/50">c² = a² + b²</div>
                </div>
              </div>
            )}

            {/* Step 15: Conclusion */}
            {step === 15 && (
              <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
                <div className="mb-16 space-y-8">
                  <p className="text-2xl text-muted-foreground">There are hundreds of ways to prove the Pythagorean theorem. What we explored today is just a handful.</p>
                  <p className="text-3xl text-white font-medium">This isn't just a random formula. It's a fundamental law of geometry, mathematics, and of our world itself.</p>
                </div>
                
                <div className="text-6xl md:text-8xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-destructive font-bold drop-shadow-[0_0_40px_hsla(250,85%,65%,0.6)] mb-16">
                  a² + b² = c²
                </div>

                <Link href="/modules" className="bg-white text-background hover:bg-gray-200 px-10 py-5 rounded-full font-bold text-xl transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Back to Modules
                </Link>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav / Controls */}
      <div className="fixed bottom-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
        <button 
          onClick={handlePrev}
          disabled={step === 0}
          className="pointer-events-auto bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white px-5 py-3 rounded-full font-bold text-sm transition-all disabled:opacity-0 flex items-center gap-2 border border-white/10"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        
        {step < SECTIONS.length - 1 && (
          <button 
            onClick={handleNext}
            className="pointer-events-auto bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_25px_hsla(250,85%,65%,0.4)] flex items-center gap-2"
          >
            Next <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}