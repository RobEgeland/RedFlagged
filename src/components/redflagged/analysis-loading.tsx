"use client";

import { Search, Zap, Shield, TrendingUp } from "lucide-react";

export function AnalysisLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-charcoal/10 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-charcoal to-charcoal/80 rounded-full p-6 shadow-2xl">
            <Search className="w-12 h-12 text-cream animate-pulse" />
          </div>
        </div>

        {/* Main Loading Text */}
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
            Analyzing Your Vehicle
          </h2>
          <p className="text-charcoal/60 text-lg">
            We're checking pricing, history, and red flags...
          </p>
        </div>

        {/* Loading Steps */}
        <div className="w-full max-w-md space-y-4 mb-8">
          {[
            { icon: TrendingUp, text: "Comparing market prices", completed: true },
            { icon: Shield, text: "Scanning for red flags", completed: true },
            { icon: Zap, text: "Generating your verdict", completed: false },
          ].map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border border-charcoal/10 shadow-sm"
            >
              <div className={`relative ${step.completed ? 'text-deal' : 'text-charcoal/30'}`}>
                {step.completed ? (
                  <div className="w-8 h-8 rounded-full bg-deal/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-deal" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center">
                    <step.icon className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </div>
              <span className={`flex-1 text-sm font-medium ${
                step.completed ? 'text-charcoal' : 'text-charcoal/60'
              }`}>
                {step.text}
              </span>
              {step.completed && (
                <div className="w-5 h-5 rounded-full bg-deal flex items-center justify-center">
                  <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div className="h-2 bg-charcoal/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-deal via-caution to-deal rounded-full animate-progress" />
          </div>
          <p className="text-center text-sm text-charcoal/50 mt-3">
            This usually takes 10-15 seconds
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-charcoal/30 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

