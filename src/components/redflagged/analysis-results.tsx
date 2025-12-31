"use client";

import { useState } from "react";
import { VerdictResult } from "@/types/vehicle";
import { VerdictCard } from "./verdict-card";
import { RedFlagCard } from "./red-flag-card";
import { QuestionsSection } from "./questions-section";
import { TransparencyDisclosure } from "./transparency-disclosure";
import { UpgradePrompt } from "./upgrade-prompt";
import { SellerSignalsCard } from "./seller-signals-card";
import { EnvironmentalRiskCard } from "./environmental-risk-card";
import { DataQualityCard } from "./data-quality-card";
import { MaintenanceRiskCard } from "./maintenance-risk-card";
import { MarketPricingAnalysisCard } from "./market-pricing-analysis-card";
import { TailoredQuestionsCard } from "./tailored-questions-card";
import { Flag, RotateCcw, FileText, MapPin, UserCheck, AlertTriangle, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisResultsProps {
  result: VerdictResult;
  onReset: () => void;
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  // Build vehicle name with trim if available
  const vehicleNameParts: string[] = [];
  if (result.vehicleInfo.year) vehicleNameParts.push(result.vehicleInfo.year.toString());
  if (result.vehicleInfo.make) vehicleNameParts.push(result.vehicleInfo.make);
  if (result.vehicleInfo.model) vehicleNameParts.push(result.vehicleInfo.model);
  if (result.vehicleInfo.trim) vehicleNameParts.push(result.vehicleInfo.trim);
  
  const vehicleName = vehicleNameParts.length > 0 ? vehicleNameParts.join(' ') : undefined;
  
  const isFree = result.tier === 'free';
  
  // State for collapsible recalls section
  const [isRecallsExpanded, setIsRecallsExpanded] = useState(true);

  return (
    <div className="space-y-10 md:space-y-12">
      {/* New Search Button */}
      <div className="flex justify-end">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 hover:bg-gray-900 hover:text-white transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          New Search
        </Button>
      </div>

      {/* Verdict Card */}
      <VerdictCard
        verdict={result.verdict}
        confidenceScore={result.confidenceScore}
        summary={result.summary}
        vehicleName={vehicleName}
        priceDifferencePercent={result.vehicleInfo.priceDifferencePercent}
        tier={result.tier}
      />

      {/* Vehicle Information */}
      {(vehicleName || result.vehicleInfo.vin) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 animate-fade-in-up">
          <div className="space-y-4">
            {vehicleName && (
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {vehicleName}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pt-2">
              {result.vehicleInfo.year && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Year</p>
                  <p className="text-lg md:text-xl text-gray-900 font-semibold">
                    {result.vehicleInfo.year}
                  </p>
                </div>
              )}
              {result.vehicleInfo.make && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Make</p>
                  <p className="text-lg md:text-xl text-gray-900 font-semibold">
                    {result.vehicleInfo.make}
                  </p>
                </div>
              )}
              {result.vehicleInfo.model && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Model</p>
                  <p className="text-lg md:text-xl text-gray-900 font-semibold">
                    {result.vehicleInfo.model}
                  </p>
                </div>
              )}
              {result.vehicleInfo.trim && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Trim</p>
                  <p className="text-lg md:text-xl text-gray-900 font-semibold">
                    {result.vehicleInfo.trim}
                  </p>
                </div>
              )}
              {result.vehicleInfo.mileage && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Mileage</p>
                  <p className="text-lg md:text-xl text-gray-900 font-semibold">
                    {result.vehicleInfo.mileage.toLocaleString()} miles
                  </p>
                </div>
              )}
              {result.vehicleInfo.vin && (
                <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-gray-200">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">VIN</p>
                  <p className="font-mono text-sm text-gray-600 break-all">
                    {result.vehicleInfo.vin}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      {(result.vehicleInfo.estimatedValue !== undefined || result.vehicleInfo.askingPrice) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-6 md:p-8 bg-white rounded-xl border border-gray-200 animate-fade-in-up shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Asking Price</p>
            <p className="font-mono text-2xl md:text-3xl font-semibold text-gray-900">
              ${(result.vehicleInfo.askingPrice || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Est. Market Value</p>
            <p className="font-mono text-2xl md:text-3xl font-semibold text-gray-900">
              {result.vehicleInfo.estimatedValue !== undefined 
                ? `$${result.vehicleInfo.estimatedValue.toLocaleString()}`
                : '—'
              }
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Difference</p>
            {result.vehicleInfo.priceDifference !== undefined ? (
            <p className={`font-mono text-2xl md:text-3xl font-semibold ${
                result.vehicleInfo.priceDifference > 0 ? 'text-disaster' : 
                result.vehicleInfo.priceDifference < 0 ? 'text-deal' : 
                'text-gray-900'
            }`}>
                {result.vehicleInfo.priceDifference > 0 ? '+' : ''}${result.vehicleInfo.priceDifference.toLocaleString()}
            </p>
            ) : (
              <p className="font-mono text-2xl md:text-3xl font-semibold text-gray-400">—</p>
            )}
          </div>
          {result.vehicleInfo.mileage && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Mileage</p>
              <p className="font-mono text-2xl md:text-3xl font-semibold text-gray-900">
                {result.vehicleInfo.mileage.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Red Flags Panel */}
      {result.redFlags.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-disaster/10 rounded-lg">
              <Flag className="w-5 h-5 text-disaster" />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Red Flags ({result.redFlags.length})
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {result.redFlags.map((flag, index) => (
              <RedFlagCard key={flag.id} flag={flag} index={index} tier={result.tier} />
            ))}
          </div>
        </div>
      )}

      {/* Data Quality & Confidence - Placed after red flags as secondary, trust-building information */}
      {result.dataQuality && (
        <DataQualityCard dataQuality={result.dataQuality} />
      )}

      {/* Vehicle Recalls */}
      {result.recalls && result.recalls.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setIsRecallsExpanded(!isRecallsExpanded)}
            className="flex items-center justify-between w-full gap-3 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-600/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Open Recalls ({result.recalls.length})
              </h3>
            </div>
            {isRecallsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {isRecallsExpanded && (
            <>
              <div className="space-y-4">
                {result.recalls.map((recall, index) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {recall.component}
                        </p>
                        {recall.nhtsaCampaignNumber && (
                          <p className="text-xs text-gray-600 font-mono mb-2">
                            NHTSA Campaign: {recall.nhtsaCampaignNumber}
                          </p>
                        )}
                      </div>
                      {recall.reportReceivedDate && (
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {(() => {
                            const date = new Date(recall.reportReceivedDate);
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Summary:</p>
                        <p>{recall.summary}</p>
                      </div>
                      {recall.consequence && (
                        <div>
                          <p className="font-medium text-gray-900 mb-1">Consequence:</p>
                          <p>{recall.consequence}</p>
                        </div>
                      )}
                      {recall.remedy && (
                        <div>
                          <p className="font-medium text-gray-900 mb-1">Remedy:</p>
                          <p>{recall.remedy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Recalls are safety issues that manufacturers must fix at no cost. Verify with the seller that these have been addressed.
              </p>
            </>
          )}
        </div>
      )}

      {/* Carfax Summary - Paid Only */}
      {!isFree && result.carfaxSummary && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-600/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Vehicle History Summary</h3>
          </div>
          <p className="text-gray-700">{result.carfaxSummary}</p>
        </div>
      )}

      {/* Comparable Listings - Paid Only */}
      {!isFree && result.comparableListings && result.comparableListings.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-600/10 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Local Comparable Listings</h3>
          </div>
          <div className="space-y-3">
            {result.comparableListings.map((listing, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <p className="font-semibold text-gray-900">${listing.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{listing.mileage.toLocaleString()} miles • {listing.location}</p>
                </div>
                <p className="text-sm text-gray-500">{listing.daysOnMarket} days listed</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environmental Risk Card */}
      {result.environmentalRisk && (
        <EnvironmentalRiskCard environmentalRisk={result.environmentalRisk} />
      )}

      {/* Seller Signals Card */}
      {result.sellerSignals && (
        <SellerSignalsCard
          listingBehavior={result.sellerSignals.listingBehavior}
          pricingBehavior={result.sellerSignals.pricingBehavior}
          profileConsistency={result.sellerSignals.profileConsistency}
          tier={result.tier}
        />
      )}

      {/* Listing Description Analysis - Show for paid tier if analysis exists */}

      {/* Maintenance Risk Assessment - Paid Only */}
      {(() => {
        const debugInfo = {
          isFree,
          tier: result.tier,
          hasAssessment: !!result.maintenanceRiskAssessment,
          assessment: result.maintenanceRiskAssessment,
          vehicleInfoYear: result.vehicleInfo?.year,
          vehicleInfoYearType: typeof result.vehicleInfo?.year
        };
        console.log('[Client] Maintenance Risk Card Debug:', JSON.stringify(debugInfo, null, 2));
        console.log('[Client] Maintenance Risk Card Debug (object):', debugInfo);
        return null;
      })()}
      {!isFree && result.maintenanceRiskAssessment && (
        <MaintenanceRiskCard assessment={result.maintenanceRiskAssessment} />
      )}

      {/* Market Pricing Analysis - Paid Only */}
      {!isFree && result.marketPricingAnalysis && result.vehicleInfo.askingPrice && (
        <MarketPricingAnalysisCard 
          analysis={result.marketPricingAnalysis} 
          askingPrice={result.vehicleInfo.askingPrice}
        />
      )}

      {/* Seller Analysis - Paid Only */}
      {!isFree && result.sellerAnalysis && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-600/10 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Seller Credibility</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Credibility Score:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-deal h-3 rounded-full" 
                  style={{ width: `${result.sellerAnalysis.credibilityScore}%` }}
                />
              </div>
              <span className="font-mono font-semibold text-gray-900">{result.sellerAnalysis.credibilityScore}%</span>
            </div>
            <ul className="space-y-2 mt-4">
              {result.sellerAnalysis.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-1">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Questions to Ask - Different for free vs paid */}
      {(() => {
        console.log('[Client] Questions Debug:', {
          isFree,
          tier: result.tier,
          hasTailoredQuestions: !!result.tailoredQuestions,
          tailoredQuestionsCount: result.tailoredQuestions?.questions?.length || 0,
          hasBasicQuestions: !!result.questionsToAsk,
          basicQuestionsCount: result.questionsToAsk?.length || 0
        });
        return null;
      })()}
      {isFree ? (
        <QuestionsSection questions={result.questionsToAsk} tier={result.tier} />
      ) : (
        result.tailoredQuestions && result.tailoredQuestions.questions && result.tailoredQuestions.questions.length > 0 ? (
          <TailoredQuestionsCard analysis={result.tailoredQuestions} />
        ) : (
          // Fallback to basic questions if tailored questions aren't available
          result.questionsToAsk && result.questionsToAsk.length > 0 && (
            <QuestionsSection questions={result.questionsToAsk} tier={result.tier} />
          )
        )
      )}

      {/* Upgrade Prompt - Show only for free tier */}
      {isFree && <UpgradePrompt />}

      {/* Transparency Disclosure */}
      <TransparencyDisclosure 
        knownData={result.knownData} 
        unknownData={result.unknownData}
        tier={result.tier}
      />
    </div>
  );
}
