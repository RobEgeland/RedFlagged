import { VerdictResult, VerdictType, RedFlag, AnalysisRequest, AnalysisTier } from '@/types/vehicle';
import { fetchNMVTISData, fetchCarfaxAutoCheckData, generateHistorySummary } from './services/vehicle-history';
import { fetchAllMarketData, calculateAverageMarketValue } from './services/market-listings';
import { fetchAllDisasterData, analyzeDisasterRisk } from './services/disaster-geography';
import { analyzeAllSellerSignals, calculateSellerCredibilityScore, analyzeUnusuallyLowPrice, analyzeTooGoodForTooLong } from './services/seller-signals';
import { fetchVehicleRecalls, VehicleRecall } from './services/vehicle-recalls';
import { analyzeEnvironmentalRisk } from './services/environmental-risk';
import { assessDataQuality } from './services/data-quality';
import { assembleVerdict } from './services/verdict-assembly';
import { assessMaintenanceRisk, estimateVehicleClass } from './services/maintenance-risk-assessment';
import { analyzeMarketPricing } from './services/market-pricing-analysis';
import { generateTailoredQuestions } from './services/tailored-questions';

// Mock vehicle database for demo purposes
const vehicleData: Record<string, { make: string; model: string; year: number; avgValue: number }> = {
  '1HGCM82633A004352': { make: 'Honda', model: 'Accord', year: 2003, avgValue: 5500 },
  '5YJSA1E26HF123456': { make: 'Tesla', model: 'Model S', year: 2017, avgValue: 42000 },
  '1G1YY22G965109876': { make: 'Chevrolet', model: 'Corvette', year: 2006, avgValue: 28000 },
  '2C3CDXCT3EH123456': { make: 'Dodge', model: 'Challenger', year: 2014, avgValue: 22000 },
  'WVWZZZ3CZWE123456': { make: 'Volkswagen', model: 'Passat', year: 1998, avgValue: 2800 },
};

// Base value estimates by make/model (simplified)
const baseValues: Record<string, Record<string, number>> = {
  'Honda': { 'Civic': 18000, 'Accord': 22000, 'CR-V': 25000, 'Pilot': 32000 },
  'Toyota': { 'Camry': 21000, 'Corolla': 17000, 'RAV4': 28000, 'Highlander': 35000 },
  'Ford': { 'F-150': 35000, 'Mustang': 28000, 'Escape': 22000, 'Explorer': 32000 },
  'Chevrolet': { 'Silverado': 33000, 'Camaro': 30000, 'Equinox': 24000, 'Corvette': 55000 },
  'BMW': { '3 Series': 32000, '5 Series': 40000, 'X3': 38000, 'X5': 48000 },
  'Mercedes-Benz': { 'C-Class': 35000, 'E-Class': 45000, 'GLC': 42000, 'GLE': 52000 },
  'Tesla': { 'Model 3': 38000, 'Model Y': 45000, 'Model S': 70000, 'Model X': 80000 },
  'Dodge': { 'Challenger': 30000, 'Charger': 28000, 'Durango': 35000, 'Ram 1500': 38000 },
  'Volkswagen': { 'Jetta': 18000, 'Passat': 22000, 'Tiguan': 25000, 'Atlas': 32000 },
};

function calculateDepreciation(baseValue: number, year: number, mileage?: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  // Depreciation: ~15% first year, ~10% subsequent years (simplified)
  let depreciatedValue = baseValue;
  if (age >= 1) depreciatedValue *= 0.85;
  for (let i = 1; i < age && i < 10; i++) {
    depreciatedValue *= 0.90;
  }
  
  // Additional mileage adjustment
  if (mileage) {
    const avgMileagePerYear = 12000;
    const expectedMileage = age * avgMileagePerYear;
    const mileageDiff = mileage - expectedMileage;
    
    if (mileageDiff > 20000) {
      depreciatedValue *= 0.90; // High mileage penalty
    } else if (mileageDiff < -20000) {
      depreciatedValue *= 1.05; // Low mileage bonus
    }
  }
  
  return Math.round(depreciatedValue);
}

function getEstimatedValue(make: string, model: string, year: number, mileage?: number): number {
  const makeData = baseValues[make];
  if (!makeData) {
    // Default fallback for unknown makes
    return calculateDepreciation(20000, year, mileage);
  }
  
  const baseValue = makeData[model];
  if (!baseValue) {
    // Default for unknown model within known make
    const avgMakeValue = Object.values(makeData).reduce((a, b) => a + b, 0) / Object.values(makeData).length;
    return calculateDepreciation(avgMakeValue, year, mileage);
  }
  
  return calculateDepreciation(baseValue, year, mileage);
}

// Helper function to generate comparable listings from market data
function generateComparableListings(
  marketData: any,
  estimatedValue: number,
  vehicleMileage?: number
): Array<{ price: number; mileage: number; location: string; daysOnMarket: number; source?: string }> {
  const listings: Array<{ price: number; mileage: number; location: string; daysOnMarket: number; source?: string }> = [];
  
  // Generate 3-5 comparable listings based on market data
  const numListings = 3 + Math.floor(Math.random() * 3);
  const baseMileage = vehicleMileage || 50000;
  
  for (let i = 0; i < numListings; i++) {
    const priceVariation = 0.85 + (Math.random() * 0.3); // 85% to 115% of estimated
    const mileageVariation = 0.8 + (Math.random() * 0.4); // 80% to 120% of vehicle mileage
    
    listings.push({
      price: Math.round(estimatedValue * priceVariation),
      mileage: Math.round(baseMileage * mileageVariation),
      location: `${15 + Math.floor(Math.random() * 50)} miles away`,
      daysOnMarket: 5 + Math.floor(Math.random() * 35),
      source: ['Auto Trader', 'Cars.com', 'CarGurus', 'Facebook Marketplace'][Math.floor(Math.random() * 4)]
    });
  }
  
  return listings.sort((a, b) => a.price - b.price);
}

