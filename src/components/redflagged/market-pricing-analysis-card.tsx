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

  const { priceRanges, askingPricePosition, comparableCount, geographicScope, marketComparison, negotiationLeverage, limitations } = analysis;

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
            Based on {comparableCount} comparable {comparableCount === 1 ? 'listing' : 'listings'} from {geographicScope}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Price Ranges - Simplified */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-600 mb-1">Low End</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(priceRanges.low)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
            <p className="text-xs text-green-600 mb-1">Market Median</p>
            <p className="text-lg font-semibold text-green-900">{formatPrice(priceRanges.median)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-600 mb-1">High End</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(priceRanges.high)}</p>
          </div>
        </div>

        {/* Asking Price vs Market - Simplified */}
        <div className={`rounded-lg p-5 border-2 ${
          askingPricePosition.position === 'below' 
            ? 'bg-green-50 border-green-300' 
            : askingPricePosition.position === 'above' 
            ? 'bg-orange-50 border-orange-300' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Your Asking Price</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(askingPrice)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <PositionIcon className={`w-5 h-5 ${
                  askingPricePosition.position === 'below' ? 'text-green-600' : 
                  askingPricePosition.position === 'above' ? 'text-orange-600' : 
                  'text-gray-600'
                }`} />
                <span className={`text-sm font-semibold ${
                  askingPricePosition.position === 'below' ? 'text-green-700' : 
                  askingPricePosition.position === 'above' ? 'text-orange-700' : 
                  'text-gray-700'
                }`}>
                  {formatPercent(askingPricePosition.differencePercent)} vs. median
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {askingPricePosition.percentile}th percentile
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
            {marketComparison}
          </p>
        </div>

        {/* Negotiation Leverage - Simplified */}
        <div className={`rounded-lg p-5 border ${leverageColors.border} ${leverageColors.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-gray-900">Negotiation Leverage</h4>
            <span className={`text-sm font-semibold px-3 py-1 rounded ${leverageColors.badge}`}>
              {negotiationLeverage.level.charAt(0).toUpperCase() + negotiationLeverage.level.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {negotiationLeverage.explanation}
          </p>
        </div>

        {/* Limitations - Only show if critical */}
        {limitations.length > 0 && limitations.length <= 2 && (
          <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Note</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {limitations[0]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


