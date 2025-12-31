"use client";

import { VerdictType, AnalysisTier } from "@/types/vehicle";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

interface VerdictCardProps {
  verdict: VerdictType;
  confidenceScore: number;
  summary: string;
  vehicleName?: string;
  priceDifferencePercent?: number;
  tier?: AnalysisTier;
}

const verdictConfig = {
  deal: {
    label: "Deal",
    icon: ShieldCheck,
    bgClass: "verdict-deal",
    description: "This looks like a solid purchase",
  },
  caution: {
    label: "Caution",
    icon: AlertTriangle,
    bgClass: "verdict-caution",
    description: "Investigate before proceeding",
  },
  disaster: {
    label: "Disaster",
    icon: XCircle,
    bgClass: "verdict-disaster",
    description: "Walk away from this deal",
  },
};

export function VerdictCard({ 
  verdict, 
  confidenceScore, 
  summary, 
  vehicleName,
  priceDifferencePercent,
  tier = 'free'
}: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <div 
      className={`relative overflow-hidden rounded-xl ${config.bgClass} text-white p-8 md:p-12 animate-fade-in-up shadow-[0_2px_16px_rgba(0,0,0,0.08)]`}
    >
      <div className="relative z-10">
        {/* Vehicle Name */}
        {vehicleName && (
          <p className="text-sm font-medium opacity-90 mb-3 uppercase tracking-wide">
            {vehicleName}
          </p>
        )}
        
        {/* Verdict Header */}
        <div className="flex items-start gap-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/15 rounded-lg backdrop-blur-sm">
              <Icon className="w-10 h-10 md:w-12 md:h-12" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-none mb-2">
                {config.label}
              </h2>
              <p className="text-base md:text-lg opacity-90">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Price Indicator */}
        {priceDifferencePercent !== undefined && (
          <div className="mb-6 py-3 px-5 bg-white/15 rounded-lg inline-block backdrop-blur-sm">
            <span className="font-mono text-xl md:text-2xl font-semibold">
              {priceDifferencePercent > 0 ? '+' : ''}{priceDifferencePercent}%
            </span>
            <span className="text-sm font-medium opacity-90 ml-3">
              {priceDifferencePercent > 0 ? 'above' : priceDifferencePercent < 0 ? 'below' : ''} market value
            </span>
          </div>
        )}

        {/* Summary */}
        <p className="text-base md:text-lg leading-relaxed opacity-95">
          {summary}
        </p>
      </div>
    </div>
  );
}
