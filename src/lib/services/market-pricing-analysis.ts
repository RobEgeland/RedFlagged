/**
 * Market Pricing Analysis Service
 * Premium Feature: Provides detailed market pricing analysis using observed
 * active vehicle listings and derived market data.
 */

import { MarketListingsData } from '@/types/vehicle';

export interface MarketPricingAnalysis {
  priceRanges: {
    low: number;
    median: number;
    high: number;
    percentile25: number;
    percentile75: number;
  };
  askingPricePosition: {
    percentile: number; // 0-100, where the asking price falls in the market
    position: 'below' | 'at' | 'above';
    differencePercent: number; // How much above/below median
  };
  comparableCount: number;
  geographicScope: string;
  listingType: 'dealer' | 'private-party' | 'mixed' | 'unknown';
  marketComparison: string; // Explanation of how asking price compares
  negotiationLeverage: {
    level: 'strong' | 'moderate' | 'limited' | 'none';
    explanation: string;
    suggestedApproach: string;
  };
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  dataQuality: {
    hasEnoughData: boolean;
    dataSparsity: 'sparse' | 'moderate' | 'adequate';
    regionalVariance: boolean;
  };
}

/**
 * Raw listing data for detailed analysis
 */
export interface RawListing {
  price: number;
  mileage?: number;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  dealer?: string;
  listingType?: 'dealer' | 'private-party';
}

/**
 * Analyze market pricing data to provide detailed pricing context
 */
export function analyzeMarketPricing(
  marketData: MarketListingsData | undefined,
  askingPrice: number,
  vehicleLocation?: string,
  rawListings?: RawListing[]
): MarketPricingAnalysis | null {
  if (!marketData) {
    return null;
  }

  // Extract pricing data from raw listings if available, otherwise use aggregated data
  let prices: number[] = [];
  let listingCount = 0;
  let geographicScope = 'National';
  let listingType: 'dealer' | 'private-party' | 'mixed' | 'unknown' = 'unknown';

  // If we have raw listings, use them for accurate analysis
  if (rawListings && rawListings.length > 0) {
    prices = rawListings
      .map(l => l.price)
      .filter((p): p is number => typeof p === 'number' && p > 0)
      .sort((a, b) => a - b);
    
    listingCount = rawListings.length;
    
    // Determine listing type
    const dealerCount = rawListings.filter(l => l.listingType === 'dealer' || l.dealer).length;
    const privateCount = rawListings.filter(l => l.listingType === 'private-party').length;
    
    if (dealerCount > privateCount * 2) {
      listingType = 'dealer';
    } else if (privateCount > dealerCount * 2) {
      listingType = 'private-party';
    } else if (dealerCount > 0 && privateCount > 0) {
      listingType = 'mixed';
    } else {
      listingType = 'dealer'; // Default assumption
    }
    
    // Determine geographic scope from listings
    const states = new Set<string>();
    rawListings.forEach(l => {
      if (l.location?.state) states.add(l.location.state);
    });
    
    if (states.size === 1) {
      geographicScope = Array.from(states)[0];
    } else if (states.size <= 3) {
      geographicScope = `${Array.from(states).join(', ')} region`;
    } else {
      geographicScope = 'Multi-regional';
    }
  } else {
    // Fall back to aggregated data - estimate percentiles
    // Get prices from Auto.dev if available
    if (marketData.autoDev) {
      const { marketAverage, priceRange } = marketData.autoDev;
      
      // Estimate percentiles from range (approximate)
      const range = priceRange.max - priceRange.min;
      prices = [
        priceRange.min, // 0th percentile (low)
        priceRange.min + range * 0.25, // 25th percentile
        marketAverage, // Approximate median (50th percentile)
        priceRange.min + range * 0.75, // 75th percentile
        priceRange.max // 100th percentile (high)
      ];
      
      listingCount = 10; // Estimate
      listingType = 'dealer'; // Auto.dev typically has dealer listings
    }

    // Also use MarketCheck sales stats if available (optional enhancement)
    // Note: MarketCheck failures are non-critical - Auto.dev data is sufficient
    if (marketData.marketCheck?.salesStats) {
      const stats = marketData.marketCheck.salesStats;
      
      // If we have MarketCheck data, use it to refine our analysis
      // But only if we don't have raw listings (which are more accurate)
      if (stats.medianPrice && prices.length === 0) {
        prices = [
          stats.priceRange?.min || stats.medianPrice * 0.8,
          stats.medianPrice * 0.9, // Approximate 25th percentile
          stats.medianPrice,
          stats.medianPrice * 1.1, // Approximate 75th percentile
          stats.priceRange?.max || stats.medianPrice * 1.2
        ];
      }
      
      // Use MarketCheck sales count if it's higher (more comprehensive)
      if (stats.salesCount > listingCount) {
        listingCount = stats.salesCount;
      }
    }
  }

  if (prices.length === 0 || listingCount === 0) {
    console.warn('[Market Pricing Analysis] Insufficient data for analysis:', {
      pricesCount: prices.length,
      listingCount,
      hasAutoDev: !!marketData.autoDev,
      hasMarketCheck: !!marketData.marketCheck
    });
    return null;
  }

  // Sort prices for percentile calculation
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const low = sortedPrices[0];
  const high = sortedPrices[sortedPrices.length - 1];
  const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
  const percentile25 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
  const percentile75 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];

  // Calculate where asking price falls
  const askingPricePercentile = calculatePercentile(askingPrice, sortedPrices);
  const medianDifference = ((askingPrice - median) / median) * 100;
  
  let position: 'below' | 'at' | 'above';
  if (Math.abs(medianDifference) < 2) {
    position = 'at';
  } else if (medianDifference < 0) {
    position = 'below';
  } else {
    position = 'above';
  }

  // Determine geographic scope
  if (vehicleLocation) {
    const state = extractState(vehicleLocation);
    geographicScope = state ? `${state} and surrounding region` : 'Regional';
  }

  // Determine listing type (Auto.dev is typically dealer, but we note uncertainty)
  if (listingType === 'unknown') {
    listingType = 'dealer'; // Default assumption for Auto.dev
  }

  // Generate market comparison explanation
  const marketComparison = generateMarketComparison(
    askingPrice,
    median,
    low,
    high,
    position,
    medianDifference
  );

  // Calculate negotiation leverage
  const negotiationLeverage = calculateNegotiationLeverage(
    askingPrice,
    median,
    low,
    high,
    position,
    medianDifference
  );

  // Assess data quality
  const dataQuality = assessDataQuality(listingCount, prices, vehicleLocation);

  // Generate limitations
  const limitations = generateLimitations(dataQuality, listingCount, geographicScope);

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (listingCount >= 20 && dataQuality.dataSparsity === 'adequate') {
    confidence = 'high';
  } else if (listingCount < 5 || dataQuality.dataSparsity === 'sparse') {
    confidence = 'low';
  }

  return {
    priceRanges: {
      low,
      median,
      high,
      percentile25,
      percentile75,
    },
    askingPricePosition: {
      percentile: askingPricePercentile,
      position,
      differencePercent: medianDifference,
    },
    comparableCount: listingCount,
    geographicScope,
    listingType,
    marketComparison,
    negotiationLeverage,
    confidence,
    limitations,
    dataQuality,
  };
}