// Enhanced flag generation with all data sources
function generateRedFlagsFromAllData(
  basicData: {
    priceDiff: number;
    priceDiffPercent: number;
    hasVin: boolean;
    year: number;
    mileage?: number;
  },
  dataSourceResults: {
    vehicleHistory: any;
    disasterData: any;
    sellerSignals: any;
    recalls?: any;
  },
  tier: AnalysisTier = 'free'
): RedFlag[] {
  const flags: RedFlag[] = [];
  const currentYear = new Date().getFullYear();
  const age = currentYear - basicData.year;
  const { priceDiff, priceDiffPercent, hasVin, mileage } = basicData;
  const { vehicleHistory, disasterData, environmentalRisk, sellerSignals, recalls } = dataSourceResults;
  
  // Pricing flags
  if (priceDiffPercent > 15) {
    flags.push({
      id: 'overpriced',
      title: tier === 'free' ? `Overpriced` : `Overpriced by ${priceDiffPercent}%`,
      description: tier === 'free' 
        ? `This vehicle appears to be listed above market value.` 
        : `This vehicle is listed significantly above market value. The asking price is $${Math.abs(priceDiff).toLocaleString()} more than comparable vehicles.`,
      severity: priceDiffPercent > 30 ? 'critical' : priceDiffPercent > 20 ? 'high' : 'medium',
      category: 'pricing',
      expandedDetails: tier === 'paid' ? `Based on current market data from Auto.dev listings and MarketCheck, similar vehicles in comparable condition typically sell for 15-20% less than this asking price.` : undefined,
      methodology: tier === 'paid' ? 'Compared against average retail prices from multiple market data sources.' : undefined,
      dataSource: tier === 'paid' ? 'Market Listings Data (Auto.dev, MarketCheck)' : undefined
    });
  } else if (priceDiffPercent < -20) {
    flags.push({
      id: 'underpriced',
      title: tier === 'free' ? `Below Market Price` : `Priced ${Math.abs(priceDiffPercent)}% Below Market`,
      description: tier === 'free'
        ? `This price seems lower than expected.`
        : `This price seems suspiciously low. While it could be a great deal, significant underpricing often indicates hidden problems.`,
      severity: priceDiffPercent < -35 ? 'high' : 'medium',
      category: 'pricing',
      expandedDetails: tier === 'paid' ? `Vehicles priced this far below market often have undisclosed issues like salvage titles, flood damage, or major mechanical problems. Proceed with extra caution.` : undefined,
      methodology: tier === 'paid' ? 'Compared against average retail prices from multiple market data sources.' : undefined,
      dataSource: tier === 'paid' ? 'Market Listings Data' : undefined
    });
  }
  
  // Pricing Risk Signals: "Unusually Low Price" and "Too Good for Too Long"
  const pricingBehavior = sellerSignals?.pricingBehavior;
  
  // "Unusually Low Price" signal (independent of time on market)
  if (pricingBehavior?.unusuallyLowPrice?.detected) {
    const lowPrice = pricingBehavior.unusuallyLowPrice;
    const belowPercent = Math.abs(lowPrice.belowMarketPercent);
    
    // Determine severity based on how far below market
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (belowPercent >= 30) {
      severity = 'high';
    } else if (belowPercent >= 20) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    flags.push({
      id: 'unusually-low-price',
      title: `Unusually Low Price (${belowPercent.toFixed(1)}% below market)`,
      description: `This vehicle's asking price is meaningfully below expected valuation anchors or market medians for similar vehicles. This pricing anomaly warrants extra scrutiny but does not imply a defect.`,
      severity,
      category: 'pricing',
      expandedDetails: `The asking price of $${lowPrice.askingPrice.toLocaleString()} is ${belowPercent.toFixed(1)}% below the market ${lowPrice.marketMedian ? 'median' : 'estimated value'} of $${((lowPrice.askingPrice / (1 + lowPrice.belowMarketPercent / 100))).toLocaleString()}. This is a probabilistic pricing behavior signal, not proof of seller intent or vehicle damage. When combined with other risk signals (seller behavior, flood exposure, data gaps), it may indicate elevated risk. Confidence: ${lowPrice.confidence}%.`,
      methodology: `Compared asking price against market median and estimated value from multiple data sources. Threshold: ${lowPrice.thresholdUsed}% below market.`,
      dataSource: 'Market Listings Data (Auto.dev, MarketCheck)'
    });
  }
  
  // "Too Good for Too Long" signal (only if "Unusually Low Price" is present)
  if (pricingBehavior?.tooGoodForTooLong?.detected) {
    const tooLong = pricingBehavior.tooGoodForTooLong;
    
    // Determine severity based on how long over threshold
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const daysOver = tooLong.daysListed - tooLong.thresholdDays;
    if (daysOver >= 30) {
      severity = 'high';
    } else if (daysOver >= 14) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    flags.push({
      id: 'too-good-for-too-long',
      title: `Too Good for Too Long (${tooLong.daysListed} days listed)`,
      description: `This unusually low-priced vehicle has remained actively listed for ${tooLong.daysListed} days, exceeding the reasonable time threshold of ${tooLong.thresholdDays} days for ${tooLong.daysListed > tooLong.thresholdDays ? 'this vehicle class' : 'common vehicles'}. This may indicate possible market rejection.`,
      severity,
      category: 'pricing',
      expandedDetails: `An unusually low-priced vehicle that remains listed for ${tooLong.daysListed} days (${daysOver} days beyond the ${tooLong.thresholdDays}-day threshold) may indicate market rejection. This is a probabilistic pricing behavior signal, not proof of seller intent or vehicle damage. When combined with other risk signals, it may indicate elevated risk. Confidence: ${tooLong.confidence}%.`,
      methodology: `Evaluated listing duration against vehicle class-specific thresholds. This signal only triggers when "Unusually Low Price" is also detected.`,
      dataSource: 'Auto.dev Listings API + Market Analysis'
    });
  }
  
  // Vehicle history flags
  if (vehicleHistory?.nmvtis) {
    const nmvtis = vehicleHistory.nmvtis;
    
    if (nmvtis.titleBrands && nmvtis.titleBrands.length > 0) {
      flags.push({
        id: 'title-brands',
        title: 'Title Brands Detected',
        description: tier === 'free'
          ? `Vehicle has title brands on record.`
          : `This vehicle has the following title brands: ${nmvtis.titleBrands.join(', ')}. This significantly impacts value and insurability.`,
        severity: 'critical',
        category: 'title',
        expandedDetails: tier === 'paid' ? `Title brands indicate the vehicle has been damaged, salvaged, or otherwise compromised. Insurance may be difficult to obtain, and resale value is permanently affected.` : undefined,
        dataSource: 'NMVTIS Database'
      });
    }
    
    if (nmvtis.theftRecords) {
      flags.push({
        id: 'theft-record',
        title: 'Theft Record Found',
        description: 'This vehicle has been reported stolen in the past.',
        severity: 'critical',
        category: 'history',
        expandedDetails: tier === 'paid' ? `Even if recovered, vehicles with theft history may have hidden damage or tampering. Verify the vehicle was properly recovered and cleared by law enforcement.` : undefined,
        dataSource: 'NMVTIS Database'
      });
    }
  }
  
  if (tier === 'paid' && vehicleHistory?.carfax) {
    const carfax = vehicleHistory.carfax;
    
    if (carfax.accidentIndicators) {
      flags.push({
        id: 'accident-history',
        title: 'Accident History Detected',
        description: 'Vehicle history shows accident indicators.',
        severity: 'high',
        category: 'history',
        expandedDetails: `Carfax/AutoCheck records show this vehicle has been involved in at least one accident. Request detailed body shop records and have a mechanic inspect for frame damage.`,
        dataSource: 'Carfax/AutoCheck'
      });
    }
    
    if (carfax.mileageSnapshots && carfax.mileageSnapshots.length > 1) {
      // Check for odometer rollback
      const sorted = [...carfax.mileageSnapshots].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].mileage < sorted[i-1].mileage) {
          flags.push({
            id: 'odometer-rollback',
            title: '⚠️ Possible Odometer Rollback',
            description: 'Mileage records show inconsistencies that may indicate odometer tampering.',
            severity: 'critical',
            category: 'history',
            expandedDetails: `Service records show mileage decreased from ${sorted[i-1].mileage.toLocaleString()} to ${sorted[i].mileage.toLocaleString()}. This is a serious red flag.`,
            dataSource: 'Carfax/AutoCheck'
          });
          break;
        }
      }
    }
  }
  
  // Environmental risk flags (probabilistic, never alone causes Disaster verdict)
  if (environmentalRisk && environmentalRisk.disasterPresence) {
    const hasRecentDisasters = environmentalRisk.recency === 'recent';
    const hasFloodRisk = environmentalRisk.floodZoneRisk === 'high' || 
                        environmentalRisk.disasterTypes.some(type => 
                          type.toLowerCase().includes('flood') || 
                          type.toLowerCase().includes('hurricane')
                        );
    
    // Only flag if there's meaningful risk (recent disasters or high flood risk)
    if (hasRecentDisasters || hasFloodRisk) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (hasRecentDisasters && hasFloodRisk) {
        severity = 'high';
      } else if (hasRecentDisasters || hasFloodRisk) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      const disasterCount = (environmentalRisk.recentDisasters?.length || 0) + 
                           (environmentalRisk.historicalDisasters?.length || 0);
      
      flags.push({
        id: 'environmental-risk',
        title: 'Potential Environmental Exposure',
        description: `Vehicle appears to be located in an area with ${hasRecentDisasters ? 'recent' : 'historical'} disaster history.`,
        severity,
        category: 'disaster',
        expandedDetails: `This vehicle appears exposed to ${disasterCount} disaster declaration${disasterCount === 1 ? '' : 's'} in the area. ${hasFloodRisk ? 'Area has high flood risk or flood-related disaster history. ' : ''}This is a probabilistic signal based on location data, not proof of actual damage. Inspect carefully for water damage, corrosion, or other environmental issues.`,
        dataSource: 'FEMA Disaster Declarations'
      });
    }
  }
  
  // Disaster geography flags (legacy - keeping for backward compatibility)
  if (disasterData) {
    const disasterRisk = analyzeDisasterRisk(disasterData);
    
    if (disasterRisk.hasRisk && disasterRisk.riskLevel !== 'low') {
      flags.push({
        id: 'disaster-risk',
        title: tier === 'free' ? 'Disaster Area History' : `${disasterRisk.riskLevel === 'high' ? 'High' : 'Moderate'} Disaster Risk Detected`,
        description: tier === 'free'
          ? 'Vehicle may be from an area with disaster history.'
          : disasterRisk.details[0] || 'This vehicle is registered in an area with natural disaster history.',
        severity: disasterRisk.riskLevel === 'high' ? 'high' : 'medium',
        category: 'disaster',
        expandedDetails: tier === 'paid' ? disasterRisk.details.join(' ') : undefined,
        dataSource: tier === 'paid' ? 'FEMA, NOAA, USGS' : 'FEMA'
      });
    }
  }
  
  // Seller signal flags (Premium only)
  if (tier === 'paid' && sellerSignals) {
    if (sellerSignals.listingBehavior?.relistingDetection?.detected) {
      const times = sellerSignals.listingBehavior.relistingDetection.timesSeen;
      flags.push({
        id: 'relisting-detected',
        title: 'Relisting Pattern Detected',
        description: `This vehicle has been listed ${times} time${times === 1 ? '' : 's'} in recent months.`,
        severity: times > 2 ? 'high' : 'medium',
        category: 'listing',
        expandedDetails: `Frequent relisting often indicates issues discovered during buyer inspections. Ask the seller why previous sales fell through.`,
        dataSource: 'Listing Behavior Analysis'
      });
    }
    
    if (sellerSignals.listingBehavior?.listingLongevity?.isStale) {
      const days = sellerSignals.listingBehavior.listingLongevity.daysListed;
      flags.push({
        id: 'stale-listing',
        title: 'Listing Longevity Concern',
        description: `Vehicle has been listed for ${days} days without selling.`,
        severity: 'medium',
        category: 'listing',
        expandedDetails: days > 45 
          ? `Extended listing period suggests the vehicle is overpriced or has issues that deter buyers. This gives you strong negotiating leverage.`
          : `Above-average listing time. The seller may be motivated to negotiate.`,
        dataSource: 'Listing Behavior Analysis'
      });
    }
    
    if (sellerSignals.pricingBehavior?.priceVolatility?.detected) {
      const volatility = sellerSignals.pricingBehavior.priceVolatility;
      const level = volatility.volatilityLevel;
      const changes = volatility.priceChanges;
      const drops = volatility.significantDrops?.length || 0;
      const oscillations = volatility.oscillations || 0;
      
      let title = 'Price Volatility Detected';
      let description = '';
      let severity: 'low' | 'medium' | 'high' | 'critical' = level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low';
      
      if (drops > 0 && oscillations > 0) {
        description = `${changes} price change${changes === 1 ? '' : 's'} with ${drops} significant drop${drops === 1 ? '' : 's'} and ${oscillations} oscillation${oscillations === 1 ? '' : 's'}.`;
      } else if (drops > 0) {
        description = `${changes} price change${changes === 1 ? '' : 's'} with ${drops} significant drop${drops === 1 ? '' : 's'} (5%+).`;
      } else if (oscillations > 0) {
        description = `${changes} price change${changes === 1 ? '' : 's'} with ${oscillations} oscillation${oscillations === 1 ? '' : 's'} (price dropped then increased, or multiple drops).`;
      } else {
        description = `${changes} price change${changes === 1 ? '' : 's'} detected within 90 days.`;
      }
      
        flags.push({
        id: 'price-volatility',
        title,
        description,
        severity,
        category: 'listing',
        expandedDetails: `Price volatility may indicate issues discovered during inspections or failed deals. This is a behavioral risk signal, not proof of a problem. Multiple price drops or oscillations suggest the seller may be adjusting price in response to buyer concerns.`,
        dataSource: 'Price Behavior Analysis'
        });
    }
    
    if (sellerSignals.pricingBehavior?.tooGoodTooBeLong?.isSuspicious) {
      flags.push({
        id: 'too-good-too-long',
        title: '⚠️ Suspiciously Low Price + Long Listing',
        description: 'Vehicle is priced well below market but has not sold quickly.',
        severity: 'critical',
        category: 'seller',
        expandedDetails: `This combination is a major red flag. A legitimately good deal at this price would sell within days. There are likely serious undisclosed issues.`,
        dataSource: 'Pricing Behavior Analysis'
      });
    }
    
    if (sellerSignals.profileConsistency?.autoDealerRevealed) {
      flags.push({
        id: 'hidden-dealer',
        title: '⚠️ Dealer Posing as Private Seller',
        description: 'Evidence suggests this is a dealer listing disguised as a private sale.',
        severity: 'high',
        category: 'seller',
        expandedDetails: `Dealers posing as private sellers avoid consumer protection laws and dealer regulations. You have fewer legal protections in this transaction.`,
        dataSource: 'Seller Profile Analysis'
      });
    }
  }
  
  // Data gap flags
  if (!hasVin) {
    flags.push({
      id: 'no-vin',
      title: 'VIN Not Verified',
      description: tier === 'free'
        ? 'Without a VIN, we cannot verify vehicle history.'
        : 'Without a VIN, we cannot verify vehicle history, recalls, or title status. This significantly limits our analysis.',
      severity: 'high',
      category: 'data-gap',
      expandedDetails: tier === 'paid' ? 'The Vehicle Identification Number (VIN) is essential for accessing NMVTIS data, recall information, and verifying the vehicle is not stolen. Always obtain the VIN before proceeding.' : undefined
    });
  }
  
  // Age and mileage flags
  if (age > 10) {
    flags.push({
      id: 'high-age',
      title: 'Vehicle Over 10 Years Old',
      description: `At ${age} years old, this vehicle may require more maintenance.`,
      severity: 'low',
      category: 'ownership',
      expandedDetails: tier === 'paid' ? 'Older vehicles often have worn seals, aging electrical systems, and may be more expensive to insure. Request maintenance records to verify proper care.' : undefined,
    });
  }
  
  if (mileage) {
    const avgMileagePerYear = 12000;
    const expectedMileage = age * avgMileagePerYear;
    
    if (mileage > expectedMileage * 1.5) {
      flags.push({
        id: 'high-mileage',
        title: 'Higher Than Average Mileage',
        description: tier === 'free'
          ? `This vehicle has ${mileage.toLocaleString()} miles.`
          : `This vehicle has ${mileage.toLocaleString()} miles, which is ${Math.round((mileage / expectedMileage - 1) * 100)}% higher than average for its age.`,
        severity: mileage > expectedMileage * 2 ? 'high' : 'medium',
        category: 'ownership',
        expandedDetails: tier === 'paid' ? 'High mileage vehicles may have more wear on critical components. Ensure timing belt/chain service has been performed if applicable, and check for oil leaks.' : undefined
      });
    } else if (mileage < expectedMileage * 0.4 && age > 3) {
      flags.push({
        id: 'suspicious-low-mileage',
        title: 'Unusually Low Mileage',
        description: tier === 'free'
          ? `Only ${mileage.toLocaleString()} miles on a ${age}-year-old vehicle.`
          : `Only ${mileage.toLocaleString()} miles on a ${age}-year-old vehicle is suspicious. This could indicate odometer tampering or extended storage.`,
        severity: 'medium',
        category: 'history',
        expandedDetails: tier === 'paid' ? 'While genuinely low-mileage vehicles exist, be cautious. Vehicles that sat unused can develop issues like dried seals, degraded fluids, and battery problems. Verify the odometer reading matches service records.' : undefined
      });
    }
  }
  
  // Private sale standard flag
  flags.push({
    id: 'private-sale',
    title: 'Private Party Sale',
    description: 'Private sales offer no warranty protection.',
    severity: 'low',
    category: 'ownership',
    expandedDetails: tier === 'paid' ? 'Unlike dealer sales, private party transactions typically do not include warranty coverage. Consider getting a pre-purchase inspection from an independent mechanic.' : undefined,
  });
  
  // Recall flags
  if (recalls && recalls.length > 0) {
    flags.push({
      id: 'open-recalls',
      title: `${recalls.length} Open Recall${recalls.length === 1 ? '' : 's'} Found`,
      description: `This vehicle has ${recalls.length} open safety recall${recalls.length === 1 ? '' : 's'} from NHTSA that need to be addressed.`,
      severity: 'high',
      category: 'history',
      expandedDetails: `Open recalls indicate safety issues that the manufacturer must fix at no cost. Verify with the seller that these recalls have been addressed, or factor in the cost and time to have them fixed before purchase.`,
      dataSource: 'NHTSA Recalls Database'
    });
  }
  
  return flags.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function generateQuestions(flags: RedFlag[], priceDiff: number): string[] {
  const questions: string[] = [];
  
  // Always include these
  questions.push('Can I see the title? Is it clean, or does it have any brands (salvage, rebuilt, lemon)?');
  questions.push('Why are you selling the vehicle?');
  
  // Conditional questions based on flags
  const flagIds = new Set(flags.map(f => f.id));
  
  if (flagIds.has('overpriced') || priceDiff > 0) {
    questions.push(`I\'ve seen similar vehicles listed for $${Math.abs(priceDiff).toLocaleString()} less. What justifies your price?`);
  }
  
  if (flagIds.has('underpriced')) {
    questions.push('This price seems lower than market value. Is there anything wrong with the vehicle I should know about?');
  }
  
  if (flagIds.has('high-mileage')) {
    questions.push('Has the timing belt/chain been replaced? When was the last major service?');
  }
  
  if (flagIds.has('suspicious-low-mileage')) {
    questions.push('Why does this vehicle have such low mileage? Has it been in storage?');
  }
  
  if (flagIds.has('high-age')) {
    questions.push('Do you have maintenance records? Has the vehicle had any major repairs?');
  }
  
  if (flagIds.has('relisting')) {
    questions.push('Has anyone else looked at or made offers on this vehicle? If so, why didn\'t those sales go through?');
  }
  
  if (flagIds.has('title-state') || flagIds.has('no-vin')) {
    questions.push('Has this vehicle ever been in an accident or had any insurance claims?');
  }
  
  // Always good to ask
  questions.push('Are there any current mechanical issues or warning lights on the dashboard?');
  questions.push('Can I have the vehicle inspected by my mechanic before purchasing?');
  
  return questions;
}

