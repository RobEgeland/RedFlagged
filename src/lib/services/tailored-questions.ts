/**
 * Tailored Questions Service
 * Premium Feature: Generates comprehensive, report-specific questions to ask the seller
 * based on all analysis findings including red flags, vehicle history, market data,
 * maintenance risks, environmental risks, and seller signals.
 */

import { VerdictResult, RedFlag } from '@/types/vehicle';

export interface TailoredQuestion {
  question: string;
  category: 'title-history' | 'pricing' | 'maintenance' | 'condition' | 'seller' | 'environmental' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  context: string; // Why this question matters based on the report
  relatedFindings?: string[]; // What findings triggered this question
}

export interface TailoredQuestionsAnalysis {
  questions: TailoredQuestion[];
  summary: string;
  categories: {
    critical: TailoredQuestion[];
    high: TailoredQuestion[];
    medium: TailoredQuestion[];
    low: TailoredQuestion[];
  };
}

/**
 * Generate tailored questions based on the complete analysis report
 */
export function generateTailoredQuestions(result: VerdictResult): TailoredQuestionsAnalysis {
  const questions: TailoredQuestion[] = [];
  const flagIds = new Set(result.redFlags.map(f => f.id));
  
  // Title and History Questions (Critical Priority)
  if (flagIds.has('title-brands') || flagIds.has('salvage-record') || flagIds.has('theft-record')) {
    questions.push({
      question: 'Can I see the title? What specific brands does it have, and when were they applied?',
      category: 'title-history',
      priority: 'critical',
      context: 'The report indicates title issues that could significantly impact vehicle value and insurability.',
      relatedFindings: result.redFlags
        .filter(f => ['title-brands', 'salvage-record', 'theft-record'].includes(f.id))
        .map(f => f.name)
    });
  } else {
    questions.push({
      question: 'Can I see the title? Is it clean, or does it have any brands (salvage, rebuilt, lemon)?',
      category: 'title-history',
      priority: 'high',
      context: 'Verifying title status is essential before purchase.',
      relatedFindings: []
    });
  }
  
  if (flagIds.has('accident-indicator') || result.vehicleHistory?.carfaxAutoCheck?.accidentIndicators) {
    questions.push({
      question: 'Has this vehicle been in any accidents? Can you provide details about what happened and what repairs were made?',
      category: 'title-history',
      priority: 'critical',
      context: 'The vehicle history suggests accident indicators that may affect structural integrity and value.',
      relatedFindings: ['Accident indicators in vehicle history']
    });
  }
  
  if (result.vehicleHistory?.carfaxAutoCheck?.ownershipChanges && result.vehicleHistory.carfaxAutoCheck.ownershipChanges > 2) {
    questions.push({
      question: `This vehicle has had ${result.vehicleHistory.carfaxAutoCheck.ownershipChanges} previous owners. Why has this vehicle changed hands so frequently?`,
      category: 'title-history',
      priority: 'high',
      context: 'Multiple ownership changes may indicate underlying issues or maintenance concerns.',
      relatedFindings: [`${result.vehicleHistory.carfaxAutoCheck.ownershipChanges} previous owners`]
    });
  }
  
  // Pricing Questions
  if (result.vehicleInfo.priceDifferencePercent && result.vehicleInfo.priceDifferencePercent > 10) {
    const diff = Math.abs(result.vehicleInfo.priceDifferencePercent);
    questions.push({
      question: `I've researched similar vehicles and found comparable listings priced ${diff.toFixed(0)}% ${result.vehicleInfo.priceDifferencePercent > 0 ? 'lower' : 'higher'} than your asking price. What factors justify this price difference?`,
      category: 'pricing',
      priority: 'high',
      context: `Market analysis shows the asking price is ${diff.toFixed(0)}% ${result.vehicleInfo.priceDifferencePercent > 0 ? 'above' : 'below'} typical market value for similar vehicles.`,
      relatedFindings: [`Price ${diff.toFixed(0)}% ${result.vehicleInfo.priceDifferencePercent > 0 ? 'above' : 'below'} market value`]
    });
  }
  
  if (flagIds.has('underpriced')) {
    questions.push({
      question: 'This price seems significantly lower than market value. Is there anything wrong with the vehicle I should know about? Any mechanical issues, damage, or other concerns?',
      category: 'pricing',
      priority: 'critical',
      context: 'Unusually low pricing may indicate hidden problems or urgent seller motivation.',
      relatedFindings: ['Unusually low price detected']
    });
  }
  
  if (result.marketPricingAnalysis?.negotiationLeverage.level === 'strong') {
    questions.push({
      question: `Based on market data, similar vehicles are priced ${Math.abs(result.marketPricingAnalysis.askingPricePosition.differencePercent).toFixed(0)}% ${result.marketPricingAnalysis.askingPricePosition.position === 'above' ? 'lower' : 'higher'}. Are you open to negotiation?`,
      category: 'pricing',
      priority: 'high',
      context: result.marketPricingAnalysis.negotiationLeverage.explanation,
      relatedFindings: ['Market pricing analysis indicates strong negotiation leverage']
    });
  }
  
  // Maintenance Questions
  if (result.maintenanceRiskAssessment) {
    const assessment = result.maintenanceRiskAssessment;
    
    if (assessment.overallRisk === 'elevated') {
      questions.push({
        question: 'This vehicle is at an age/mileage where major maintenance items are typically due. What major maintenance has been performed recently (timing belt/chain, transmission service, suspension work)?',
        category: 'maintenance',
        priority: 'high',
        context: assessment.classification,
        relatedFindings: [`Maintenance risk: ${assessment.overallRisk}`, ...assessment.riskFactors.slice(0, 2).map(f => f.component)]
      });
    }
    
    if (assessment.inspectionFocus.length > 0) {
      const highPriorityItems = assessment.inspectionFocus.filter(item => item.priority === 'high');
      if (highPriorityItems.length > 0) {
        questions.push({
          question: `Can you provide service records for ${highPriorityItems[0].component}? ${highPriorityItems[0].reason}`,
          category: 'maintenance',
          priority: 'high',
          context: highPriorityItems[0].whatToCheck,
          relatedFindings: [`High-priority inspection item: ${highPriorityItems[0].component}`]
        });
      }
    }
    
    if (result.vehicleInfo.mileage && result.vehicleInfo.mileage >= 100000) {
      questions.push({
        question: 'Has the timing belt/chain been replaced? This is a critical maintenance item that can cause catastrophic engine failure if it breaks.',
        category: 'maintenance',
        priority: 'critical',
        context: 'Vehicles over 100,000 miles typically require timing belt/chain replacement.',
        relatedFindings: [`High mileage: ${result.vehicleInfo.mileage.toLocaleString()} miles`]
      });
    }
  }
  
  if (flagIds.has('high-mileage')) {
    questions.push({
      question: 'Given the high mileage, what major components have been replaced or rebuilt? (engine, transmission, suspension, etc.)',
      category: 'maintenance',
      priority: 'high',
      context: 'High-mileage vehicles often require major component replacement.',
      relatedFindings: ['High mileage flag']
    });
  }
  
  if (flagIds.has('high-age')) {
    questions.push({
      question: 'Do you have complete maintenance records? For a vehicle of this age, maintenance history is crucial.',
      category: 'maintenance',
      priority: 'high',
      context: 'Older vehicles require careful maintenance to remain reliable.',
      relatedFindings: ['High age flag']
    });
  }
  
  // Condition Questions
  questions.push({
    question: 'Are there any current mechanical issues, warning lights on the dashboard, or unusual sounds or behaviors?',
    category: 'condition',
    priority: 'high',
    context: 'Understanding current condition helps assess immediate repair needs.',
    relatedFindings: []
  });
  
  if (result.recalls && result.recalls.length > 0) {
    questions.push({
      question: `This vehicle has ${result.recalls.length} open recall${result.recalls.length > 1 ? 's' : ''}. Have these been addressed? Can you provide documentation?`,
      category: 'condition',
      priority: 'high',
      context: 'Open recalls represent safety issues that should be resolved before purchase.',
      relatedFindings: [`${result.recalls.length} open recall${result.recalls.length > 1 ? 's' : ''}`]
    });
  }
  
  questions.push({
    question: 'Can I have the vehicle inspected by my own mechanic before purchasing?',
    category: 'condition',
    priority: 'critical',
    context: 'Professional inspection is essential to identify hidden issues.',
    relatedFindings: []
  });
  
  // Environmental Questions
  if (result.environmentalRisk?.disasterPresence) {
    const recentDisasters = result.environmentalRisk.recentDisasters || [];
    if (recentDisasters.length > 0) {
      const disasterTypes = [...new Set(recentDisasters.map(d => d.disasterType))].join(', ');
      questions.push({
        question: `This area has experienced ${disasterTypes} in recent years. Has this vehicle been exposed to flooding, water damage, or other weather-related issues?`,
        category: 'environmental',
        priority: 'high',
        context: `Recent disaster history in the area (${disasterTypes}) increases risk of weather-related damage.`,
        relatedFindings: [`Environmental risk: ${disasterTypes}`]
      });
    }
  }
  
  if (result.environmentalRisk?.floodZoneRisk === 'high' || result.environmentalRisk?.floodZoneRisk === 'medium') {
    questions.push({
      question: 'Has this vehicle ever been exposed to flooding or water damage? Have you noticed any water stains, musty odors, or electrical issues?',
      category: 'environmental',
      priority: 'critical',
      context: `The vehicle is in a ${result.environmentalRisk.floodZoneRisk} flood risk zone.`,
      relatedFindings: [`Flood zone risk: ${result.environmentalRisk.floodZoneRisk}`]
    });
  }
  
  // Seller Questions
  if (result.sellerSignals?.pricingBehavior?.unusuallyLowPrice?.detected) {
    questions.push({
      question: 'Why is this vehicle priced so far below market value? Are you motivated to sell quickly?',
      category: 'seller',
      priority: 'high',
      context: 'Unusually low pricing may indicate seller motivation or hidden issues.',
      relatedFindings: ['Unusually low price detected']
    });
  }
  
  if (result.sellerSignals?.listingBehavior?.listingLongevity?.daysListed && 
      result.sellerSignals.listingBehavior.listingLongevity.daysListed > 60) {
    questions.push({
      question: `This listing has been active for ${result.sellerSignals.listingBehavior.listingLongevity.daysListed} days. Has anyone else looked at or made offers on this vehicle? If so, why didn't those sales go through?`,
      category: 'seller',
      priority: 'medium',
      context: 'Extended listing duration may indicate issues that prevented previous sales.',
      relatedFindings: [`Listed for ${result.sellerSignals.listingBehavior.listingLongevity.daysListed} days`]
    });
  }
  
  questions.push({
    question: 'Why are you selling this vehicle?',
    category: 'seller',
    priority: 'medium',
    context: 'Understanding seller motivation can provide negotiation context.',
    relatedFindings: []
  });
  
  // General Questions
  if (result.vehicleInfo.mileage && result.vehicleInfo.mileage < 50000 && result.vehicleInfo.year && 
      (new Date().getFullYear() - result.vehicleInfo.year) > 5) {
    questions.push({
      question: 'Why does this vehicle have such low mileage for its age? Has it been in storage or used very infrequently?',
      category: 'general',
      priority: 'medium',
      context: 'Low mileage on an older vehicle may indicate storage or infrequent use, which can have its own issues.',
      relatedFindings: [`Low mileage: ${result.vehicleInfo.mileage.toLocaleString()} miles on a ${result.vehicleInfo.year} vehicle`]
    });
  }
  
  if (result.dataQuality?.overallConfidence === 'low') {
    questions.push({
      question: 'I notice there\'s limited vehicle history data available. Can you provide additional documentation (service records, previous inspection reports, etc.)?',
      category: 'general',
      priority: 'medium',
      context: 'Limited data quality makes additional documentation especially important.',
      relatedFindings: ['Low data quality confidence']
    });
  }
  
  // Ensure we always have at least basic questions
  if (questions.length === 0) {
    // Fallback: Add essential questions if none were generated
    questions.push({
      question: 'Can I see the title? Is it clean, or does it have any brands (salvage, rebuilt, lemon)?',
      category: 'title-history',
      priority: 'high',
      context: 'Verifying title status is essential before purchase.',
      relatedFindings: []
    });
    questions.push({
      question: 'Why are you selling this vehicle?',
      category: 'seller',
      priority: 'medium',
      context: 'Understanding seller motivation can provide negotiation context.',
      relatedFindings: []
    });
    questions.push({
      question: 'Are there any current mechanical issues, warning lights on the dashboard, or unusual sounds or behaviors?',
      category: 'condition',
      priority: 'high',
      context: 'Understanding current condition helps assess immediate repair needs.',
      relatedFindings: []
    });
    questions.push({
      question: 'Can I have the vehicle inspected by my own mechanic before purchasing?',
      category: 'condition',
      priority: 'critical',
      context: 'Professional inspection is essential to identify hidden issues.',
      relatedFindings: []
    });
  }
  
  // Organize by priority
  const categories = {
    critical: questions.filter(q => q.priority === 'critical'),
    high: questions.filter(q => q.priority === 'high'),
    medium: questions.filter(q => q.priority === 'medium'),
    low: questions.filter(q => q.priority === 'low')
  };
  
  // Generate summary
  const summary = generateSummary(questions, categories, result);
  
  console.log('[Tailored Questions] Generated questions:', {
    total: questions.length,
    critical: categories.critical.length,
    high: categories.high.length,
    medium: categories.medium.length,
    low: categories.low.length
  });
  
  return {
    questions,
    summary,
    categories
  };
}

