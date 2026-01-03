"use client";

import { ListingBehaviorSignals, PricingBehaviorSignals, SellerProfileConsistency } from "@/types/vehicle";
import { AlertTriangle, TrendingUp, UserCheck, Shield, TrendingDown } from "lucide-react";

interface SellerSignalsCardProps {
  listingBehavior?: ListingBehaviorSignals;
  pricingBehavior?: PricingBehaviorSignals;
  profileConsistency?: SellerProfileConsistency;
  tier?: 'free' | 'paid';
}

export function SellerSignalsCard({
  listingBehavior,
  pricingBehavior,
  profileConsistency,
  tier = 'free'
}: SellerSignalsCardProps) {
  const hasRelisting = listingBehavior?.relistingDetection?.detected;
  const relistingCount = listingBehavior?.relistingDetection?.timesSeen || 0;
  const relistingConfidence = listingBehavior?.relistingDetection?.confidence || 0;
  const relistingHistory = listingBehavior?.relistingDetection?.personalBackupHistory || [];
  
  const hasPriceVolatility = pricingBehavior?.priceVolatility?.detected;
  const volatilityLevel = pricingBehavior?.priceVolatility?.volatilityLevel;
  const priceChanges = pricingBehavior?.priceVolatility?.priceChanges || 0;
  const significantDrops = pricingBehavior?.priceVolatility?.significantDrops || [];
  const oscillations = pricingBehavior?.priceVolatility?.oscillations || 0;
  const priceHistory = pricingBehavior?.priceVolatility?.priceHistory || [];
  
  const hasUnusuallyLowPrice = pricingBehavior?.unusuallyLowPrice?.detected;
  const unusuallyLowPrice = pricingBehavior?.unusuallyLowPrice;
  
  const hasTooGoodForTooLong = pricingBehavior?.tooGoodForTooLong?.detected;
  const tooGoodForTooLong = pricingBehavior?.tooGoodForTooLong;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-purple-600/10 rounded-lg">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Seller Signals</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Patterns that may indicate increased risk
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Relisting Detection */}
        {hasRelisting && (
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Relisting Detected</h4>
                  <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                    {relistingConfidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  This vehicle has been listed {relistingCount} time{relistingCount === 1 ? '' : 's'} in the last 90 days.
                </p>
                
                {relistingHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Listing History:</p>
                    <ul className="space-y-1">
                      {relistingHistory.map((entry, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-gray-600 italic">
                    ⚠️ Frequent relisting may indicate issues discovered during previous buyer inspections. 
                    Ask the seller why previous sales fell through.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Volatility */}
        {hasPriceVolatility && (
          <div className={`border rounded-lg p-4 ${
            volatilityLevel === 'high' ? 'border-red-200 bg-red-50/50' :
            volatilityLevel === 'medium' ? 'border-orange-200 bg-orange-50/50' :
            'border-yellow-200 bg-yellow-50/50'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                volatilityLevel === 'high' ? 'bg-red-100' :
                volatilityLevel === 'medium' ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                <TrendingDown className={`w-4 h-4 ${
                  volatilityLevel === 'high' ? 'text-red-600' :
                  volatilityLevel === 'medium' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Price Volatility Detected</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    volatilityLevel === 'high' ? 'text-red-700 bg-red-100' :
                    volatilityLevel === 'medium' ? 'text-orange-700 bg-orange-100' :
                    'text-yellow-700 bg-yellow-100'
                  }`}>
                    {volatilityLevel?.toUpperCase() || 'UNKNOWN'} risk
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {priceChanges} price change{priceChanges === 1 ? '' : 's'} detected in the last 90 days.
                  {significantDrops.length > 0 && ` ${significantDrops.length} significant price drop${significantDrops.length === 1 ? '' : 's'} (5%+).`}
                  {oscillations > 0 && ` Price has oscillated ${oscillations} time${oscillations === 1 ? '' : 's'} (drop then increase, or multiple drops).`}
                </p>
                
                {significantDrops.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Significant Price Drops:</p>
                    <ul className="space-y-1">
                      {significantDrops.map((drop, index) => (
                        <li key={index} className="text-xs text-gray-600">
                          <span className="font-semibold">${drop.fromPrice.toLocaleString()}</span>
                          {' → '}
                          <span className="font-semibold text-red-600">${drop.toPrice.toLocaleString()}</span>
                          {' '}
                          <span className="text-red-600">(-{drop.dropPercent}%)</span>
                          {' '}
                          <span className="text-gray-500">{drop.daysAgo} days ago</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {priceHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Price History:</p>
                    <ul className="space-y-1">
                      {priceHistory.slice(0, 5).map((entry, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>
                            <span className="font-semibold">${entry.price.toLocaleString()}</span>
                            {' on '}
                            <span>{(() => {
                              const date = new Date(entry.date);
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                            })()}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">
                    ⚠️ Price volatility may indicate issues discovered during inspections or failed deals. 
                    This is a behavioral risk signal, not proof of a problem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unusually Low Price */}
        {hasUnusuallyLowPrice && unusuallyLowPrice && (
          <div className={`border rounded-lg p-4 ${
            unusuallyLowPrice.belowMarketPercent <= -30 ? 'border-red-200 bg-red-50/50' :
            unusuallyLowPrice.belowMarketPercent <= -20 ? 'border-orange-200 bg-orange-50/50' :
            'border-yellow-200 bg-yellow-50/50'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                unusuallyLowPrice.belowMarketPercent <= -30 ? 'bg-red-100' :
                unusuallyLowPrice.belowMarketPercent <= -20 ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                <TrendingDown className={`w-4 h-4 ${
                  unusuallyLowPrice.belowMarketPercent <= -30 ? 'text-red-600' :
                  unusuallyLowPrice.belowMarketPercent <= -20 ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Unusually Low Price</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    unusuallyLowPrice.belowMarketPercent <= -30 ? 'text-red-700 bg-red-100' :
                    unusuallyLowPrice.belowMarketPercent <= -20 ? 'text-orange-700 bg-orange-100' :
                    'text-yellow-700 bg-yellow-100'
                  }`}>
                    {unusuallyLowPrice.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Asking price is {Math.abs(unusuallyLowPrice.belowMarketPercent).toFixed(1)}% below market {unusuallyLowPrice.marketMedian ? 'median' : 'estimated value'}.
                  This pricing anomaly warrants extra scrutiny but does not imply a defect.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">
                    ⚠️ This is a probabilistic pricing behavior signal, not proof of seller intent or vehicle damage. 
                    When combined with other risk signals (seller behavior, flood exposure, data gaps), it may indicate elevated risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Too Good for Too Long */}
        {hasTooGoodForTooLong && tooGoodForTooLong && (
          <div className={`border rounded-lg p-4 ${
            (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 30 ? 'border-red-200 bg-red-50/50' :
            (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 14 ? 'border-orange-200 bg-orange-50/50' :
            'border-yellow-200 bg-yellow-50/50'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 30 ? 'bg-red-100' :
                (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 14 ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${
                  (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 30 ? 'text-red-600' :
                  (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 14 ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Too Good for Too Long</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 30 ? 'text-red-700 bg-red-100' :
                    (tooGoodForTooLong.daysListed - tooGoodForTooLong.thresholdDays) >= 14 ? 'text-orange-700 bg-orange-100' :
                    'text-yellow-700 bg-yellow-100'
                  }`}>
                    {tooGoodForTooLong.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  This unusually low-priced vehicle has been listed for {tooGoodForTooLong.daysListed} days, 
                  exceeding the reasonable threshold of {tooGoodForTooLong.thresholdDays} days. 
                  This may indicate possible market rejection.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">
                    ⚠️ This signal only triggers when "Unusually Low Price" is also detected. 
                    It is a probabilistic pricing behavior signal, not proof of seller intent or vehicle damage. 
                    When combined with other risk signals, it may indicate elevated risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listing Longevity */}
        {listingBehavior?.listingLongevity && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Listing Longevity</h4>
                <p className="text-sm text-gray-700">
                  Vehicle has been listed for {listingBehavior.listingLongevity.daysListed} days
                  {listingBehavior.listingLongevity.isStale && ' - This is longer than typical for similar vehicles.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Signals Detected */}
        {!hasRelisting && !hasPriceVolatility && !hasUnusuallyLowPrice && !hasTooGoodForTooLong && !listingBehavior?.listingLongevity && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">No Significant Seller Signals Detected</h4>
                <p className="text-sm text-gray-700">
                  We did not detect any concerning patterns in how this vehicle is being sold.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Note about Seller Signals */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> Seller signals detect patterns, not intent. They act as risk multipliers 
            when combined with pricing, flood risk, or data gaps. They never alone trigger a "Disaster" verdict.
          </p>
        </div>
      </div>
    </div>
  );
}

