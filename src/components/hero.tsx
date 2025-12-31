import { ArrowDown, CheckCircle2, Shield, TrendingDown, Clock, AlertCircle, HelpCircle, Gauge } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* WHO: Badge identifying the audience */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full">
                <span className="w-2 h-2 bg-deal rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-600">
                  Built for private-party used car buyers
                </span>
              </div>
            </div>

            {/* WHAT: Clear headline with outcome */}
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Should you buy this car?
              <br />
              <span className="text-slate-400 font-medium">Get a clear answer in seconds.</span>
            </h1>
            
            {/* WHY: Value proposition */}
            <p className="text-center text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              RedFlagged analyzes any used car listing and delivers a verdict—not a data dump. 
              Know if it&apos;s a <span className="font-semibold text-deal">Deal</span>, needs <span className="font-semibold text-caution">Caution</span>, or is a <span className="font-semibold text-disaster">Disaster</span> before you commit.
            </p>

            {/* CTV: Value-driven call-to-action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a 
                href="#analyze" 
                className="group inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all hover:scale-[1.02] font-semibold text-lg shadow-lg shadow-slate-900/20"
              >
                Is This a Bad Deal?
                <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              </a>
              <span className="text-slate-400 text-sm">Free • No signup required</span>
            </div>

            {/* Visual: Verdict Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              {/* Deal Card */}
              <div className="relative p-5 rounded-xl bg-white border-2 border-deal/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-3 left-4">
                  <span className="px-3 py-1 bg-deal text-white text-xs font-bold rounded-full">DEAL</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-deal" />
                    <span className="font-semibold text-slate-800">Good to pursue</span>
                  </div>
                  <p className="text-sm text-slate-500">Fair price, clean history, no major concerns</p>
                </div>
              </div>

              {/* Caution Card */}
              <div className="relative p-5 rounded-xl bg-white border-2 border-caution/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-3 left-4">
                  <span className="px-3 py-1 bg-caution text-white text-xs font-bold rounded-full">CAUTION</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-caution" />
                    <span className="font-semibold text-slate-800">Needs investigation</span>
                  </div>
                  <p className="text-sm text-slate-500">Potential issues found—ask questions first</p>
                </div>
              </div>

              {/* Disaster Card */}
              <div className="relative p-5 rounded-xl bg-white border-2 border-disaster/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-3 left-4">
                  <span className="px-3 py-1 bg-disaster text-white text-xs font-bold rounded-full">DISASTER</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-disaster" />
                    <span className="font-semibold text-slate-800">Walk away</span>
                  </div>
                  <p className="text-sm text-slate-500">Serious red flags detected—high risk</p>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                <span>Confidence-scored analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Results in under 10 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Questions to ask the seller</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