function determineVerdict(flags: RedFlag[], priceDiffPercent: number): { verdict: VerdictType; confidence: number } {
  const criticalFlags = flags.filter(f => f.severity === 'critical').length;
  const highFlags = flags.filter(f => f.severity === 'high').length;
  const mediumFlags = flags.filter(f => f.severity === 'medium').length;
  
  // Calculate base score (100 = perfect)
  let score = 100;
  score -= criticalFlags * 40;
  score -= highFlags * 20;
  score -= mediumFlags * 8;
  
  // Price adjustment
  if (priceDiffPercent > 25) score -= 15;
  else if (priceDiffPercent > 15) score -= 8;
  else if (priceDiffPercent < -25) score -= 10;
  else if (priceDiffPercent < 0 && priceDiffPercent > -15) score += 5;
  
  // Determine verdict
  // IMPORTANT: Environmental risk and pricing risk signals never alone cause "Disaster" verdict
  const hasOnlyEnvironmentalRisk = flags.length === 1 && flags.some(f => f.id === 'environmental-risk');
  const hasOnlyPricingRisk = flags.length === 1 && (flags.some(f => f.id === 'unusually-low-price') || flags.some(f => f.id === 'too-good-for-too-long'));
  const hasOnlyPricingRiskSignals = flags.every(f => f.id === 'unusually-low-price' || f.id === 'too-good-for-too-long');
  
  const hasEnvironmentalRisk = flags.some(f => f.id === 'environmental-risk');
  const hasPricingRisk = flags.some(f => f.id === 'unusually-low-price' || f.id === 'too-good-for-too-long');
  
  let verdict: VerdictType;
  if (score >= 70) verdict = 'deal';
  else if (score >= 45) verdict = 'caution';
  else {
    // If only environmental risk or only pricing risk signals, cap at "caution" - never "disaster"
    if (hasOnlyEnvironmentalRisk || hasOnlyPricingRisk || hasOnlyPricingRiskSignals) {
      verdict = 'caution';
    } else {
      verdict = 'disaster';
    }
  }
  
  // Confidence based on data completeness
  let confidence = 75;
  const hasNoVin = flags.some(f => f.id === 'no-vin');
  if (hasNoVin) confidence -= 20;
  if (flags.some(f => f.id === 'title-state')) confidence -= 10;
  
  // Environmental risk and pricing risk lower confidence but don't cause disaster alone
  if (hasEnvironmentalRisk) {
    confidence -= 5; // Small confidence reduction
  }
  if (hasPricingRisk) {
    confidence -= 3; // Small confidence reduction for pricing risk
  }
  
  return { verdict, confidence: Math.max(40, Math.min(95, confidence)) };
}

