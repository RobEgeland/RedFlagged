"use client";

import { useState } from "react";
import { DataQualityAssessment } from "@/types/vehicle";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataQualityCardProps {
  dataQuality: DataQualityAssessment;
}

const confidenceLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const confidenceDescriptions = {
  high: "based on comprehensive data",
  medium: "based on partial data",
  low: "based on limited data",
};

/**
 * Get limiting factors - only show factors that reduce confidence
 */
function getLimitingFactors(factors: DataQualityAssessment['factors']) {
  return factors.filter(
    factor => factor.status !== 'complete'
  );
}

/**
 * Generate a concise summary of what limits confidence
 */
function getConfidenceSummary(factors: DataQualityAssessment['factors']): string {
  const limitingFactors = getLimitingFactors(factors);
  
  if (limitingFactors.length === 0) {
    return "All data sources available";
  }
  
  const highImpactLimits = limitingFactors.filter(f => f.impact === 'high');
  const mediumImpactLimits = limitingFactors.filter(f => f.impact === 'medium');
  
  if (highImpactLimits.length > 0) {
    const firstHigh = highImpactLimits[0];
    if (firstHigh.status === 'missing') {
      return `Missing ${firstHigh.name.toLowerCase()}`;
    } else if (firstHigh.status === 'unavailable') {
      return `${firstHigh.name} unavailable`;
    } else {
      return `Partial ${firstHigh.name.toLowerCase()}`;
    }
  }
  
  if (mediumImpactLimits.length > 0) {
    const firstMedium = mediumImpactLimits[0];
    if (firstMedium.status === 'missing') {
      return `Some data missing`;
    } else {
      return `Some data incomplete`;
    }
  }
  
  return "Some data unavailable";
}

export function DataQualityCard({ dataQuality }: DataQualityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const limitingFactors = getLimitingFactors(dataQuality.factors);
  const hasLimitingFactors = limitingFactors.length > 0;
  const confidenceLabel = confidenceLabels[dataQuality.overallConfidence];
  const confidenceDesc = confidenceDescriptions[dataQuality.overallConfidence];
  const summary = getConfidenceSummary(dataQuality.factors);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Collapsed Summary - Always Visible */}
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Confidence: {confidenceLabel}</span>
                {hasLimitingFactors && (
                  <span className="text-gray-600"> — {summary}</span>
                )}
                {!hasLimitingFactors && (
                  <span className="text-gray-600"> — {confidenceDesc}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded Details - Only show limiting factors */}
      {isExpanded && hasLimitingFactors && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-4">
          <div className="pt-4">
            <p className="text-xs text-gray-600 mb-3">
              The following information is missing or incomplete, which affects our confidence in the analysis:
            </p>
            <div className="space-y-2">
              {limitingFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="p-3 rounded-md bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {factor.name}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {factor.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations - Only if there are actionable ones */}
          {dataQuality.recommendations.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">
                To improve confidence:
              </p>
              <ul className="space-y-1.5">
                {dataQuality.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calm explanatory note */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              This assessment reflects data availability, not the accuracy of the analysis itself. 
              The red flags and verdict above are based on the information we were able to gather.
            </p>
          </div>
        </div>
      )}

      {/* Expanded - High Confidence (all data available) */}
      {isExpanded && !hasLimitingFactors && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="pt-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              We have comprehensive data for this vehicle from multiple reliable sources. 
              Our analysis is based on complete information and should be highly accurate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
