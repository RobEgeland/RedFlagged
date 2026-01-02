"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Zap,
  Shield,
  TrendingUp,
  MapPin,
  Wrench,
  FileCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const analysisSteps = [
  {
    icon: TrendingUp,
    text: "Checking market prices",
    detail: "Comparing with similar listings",
  },
  {
    icon: FileCheck,
    text: "Scanning vehicle history",
    detail: "Title brands, accidents, ownership",
  },
  {
    icon: Shield,
    text: "Detecting red flags",
    detail: "Seller patterns, pricing anomalies",
  },
  {
    icon: MapPin,
    text: "Assessing location risks",
    detail: "Flood zones, disaster history",
  },
  {
    icon: Wrench,
    text: "Predicting maintenance",
    detail: "Age & mileage-based risks",
  },
  {
    icon: Zap,
    text: "Generating your verdict",
    detail: "Compiling final analysis",
  },
];

export function AnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    // Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + Math.random() * 3;
        }
        return prev;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4">
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        {/* Main Visual - Animated Ring */}
        <div className="relative mb-10">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-slate-200" />
          <div
            className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-slate-900 animate-spin"
            style={{ animationDuration: "1.5s" }}
          />

          {/* Inner content */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner">
            <div className="text-center">
              <Search className="w-10 h-10 text-slate-700 mx-auto mb-1" />
              <span className="text-xs font-medium text-slate-500">
                Analyzing
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Analyzing Your Vehicle
          </h2>
          <p className="text-slate-500">
            Running comprehensive checks across multiple data sources
          </p>
        </div>

        {/* Steps List */}
        <div className="w-full max-w-md mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {analysisSteps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 ${
                    index !== analysisSteps.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  } ${isCurrent ? "bg-slate-50" : ""}`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-9 h-9 rounded-full bg-deal/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-deal" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium transition-colors ${
                        isCompleted
                          ? "text-slate-900"
                          : isCurrent
                            ? "text-slate-900"
                            : "text-slate-400"
                      }`}
                    >
                      {step.text}
                    </div>
                    <div
                      className={`text-xs transition-colors ${
                        isCompleted
                          ? "text-slate-500"
                          : isCurrent
                            ? "text-slate-500"
                            : "text-slate-300"
                      }`}
                    >
                      {step.detail}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {isCompleted && (
                      <span className="text-xs font-medium text-deal">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-medium text-slate-600">
                        Running...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Usually takes 10-15 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
