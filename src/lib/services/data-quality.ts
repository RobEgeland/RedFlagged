import { VerdictResult, AnalysisRequest, DataQualityFactor, DataQualityAssessment } from '@/types/vehicle';

/**
 * Data Quality and Confidence Assessment
 * 
 * Evaluates how complete and reliable the available data is for a given vehicle analysis.
 * The goal is to clearly communicate confidence to the user and prevent over-certainty
 * when inputs are sparse or incomplete.
 */

/**
 * Assess VIN data completeness
 */
function assessVINData(
  request: AnalysisRequest,
  vehicleHistory?: VerdictResult['vehicleHistory'],
  vehicleInfo?: VerdictResult['vehicleInfo']
): DataQualityFactor {
  const hasVIN = !!request.vin;
  // Check vehicleInfo first (from VIN decode), then fall back to request
  const hasYear = !!(vehicleInfo?.year || request.year);
  const hasMake = !!(vehicleInfo?.make || request.make);
  const hasModel = !!(vehicleInfo?.model || request.model);
  const hasHistoryData = !!vehicleHistory?.nmvtis;
  
  if (!hasVIN) {
    return {
      id: 'vin-missing',
      name: 'VIN Information',
      status: 'missing',
      impact: 'high',
      explanation: 'No VIN provided. Vehicle history, title records, and theft data cannot be verified.'
    };
  }
  
  if (!hasYear || !hasMake || !hasModel) {
    return {
      id: 'vin-incomplete',
      name: 'VIN Information',
      status: 'partial',
      impact: 'high',
      explanation: 'VIN provided but some vehicle details (year, make, or model) are missing. This limits our ability to fetch recalls and accurate market data.'
    };
  }
  
  if (!hasHistoryData) {
    return {
      id: 'vin-no-history',
      name: 'VIN History Data',
      status: 'unavailable',
      impact: 'medium',
      explanation: 'VIN provided but no vehicle history data was found. Title brands, theft records, and odometer readings are unavailable.'
    };
  }
  
  return {
    id: 'vin-complete',
    name: 'VIN Information',
    status: 'complete',
    impact: 'high',
    explanation: 'VIN and vehicle details are available. Vehicle history data was successfully retrieved.'
  };
}

/**
 * Assess market comparables availability
 */
function assessMarketData(
  marketData?: VerdictResult['marketData'],
  estimatedValue?: number
): DataQualityFactor {
  if (!marketData) {
    return {
      id: 'market-missing',
      name: 'Market Comparables',
      status: 'missing',
      impact: 'high',
      explanation: 'No market pricing data available. Price analysis is based on estimates only, which may be inaccurate.'
    };
  }
  
  const sources = [
    marketData.autoDev,
    marketData.marketCheck
  ].filter(Boolean);
  
  // Log for debugging
  console.log('[Data Quality] Market data assessment:', {
    hasAutoDev: !!marketData.autoDev,
    hasMarketCheck: !!marketData.marketCheck,
    sourcesCount: sources.length,
    estimatedValue
  });
  
  if (sources.length === 0) {
    return {
      id: 'market-no-sources',
      name: 'Market Comparables',
      status: 'unavailable',
      impact: 'high',
      explanation: 'Market data sources are unavailable. This may be due to API configuration issues or no listings found for this vehicle. Price comparison may be unreliable.'
    };
  }
  
  if (sources.length === 1) {
    return {
      id: 'market-limited',
      name: 'Market Comparables',
      status: 'partial',
      impact: 'medium',
      explanation: `Only ${sources.length} market data source available. More sources would improve price accuracy.`
    };
  }
  
  if (!estimatedValue) {
    return {
      id: 'market-no-estimate',
      name: 'Market Value Estimate',
      status: 'partial',
      impact: 'medium',
      explanation: 'Market data available but unable to calculate reliable value estimate.'
    };
  }
  
  return {
    id: 'market-complete',
    name: 'Market Comparables',
    status: 'complete',
    impact: 'high',
    explanation: `${sources.length} market data sources available. Price analysis is based on multiple reliable sources.`
  };
}

/**
 * Assess seller behavior history
 */
