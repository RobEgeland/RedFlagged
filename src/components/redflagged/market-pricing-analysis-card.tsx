"use client";

import { VerdictResult } from "@/types/vehicle";
import { DollarSign, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3 } from "lucide-react";

interface MarketPricingAnalysisCardProps {
  analysis: VerdictResult['marketPricingAnalysis'];
  askingPrice: number;
}

export function MarketPricingAnalysisCard({ analysis, askingPrice }: MarketPricingAnalysisCardProps) {
  if (!analysis) {
    return null;
  }

  const { priceRanges, askingPricePosition, comparableCount, geographicScope, listingType, marketComparison, negotiationLeverage, confidence, limitations, dataQuality } = analysis;

  const getLeverageColor = (level: string) => {
    switch (level) {
      case 'strong':
        return {
          bg: 'bg-green-50/50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-700'
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-50/50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      case 'limited':
        return {
          bg: 'bg-orange-50/50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      default:
        return {
          bg: 'bg-gray-50/50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const leverageColors = getLeverageColor(negotiationLeverage.level);
  const PositionIcon = askingPricePosition.position === 'below' ? TrendingDown :
                       askingPricePosition.position === 'above' ? TrendingUp : Minus;

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-orange-600';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-600/10 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Market Pricing Analysis</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Detailed pricing context from observed market listings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Data Quality Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Analysis Summary</p>
              <p className="text-xs text-gray-600 mt-1">
                Based on {comparableCount} comparable {comparableCount === 1 ? 'listing' : 'listings'} from {geographicScope}
              </p>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceColor(confidence)} bg-white`}>
              {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Listing Type: <strong className="text-gray-900">{listingType === 'dealer' ? 'Dealer' : listingType === 'private-party' ? 'Private Party' : listingType === 'mixed' ? 'Mixed' : 'Unknown'}</strong></span>
            {dataQuality.dataSparsity !== 'adequate' && (
              <span className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="w-3 h-3" />
                {dataQuality.dataSparsity === 'sparse' ? 'Sparse Data' : 'Moderate Data'}
              </span>
            )}
          </div>
        </div>

        {/* Price Ranges */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            Market Price Ranges
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Low</p>
              <p className="text-sm font-semibold text-gray-900">{formatPrice(priceRanges.low)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">25th %ile</p>
              <p className="text-sm font-semibold text-blue-900">{formatPrice(priceRanges.percentile25)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">Median</p>
              <p className="text-sm font-semibold text-green-900">{formatPrice(priceRanges.median)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">75th %ile</p>
              <p className="text-sm font-semibold text-blue-900">{formatPrice(priceRanges.percentile75)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">High</p>
              <p className="text-sm font-semibold text-gray-900">{formatPrice(priceRanges.high)}</p>
            </div>
          </div>
        </div>

        {/* Asking Price Position */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Your Asking Price Position</h4>
            <div className="flex items-center gap-2">
              <PositionIcon className={`w-4 h-4 ${askingPricePosition.position === 'below' ? 'text-green-600' : askingPricePosition.position === 'above' ? 'text-orange-600' : 'text-gray-600'}`} />
              <span className="text-xs font-medium text-gray-600">
                {askingPricePosition.percentile}th percentile
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Asking Price:</span>
              <span className="text-sm font-semibold text-gray-900">{formatPrice(askingPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">vs. Market Median:</span>
              <span className={`text-sm font-semibold ${askingPricePosition.differencePercent >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatPercent(askingPricePosition.differencePercent)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
            {marketComparison}
          </p>
        </div>

        {/* Negotiation Leverage */}
        <div className={`rounded-lg p-4 border ${leverageColors.border} ${leverageColors.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Negotiation Leverage</h4>
            <span className={`text-xs font-medium px-2 py-1 rounded ${leverageColors.badge}`}>
              {negotiationLeverage.level.charAt(0).toUpperCase() + negotiationLeverage.level.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {negotiationLeverage.explanation}
          </p>
          <div className="bg-white/50 rounded p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-900 mb-1">Suggested Approach:</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {negotiationLeverage.suggestedApproach}
            </p>
          </div>
        </div>

        {/* Limitations */}
        {limitations.length > 0 && (
          <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <h4 className="text-sm font-semibold text-gray-900">Important Limitations</h4>
            </div>
            <ul className="space-y-2">
              {limitations.map((limitation, index) => (
                <li key={index} className="text-xs text-gray-700 leading-relaxed flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important Note */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic leading-relaxed">
            <strong>Note:</strong> This analysis provides probabilistic pricing context based on observed market listings and derived market data. Prices are not presented as authoritative valuations or sale prices. This analysis serves to inform pricing context, confidence, and negotiation leverage, but does not independently change or override the overall verdict. Actual transaction prices may vary based on negotiation, condition, timing, and other factors not captured here.
          </p>
        </div>
      </div>
    </div>
  );
}

