"use client";

import { useState } from "react";
import { RedFlag, AnalysisTier } from "@/types/vehicle";
import { 
  Flag, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  FileWarning,
  FileQuestion,
  ClipboardList,
  Users,
  AlertCircle
} from "lucide-react";

interface RedFlagCardProps {
  flag: RedFlag;
  index: number;
  tier?: AnalysisTier;
}

const categoryIcons = {
  pricing: DollarSign,
  history: FileWarning,
  title: FileQuestion,
  'data-gap': AlertCircle,
  listing: ClipboardList,
  ownership: Users,
};

const severityConfig = {
  critical: {
    borderColor: "border-disaster",
    badgeBg: "bg-disaster",
    badgeText: "text-white",
  },
  high: {
    borderColor: "border-disaster/60",
    badgeBg: "bg-disaster/80",
    badgeText: "text-white",
  },
  medium: {
    borderColor: "border-caution",
    badgeBg: "bg-caution",
    badgeText: "text-white",
  },
  low: {
    borderColor: "border-gray-300",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-700",
  },
};

export function RedFlagCard({ flag, index, tier = 'free' }: RedFlagCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = severityConfig[flag.severity];
  const CategoryIcon = categoryIcons[flag.category] || Flag;
  
  const animationDelay = `${index * 40}ms`;

  return (
    <div 
      className={`
        bg-white border ${config.borderColor} rounded-lg overflow-hidden
        shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]
        transition-all duration-150 hover:translate-y-[-2px]]
        animate-fade-in-up cursor-pointer
      `}
      style={{ animationDelay }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5 md:p-6 relative">
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-md">
                <CategoryIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <Flag 
                  className={`w-4 h-4 ${
                    flag.severity === 'critical' || flag.severity === 'high' 
                      ? 'text-disaster' 
                      : flag.severity === 'medium' 
                        ? 'text-caution' 
                        : 'text-gray-400'
                  }`} 
                />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${config.badgeBg} ${config.badgeText}`}>
                  {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
                </span>
              </div>
            </div>
              <button 
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 leading-tight">
            {flag.title}
          </h3>

          {/* Description */}
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            {flag.description}
          </p>

          {/* Expanded Content - always show expanded details if available, or use description as fallback */}
          {isExpanded && (
            <div className="mt-5 pt-5 border-t border-gray-200 space-y-4 animate-fade-in-up">
              {(flag.expandedDetails || flag.description) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    What This Means
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {flag.expandedDetails || flag.description}
                  </p>
                </div>
              )}
              {flag.methodology && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Our Methodology
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {flag.methodology}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
