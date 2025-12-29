import { Flag, Shield, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-texture pointer-events-none" />
      
      <div className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal/5 rounded-full mb-8">
              <Flag className="w-4 h-4 text-disaster" />
              <span className="text-sm font-medium text-charcoal/80">
                For private-party used car buyers
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-charcoal mb-6 tracking-tight leading-[1.1]">
              Know if it&apos;s a{" "}
              <span className="text-deal">Deal</span>,{" "}
              <span className="text-caution">Caution</span>, or{" "}
              <span className="text-disaster">Disaster</span>
              <br />
              <span className="text-charcoal/60">before you buy.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-charcoal/70 mb-10 max-w-2xl mx-auto leading-relaxed font-sans">
              Stop guessing. RedFlagged analyzes any used car listing and tells you exactly what 
              traditional history reports miss—overpricing, hidden risks, and the questions you need to ask.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
              <div className="flex items-center gap-2 text-sm text-charcoal/70">
                <Shield className="w-5 h-5 text-deal" />
                <span>Clear verdict in seconds</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal/70">
                <AlertTriangle className="w-5 h-5 text-caution" />
                <span>Red flags others miss</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal/70">
                <XCircle className="w-5 h-5 text-disaster" />
                <span>Questions to protect yourself</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <a 
              href="#analyze" 
              className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal transition-colors group"
            >
              <span className="text-sm font-medium">Try it free below</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
