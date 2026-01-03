import { RedFlag, VerdictType, DataQualityAssessment, VerdictResult } from '@/types/vehicle';

/**
 * Verdict Assembly System
 * 
 * Combines multiple risk signals into one clear outcome: Deal, Caution, or Disaster.
 * Signals are grouped into:
 * - Structural risks (flood/disaster, serious safety issues, maintenance concerns)
 * - Market risks (pricing anomalies, volatility, weak comparables, poor market position)
 * - Seller behavior risks (relisting patterns, low-price persistence)
 * 
 * Principles:
 * - No single signal determines verdict alone
 * - Disaster requires strong structural risk + at least one additional signal
 * - Caution for moderate risks, multiple weaker signals, or limited data
 * - Deal only when no meaningful risks + medium/high confidence
 * - Data quality acts as modifier (low confidence prevents Deal, softens conclusions)
 * - Premium features (maintenance risk, market pricing analysis) provide additional context
 */

export interface VerdictReasoning {
  verdict: VerdictType;
  confidence: number;
  explanation: string;
  structuralRisks: RedFlag[];
  marketRisks: RedFlag[];
  sellerBehaviorRisks: RedFlag[];
  dataQualityImpact: 'none' | 'softening' | 'preventing-deal';
  contributingFactors?: {
    maintenanceRisk?: 'low' | 'medium' | 'elevated';
    marketPosition?: 'favorable' | 'neutral' | 'unfavorable';
    environmentalRisk?: 'low' | 'medium' | 'high';
  };
}

/**
 * Categorize red flags into risk types
 */
function categorizeFlags(flags: RedFlag[]): {
  structural: RedFlag[];
  market: RedFlag[];
  sellerBehavior: RedFlag[];
} {
  const structural: RedFlag[] = [];
  const market: RedFlag[] = [];
  const sellerBehavior: RedFlag[] = [];

  flags.forEach(flag => {
    // Structural risks: serious safety issues, flood/disaster exposure
    if (
      flag.id === 'title-brands' ||
      flag.id === 'theft-record' ||
      flag.id === 'odometer-rollback' ||
      flag.id === 'accident-history' ||
      flag.id === 'environmental-risk' ||
      flag.id === 'disaster-risk' ||
      (flag.category === 'disaster' && (flag.severity === 'high' || flag.severity === 'critical'))
    ) {
      structural.push(flag);
    }
    // Market risks: pricing anomalies, volatility, weak comparables
    else if (
      flag.id === 'overpriced' ||
      flag.id === 'underpriced' ||
      flag.id === 'unusually-low-price' ||
      flag.id === 'too-good-for-too-long' ||
      flag.category === 'pricing'
    ) {
      market.push(flag);
    }
    // Seller behavior risks: relisting, price volatility, stale listings
    else if (
      flag.id === 'relisting-detected' ||
      flag.id === 'price-volatility' ||
      flag.id === 'stale-listing' ||
      flag.id === 'too-good-too-be-long' ||
      flag.category === 'listing' ||
      flag.category === 'seller'
    ) {
      sellerBehavior.push(flag);
    }
    // Default: categorize by severity for uncategorized flags
    else if (flag.severity === 'critical' || flag.severity === 'high') {
      structural.push(flag);
    } else {
      market.push(flag);
    }
  });

  return { structural, market, sellerBehavior };
}

/**
 * Determine if there's a strong structural risk
 */
function hasStrongStructuralRisk(structuralRisks: RedFlag[]): boolean {
  // Strong structural risks: critical severity or high severity with serious implications
  return structuralRisks.some(flag => 
    flag.severity === 'critical' ||
    (flag.severity === 'high' && (
      flag.id === 'title-brands' ||
      flag.id === 'theft-record' ||
      flag.id === 'odometer-rollback' ||
      flag.id === 'accident-history'
    ))
  );
}

/**
 * Determine if environmental risk is the only structural risk
 */
