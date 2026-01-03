import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { VehicleAnalyzer } from "@/components/redflagged/vehicle-analyzer";
import {
  Shield,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Eye,
  CheckCircle2,
  ArrowRight,
  Car,
  Search,
  FileCheck,
  TrendingUp,
  MapPin,
  Wrench,
  Clock,
  Users,
  BadgeCheck,
  CircleSlash,
  BarChart3,
  ChevronDown,
} from "lucide-react";

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* Vehicle Analyzer Section */}
      <section className="relative py-16 md:py-24 bg-white" id="analyze">
        {/* Retro pixel grid texture */}
        <div className="absolute inset-0 bg-pixel-grid opacity-50" />
        {/* Wireframe grid - subtle depth */}
        <div className="absolute inset-0 bg-wireframe-grid opacity-30" />
        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-scanlines opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium rounded-full mb-4">
              Try It Free
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Check Any Vehicle Instantly
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Enter a VIN and listing details below. Get your verdict in
              seconds—no signup required.
            </p>
          </div>

          <VehicleAnalyzer />
        </div>
      </section>

      {/* Problem-Agitation-Solution Section */}
      <section className="relative py-20 md:py-28 bg-[#f8fafb]">
        {/* Scanlines - CRT texture */}
        <div className="absolute inset-0 bg-scanlines opacity-30" />
        {/* Corner brackets */}
        <div className="absolute inset-0 bg-hud-corners opacity-40" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="max-w-4xl mx-auto">
            {/* Problem */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 text-disaster text-sm font-medium rounded-full mb-6">
                <AlertTriangle className="w-4 h-4" />
                The Problem
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Buying a used car privately is risky
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Traditional history reports give you data—but not answers.
                You&apos;re left staring at pages of information, wondering:
                &ldquo;Is this actually a problem? Should I walk away?&rdquo;
              </p>
            </div>

            {/* Agitation - Pain Points */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  icon: DollarSign,
                  title: "Overpriced deals",
                  description:
                    "No easy way to know if you're paying thousands more than you should",
                },
                {
                  icon: Eye,
                  title: "Hidden history",
                  description:
                    "Salvage titles, floods, and accidents that sellers conveniently forget to mention",
                },
                {
                  icon: Users,
                  title: "Seller games",
                  description:
                    "Relisted cars, suspicious pricing, and deals that seem too good to be true",
                },
              ].map((pain, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-xl border border-red-100/80 shadow-sm"
                >
                  <div className="p-2 bg-red-50 rounded-lg inline-block mb-4">
                    <pain.icon className="w-5 h-5 text-disaster" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {pain.title}
                  </h3>
                  <p className="text-slate-500 text-sm">{pain.description}</p>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-deal text-sm font-medium rounded-full mb-6">
                <CheckCircle2 className="w-4 h-4" />
                The Solution
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                A clear verdict—not another report to interpret
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                RedFlagged analyzes the listing and tells you exactly what to
                do: <span className="font-semibold text-deal">pursue it</span>,
                <span className="font-semibold text-caution">
                  {" "}
                  ask questions first
                </span>
                , or{" "}
                <span className="font-semibold text-disaster">walk away</span>.
                You get the answer in 3 seconds.
              </p>
            </div>

            {/* Solution Visual - Signal Stack */}
            <div className="relative bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm overflow-hidden">
              {/* HUD radar rings */}
              <div className="absolute inset-0 bg-radar-rings opacity-40" />
              {/* Pixel grid for retro texture */}
              <div className="absolute inset-0 bg-pixel-grid opacity-30" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-slate-50/80 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="grid md:grid-cols-2 gap-8 items-center relative">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    What we analyze
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        icon: DollarSign,
                        label: "Price vs. real market data",
                        color: "text-deal",
                      },
                      {
                        icon: FileCheck,
                        label: "Title history & brand checks",
                        color: "text-slate-700",
                      },
                      {
                        icon: TrendingUp,
                        label: "Seller pricing behavior",
                        color: "text-caution",
                      },
                      {
                        icon: MapPin,
                        label: "Disaster zone exposure",
                        color: "text-slate-700",
                      },
                      {
                        icon: Wrench,
                        label: "Maintenance risk prediction",
                        color: "text-slate-700",
                      },
                      {
                        icon: MessageSquare,
                        label: "Custom questions for you to ask",
                        color: "text-slate-700",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100"
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className="text-slate-700 text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Outer radar rings */}
                    <div className="absolute inset-0 -m-8">
                      <div
                        className="absolute inset-0 rounded-full border border-slate-200/50"
                        style={{ margin: "0px" }}
                      />
                      <div
                        className="absolute inset-0 rounded-full border border-slate-200/30"
                        style={{ margin: "16px" }}
                      />
                      <div
                        className="absolute inset-0 rounded-full border border-slate-200/20"
                        style={{ margin: "32px" }}
                      />
                    </div>
                    {/* Verdict Badge */}
                    <div className="w-48 h-48 rounded-full bg-gradient-to-b from-white to-slate-50 flex items-center justify-center shadow-inner border border-slate-200">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-deal mb-1">
                          DEAL
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                          Clear Verdict
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 md:py-28 bg-slate-900 text-white overflow-hidden">
        {/* Retro wireframe grid - perspective floor */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
            linear-gradient(rgba(100, 149, 237, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 149, 237, 0.3) 1px, transparent 1px)
          `,
            backgroundSize: "60px 60px",
            backgroundPosition: "center center",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center bottom",
          }}
        />
        {/* Radar sweep arc */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            conic-gradient(
              from 180deg at 50% 100%,
              transparent 0deg,
              rgba(100, 149, 237, 0.03) 20deg,
              rgba(100, 149, 237, 0.06) 40deg,
              rgba(100, 149, 237, 0.03) 60deg,
              transparent 80deg,
              transparent 360deg
            )
          `,
          }}
        />
        {/* CRT scanlines */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 3px)`,
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Three steps. Ten seconds. One clear answer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: Car,
                title: "Enter the vehicle",
                description:
                  "Paste the VIN, or enter year, make, model, and asking price manually.",
              },
              {
                step: "2",
                icon: Search,
                title: "We analyze everything",
                description:
                  "Market pricing, history signals, seller behavior, disaster exposure—all checked instantly.",
              },
              {
                step: "3",
                icon: BadgeCheck,
                title: "Get your verdict",
                description:
                  "Deal, Caution, or Disaster—plus the specific red flags and questions you need.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="p-6 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <span className="font-mono text-lg font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                    <item.icon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        {/* Wireframe grid texture */}
        <div className="absolute inset-0 bg-wireframe-grid opacity-25" />
        {/* Scanlines for CRT texture */}
        <div className="absolute inset-0 bg-scanlines opacity-30" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Not Another History Report
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Traditional reports give you data to decipher. We give you a
                decision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Reports */}
              <div className="p-8 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <CircleSlash className="w-6 h-6 text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-500">
                    Traditional history reports
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Pages of raw data without interpretation",
                    "No pricing analysis or market context",
                    "Can't detect suspicious seller behavior",
                    "No questions to ask—you're on your own",
                    "Recurring subscription fees",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-slate-500 text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-slate-400 text-xs">✕</span>
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RedFlagged */}
              <div className="relative p-8 bg-slate-900 rounded-2xl text-white overflow-hidden">
                {/* Retro HUD corner brackets */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25V0h25M75 0h25v25M100 75v25H75M25 100H0V75' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "100px 100px",
                  }}
                />
                {/* Pixel grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "4px 4px",
                  }}
                />
                <div className="flex items-center gap-3 mb-6 relative">
                  <Shield className="w-6 h-6 text-deal" />
                  <h3 className="text-lg font-bold">RedFlagged</h3>
                </div>
                <ul className="space-y-4 relative">
                  {[
                    "Clear verdict: Deal, Caution, or Disaster",
                    "Real-time market pricing comparison",
                    "Seller behavior & relisting detection",
                    "Custom questions based on detected flags",
                    "One-time payment—no subscriptions",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-slate-200 text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-deal flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="relative py-20 md:py-28 bg-[#f7f9fb] overflow-hidden">
        {/* Crosshair targeting marks */}
        <div className="absolute inset-0 bg-crosshair opacity-25" />
        {/* Pixel grid texture */}
        <div className="absolute inset-0 bg-pixel-grid opacity-40" />
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full mb-6 shadow-sm">
              <Eye className="w-4 h-4" />
              Our Philosophy
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Transparency over perfection
            </h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              We believe a report that says &ldquo;We couldn&apos;t verify
              this&rdquo; is more trustworthy than one that pretends to know
              everything. Every RedFlagged analysis shows exactly what we know,
              what we don&apos;t, and how that affects our confidence.
            </p>

            {/* Trust Signals */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: BarChart3,
                  title: "Confidence-scored",
                  description:
                    "Every verdict includes a confidence percentage based on data availability",
                },
                {
                  icon: Eye,
                  title: "Limitations disclosed",
                  description:
                    "We clearly state what data sources we checked and what we couldn't verify",
                },
                {
                  icon: MessageSquare,
                  title: "Conservative language",
                  description:
                    "No alarmist claims—just factual analysis and practical next steps",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="p-3 bg-slate-50 rounded-lg inline-block mb-4 border border-slate-100">
                    <item.icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 md:py-28 bg-white" id="pricing">
        {/* Retro pixel grid */}
        <div className="absolute inset-0 bg-pixel-grid opacity-40" />
        {/* Speed lines accent */}
        <div className="absolute inset-0 bg-speed-lines" />

        <div className="w-full px-6 md:px-8 lg:px-12 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Simple, Honest Pricing
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Start free. Upgrade only if you want the full deep-dive.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tier */}
              <div className="p-8 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    Free Analysis
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Perfect for initial screening
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-slate-400 ml-1">forever</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Deal / Caution / Disaster verdict",
                    "Price vs. market comparison",
                    "Top 2 red flags identified",
                    "2 questions to ask the seller",
                    "Data quality transparency",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-slate-700 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 text-deal flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#analyze"
                  className="block w-full py-3 px-4 text-center bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Try Free Analysis
                </a>
              </div>

              {/* Premium Tier */}
              <div className="relative p-8 bg-slate-900 rounded-2xl text-white overflow-hidden shadow-lg">
                {/* Retro HUD pixel grid */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                    backgroundSize: "4px 4px",
                  }}
                />
                {/* Corner brackets */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30V0h30M90 0h30v30M120 90v30H90M30 120H0V90' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "120px 120px",
                  }}
                />
                {/* ONE-TIME Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-caution text-white text-xs font-bold rounded-full">
                    ONE-TIME
                  </span>
                </div>
                
                {/* Header */}
                <div className="mb-6 relative z-10">
                  <h3 className="text-2xl font-bold mb-1">Premium Report</h3>
                  <p className="text-slate-400 text-sm">
                    Complete analysis for serious buyers
                  </p>
                </div>
                
                {/* Price */}
                <div className="mb-8 relative z-10">
                  <span className="text-4xl font-bold">$7.99</span>
                  <span className="text-slate-400 ml-1">one-time</span>
                </div>
                
                {/* Features List */}
                <ul className="space-y-4 mb-8 relative z-10">
                  {[
                    "Everything in Free, plus:",
                    "Accident, title, flood & lemon indicators",
                    "Seller signal analysis (relisting, pricing patterns)",
                    "Environmental risk assessment",
                    "Maintenance risk prediction",
                    "Contextual tailored questions",
                    "Shareable report link",
                    "Save to dashboard for later viewing",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-slate-200 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 text-caution flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <a
                  href="#analyze"
                  className="relative z-10 block w-full py-3 px-4 text-center bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Get Premium Report
                </a>
              </div>
            </div>

            {/* No subscription note */}
            <div className="text-center mt-8">
              <p className="text-slate-400 text-sm">
                No subscriptions. No recurring fees. Pay once, get your report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 md:py-28 bg-slate-900 overflow-hidden">
        {/* Retro wireframe perspective grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
            linear-gradient(rgba(100, 149, 237, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 149, 237, 0.4) 1px, transparent 1px)
          `,
            backgroundSize: "80px 80px",
            transform: "perspective(400px) rotateX(55deg)",
            transformOrigin: "center bottom",
          }}
        />
        {/* CRT scanlines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 3px)`,
          }}
        />
        {/* Ambient glow from center */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(100, 149, 237, 0.06) 0%, transparent 70%)`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />

        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stop wondering. Start knowing.
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg">
            Every hour you spend second-guessing is an hour closer to someone
            else buying your car—or worse, you buying a lemon.
          </p>
          <a
            href="#analyze"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all hover:scale-[1.02] font-bold text-lg shadow-lg"
          >
            Is This Car Worth It?
            <ChevronDown className="w-5 h-5" />
          </a>
          <div className="mt-6 text-slate-500 text-sm">
            Free instant analysis • No signup required
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
