"use client";

import { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  Info
} from "lucide-react";
import { AnalysisTier } from "@/types/vehicle";

interface TransparencyDisclosureProps {
  knownData: string[];
  unknownData: string[];
  tier?: AnalysisTier;
}

export function TransparencyDisclosure({ knownData, unknownData, tier = 'free' }: TransparencyDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFree = tier === 'free';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up shadow-sm">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Info className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Transparency Disclosure
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {isFree ? 'Basic data coverage - upgrade for full transparency' : 'What we checked, what we couldn\'t check, and why it matters'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 md:px-6 pb-6 space-y-6 animate-fade-in-up">
          {/* Divider */}
          <div className="border-t border-gray-200" />
          
          {/* What We Know */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-deal" />
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                What We Verified
              </h4>
            </div>
            <ul className="space-y-2.5">
              {knownData.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-deal flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What We Don't Know */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <EyeOff className="w-4 h-4 text-caution" />
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                What We Couldn&apos;t Verify
              </h4>
            </div>
            <ul className="space-y-2.5">
              {unknownData.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <HelpCircle className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong className="font-semibold text-gray-900">Important:</strong> RedFlagged provides analysis based on publicly available data and pricing algorithms. 
              We cannot guarantee the accuracy of seller-provided information. Always verify claims independently, 
              request documentation, and consider a professional pre-purchase inspection before completing any vehicle purchase.
            </p>
          </div>

          {/* Data Sources */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600">Data Sources:</p>
            {!isFree && <p>Vehicle history: Carfax/AutoCheck/NMVTIS databases</p>}
            <p>Market pricing: Aggregated from public listings and auction data</p>
            <p>VIN decode: NHTSA VIN decoder database</p>
            {!isFree && <p>Disaster data: FEMA disaster zone records</p>}
            <p>Analysis generated: {new Date().toLocaleDateString()}</p>
            {isFree && <p className="text-caution font-medium">⚠️ Limited data sources in free tier - upgrade for complete analysis</p>}
          </div>
        </div>
      )}
    </div>
  );
}