function assessSellerSignals(
  sellerSignals?: VerdictResult['sellerSignals'],
  tier: 'free' | 'paid' = 'free'
): DataQualityFactor {
  if (tier === 'free') {
    return {
      id: 'seller-signals-premium',
      name: 'Seller Behavior History',
      status: 'unavailable',
      impact: 'medium',
      explanation: 'Seller behavior analysis requires premium tier. Relisting detection, price volatility, and seller profile analysis are unavailable.'
    };
  }
  
  if (!sellerSignals) {
    return {
      id: 'seller-signals-missing',
      name: 'Seller Behavior History',
      status: 'missing',
      impact: 'medium',
      explanation: 'No seller behavior data available. Cannot assess relisting patterns, price changes, or seller credibility.'
    };
  }
  
  const hasListingBehavior = !!sellerSignals.listingBehavior;
  const hasPricingBehavior = !!sellerSignals.pricingBehavior;
  const hasProfileConsistency = !!sellerSignals.profileConsistency;
  
  const availableSignals = [hasListingBehavior, hasPricingBehavior, hasProfileConsistency].filter(Boolean).length;
  
  if (availableSignals === 0) {
    return {
      id: 'seller-signals-none',
      name: 'Seller Behavior History',
      status: 'unavailable',
      impact: 'medium',
      explanation: 'Seller behavior data unavailable. This may be a new listing or the vehicle is not listed on tracked platforms.'
    };
  }
  
  if (availableSignals < 3) {
    return {
      id: 'seller-signals-partial',
      name: 'Seller Behavior History',
      status: 'partial',
      impact: 'medium',
      explanation: `Limited seller behavior data (${availableSignals} of 3 signal types available). Analysis may miss some risk patterns.`
    };
  }
  
  return {
    id: 'seller-signals-complete',
    name: 'Seller Behavior History',
    status: 'complete',
    impact: 'medium',
    explanation: 'Comprehensive seller behavior data available. Relisting patterns, price changes, and seller profile have been analyzed.'
  };
}

/**
 * Assess location data completeness
 */
function assessLocationData(
  request: AnalysisRequest,
  environmentalRisk?: VerdictResult['environmentalRisk'],
  disasterData?: VerdictResult['disasterData']
): DataQualityFactor {
  if (!request.location) {
    return {
      id: 'location-missing',
      name: 'Location Information',
      status: 'missing',
      impact: 'medium',
      explanation: 'No location provided. Environmental risk assessment (flood zones, disaster history) cannot be performed.'
    };
  }
  
  const hasEnvironmentalRisk = !!environmentalRisk;
  const hasDisasterData = !!disasterData;
  
  if (!hasEnvironmentalRisk && !hasDisasterData) {
    return {
      id: 'location-no-data',
      name: 'Location Data',
      status: 'unavailable',
      impact: 'low',
      explanation: 'Location provided but no environmental or disaster data found. This may indicate low risk or data unavailability.'
    };
  }
  
  if (hasEnvironmentalRisk && environmentalRisk.confidence < 50) {
    return {
      id: 'location-low-confidence',
      name: 'Location Data',
      status: 'partial',
      impact: 'low',
      explanation: 'Location data available but confidence is low. Environmental risk assessment may be incomplete.'
    };
  }
  
  return {
    id: 'location-complete',
    name: 'Location Information',
    status: 'complete',
    impact: 'low',
    explanation: 'Location provided and environmental risk data retrieved. Disaster and flood risk have been assessed.'
  };
}

/**
 * Assess external source availability
 */
function assessExternalSources(
  recalls?: VerdictResult['recalls'],
  vehicleHistory?: VerdictResult['vehicleHistory']
): DataQualityFactor {
  const hasRecalls = recalls !== undefined; // Even empty array means we checked
  const hasHistory = !!vehicleHistory?.nmvtis;
  
  if (!hasRecalls && !hasHistory) {
    return {
      id: 'external-sources-none',
      name: 'External Data Sources',
      status: 'unavailable',
      impact: 'medium',
      explanation: 'Unable to access external data sources (recalls, vehicle history). Some risk factors may be undetected.'
    };
  }
  
  if (hasRecalls && hasHistory) {
    return {
      id: 'external-sources-complete',
      name: 'External Data Sources',
      status: 'complete',
      impact: 'medium',
      explanation: 'External data sources accessible. Recalls and vehicle history have been checked.'
    };
  }
  
  return {
    id: 'external-sources-partial',
    name: 'External Data Sources',
    status: 'partial',
    impact: 'medium',
    explanation: `Only ${hasRecalls ? 'recalls' : 'vehicle history'} data available. Some external sources are unavailable.`
  };
}

/**
 * Assess mileage data
 */
function assessMileageData(
  request: AnalysisRequest,
  vehicleHistory?: VerdictResult['vehicleHistory']
): DataQualityFactor {
  if (!request.mileage) {
    return {
      id: 'mileage-missing',
      name: 'Mileage Information',
      status: 'missing',
      impact: 'low',
      explanation: 'No mileage provided. Value estimates and wear assessment may be less accurate.'
    };
  }
  
  const hasOdometerHistory = !!vehicleHistory?.nmvtis?.odometer && vehicleHistory.nmvtis.odometer.length > 0;
  
  if (!hasOdometerHistory) {
    return {
      id: 'mileage-no-history',
      name: 'Mileage Information',
      status: 'partial',
      impact: 'low',
      explanation: 'Mileage provided but no historical odometer records available for verification.'
    };
  }
  
  return {
    id: 'mileage-complete',
    name: 'Mileage Information',
    status: 'complete',
    impact: 'low',
    explanation: 'Mileage provided and historical odometer records available for verification.'
  };
}

/**
 * Calculate overall confidence level and score
 */