/**
 * Generate a summary explaining the tailored questions
 */
function generateSummary(
  questions: TailoredQuestion[],
  categories: TailoredQuestionsAnalysis['categories'],
  result: VerdictResult
): string {
  const criticalCount = categories.critical.length;
  const highCount = categories.high.length;
  const totalCount = questions.length;
  
  let summary = `Based on this vehicle's analysis, ${totalCount} tailored questions have been generated to help you gather critical information before purchase. `;
  
  if (criticalCount > 0) {
    summary += `${criticalCount} critical question${criticalCount > 1 ? 's' : ''} address${criticalCount === 1 ? 'es' : ''} title issues, accidents, or major concerns. `;
  }
  
  if (highCount > 0) {
    summary += `${highCount} high-priority question${highCount > 1 ? 's' : ''} focus${highCount === 1 ? 'es' : ''} on pricing, maintenance, and condition verification. `;
  }
  
  const categoryCounts = {
    'title-history': questions.filter(q => q.category === 'title-history').length,
    'pricing': questions.filter(q => q.category === 'pricing').length,
    'maintenance': questions.filter(q => q.category === 'maintenance').length,
    'environmental': questions.filter(q => q.category === 'environmental').length,
    'seller': questions.filter(q => q.category === 'seller').length
  };
  
  const activeCategories = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => `${category.replace('-', ' ')} (${count})`)
    .join(', ');
  
  if (activeCategories) {
    summary += `Questions are organized across ${activeCategories}. `;
  }
  
  summary += 'These questions are specifically tailored to the findings in this report and should help you make an informed purchasing decision.';
  
  return summary;
}

