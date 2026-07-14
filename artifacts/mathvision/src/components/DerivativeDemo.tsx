import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

// f(x) = 0.1x³ - 0.5x² + x + 2
const f = (x: number) => 0.1 * Math.pow(x, 3) - 0.5 * Math.pow(x, 2) + x + 2;
// f'(x) = 0.3x² - x + 1
const df = (x: number) => 0.3 * Math.pow(x, 2) - x + 1;

export function DerivativeDemo() {
  const [p2X, setP2X] = useState(6.5);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const p1X = 2; // Fixed point

  const width = 800;
  const height = 500;
  const xMin = 0;
  const xMax = 8;
  const yMin = 0;
  const yMax = 20;

  const scaleX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
  const scaleY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
  const invertX = (px: number) => (px / width) * (xMax - xMin) + xMin;

  const curvePoints = [];
  for (let x = xMin; x <= xMax; x += 0.1) {
    curvePoints.push(`${scaleX(x)},${scaleY(f(x))}`);
  }
  const pathD = `M ${curvePoints.join(' L ')}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).id === 'p2-handle' || (e.target as Element).id === 'p2-group') {
      setIsDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      let newX = invertX(px);
      newX = Math.max(xMin + 0.5, Math.min(xMax - 0.5, newX));
      
      // Prevent exact overlap to avoid division by zero visually
      if (Math.abs(newX - p1X) < 0.05) {
        newX = p1X + (newX > p1X ? 0.05 : -0.05);
      }
      setP2X(newX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if ((e.target as Element).id === 'p2-handle' || (e.target as Element).id === 'p2-group') {
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const p1Y = f(p1X);
  const p2Y = f(p2X);
  
  const distance = Math.abs(p2X - p1X);
  const isClose = distance < 0.15;
  
  const slope = isClose ? df(p1X) : (p2Y - p1Y) / (p2X - p1X);
  
  // Extend line to bounds
  const lineY1 = slope * (xMin - p1X) + p1Y;
  const lineY2 = slope * (xMax - p1X) + p1Y;

  const animateToP1 = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let startX = p2X;
    let targetX = p1X + 0.05;
    let duration = 2500; // ms
    let startTime: number | null = null;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentX = startX + (targetX - startX) * ease;
      setP2X(currentX);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(step);
  };

  const reset = () => {
    if (!isAnimating) {
      setP2X(6.5);
    }
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row items-center justify-center p-6 glass-panel rounded-2xl shadow-2xl relative border-primary/20">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none rounded-2xl"></div>
      
      <div className="relative z-10 w-full xl:w-[65%] aspect-[8/5] bg-background/50 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden">
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Grid lines */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line 
              key={`h-${i}`} 
              x1={0} y1={scaleY(i * 2)} 
              x2={width} y2={scaleY(i * 2)} 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="1" 
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line 
              key={`v-${i}`} 
              x1={scaleX(i)} y1={0} 
              x2={scaleX(i)} y2={height} 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="1" 
            />
          ))}

          {/* Curve */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="4" 
            strokeLinecap="round"
            className="drop-shadow-[0_0_12px_hsla(250,85%,65%,0.6)]"
          />

          {/* Secant/Tangent Line */}
          <line 
            x1={scaleX(xMin)} y1={scaleY(lineY1)} 
            x2={scaleX(xMax)} y2={scaleY(lineY2)} 
            stroke="hsl(var(--accent))" 
            strokeWidth="3"
            strokeDasharray={isClose ? "none" : "8 8"}
            className="transition-all duration-75 drop-shadow-[0_0_8px_hsla(40,90%,55%,0.5)]"
          />

          {/* Point 1 (Fixed) */}
          <circle 
            cx={scaleX(p1X)} cy={scaleY(p1Y)} 
            r="8" 
            fill="hsl(var(--primary))" 
          />
          <text 
            x={scaleX(p1X) - 15} 
            y={scaleY(p1Y) - 20} 
            fill="white" 
            className="text-base font-mono font-bold"
          >
            P₁
          </text>

          {/* Point 2 (Draggable) */}
          <g 
            id="p2-group"
            onPointerDown={handlePointerDown} 
            className={isAnimating ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}
          >
            <circle 
              id="p2-handle"
              cx={scaleX(p2X)} cy={scaleY(p2Y)} 
              r="40" 
              fill="transparent" 
            />
            <circle 
              cx={scaleX(p2X)} cy={scaleY(p2Y)} 
              r="10" 
              fill="hsl(var(--accent))" 
              className="drop-shadow-[0_0_12px_hsla(40,90%,55%,0.8)]"
            />
            <text 
              x={scaleX(p2X) + 18} 
              y={scaleY(p2Y) - 18} 
              fill="hsl(var(--accent))" 
              className="text-base font-mono font-bold pointer-events-none select-none"
            >
              P₂
            </text>
          </g>
        </svg>
      </div>

      <div className="w-full xl:w-[35%] flex flex-col gap-6 z-10">
        <div className="bg-background/80 backdrop-blur-md p-8 rounded-xl border border-white/5">
          <h3 className="text-2xl font-bold mb-3 text-white">The Limit in Action</h3>
          <p className="text-muted-foreground mb-6 h-20 leading-relaxed">
            {isClose 
              ? "Almost there! As P₂ approaches P₁, the secant line visually transforms into the tangent line." 
              : "Drag P₂ towards P₁. The secant line shows the average rate of change between the two points."}
          </p>
          
          <div className="bg-black/40 rounded-xl p-5 font-mono space-y-4 border border-white/5 shadow-inner">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Δx (distance)</span>
              <span className="text-white text-lg">{distance.toFixed(3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{isClose ? "Tangent Slope" : "Secant Slope"}</span>
              <span className="text-accent text-2xl font-bold">{slope.toFixed(3)}</span>
            </div>
            
            {/* Height-animated container to keep layout stable */}
            <div className="h-10 flex items-center">
              {isClose && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full pt-3 border-t border-white/10 text-primary text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} /> Instantaneous rate found!
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={animateToP1}
            disabled={isAnimating || isClose}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_hsla(250,85%,65%,0.3)] disabled:shadow-none"
          >
            <Play size={20} fill="currentColor" />
            Animate Limit
          </button>
          <button 
            onClick={reset}
            disabled={isAnimating}
            className="bg-white/5 border border-white/10 hover:bg-white/10 py-4 px-5 rounded-xl text-white transition-all disabled:opacity-50"
            aria-label="Reset position"
          >
            <RotateCcw size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