function calculateConfidence(
  factors: DataQualityFactor[]
): { level: 'high' | 'medium' | 'low'; score: number } {
  // Weight factors by impact
  let totalWeight = 0;
  let weightedScore = 0;
  
  factors.forEach(factor => {
    let weight = 1;
    if (factor.impact === 'high') weight = 3;
    else if (factor.impact === 'medium') weight = 2;
    else if (factor.impact === 'low') weight = 1;
    
    let factorScore = 0;
    if (factor.status === 'complete') factorScore = 100;
    else if (factor.status === 'partial') factorScore = 50;
    else if (factor.status === 'unavailable') factorScore = 25;
    else if (factor.status === 'missing') factorScore = 0;
    
    totalWeight += weight;
    weightedScore += factorScore * weight;
  });
  
  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  
  let level: 'high' | 'medium' | 'low';
  if (score >= 75) level = 'high';
  else if (score >= 50) level = 'medium';
  else level = 'low';
  
  // Be conservative: if any high-impact factor is missing, cap at medium
  const hasMissingHighImpact = factors.some(
    f => f.impact === 'high' && f.status === 'missing'
  );
  if (hasMissingHighImpact && level === 'high') {
    level = 'medium';
    // Adjust score downward
    const adjustedScore = Math.min(score, 70);
    return { level, score: adjustedScore };
  }
  
  return { level, score };
}

/**
 * Generate plain-English summary
 */
function generateSummary(
  level: 'high' | 'medium' | 'low',
  factors: DataQualityFactor[]
): string {
  const highImpactIssues = factors.filter(f => f.impact === 'high' && f.status !== 'complete');
  const missingCritical = factors.filter(f => f.impact === 'high' && f.status === 'missing');
  
  if (level === 'high') {
    if (highImpactIssues.length === 0) {
      return 'We have comprehensive data for this vehicle. Our analysis is based on multiple reliable sources and should be highly accurate.';
    } else {
      return 'We have good data coverage for this vehicle, though some information is incomplete. Our analysis should be reasonably reliable.';
    }
  }
  
  if (level === 'medium') {
    if (missingCritical.length > 0) {
      return 'Some critical information is missing, which limits the accuracy of our analysis. Important data gaps may affect the reliability of our assessment.';
    } else {
      return 'We have partial data for this vehicle. While we can provide an analysis, some important information is unavailable or incomplete.';
    }
  }
  
  // Low confidence
  if (missingCritical.length > 0) {
    return 'Significant data gaps limit our ability to provide a reliable analysis. Critical information is missing, and our assessment should be treated with caution.';
  } else {
    return 'Limited data is available for this vehicle. Our analysis is based on incomplete information and may not capture all relevant risk factors.';
  }
}

/**
 * Generate recommendations based on data gaps
 */
function generateRecommendations(
  factors: DataQualityFactor[]
): string[] {
  const recommendations: string[] = [];
  
  const missingVIN = factors.find(f => f.id === 'vin-missing');
  if (missingVIN) {
    recommendations.push('Provide the VIN to access vehicle history, title records, and recall information.');
  }
  
  const incompleteVIN = factors.find(f => f.id === 'vin-incomplete');
  if (incompleteVIN) {
    recommendations.push('Ensure all vehicle details (year, make, model) are provided for accurate analysis.');
  }
  
  const missingMarket = factors.find(f => f.id === 'market-missing' || f.id === 'market-no-sources');
  if (missingMarket) {
    recommendations.push('Market pricing data is unavailable. Consider verifying the asking price against similar listings manually.');
  }
  
  const missingLocation = factors.find(f => f.id === 'location-missing');
  if (missingLocation) {
    recommendations.push('Provide the vehicle location to assess environmental risks (flood zones, disaster history).');
  }
  
  const missingMileage = factors.find(f => f.id === 'mileage-missing');
  if (missingMileage) {
    recommendations.push('Provide the vehicle mileage for more accurate value estimation.');
  }
  
  const premiumSignals = factors.find(f => f.id === 'seller-signals-premium');
  if (premiumSignals) {
    recommendations.push('Upgrade to premium to access seller behavior analysis (relisting detection, price volatility).');
  }
  
  return recommendations;
}

/**
 * Assess data quality and confidence for a vehicle analysis
 */
export function assessDataQuality(
  request: AnalysisRequest,
  result: VerdictResult
): DataQualityAssessment {
  const factors: DataQualityFactor[] = [];
  
  // Assess all data quality factors
  // Pass vehicleInfo so we can check decoded VIN data, not just original request
  factors.push(assessVINData(request, result.vehicleHistory, result.vehicleInfo));
  factors.push(assessMarketData(result.marketData, result.vehicleInfo.estimatedValue));
  factors.push(assessSellerSignals(result.sellerSignals, result.tier));
  factors.push(assessLocationData(request, result.environmentalRisk, result.disasterData));
  factors.push(assessExternalSources(result.recalls, result.vehicleHistory));
  factors.push(assessMileageData(request, result.vehicleHistory));
  
  // Calculate overall confidence
  const { level, score } = calculateConfidence(factors);
  
  // Generate summary and recommendations
  const summary = generateSummary(level, factors);
  const recommendations = generateRecommendations(factors);
  
  return {
    overallConfidence: level,
    confidenceScore: score,
    factors,
    summary,
    recommendations
  };
}

