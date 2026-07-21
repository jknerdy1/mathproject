import React from "react";
import { useUser, useClerk } from "@clerk/react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { LogOut, Lock, Play } from "lucide-react";

export default function Modules() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none fixed"></div>
      
      {/* Navbar */}
      <nav className="relative z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center rotate-12 drop-shadow-[0_0_12px_hsla(250,85%,65%,0.6)] group-hover:rotate-[24deg] transition-transform">
            <span className="text-white -rotate-12 font-mono font-bold leading-none">∑</span >
          </div>
          MathVision
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            Hello, <span className="text-white font-semibold">{user?.firstName || "Explorer"}</span>
          </span>
          <button 
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Your Journeys</h1>
          <p className="text-xl text-muted-foreground">Select a module to begin exploring.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 - Pythagorean Theorem */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent hover:-translate-y-2 transition-transform duration-300 group flex flex-col h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
            
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsla(250,85%,65%,1)]"></span>
              Geometry · 25 min
            </div>
            
            <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">The Pythagorean Theorem</h2>
            <p className="text-muted-foreground text-lg mb-8 flex-grow leading-relaxed">
              Discover why a² + b² = c² isn't just a formula — it's a fundamental law of space itself.
            </p>
            
            <Link href="/modules/pythagorean" className="bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-[0_0_20px_hsla(250,85%,65%,0.3)]">
              <Play size={20} fill="currentColor" />
              Start Module
            </Link>
          </motion.div>

          {/* Coming Soon Cards */}
          {[
            { title: "The Derivative", cat: "Calculus", desc: "Watch the secant become the tangent line." },
            { title: "Euler's Identity", cat: "Complex Numbers", desc: "The most beautiful equation in mathematics." },
            { title: "Prime Numbers", cat: "Number Theory", desc: "The indivisible atoms of arithmetic." },
          ].map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-panel p-8 rounded-[2rem] border border-white/5 opacity-60 flex flex-col h-full relative"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                {mod.cat} · Coming Soon
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-white/50">{mod.title}</h2>
              <p className="text-muted-foreground text-lg mb-8 flex-grow leading-relaxed">
                {mod.desc}
              </p>
              
              <div className="bg-black/40 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 text-muted-foreground cursor-not-allowed border border-white/5">
                <Lock size={18} />
                Locked
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