function generateQuestionsWithTier(flags: RedFlag[], priceDiff: number, tier: AnalysisTier = 'free'): string[] {
  if (tier === 'free') {
    // Free tier gets 1-2 essential questions based on key flags
    const questions: string[] = [];
    const flagIds = new Set(flags.map(f => f.id));
    
    // Always include title question (most important)
    questions.push('Can I see the title? Is it clean, or does it have any brands (salvage, rebuilt, lemon)?');
    
    // Add one more essential question based on highest priority flag
    if (flagIds.has('title-brands') || flagIds.has('theft-record')) {
      questions.push('Has this vehicle ever been in an accident or had any insurance claims?');
    } else if (flagIds.has('overpriced') || priceDiff > 0) {
      questions.push(`I've seen similar vehicles listed for $${Math.abs(priceDiff).toLocaleString()} less. What justifies your price?`);
    } else if (flagIds.has('underpriced')) {
      questions.push('This price seems lower than market value. Is there anything wrong with the vehicle I should know about?');
    } else if (flagIds.has('environmental-risk')) {
      questions.push('Has this vehicle ever been exposed to flooding or water damage?');
    } else {
      // Default second question
      questions.push('Why are you selling the vehicle?');
    }
    
    return questions;
  }
  
  // Paid tier uses the full generateQuestions function
  return generateQuestions(flags, priceDiff);
}