function hasOnlyEnvironmentalRisk(structuralRisks: RedFlag[]): boolean {
  return structuralRisks.length === 1 && 
         structuralRisks[0].id === 'environmental-risk';
}

/**
 * Count meaningful risk signals (excluding low severity)
 */
function countMeaningfulRisks(risks: RedFlag[]): number {
  return risks.filter(r => r.severity !== 'low').length;
}

/**
 * Assess data quality impact on verdict
 */
function assessDataQualityImpact(
  dataQuality: DataQualityAssessment | undefined,
  proposedVerdict: VerdictType
): 'none' | 'softening' | 'preventing-deal' {
  if (!dataQuality) return 'none';
  
  // Low confidence prevents Deal verdict
  if (dataQuality.overallConfidence === 'low' && proposedVerdict === 'deal') {
    return 'preventing-deal';
  }
  
  // Medium or low confidence softens conclusions
  if (dataQuality.overallConfidence === 'low' || dataQuality.overallConfidence === 'medium') {
    return 'softening';
  }
  
  return 'none';
}

/**
 * Assess maintenance risk contribution to verdict
 */
function assessMaintenanceRiskContribution(
  maintenanceRisk?: VerdictResult['maintenanceRiskAssessment']
): 'low' | 'medium' | 'elevated' | null {
  if (!maintenanceRisk) return null;
  return maintenanceRisk.overallRisk;
}

/**
 * Assess market pricing position contribution to verdict
 */
function assessMarketPositionContribution(
  marketPricing?: VerdictResult['marketPricingAnalysis']
): 'favorable' | 'neutral' | 'unfavorable' | null {
  if (!marketPricing) return null;
  
  // Unfavorable: high percentile (overpriced) with weak negotiation leverage
  if (marketPricing.askingPricePosition?.percentile && marketPricing.negotiationLeverage) {
    const percentile = marketPricing.askingPricePosition.percentile;
    const leverageLevel = marketPricing.negotiationLeverage.level;
    if (percentile >= 75 && leverageLevel === 'limited') {
      return 'unfavorable';
    }
    if (percentile <= 25 && leverageLevel === 'strong') {
      return 'favorable';
    }
  }
  
  // Check asking price position
  if (marketPricing.askingPricePosition?.position === 'above' && marketPricing.askingPricePosition.differencePercent > 10) {
    return 'unfavorable';
  }
  if (marketPricing.askingPricePosition?.position === 'below' && marketPricing.askingPricePosition.differencePercent < -10) {
    return 'favorable';
  }
  
  return 'neutral';
}

/**
 * Assess environmental risk contribution to verdict
 */
