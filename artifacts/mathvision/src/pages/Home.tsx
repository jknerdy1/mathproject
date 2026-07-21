import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { DerivativeDemo } from '@/components/DerivativeDemo';
import { 
  Telescope, 
  Lightbulb, 
  Puzzle, 
  ArrowRight, 
  Sparkles,
  FunctionSquare,
  Network
} from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Home() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center rotate-12 drop-shadow-[0_0_12px_hsla(250,85%,65%,0.6)]">
            <span className="text-white -rotate-12 font-mono font-bold leading-none">∑</span >
          </div>
          MathVision
        </div>
        <div className="hidden md:flex gap-10 text-sm font-medium text-muted-foreground">
          <a href="#philosophy" className="hover:text-white transition-colors py-2">Philosophy</a>
          <a href="#demo" className="hover:text-white transition-colors py-2">Interactive Demo</a>
          <a href="#curriculum" className="hover:text-white transition-colors py-2">Curriculum</a>
        </div>
        <button onClick={() => navigate('/sign-in')} className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-full text-sm font-semibold transition-all backdrop-blur-sm border border-white/5">
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center min-h-[90vh] justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel text-primary text-sm font-semibold mb-8 border-primary/20">
            <Sparkles size={16} />
            <span>A new way to experience mathematics</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] max-w-5xl mx-auto">
            See the math, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent glow-text pb-2 inline-block">
              don't just memorize it.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Where math stops being a chore and starts being an adventure. 
            Guided discovery for the curious student who wants to know <i className="text-white">why</i> it works.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button onClick={() => navigate('/sign-up')} className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-full font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-3 drop-shadow-[0_0_25px_hsla(250,85%,65%,0.5)] w-full sm:w-auto">
              Start Your Adventure
              <ArrowRight size={22} />
            </button>
            <a href="#demo" className="glass-panel hover:bg-white/10 px-10 py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center w-full sm:w-auto border-white/10">
              Try the Demo
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-muted-foreground gap-2 animate-bounce"
        >
          <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-muted-foreground to-transparent"></div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-32 px-6 md:px-12 bg-white/[0.01] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Understanding over memorization.</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We believe every student is capable of discovering mathematical truths. We don't hand you the formula — we provide the map so you can find it yourself.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Telescope className="w-8 h-8 text-primary" />,
                title: "Guided Discovery",
                desc: "Don't just accept formulas blindly. Follow the breadcrumbs and logically discover the relationships yourself."
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-accent" />,
                title: "Visual Intuition",
                desc: "If you can't see it, you don't fully understand it. We translate abstract symbols into interactive, living geometry."
              },
              {
                icon: <Puzzle className="w-8 h-8 text-destructive" />,
                title: "Connected Concepts",
                desc: "Math isn't a list of isolated tricks. It's a single, beautiful web of interconnected ideas. We show you the threads."
              }
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="glass-panel p-10 rounded-[2rem] h-full hover:bg-white/[0.03] transition-all border-t-white/10 hover:-translate-y-2 group">
                  <div className="bg-background/80 rounded-2xl w-16 h-16 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-40 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 right-1/4 w-[800px] h-[800px] bg-accent/15 rounded-full blur-[150px] -z-10 pointer-events-none -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-16 md:w-2/3">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Play with concepts, <br/>not just symbols.</h2>
              <div className="text-xl text-muted-foreground leading-relaxed space-y-6">
                <p>Textbooks define the derivative as a cold, abstract limit:</p>
                <div className="bg-black/50 p-6 rounded-xl border border-white/5 font-mono text-lg inline-block text-white shadow-inner">
                  <span className="text-primary">f'(x)</span> = <span className="text-accent">lim</span><sub className="text-xs ml-1 mr-2 text-muted-foreground">h→0</sub> 
                  <span className="opacity-80">[ f(x+h) - f(x) ] / h</span>
                </div>
                <p>
                  We define it as a visual story. Drag the point below. Watch the secant line gracefully become the tangent line in real-time. Feel the math.
                </p>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <DerivativeDemo />
          </FadeIn>
        </div>
      </section>

      {/* Storytelling Section */}
      <section className="py-32 px-6 md:px-12 bg-primary/[0.02] relative overflow-hidden border-y border-white/5">
        <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,_rgba(109,40,217,0.1),_transparent_60%)] -z-10"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <FadeIn>
            <div className="aspect-square relative rounded-[3rem] overflow-hidden glass-panel border-primary/20 flex items-center justify-center p-8 group">
               <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
               
               <div className="relative z-10 w-64 h-64 rounded-full border border-primary/40 flex items-center justify-center group-hover:rotate-90 transition-transform duration-[10s] ease-linear">
                  <div className="w-full h-[1px] bg-primary/40 absolute top-1/2"></div>
                  <div className="w-[1px] h-full bg-primary/40 absolute left-1/2"></div>
                  <div className="w-44 h-44 rounded-full border-[2px] border-accent/60 absolute border-dashed"></div>
                  <div className="w-3 h-3 bg-accent rounded-full absolute top-[15%] left-[85%] shadow-[0_0_15px_hsla(40,90%,55%,1)]"></div>
               </div>
               
               <div className="absolute z-20 text-5xl font-mono text-white font-bold drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  e<sup className="text-3xl text-primary">iπ</sup> + 1 = 0
               </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Every formula is a story waiting to be told.</h2>
            <div className="space-y-6 text-xl text-muted-foreground leading-relaxed">
              <p>
                Mathematics wasn't handed down on stone tablets. It was fiercely debated, slowly uncovered, and born out of necessity by real people trying to solve real problems.
              </p>
              <p>
                Our modules don't just teach you the mechanics. They teach you the context. When you understand the historical problem they were trying to solve, the solution suddenly makes perfect sense.
              </p>
            </div>
            <button onClick={() => navigate('/sign-up')} className="mt-10 flex items-center gap-3 text-primary font-bold text-lg hover:text-white transition-colors group">
              Start exploring
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-40 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">The Curriculum</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-xl">
                Comprehensive, immersive journeys through the core pillars of mathematics. No rote memorization required.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FunctionSquare className="w-8 h-8" />,
                title: "Pre-Calculus",
                desc: "Master functions, trigonometry, and the fundamental shapes of mathematics before the dive.",
                color: "from-blue-500/20 to-cyan-500/5",
                borderColor: "border-blue-500/30",
                shadow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
                textColor: "text-blue-400"
              },
              {
                icon: <ArrowRight className="w-8 h-8" />,
                title: "Calculus I",
                desc: "Limits, derivatives, and the gorgeous mathematics of continuous change and motion.",
                color: "from-primary/20 to-purple-500/5",
                borderColor: "border-primary/30",
                shadow: "hover:shadow-[0_0_30px_hsla(250,85%,65%,0.15)]",
                textColor: "text-primary"
              },
              {
                icon: <Network className="w-8 h-8" />,
                title: "Linear Algebra",
                desc: "Vectors, matrices, and navigating multi-dimensional spaces with absolute clarity.",
                color: "from-accent/20 to-orange-500/5",
                borderColor: "border-accent/30",
                shadow: "hover:shadow-[0_0_30px_hsla(40,90%,55%,0.15)]",
                textColor: "text-accent"
              }
            ].map((mod, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className={`p-10 rounded-[2rem] glass-panel border ${mod.borderColor} bg-gradient-to-br ${mod.color} transition-all duration-300 ${mod.shadow} hover:-translate-y-2 cursor-pointer group flex flex-col h-full`}>
                  <div className={`w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-8 ${mod.textColor} group-hover:scale-110 transition-transform`}>
                    {mod.icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{mod.title}</h3>
                  <p className="text-muted-foreground text-lg mb-10 flex-grow">{mod.desc}</p>
                  <div className="text-white font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                    Explore Module <ArrowRight size={18} className={mod.textColor} />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 md:px-12 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-primary/20 rounded-full blur-[150px] -z-10 opacity-70"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">Ready to see math differently?</h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who have discovered the profound beauty of true mathematical understanding.
            </p>
            <button onClick={() => navigate('/sign-up')} className="bg-white text-background hover:bg-gray-100 px-12 py-6 rounded-full font-bold text-xl transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Create Your Free Account
            </button>
            <p className="mt-8 text-muted-foreground">No credit card required. Start exploring the first module instantly.</p>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-12 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center rotate-12 border border-primary/30">
              <span className="text-primary -rotate-12 font-mono font-bold">∑</span >
            </div>
            <span className="font-bold text-xl text-white tracking-tight">MathVision</span>
          </div>
          
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">About Us</a>
            <a href="#" className="hover:text-white transition-colors">For Teachers</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>

          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MathVision Education. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