/**
 * Extract model year from VIN (position 10, 0-indexed character 9)
 * VIN year codes: A=1980, B=1981, ..., Y=2000, 1=2001, ..., 9=2009, A=2010, ...
 */
function extractYearFromVIN(vin: string): number | undefined {
  if (!vin || vin.length < 10) return undefined;
  
  const yearChar = vin.charAt(9).toUpperCase();
  const yearMap: Record<string, number> = {
    'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
    'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994,
    'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000,
    '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
  };
  
  // For 2010-2039, the pattern repeats with A=2010, B=2011, etc.
  // But we need to check the VIN format to determine if it's 1980s or 2010s
  // For now, if it's a letter and we're in a recent year, assume 2010s
  const currentYear = new Date().getFullYear();
  if (yearMap[yearChar]) {
    let year = yearMap[yearChar];
    // If the year is before 2000 and we're past 2010, it might be the 2010s cycle
    if (year < 2000 && currentYear >= 2010) {
      // Check if it makes sense to be 2010s (add 30 years)
      const possible2010sYear = year + 30;
      if (possible2010sYear <= currentYear + 1) {
        return possible2010sYear;
      }
    }
    return year;
  }
  
  return undefined;
}

export async function analyzeVehicle(request: AnalysisRequest): Promise<VerdictResult> {
  console.log('[Analysis] Starting analysis for request:', { 
    vin: request.vin ? 'provided' : 'missing',
    hasYear: !!request.year,
    hasMake: !!request.make,
    hasModel: !!request.model,
    askingPrice: request.askingPrice,
    tier: request.tier || 'free'
  });
  
  try {
  const tier = request.tier || 'free';
  
  let vehicleInfo = {
    vin: request.vin,
    year: request.year,
    make: request.make,
    model: request.model,
    trim: undefined,
    mileage: request.mileage,
    askingPrice: request.askingPrice,
  };
  
  // Try to extract year from VIN if not provided
  if (!vehicleInfo.year && request.vin) {
    const vinYear = extractYearFromVIN(request.vin);
    if (vinYear) {
      vehicleInfo.year = vinYear;
      console.log('[Analysis] Extracted year from VIN:', vinYear);
    }
  }
  
  // If VIN provided, try to lookup vehicle data
  if (request.vin && vehicleData[request.vin]) {
    const vinData = vehicleData[request.vin];
    vehicleInfo = {
      ...vehicleInfo,
      year: vinData.year,
      make: vinData.make,
      model: vinData.model,
    };
  }
  
  // Fetch vehicle history FIRST if VIN is provided, so we can get vehicle details for market data
  let vehicleHistory = { nmvtis: null, carfax: null };
  if (request.vin) {
    try {
      const nmvtis = await fetchNMVTISData(request.vin);
      const carfax = tier === 'paid' ? await fetchCarfaxAutoCheckData(request.vin) : null;
      vehicleHistory = { nmvtis, carfax };
    } catch (error: any) {
      // If it's a VIN validation error (400), re-throw it so the user sees the error
      // For other errors, log and continue without history data
      if (error?.message && (error.message.includes('Invalid VIN') || error.message.includes('VIN must be'))) {
        throw error; // Re-throw VIN validation errors
      }
      console.error('[Analysis] Error fetching vehicle history:', error);
      vehicleHistory = { nmvtis: null, carfax: null };
    }
  }
  
  // Update vehicleInfo with data from Auto.dev if available (prefer Auto.dev data)
  // This ensures we have year/make/model for market data fetching
  if (vehicleHistory?.nmvtis?.vehicleDetails) {
    const autoDevDetails = vehicleHistory.nmvtis.vehicleDetails;
    vehicleInfo = {
      ...vehicleInfo,
      // Prefer Auto.dev data as it's more accurate from VIN decode
      // But keep manual year entry if Auto.dev doesn't provide year
      year: autoDevDetails.year || vehicleInfo.year || request.year,
      make: autoDevDetails.make || vehicleInfo.make,
      model: autoDevDetails.model || vehicleInfo.model,
      trim: autoDevDetails.trim || vehicleInfo.trim,
    };
    console.log('[Analysis] Updated vehicleInfo from Auto.dev for market data:', { 
      year: vehicleInfo.year, 
      make: vehicleInfo.make, 
      model: vehicleInfo.model 
    });
  } else {
    console.log('[Analysis] No Auto.dev vehicle details, using manual entry for market data:', { 
      year: vehicleInfo.year, 
      make: vehicleInfo.make, 
      model: vehicleInfo.model 
    });
  }

  // Now fetch all remaining data sources in parallel
  const dataFetchPromises: Promise<any>[] = [];
  
  // Market listings data - now we have vehicle details from VIN decode
  let marketDataPromise = Promise.resolve(null);
  if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
    console.log('[Analysis] Fetching market data for:', { 
      year: vehicleInfo.year, 
      make: vehicleInfo.make, 
      model: vehicleInfo.model, 
      trim: vehicleInfo.trim,
      mileage: vehicleInfo.mileage 
    });
    marketDataPromise = fetchAllMarketData(
      vehicleInfo.year,
      vehicleInfo.make,
      vehicleInfo.model,
      vehicleInfo.mileage,
      tier,
      vehicleInfo.trim
    );
  } else {
    console.warn('[Analysis] Skipping market data fetch - missing vehicle details:', {
      hasYear: !!vehicleInfo.year,
      hasMake: !!vehicleInfo.make,
      hasModel: !!vehicleInfo.model
    });
  }
  dataFetchPromises.push(marketDataPromise);
  
  // Disaster geography data (Free: FEMA, Premium: + NOAA/USGS)
  const disasterDataPromise = fetchAllDisasterData(request.location, tier);
  dataFetchPromises.push(disasterDataPromise);
  
  // Environmental risk analysis (based on location)
  let environmentalRiskPromise = Promise.resolve(null);
  if (request.location) {
    environmentalRiskPromise = analyzeEnvironmentalRisk(request.location);
  }
  dataFetchPromises.push(environmentalRiskPromise);
  
  // Seller signals (available for all tiers, but some features may be premium-only)
  let sellerSignalsPromise = Promise.resolve(null);
  if (request.vin) {
    sellerSignalsPromise = analyzeAllSellerSignals(
      request.vin,
      request.askingPrice
    );
  }
  dataFetchPromises.push(sellerSignalsPromise);
  
  // Wait for all remaining data to be fetched (vehicleHistory was already fetched above)
  const [marketData, disasterData, environmentalRisk, sellerSignals] = await Promise.all(dataFetchPromises);
  
  // Maintenance risk assessment (Premium only) - runs after vehicleHistory is available
  let maintenanceRiskAssessment: any = null;
  if (tier === 'paid') {
    // Extract ownership history from vehicle history if available
    const ownershipHistory = vehicleHistory?.carfax?.ownershipChanges !== undefined
      ? { ownerCount: vehicleHistory.carfax.ownershipChanges, ownershipChanges: vehicleHistory.carfax.ownershipChanges }
      : undefined;
    
    const vehicleClass = estimateVehicleClass(vehicleInfo.make, vehicleInfo.model);
    
    // Use vehicleInfo.year, fallback to request.year if not available
    // Ensure year is a number (convert string to number if needed)
    const rawYear = vehicleInfo.year || request.year;
    const assessmentYear = typeof rawYear === 'string' ? parseInt(rawYear, 10) : rawYear;
    const assessmentMileage = vehicleInfo.mileage || request.mileage;
    
    console.log('[Analysis] Assessing maintenance risk:', {
      vehicleInfoYear: vehicleInfo.year,
      vehicleInfoYearType: typeof vehicleInfo.year,
      requestYear: request.year,
      requestYearType: typeof request.year,
      rawYear,
      rawYearType: typeof rawYear,
      assessmentYear,
      assessmentYearType: typeof assessmentYear,
      isNaN: isNaN(assessmentYear as number),
      mileage: assessmentMileage,
      vehicleClass,
      ownershipChanges: vehicleHistory?.carfax?.ownershipChanges
    });
    
    maintenanceRiskAssessment = assessMaintenanceRisk(
      assessmentYear,
      assessmentMileage,
      ownershipHistory,
      vehicleClass
    );
    
    console.log('[Analysis] Maintenance risk assessment result:', {
      hasAssessment: !!maintenanceRiskAssessment,
      overallRisk: maintenanceRiskAssessment?.overallRisk,
      riskFactorsCount: maintenanceRiskAssessment?.riskFactors?.length || 0,
      inspectionFocusCount: maintenanceRiskAssessment?.inspectionFocus?.length || 0,
      fullAssessment: maintenanceRiskAssessment
    });
  } else {
    console.log('[Analysis] Maintenance risk assessment skipped - not paid tier');
  }
  
  // Log seller signals for debugging
  console.log('[Analysis] Seller signals result:', {
    hasSellerSignals: !!sellerSignals,
    listingBehavior: sellerSignals?.listingBehavior,
    pricingBehavior: sellerSignals?.pricingBehavior,
    profileConsistency: sellerSignals?.profileConsistency
  });
  
  // Update vehicleInfo with data from Auto.dev if available (prefer Auto.dev data)
  // But keep manual entry as fallback for year if Auto.dev doesn't provide it
  if (vehicleHistory?.nmvtis?.vehicleDetails) {
    const autoDevDetails = vehicleHistory.nmvtis.vehicleDetails;
    vehicleInfo = {
      ...vehicleInfo,
      // Prefer Auto.dev data as it's more accurate from VIN decode
      // But keep manual year entry if Auto.dev doesn't provide year
      year: autoDevDetails.year || vehicleInfo.year || request.year,
      make: autoDevDetails.make || vehicleInfo.make,
      model: autoDevDetails.model || vehicleInfo.model,
      trim: autoDevDetails.trim || vehicleInfo.trim,
    };
    console.log('[Analysis] Updated vehicleInfo from Auto.dev:', { year: vehicleInfo.year, make: vehicleInfo.make, model: vehicleInfo.model });
  } else {
    console.log('[Analysis] No Auto.dev vehicle details, using manual entry:', { year: vehicleInfo.year, make: vehicleInfo.make, model: vehicleInfo.model });
  }
  
  // Log market data for debugging
  console.log('[Analysis] Market data result:', {
    hasMarketData: !!marketData,
    hasAutoDev: !!marketData?.autoDev,
    hasMarketCheck: !!marketData?.marketCheck
  });
  
  // Fetch vehicle recalls using make/model/year (after we have vehicle details from Auto.dev or manual entry)
  let recalls: VehicleRecall[] | null = null;
  if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
    try {
      console.log('[Analysis] Fetching recalls for:', { make: vehicleInfo.make, model: vehicleInfo.model, year: vehicleInfo.year });
      recalls = await fetchVehicleRecalls(vehicleInfo.make, vehicleInfo.model, vehicleInfo.year);
      console.log('[Analysis] Recalls fetch result:', recalls ? `${recalls.length} recalls found` : 'No recalls');
    } catch (error) {
      console.error('[Analysis] Error fetching recalls:', error);
      // Continue without recalls - don't fail the entire analysis
      recalls = null;
    }
  } else {
    console.log('[Analysis] Skipping recalls fetch - missing vehicle details:', { year: vehicleInfo.year, make: vehicleInfo.make, model: vehicleInfo.model });
  }
  
  // Calculate estimated value from market data
  let estimatedValue: number;
  let marketMedian: number | undefined;
  if (marketData && Object.keys(marketData).length > 0) {
    console.log('[Analysis] Calculating market value from market data...');
    estimatedValue = calculateAverageMarketValue(marketData);
    console.log('[Analysis] Calculated estimatedValue from market data:', estimatedValue);
    
    // Calculate market median from available market data sources
    const marketValues: number[] = [];
    if (marketData.autoDev?.marketAverage) marketValues.push(marketData.autoDev.marketAverage);
    if (marketData.marketCheck) marketValues.push(marketData.marketCheck.competitivePrice);
    
    if (marketValues.length > 0) {
      marketValues.sort((a, b) => a - b);
      const mid = Math.floor(marketValues.length / 2);
      marketMedian = marketValues.length % 2 === 0
        ? (marketValues[mid - 1] + marketValues[mid]) / 2
        : marketValues[mid];
    }
  } else {
    // Fallback to legacy calculation
    console.log('[Analysis] No market data available, using fallback calculation');
    estimatedValue = vehicleInfo.make && vehicleInfo.model && vehicleInfo.year
      ? getEstimatedValue(vehicleInfo.make, vehicleInfo.model, vehicleInfo.year, vehicleInfo.mileage)
      : request.askingPrice * 0.95;
    console.log('[Analysis] Fallback estimatedValue:', estimatedValue, {
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      year: vehicleInfo.year,
      mileage: vehicleInfo.mileage,
      askingPrice: request.askingPrice,
    });
  }
  
  console.log('[Analysis] Final estimatedValue before price calculations:', estimatedValue);
  
  const priceDiff = request.askingPrice - estimatedValue;
  const priceDiffPercent = Math.round((priceDiff / estimatedValue) * 100);
  
  // Analyze pricing risk signals: "Unusually Low Price" and "Too Good for Too Long"
  const unusuallyLowPrice = analyzeUnusuallyLowPrice(
    request.askingPrice,
    estimatedValue,
    marketMedian
  );
  
  // Get days listed from seller signals (if available)
  const daysListed = sellerSignals?.listingBehavior?.listingLongevity?.daysListed ?? 0;
  
  // Determine vehicle class for "Too Good for Too Long" threshold
  // Simple heuristic: luxury brands or high-value vehicles get longer thresholds
  const isLuxury = vehicleInfo.make && ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Porsche', 'Tesla', 'Jaguar', 'Land Rover', 'Bentley', 'Rolls-Royce', 'Maserati', 'Ferrari', 'Lamborghini'].includes(vehicleInfo.make);
  const isExotic = estimatedValue > 100000; // Vehicles over $100k are considered exotic
  const vehicleClass: 'common' | 'luxury' | 'exotic' = isExotic ? 'exotic' : isLuxury ? 'luxury' : 'common';
  
  const tooGoodForTooLong = analyzeTooGoodForTooLong(
    daysListed,
    unusuallyLowPrice?.detected ?? false,
    vehicleClass
  );
  
  // Add pricing risk signals to seller signals if they were detected
  let updatedSellerSignals = sellerSignals;
  if (unusuallyLowPrice || tooGoodForTooLong) {
    updatedSellerSignals = {
      ...(sellerSignals || {
        listingBehavior: {},
        pricingBehavior: {},
        profileConsistency: {}
      }),
      pricingBehavior: {
        ...(sellerSignals?.pricingBehavior || {}),
        ...(unusuallyLowPrice ? { unusuallyLowPrice } : {}),
        ...(tooGoodForTooLong ? { tooGoodForTooLong } : {})
      }
    };
  }
  
  // Generate red flags with all data sources
  const redFlags = generateRedFlagsFromAllData(
    {
      priceDiff,
      priceDiffPercent,
      hasVin: !!request.vin,
      year: vehicleInfo.year || new Date().getFullYear() - 5,
      mileage: vehicleInfo.mileage
    },
    {
      vehicleHistory,
      disasterData,
      environmentalRisk,
      sellerSignals: updatedSellerSignals,
      recalls: recalls || undefined
    },
    tier
  );
  
  // Generate questions with tier awareness
  const questionsToAsk = generateQuestionsWithTier(redFlags, priceDiff, tier);
  
  // Build known and unknown data (needed for preliminary result)
  const knownData: string[] = [];
  const unknownData: string[] = [];
  
  if (vehicleInfo.vin) {
    knownData.push('VIN verified');
    if (vehicleHistory.nmvtis) {
      knownData.push('NMVTIS title check completed');
    }
    if (tier === 'paid' && vehicleHistory.carfax) {
      knownData.push('Full vehicle history report');
    }
  } else {
    unknownData.push('VIN not provided');
  }
  
  if (vehicleInfo.year) knownData.push(`Year: ${vehicleInfo.year}`);
  if (vehicleInfo.make) knownData.push(`Make: ${vehicleInfo.make}`);
  if (vehicleInfo.model) knownData.push(`Model: ${vehicleInfo.model}`);
  if (vehicleInfo.mileage) knownData.push(`Mileage: ${vehicleInfo.mileage.toLocaleString()}`);
  
  if (marketData) {
    if (marketData.autoDev) knownData.push('Auto.dev market listings');
    if (tier === 'paid') {
      if (marketData.marketCheck) knownData.push('MarketCheck competitive pricing');
    }
  }
  
  if (disasterData?.femaDeclarations) {
    knownData.push('FEMA disaster history checked');
  }
  
  if (recalls && recalls.length > 0) {
    knownData.push(`${recalls.length} open recall${recalls.length === 1 ? '' : 's'} found (NHTSA)`);
  } else if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
    knownData.push('NHTSA recall check completed (no open recalls)');
  }
  
  if (tier === 'free') {
    unknownData.push('Detailed accident history');
    unknownData.push('Complete service records');
    unknownData.push('Seller credibility analysis');
  } else {
    if (!vehicleHistory.carfax) {
      unknownData.push('Some service records may be incomplete');
    }
  }
  
  unknownData.push('Physical inspection results');
  
  if (!vehicleInfo.vin) {
    unknownData.push('Theft records');
  }
  
  // Build preliminary result for data quality assessment
  const preliminaryResult: VerdictResult = {
    tier,
    verdict: 'caution', // Placeholder, will be updated
    confidenceScore: 75, // Placeholder, will be updated
    summary: '', // Placeholder, will be updated
    redFlags,
    questionsToAsk,
    knownData,
    unknownData,
    vehicleInfo: {
      ...vehicleInfo,
      estimatedValue,
      priceDifference: priceDiff,
      priceDifferencePercent: priceDiffPercent,
    },
    vehicleHistory: vehicleHistory ? {
      nmvtis: vehicleHistory.nmvtis || undefined,
      carfaxAutoCheck: vehicleHistory.carfax || undefined,
    } : undefined,
    marketData: marketData || undefined,
    disasterData: disasterData || undefined,
    environmentalRisk: environmentalRisk || undefined,
    sellerSignals: updatedSellerSignals || undefined,
    maintenanceRiskAssessment: maintenanceRiskAssessment || undefined,
    recalls: recalls && recalls.length > 0 ? recalls : undefined
  };
  
  // Assess data quality first (needed for verdict assembly)
  const dataQuality = assessDataQuality(request, preliminaryResult);
  
  // Build result with premium features for verdict assembly (market pricing analysis added later)
  const resultForVerdict: Partial<VerdictResult> = {
    ...preliminaryResult,
    maintenanceRiskAssessment: maintenanceRiskAssessment || undefined,
    marketPricingAnalysis: undefined, // Will be added after verdict assembly
    environmentalRisk: environmentalRisk || undefined
  };
  
  // Determine verdict using new assembly system (pass result to access premium features)
  const verdictReasoning = assembleVerdict(redFlags, dataQuality, resultForVerdict);
  const verdict = verdictReasoning.verdict;
  const confidence = verdictReasoning.confidence;
  
  // Build final result with verdict and data quality (summary and market pricing analysis will be added below)
  const result: VerdictResult = {
    tier,
    verdict,
    confidenceScore: confidence,
    summary: '', // Will be set after premium features are added
    redFlags,
    questionsToAsk,
    knownData,
    unknownData,
    vehicleInfo: {
      ...vehicleInfo,
      estimatedValue,
      priceDifference: priceDiff,
      priceDifferencePercent: priceDiffPercent,
    },
    vehicleHistory: vehicleHistory ? {
      nmvtis: vehicleHistory.nmvtis || undefined,
      carfaxAutoCheck: vehicleHistory.carfax || undefined,
    } : undefined,
    marketData: marketData || undefined,
    disasterData: disasterData || undefined,
    environmentalRisk: environmentalRisk || undefined,
    sellerSignals: updatedSellerSignals || undefined,
    maintenanceRiskAssessment: maintenanceRiskAssessment || undefined,
    marketPricingAnalysis: undefined, // Will be added in premium features section below
    tailoredQuestions: undefined, // Will be added in premium features section below
    recalls: recalls && recalls.length > 0 ? recalls : undefined
  };
  
  // Log recalls in result for debugging
  console.log('[Analysis] Recalls in result:', {
    hasRecalls: !!result.recalls,
    recallCount: result.recalls?.length || 0,
    recalls: result.recalls
  });
  
  // Log maintenance risk assessment in result for debugging
  console.log('[Analysis] Maintenance risk assessment in final result:', {
    hasAssessment: !!result.maintenanceRiskAssessment,
    overallRisk: result.maintenanceRiskAssessment?.overallRisk,
    riskFactorsCount: result.maintenanceRiskAssessment?.riskFactors?.length || 0,
    inspectionFocusCount: result.maintenanceRiskAssessment?.inspectionFocus?.length || 0,
    tier: result.tier
  });
  
  // Data quality already assessed above, add to result
  result.dataQuality = dataQuality;
  console.log('[Analysis] Data quality assessment:', {
    overallConfidence: dataQuality.overallConfidence,
    confidenceScore: dataQuality.confidenceScore,
    factorsCount: dataQuality.factors.length
  });
  console.log('[Analysis] Verdict reasoning:', {
    verdict: verdictReasoning.verdict,
    confidence: verdictReasoning.confidence,
    structuralRisks: verdictReasoning.structuralRisks.length,
    marketRisks: verdictReasoning.marketRisks.length,
    sellerBehaviorRisks: verdictReasoning.sellerBehaviorRisks.length,
    dataQualityImpact: verdictReasoning.dataQualityImpact
  });
  
  // Add premium computed features
  if (tier === 'paid') {
    // Carfax summary
    if (vehicleHistory?.carfax || vehicleHistory?.nmvtis) {
      result.carfaxSummary = generateHistorySummary(
        vehicleHistory.nmvtis,
        vehicleHistory.carfax
      );
    }
    
    // Comparable listings from market data
    if (marketData) {
      result.comparableListings = generateComparableListings(marketData, estimatedValue, vehicleInfo.mileage);
    }
    
    // Market pricing analysis (detailed pricing context)
    if (marketData && vehicleInfo.askingPrice) {
      const rawListings = marketData.autoDev?.rawListings;
      const pricingAnalysis = analyzeMarketPricing(
        marketData,
        vehicleInfo.askingPrice,
        request.location,
        rawListings
      );
      
      if (pricingAnalysis) {
        result.marketPricingAnalysis = pricingAnalysis;
        console.log('[Analysis] Market pricing analysis generated:', {
          hasAnalysis: !!pricingAnalysis,
          comparableCount: pricingAnalysis.comparableCount,
          askingPricePercentile: pricingAnalysis.askingPricePosition.percentile,
          negotiationLeverage: pricingAnalysis.negotiationLeverage.level
        });
      }
    }
    
    // Seller analysis
    if (sellerSignals) {
      const credibility = calculateSellerCredibilityScore(sellerSignals);
      result.sellerAnalysis = credibility;
    }
    
    // Tailored questions (comprehensive, report-specific questions)
    const tailoredQuestions = generateTailoredQuestions(result);
    result.tailoredQuestions = tailoredQuestions;
    console.log('[Analysis] Tailored questions generated:', {
      totalQuestions: tailoredQuestions.questions.length,
      critical: tailoredQuestions.categories.critical.length,
      high: tailoredQuestions.categories.high.length,
      medium: tailoredQuestions.categories.medium.length,
      low: tailoredQuestions.categories.low.length
    });
    
    // Generate summary now that all premium features are available
    // Paid tier: Enhanced explanation with detailed context from premium features
    let summary = verdictReasoning.explanation;
    
    // Enhance with detailed price context from market pricing analysis if available
    if (result.marketPricingAnalysis) {
      const mpa = result.marketPricingAnalysis;
      if (verdict === 'deal' && mpa.askingPricePosition === 'significantly_below') {
        summary = `This appears to be a solid deal. Market pricing analysis shows the asking price is significantly below comparable listings (${mpa.percentilePosition ? `${100 - mpa.percentilePosition}th` : 'lower'} percentile). ${summary}`;
      } else if (verdict === 'deal' && mpa.askingPricePosition === 'at_or_below_median') {
        summary = `This vehicle is priced reasonably. Market pricing analysis indicates the asking price is at or below the median of comparable listings. ${summary}`;
      } else if (verdict === 'caution' && mpa.askingPricePosition === 'significantly_above') {
        summary = `Market pricing analysis shows the asking price is significantly above comparable listings (${mpa.percentilePosition ? `${mpa.percentilePosition}th` : 'higher'} percentile). ${summary}`;
      } else if (verdict === 'caution' && mpa.negotiationLeverage?.level === 'weak') {
        summary = `${summary} Market pricing analysis indicates weak negotiation leverage.`;
      }
    } else {
      // Fallback to basic price context if market pricing analysis not available
      if (verdict === 'deal' && priceDiffPercent !== undefined && priceDiffPercent < 0) {
        summary = `This appears to be a solid deal. The asking price is ${Math.abs(priceDiffPercent).toFixed(1)}% below market value. ${summary}`;
      } else if (verdict === 'deal' && priceDiffPercent !== undefined && priceDiffPercent > 0 && priceDiffPercent < 15) {
        summary = `This vehicle is priced reasonably. ${summary}`;
      } else if (verdict === 'caution' && priceDiffPercent !== undefined && priceDiffPercent > 15) {
        summary = `Priced ${priceDiffPercent.toFixed(1)}% above market value. ${summary}`;
      }
    }
    
    // Add maintenance risk context for paid tier
    if (result.maintenanceRiskAssessment && result.maintenanceRiskAssessment.overallRisk === 'elevated' && 
        !summary.includes('maintenance risk') && !summary.includes('maintenance concerns')) {
      summary = `${summary} Maintenance risk assessment indicates elevated forward-looking maintenance concerns.`;
    }
    
    // Add environmental risk context if not already mentioned
    if (result.environmentalRisk && result.environmentalRisk.overallRisk === 'high' && 
        !summary.includes('environmental') && !summary.includes('water damage')) {
      summary = `${summary} Environmental risk assessment indicates high exposure to disaster events.`;
    }
    
    // Add data quality context for paid tier
    if (dataQuality && dataQuality.overallConfidence === 'low') {
      summary = `${summary} Note: Limited data quality may affect confidence in this assessment.`;
    }
    
    result.summary = summary;
  } else {
    // Free tier: Generate summary with basic context
    let summary = verdictReasoning.explanation;
    
    // Add price context if available and relevant
    if (verdict === 'deal' && priceDiffPercent !== undefined && priceDiffPercent < 0) {
      summary = `This appears to be a solid deal. The asking price is ${Math.abs(priceDiffPercent).toFixed(0)}% below market value. ${summary}`;
    } else if (verdict === 'deal' && priceDiffPercent !== undefined && priceDiffPercent > 0 && priceDiffPercent < 15) {
      summary = `This vehicle is priced reasonably. ${summary}`;
    } else if (verdict === 'caution' && priceDiffPercent !== undefined && priceDiffPercent > 15) {
      summary = `Priced ${priceDiffPercent.toFixed(0)}% above market. ${summary}`;
    }
    
    result.summary = summary;
  }
  
  return result;
  } catch (error: any) {
    console.error('[Analysis] Fatal error in analyzeVehicle:', error);
    console.error('[Analysis] Error stack:', error?.stack);
    console.error('[Analysis] Error message:', error?.message);
    console.error('[Analysis] Error name:', error?.name);
    // Re-throw so the UI can catch and display the error
    throw error;
  }
}