/**
 * Calculate percentile position of a value in a sorted array
 */
function calculatePercentile(value: number, sortedArray: number[]): number {
  if (sortedArray.length === 0) return 50;
  
  let belowCount = 0;
  for (const price of sortedArray) {
    if (price < value) belowCount++;
  }
  
  return Math.round((belowCount / sortedArray.length) * 100);
}

/**
 * Generate market comparison explanation
 */
function generateMarketComparison(
  askingPrice: number,
  median: number,
  low: number,
  high: number,
  position: 'below' | 'at' | 'above',
  differencePercent: number
): string {
  const absDiff = Math.abs(differencePercent);
  
  if (position === 'below') {
    if (absDiff >= 15) {
      return `The asking price is ${absDiff.toFixed(0)}% below the median market price, placing it in the lower range of comparable listings. This suggests the vehicle may be priced competitively or below market value.`;
    } else if (absDiff >= 5) {
      return `The asking price is ${absDiff.toFixed(0)}% below the median market price, indicating a competitive position in the lower-mid range of the market.`;
    } else {
      return `The asking price is slightly below the median market price, positioning it in the lower portion of the typical price range.`;
    }
  } else if (position === 'at') {
    return `The asking price aligns closely with the median market price, indicating a market-rate valuation that reflects typical pricing for similar vehicles.`;
  } else {
    if (absDiff >= 15) {
      return `The asking price is ${absDiff.toFixed(0)}% above the median market price, placing it in the upper range of comparable listings. This may indicate premium pricing or additional features/condition factors.`;
    } else if (absDiff >= 5) {
      return `The asking price is ${absDiff.toFixed(0)}% above the median market price, positioning it in the upper-mid range of the market.`;
    } else {
      return `The asking price is slightly above the median market price, positioning it in the upper portion of the typical price range.`;
    }
  }
}

/**
 * Calculate negotiation leverage
 */
