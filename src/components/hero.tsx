"use client";

import {
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

// Verdict Preview Card Component - The dominant focal element
function VerdictPreviewCard() {
  // Using "Deal" as the sample verdict for the preview
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200/50 overflow-hidden">
        {/* Card header with verdict badge */}
        <div className="bg-gradient-to-r from-[#1E5A3A] to-[#2D7A4F] px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-white/90 text-sm font-medium mb-1">
                VERDICT
              </div>
              <div className="text-white text-3xl font-bold tracking-tight">
                DEAL
              </div>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-8 space-y-8">
          {/* Key Reasons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Key Factors
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E5A3A] mt-2 flex-shrink-0" />
                <p className="text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">
                    Fair market price
                  </span>{" "}
                  — Listed at $12,500, within expected range for this model and
                  mileage
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E5A3A] mt-2 flex-shrink-0" />
                <p className="text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">
                    Low risk signals
                  </span>{" "}
                  — No major red flags detected in our analysis
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E5A3A] mt-2 flex-shrink-0" />
                <p className="text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">
                    2 questions to ask the seller
                  </span>{" "}
                  — Essential questions provided to help verify key information
                </p>
              </div>
            </div>
          </div>

          {/* Questions to Ask */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Questions to Ask
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-slate-600">
                    1
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Can you provide the most recent service records and
                  maintenance history?
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-slate-600">
                    2
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Are there any known issues or repairs needed that aren&apos;t
                  mentioned in the listing?
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-slate-600">
                    3
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  What is the reason for selling, and how long have you owned
                  the vehicle?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card footer - subtle branding */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sample analysis preview</span>
            <span className="font-medium">RedFlagged</span>
          </div>
        </div>
      </div>

      {/* Decorative elements - subtle depth */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#1E5A3A]/10 via-transparent to-[#1E5A3A]/10 rounded-2xl blur-xl -z-10 opacity-50" />
    </div>
  );
}

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 min-h-screen">
      {/* Modern gradient field */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(100, 149, 237, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 20% 60%, rgba(148, 163, 184, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(148, 163, 184, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Light grain texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="w-full px-6 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto">
            {/* Text content - above preview card */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-[1.05] mb-6 tracking-tight">
                Should you buy
                <br />
                <span className="text-slate-600">this car?</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-10 font-light">
                Get a clear verdict—
                <span className="font-semibold text-slate-900">Deal</span>,{" "}
                <span className="font-semibold text-slate-900">Caution</span>,
                or{" "}
                <span className="font-semibold text-slate-900">Disaster</span>
                —with confidence-scored analysis in seconds.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <a
                  href="#analyze"
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all hover:scale-[1.02] font-semibold text-lg shadow-xl shadow-slate-900/25"
                >
                  Is This a Bad Deal?
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Trust indicator */}
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Shield className="w-4 h-4" />
                <span>Free instant analysis • No signup required</span>
              </div>
            </div>

            {/* Verdict Preview Card - The dominant focal element */}
            <div className="mb-12">
              <VerdictPreviewCard />
            </div>

            {/* Secondary trust elements */}
            <div className="text-center">
              <p className="text-sm text-slate-500 max-w-2xl mx-auto">
                Every analysis includes market pricing, history checks, risk
                signals, and actionable questions—all in one clear report.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}