function assessEnvironmentalRiskContribution(
  environmentalRisk?: VerdictResult['environmentalRisk']
): 'low' | 'medium' | 'high' | null {
  if (!environmentalRisk) return null;
  
  // Determine risk level based on available data
  if (environmentalRisk.floodZoneRisk === 'high' || (environmentalRisk.disasterPresence && environmentalRisk.recency === 'recent')) {
    return 'high';
  }
  if (environmentalRisk.floodZoneRisk === 'medium' || (environmentalRisk.disasterPresence && environmentalRisk.recency === 'historical')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Assemble verdict from categorized risk signals and premium features
 */
export function assembleVerdict(
  flags: RedFlag[],
  dataQuality: DataQualityAssessment | undefined,
  result?: Partial<VerdictResult>
): VerdictReasoning {
  const { structural, market, sellerBehavior } = categorizeFlags(flags);
  
  // Assess premium feature contributions
  const maintenanceRisk = assessMaintenanceRiskContribution(result?.maintenanceRiskAssessment);
  const marketPosition = assessMarketPositionContribution(result?.marketPricingAnalysis);
  const environmentalRiskLevel = assessEnvironmentalRiskContribution(result?.environmentalRisk);
  
  const hasStrongStructural = hasStrongStructuralRisk(structural);
  const onlyEnvironmental = hasOnlyEnvironmentalRisk(structural);
  const structuralCount = countMeaningfulRisks(structural);
  const marketCount = countMeaningfulRisks(market);
  const sellerBehaviorCount = countMeaningfulRisks(sellerBehavior);
  
  // Count premium feature risks as additional signals
  let premiumRiskCount = 0;
  if (maintenanceRisk === 'elevated') premiumRiskCount += 1;
  if (marketPosition === 'unfavorable') premiumRiskCount += 0.5; // Half weight for market position
  if (environmentalRiskLevel === 'high' && !onlyEnvironmental) premiumRiskCount += 0.5; // Half weight if not already counted
  
  const totalMeaningfulRisks = structuralCount + marketCount + sellerBehaviorCount + Math.floor(premiumRiskCount);
  
  // Rule 1: Deal verdict requires no meaningful risks + medium/high confidence
  // Elevated maintenance risk or unfavorable market position can prevent Deal
  if (totalMeaningfulRisks === 0 && maintenanceRisk !== 'elevated' && marketPosition !== 'unfavorable') {
    // Check data quality - low confidence prevents Deal verdict
    const hasLowConfidence = dataQuality?.overallConfidence === 'low';
    const hasMediumOrHighConfidence = !dataQuality || 
      dataQuality.overallConfidence === 'medium' || 
      dataQuality.overallConfidence === 'high';
    
    if (hasLowConfidence) {
      return {
        verdict: 'caution',
        confidence: Math.max(40, (dataQuality?.confidenceScore || 75) - 10),
        explanation: 'No significant risk signals detected, but limited data quality prevents a confident "Deal" assessment. Proceed with standard due diligence.',
        structuralRisks: [],
        marketRisks: [],
        sellerBehaviorRisks: [],
        dataQualityImpact: 'preventing-deal',
        contributingFactors: {
          maintenanceRisk: maintenanceRisk || undefined,
          marketPosition: marketPosition || undefined,
          environmentalRisk: environmentalRiskLevel || undefined
        }
      };
    }
    
    if (hasMediumOrHighConfidence) {
      let explanation = 'No meaningful risk signals detected. This appears to be a reasonable deal with standard due diligence recommended.';
      
      // Add premium feature context if available
      if (maintenanceRisk === 'medium') {
        explanation += ' Note: Maintenance risk assessment indicates moderate forward-looking maintenance concerns.';
      }
      if (marketPosition === 'favorable') {
        explanation += ' Market pricing analysis suggests favorable negotiation position.';
      }
      
      return {
        verdict: 'deal',
        confidence: dataQuality?.confidenceScore || 85,
        explanation,
        structuralRisks: [],
        marketRisks: [],
        sellerBehaviorRisks: [],
        dataQualityImpact: 'none',
        contributingFactors: {
          maintenanceRisk: maintenanceRisk || undefined,
          marketPosition: marketPosition || undefined,
          environmentalRisk: environmentalRiskLevel || undefined
        }
      };
    }
    
    // Fallback if confidence is unclear
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 70) - 5),
      explanation: 'No significant risk signals detected, but data quality assessment is incomplete. Proceed with standard due diligence.',
      structuralRisks: [],
      marketRisks: [],
      sellerBehaviorRisks: [],
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Elevated maintenance risk without other signals -> Caution
  if (totalMeaningfulRisks === 0 && maintenanceRisk === 'elevated') {
    return {
      verdict: 'caution',
      confidence: Math.max(55, (dataQuality?.confidenceScore || 75) - 5),
      explanation: 'No red flag signals detected, but maintenance risk assessment indicates elevated forward-looking maintenance concerns. Budget for potential repairs and factor maintenance costs into your decision.',
      structuralRisks: [],
      marketRisks: [],
      sellerBehaviorRisks: [],
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: 'elevated',
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Unfavorable market position without other signals -> Caution
  if (totalMeaningfulRisks === 0 && marketPosition === 'unfavorable') {
    return {
      verdict: 'caution',
      confidence: Math.max(60, (dataQuality?.confidenceScore || 75) - 5),
      explanation: 'No red flag signals detected, but market pricing analysis indicates the asking price is positioned unfavorably compared to comparable listings. Negotiation leverage appears weak.',
      structuralRisks: [],
      marketRisks: [],
      sellerBehaviorRisks: [],
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: 'unfavorable',
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Rule 2: Disaster requires strong structural risk + at least one additional signal from another category
  // Elevated maintenance risk or unfavorable market position can serve as additional signals
  if (hasStrongStructural && !onlyEnvironmental) {
    const hasAdditionalSignal = marketCount > 0 || sellerBehaviorCount > 0 || 
                                 maintenanceRisk === 'elevated' || marketPosition === 'unfavorable';
    
    if (hasAdditionalSignal) {
      // Strong structural risk confirmed by additional signals
      const qualityImpact = assessDataQualityImpact(dataQuality, 'disaster');
      const confidence = qualityImpact === 'softening' 
        ? Math.max(50, (dataQuality?.confidenceScore || 75) - 5)
        : (dataQuality?.confidenceScore || 75);
      
      let explanation = `Strong structural risk (${structural.filter(f => f.severity === 'critical' || f.severity === 'high').map(f => f.title).join(', ')})`;
      
      const additionalSignals: string[] = [];
      if (marketCount > 0) additionalSignals.push('market risk signals');
      if (sellerBehaviorCount > 0) additionalSignals.push('seller behavior concerns');
      if (maintenanceRisk === 'elevated') additionalSignals.push('elevated maintenance risk');
      if (marketPosition === 'unfavorable') additionalSignals.push('unfavorable market pricing');
      
      explanation += ` combined with ${additionalSignals.join(', ')}. This combination indicates significant concerns.`;
      
      return {
        verdict: 'disaster',
        confidence,
        explanation,
        structuralRisks: structural,
        marketRisks: market,
        sellerBehaviorRisks: sellerBehavior,
        dataQualityImpact: qualityImpact,
        contributingFactors: {
          maintenanceRisk: maintenanceRisk || undefined,
          marketPosition: marketPosition || undefined,
          environmentalRisk: environmentalRiskLevel || undefined
        }
      };
    }
  }
  
  // Rule 3: Caution scenarios
  // - Moderate risks
  // - Multiple weaker signals stacking together
  // - Unusually low prices without confirmation
  // - Environmental exposure alone
  // - Limited data quality
  
  // Environmental risk alone -> Caution
  if (onlyEnvironmental) {
    let explanation = 'Environmental exposure detected, but this is a probabilistic signal and not proof of damage. Inspect carefully for water damage or corrosion.';
    
    // Add maintenance risk context if available
    if (maintenanceRisk === 'elevated') {
      explanation += ' Combined with elevated maintenance risk, this suggests increased inspection priority.';
    }
    
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 75) - 10),
      explanation,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Unusually low price without strong structural confirmation -> Caution
  const hasUnusuallyLowPrice = market.some(f => f.id === 'unusually-low-price');
  const hasTooGoodForTooLong = market.some(f => f.id === 'too-good-for-too-long');
  if ((hasUnusuallyLowPrice || hasTooGoodForTooLong) && !hasStrongStructural) {
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 75) - 5),
      explanation: 'Unusually low pricing detected without structural risk confirmation. This pricing anomaly warrants extra scrutiny but does not imply a defect. Inspect carefully and verify vehicle condition.',
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening'
    };
  }
  
  // Multiple weaker signals stacking -> Caution
  if (totalMeaningfulRisks >= 2 && !hasStrongStructural) {
    const qualityImpact = assessDataQualityImpact(dataQuality, 'caution');
    const confidence = qualityImpact === 'softening'
      ? Math.max(50, (dataQuality?.confidenceScore || 75) - 5)
      : (dataQuality?.confidenceScore || 70);
    
    const categories: string[] = [];
    if (structuralCount > 0) categories.push('structural');
    if (marketCount > 0) categories.push('market');
    if (sellerBehaviorCount > 0) categories.push('seller behavior');
    if (maintenanceRisk === 'elevated') categories.push('maintenance');
    if (marketPosition === 'unfavorable') categories.push('pricing');
    
    let explanation = `Multiple risk signals detected across ${categories.join(', ')} categories. While no single signal is critical, the combination warrants careful investigation.`;
    
    if (maintenanceRisk === 'elevated') {
      explanation += ' Elevated maintenance risk suggests budgeting for potential repairs.';
    }
    if (marketPosition === 'unfavorable') {
      explanation += ' Market pricing analysis indicates weak negotiation leverage.';
    }
    
    return {
      verdict: 'caution',
      confidence,
      explanation,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: qualityImpact,
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Moderate structural risk without additional signals -> Caution
  if (structuralCount > 0 && !hasStrongStructural && marketCount === 0 && sellerBehaviorCount === 0 && 
      maintenanceRisk !== 'elevated' && marketPosition !== 'unfavorable') {
    let explanation = `Moderate structural risk detected (${structural.map(f => f.title).join(', ')}). Investigate thoroughly before proceeding.`;
    if (maintenanceRisk === 'medium') {
      explanation += ' Maintenance risk assessment indicates moderate forward-looking concerns.';
    }
    
    return {
      verdict: 'caution',
      confidence: Math.max(55, (dataQuality?.confidenceScore || 75) - 5),
      explanation,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Strong structural risk without additional signals -> Caution (not Disaster)
  if (hasStrongStructural && marketCount === 0 && sellerBehaviorCount === 0 && 
      maintenanceRisk !== 'elevated' && marketPosition !== 'unfavorable') {
    const explanation = `Strong structural risk detected (${structural.filter(f => f.severity === 'critical' || f.severity === 'high').map(f => f.title).join(', ')}), but no additional confirming signals from market or seller behavior. Proceed with extreme caution and thorough inspection.`;
    
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 75) - 10),
      explanation,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Single moderate risk -> Caution
  if (totalMeaningfulRisks === 1 && maintenanceRisk !== 'elevated' && marketPosition !== 'unfavorable') {
    const singleRisk = [...structural, ...market, ...sellerBehavior].find(r => r.severity !== 'low');
    let explanation = `One moderate risk signal detected: ${singleRisk?.title || 'risk identified'}. Investigate this concern before proceeding.`;
    if (maintenanceRisk === 'medium') {
      explanation += ' Maintenance risk assessment indicates moderate forward-looking concerns.';
    }
    
    return {
      verdict: 'caution',
      confidence: Math.max(60, (dataQuality?.confidenceScore || 75) - 5),
      explanation,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening',
      contributingFactors: {
        maintenanceRisk: maintenanceRisk || undefined,
        marketPosition: marketPosition || undefined,
        environmentalRisk: environmentalRiskLevel || undefined
      }
    };
  }
  
  // Fallback: Default to Caution for any remaining cases
  const qualityImpact = assessDataQualityImpact(dataQuality, 'caution');
  let explanation = 'Risk signals detected that warrant investigation. Review all concerns carefully before making a decision.';
  
  if (maintenanceRisk === 'elevated') {
    explanation += ' Elevated maintenance risk suggests budgeting for potential repairs.';
  }
  if (marketPosition === 'unfavorable') {
    explanation += ' Market pricing analysis indicates weak negotiation leverage.';
  }
  
  return {
    verdict: 'caution',
    confidence: Math.max(50, (dataQuality?.confidenceScore || 70) - 5),
    explanation,
    structuralRisks: structural,
    marketRisks: market,
    sellerBehaviorRisks: sellerBehavior,
    dataQualityImpact: qualityImpact,
    contributingFactors: {
      maintenanceRisk: maintenanceRisk || undefined,
      marketPosition: marketPosition || undefined,
      environmentalRisk: environmentalRiskLevel || undefined
    }
  };
}