function calculateNegotiationLeverage(
  askingPrice: number,
  median: number,
  low: number,
  high: number,
  position: 'below' | 'at' | 'above',
  differencePercent: number
): {
  level: 'strong' | 'moderate' | 'limited' | 'none';
  explanation: string;
  suggestedApproach: string;
} {
  const absDiff = Math.abs(differencePercent);
  
  if (position === 'below' && absDiff >= 10) {
    return {
      level: 'limited',
      explanation: `With the asking price already ${absDiff.toFixed(0)}% below median, there may be limited room for negotiation unless the seller is motivated. The price appears competitive relative to the market.`,
      suggestedApproach: 'Focus negotiation on vehicle condition, maintenance records, or included features rather than price reduction. If the vehicle checks out well, the current price may represent fair value.'
    };
  } else if (position === 'below' && absDiff >= 5) {
    return {
      level: 'moderate',
      explanation: `The asking price is ${absDiff.toFixed(0)}% below median, suggesting some negotiation room may exist, though the starting position is already favorable.`,
      suggestedApproach: 'A modest negotiation (2-5%) may be reasonable, but be prepared that the seller may be firm given the competitive pricing. Emphasize your readiness to move quickly if terms are agreeable.'
    };
  } else if (position === 'at') {
    return {
      level: 'moderate',
      explanation: 'The asking price aligns with market median, providing a neutral starting point for negotiation.',
      suggestedApproach: 'Standard negotiation approaches apply. Consider factors like vehicle condition, mileage, included features, and seller motivation when determining your offer strategy.'
    };
  } else if (position === 'above' && absDiff >= 15) {
    return {
      level: 'strong',
      explanation: `The asking price is ${absDiff.toFixed(0)}% above median, providing significant potential for negotiation. The price appears elevated relative to comparable listings.`,
      suggestedApproach: 'You have strong leverage for negotiation. Reference comparable listings and market data to support a lower offer. Consider starting 10-15% below asking and negotiating toward a price closer to median market value.'
    };
  } else if (position === 'above' && absDiff >= 5) {
    return {
      level: 'moderate',
      explanation: `The asking price is ${absDiff.toFixed(0)}% above median, providing some negotiation room.`,
      suggestedApproach: 'Moderate negotiation leverage exists. Consider starting 5-8% below asking and working toward a price closer to median. Be prepared to justify your offer with market data.'
    };
  } else {
    return {
      level: 'limited',
      explanation: 'The asking price is slightly above median, with limited negotiation leverage.',
      suggestedApproach: 'Focus on value factors like condition, maintenance history, and included features. A modest negotiation (2-4%) may be reasonable, but the price is relatively close to market median.'
    };
  }
}

/**
 * Assess data quality
 */
function assessDataQuality(
  listingCount: number,
  prices: number[],
  vehicleLocation?: string
): {
  hasEnoughData: boolean;
  dataSparsity: 'sparse' | 'moderate' | 'adequate';
  regionalVariance: boolean;
} {
  const hasEnoughData = listingCount >= 5;
  let dataSparsity: 'sparse' | 'moderate' | 'adequate';
  
  if (listingCount >= 15) {
    dataSparsity = 'adequate';
  } else if (listingCount >= 5) {
    dataSparsity = 'moderate';
  } else {
    dataSparsity = 'sparse';
  }

  // Check for regional variance (price range spread)
  const priceRange = Math.max(...prices) - Math.min(...prices);
  const medianPrice = prices[Math.floor(prices.length / 2)];
  const rangePercent = (priceRange / medianPrice) * 100;
  const regionalVariance = rangePercent > 30; // More than 30% spread suggests regional variance

  return {
    hasEnoughData,
    dataSparsity,
    regionalVariance,
  };
}

/**
 * Generate limitations list
 */
function generateLimitations(
  dataQuality: { hasEnoughData: boolean; dataSparsity: string; regionalVariance: boolean },
  listingCount: number,
  geographicScope: string
): string[] {
  const limitations: string[] = [];

  if (dataQuality.dataSparsity === 'sparse') {
    limitations.push(`Limited comparable listings (${listingCount} found) may reduce pricing precision. Market analysis should be considered approximate.`);
  }

  if (dataQuality.regionalVariance) {
    limitations.push('Significant price variation observed across listings, which may reflect regional differences, condition variations, or feature differences not captured in this analysis.');
  }

  if (listingCount < 10) {
    limitations.push('Small sample size limits statistical confidence. Consider this analysis as directional guidance rather than definitive valuation.');
  }

  if (geographicScope === 'National') {
    limitations.push('Analysis reflects national market trends. Local market conditions may vary significantly, and regional pricing differences are not accounted for in this assessment.');
  }

  limitations.push('Pricing reflects observed listings and market data, not authoritative valuations. Actual transaction prices may differ based on negotiation, condition, timing, and other factors not captured here.');

  return limitations;
}

/**
 * Extract state from location string
 */
function extractState(location?: string): string | null {
  if (!location) return null;
  
  // Try to extract state abbreviation or name
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const upperLocation = location.toUpperCase();
  for (const abbr of stateAbbreviations) {
    if (upperLocation.includes(abbr)) {
      return abbr;
    }
  }
  
  // Try full state names
  const stateNames = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  
  for (const name of stateNames) {
    if (location.includes(name)) {
      return name;
    }
  }
  
  return null;
}

