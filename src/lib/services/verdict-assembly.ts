import { RedFlag, VerdictType, DataQualityAssessment } from '@/types/vehicle';

/**
 * Verdict Assembly System
 * 
 * Combines multiple risk signals into one clear outcome: Deal, Caution, or Disaster.
 * Signals are grouped into:
 * - Structural risks (flood/disaster, serious safety issues)
 * - Market risks (pricing anomalies, volatility, weak comparables)
 * - Seller behavior risks (relisting patterns, low-price persistence)
 * 
 * Principles:
 * - No single signal determines verdict alone
 * - Disaster requires strong structural risk + at least one additional signal
 * - Caution for moderate risks, multiple weaker signals, or limited data
 * - Deal only when no meaningful risks + medium/high confidence
 * - Data quality acts as modifier (low confidence prevents Deal, softens conclusions)
 */

export interface VerdictReasoning {
  verdict: VerdictType;
  confidence: number;
  explanation: string;
  structuralRisks: RedFlag[];
  marketRisks: RedFlag[];
  sellerBehaviorRisks: RedFlag[];
  dataQualityImpact: 'none' | 'softening' | 'preventing-deal';
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
      (flag.category === 'disaster' && flag.severity === 'high' || flag.severity === 'critical')
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
 * Assemble verdict from categorized risk signals
 */
export function assembleVerdict(
  flags: RedFlag[],
  dataQuality: DataQualityAssessment | undefined
): VerdictReasoning {
  const { structural, market, sellerBehavior } = categorizeFlags(flags);
  
  const hasStrongStructural = hasStrongStructuralRisk(structural);
  const onlyEnvironmental = hasOnlyEnvironmentalRisk(structural);
  const structuralCount = countMeaningfulRisks(structural);
  const marketCount = countMeaningfulRisks(market);
  const sellerBehaviorCount = countMeaningfulRisks(sellerBehavior);
  
  const totalMeaningfulRisks = structuralCount + marketCount + sellerBehaviorCount;
  
  // Rule 1: Deal verdict requires no meaningful risks + medium/high confidence
  if (totalMeaningfulRisks === 0) {
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
        dataQualityImpact: 'preventing-deal'
      };
    }
    
    if (hasMediumOrHighConfidence) {
      return {
        verdict: 'deal',
        confidence: dataQuality?.confidenceScore || 85,
        explanation: 'No meaningful risk signals detected. This appears to be a reasonable deal with standard due diligence recommended.',
        structuralRisks: [],
        marketRisks: [],
        sellerBehaviorRisks: [],
        dataQualityImpact: 'none'
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
      dataQualityImpact: 'softening'
    };
  }
  
  // Rule 2: Disaster requires strong structural risk + at least one additional signal from another category
  if (hasStrongStructural && !onlyEnvironmental) {
    const hasAdditionalSignal = marketCount > 0 || sellerBehaviorCount > 0;
    
    if (hasAdditionalSignal) {
      // Strong structural risk confirmed by additional signals
      const qualityImpact = assessDataQualityImpact(dataQuality, 'disaster');
      const confidence = qualityImpact === 'softening' 
        ? Math.max(50, (dataQuality?.confidenceScore || 75) - 5)
        : (dataQuality?.confidenceScore || 75);
      
      return {
        verdict: 'disaster',
        confidence,
        explanation: `Strong structural risk (${structural.filter(f => f.severity === 'critical' || f.severity === 'high').map(f => f.title).join(', ')}) combined with ${marketCount > 0 ? 'market' : 'seller behavior'} risk signals. This combination indicates significant concerns.`,
        structuralRisks: structural,
        marketRisks: market,
        sellerBehaviorRisks: sellerBehavior,
        dataQualityImpact: qualityImpact
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
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 75) - 10),
      explanation: 'Environmental exposure detected, but this is a probabilistic signal and not proof of damage. Inspect carefully for water damage or corrosion.',
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening'
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
    
    return {
      verdict: 'caution',
      confidence,
      explanation: `Multiple risk signals detected across ${structuralCount > 0 ? 'structural, ' : ''}${marketCount > 0 ? 'market, ' : ''}${sellerBehaviorCount > 0 ? 'seller behavior' : ''} categories. While no single signal is critical, the combination warrants careful investigation.`,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: qualityImpact
    };
  }
  
  // Moderate structural risk without additional signals -> Caution
  if (structuralCount > 0 && !hasStrongStructural && marketCount === 0 && sellerBehaviorCount === 0) {
    return {
      verdict: 'caution',
      confidence: Math.max(55, (dataQuality?.confidenceScore || 75) - 5),
      explanation: `Moderate structural risk detected (${structural.map(f => f.title).join(', ')}). Investigate thoroughly before proceeding.`,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening'
    };
  }
  
  // Strong structural risk without additional signals -> Caution (not Disaster)
  if (hasStrongStructural && marketCount === 0 && sellerBehaviorCount === 0) {
    return {
      verdict: 'caution',
      confidence: Math.max(50, (dataQuality?.confidenceScore || 75) - 10),
      explanation: `Strong structural risk detected (${structural.filter(f => f.severity === 'critical' || f.severity === 'high').map(f => f.title).join(', ')}), but no additional confirming signals from market or seller behavior. Proceed with extreme caution and thorough inspection.`,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening'
    };
  }
  
  // Single moderate risk -> Caution
  if (totalMeaningfulRisks === 1) {
    const singleRisk = [...structural, ...market, ...sellerBehavior].find(r => r.severity !== 'low');
    return {
      verdict: 'caution',
      confidence: Math.max(60, (dataQuality?.confidenceScore || 75) - 5),
      explanation: `One moderate risk signal detected: ${singleRisk?.title || 'risk identified'}. Investigate this concern before proceeding.`,
      structuralRisks: structural,
      marketRisks: market,
      sellerBehaviorRisks: sellerBehavior,
      dataQualityImpact: 'softening'
    };
  }
  
  // Fallback: Default to Caution for any remaining cases
  const qualityImpact = assessDataQualityImpact(dataQuality, 'caution');
  return {
    verdict: 'caution',
    confidence: Math.max(50, (dataQuality?.confidenceScore || 70) - 5),
    explanation: 'Risk signals detected that warrant investigation. Review all concerns carefully before making a decision.',
    structuralRisks: structural,
    marketRisks: market,
    sellerBehaviorRisks: sellerBehavior,
    dataQualityImpact: qualityImpact
  };
}

