import { 
  ListingBehaviorSignals, 
  PricingBehaviorSignals, 
  SellerProfileConsistency 
} from '@/types/vehicle';

/**
 * Seller Signals Services
 * Analyzes listing behavior, pricing behavior, and seller profile consistency
 */

/**
 * Auto.dev API Configuration
 */
interface AutoDevConfig {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Auto.dev Listing Response Structure
 */
interface AutoDevListingResponse {
  data?: {
    vin?: string;
    createdAt?: string;
    online?: boolean;
    vehicle?: {
      vin?: string;
      year?: number;
      make?: string;
      model?: string;
      trim?: string;
    };
    retailListing?: {
      price?: number;
      dealer?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get Auto.dev API configuration from environment variables
 */
function getAutoDevConfig(): AutoDevConfig {
  return {
    apiKey: process.env.AUTO_DEV_API_KEY,
    apiUrl: process.env.AUTO_DEV_API_URL || 'https://api.auto.dev',
  };
}

/**
 * Check if code is running on client-side
 */
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Fetch vehicle listing from Auto.dev Listings API by VIN
 */
async function fetchListingByVIN(
  vin: string,
  apiKey: string,
  apiUrl: string
): Promise<AutoDevListingResponse | null> {
  try {
    const url = `${apiUrl}/listings/${vin}`;
    console.log('[Auto.dev Listing] Fetching listing for VIN:', vin);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[Auto.dev Listing] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        console.error('[Auto.dev Listing] API authentication failed. Check your API key.');
        return null;
      }
      
      if (response.status === 404) {
        console.warn('[Auto.dev Listing] No listing found for VIN:', vin);
        return null;
      }
      
      if (response.status === 429) {
        console.error('[Auto.dev Listing] API rate limit exceeded.');
        return null;
      }
      
      console.error('[Auto.dev Listing] API error:', response.status, errorData);
      return null;
    }
    
    const data: AutoDevListingResponse = await response.json();
    console.log('[Auto.dev Listing] Received listing data:', {
      hasData: !!data.data,
      createdAt: data.data?.createdAt,
      online: data.data?.online
    });
    
    return data;
  } catch (error: any) {
    console.error('[Auto.dev Listing] Fetch error:', error);
    return null;
  }
}

/**
 * Calculate weighted relisting score based on multiple listing dates
 * Recent relists (within last 30 days) are weighted 3x
 * Relists within 30-60 days are weighted 2x
 * Relists within 60-90 days are weighted 1x
 * 
 * This function can handle either:
 * 1. A single listing date (current API behavior)
 * 2. Multiple listing dates (for testing or future API enhancement)
 */
function calculateRelistingScore(
  createdAt: string,
  additionalListingDates?: string[]
): {
  relistingCount: number;
  weightedScore: number;
  confidence: number;
  daysSinceCreation: number;
  isRecentRelist: boolean;
  allListingDates?: string[];
} {
  const now = new Date();
  const allDates = [createdAt, ...(additionalListingDates || [])].filter(Boolean);
  
  // Calculate scores for all listings
  const listingScores = allDates.map(date => {
    const createdDate = new Date(date);
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only consider listings within the last 90 days
    if (daysSinceCreation > 90 || daysSinceCreation < 0) {
      return null;
    }
    
    // Weight recent relists more heavily
    let weight = 1;
    let isRecentRelist = false;
    
    if (daysSinceCreation <= 7) {
      weight = 3; // Very recent (within 7 days) - highest weight, likely relist
      isRecentRelist = true;
    } else if (daysSinceCreation <= 30) {
      weight = 2.5; // Recent (7-30 days) - high weight
      isRecentRelist = true;
    } else if (daysSinceCreation <= 60) {
      weight = 2; // Moderately recent (30-60 days) - medium weight
    } else {
      weight = 1; // Older but within 90 days - base weight
    }
    
    return {
      daysSinceCreation,
      weight,
      isRecentRelist,
      date
    };
  }).filter((score): score is NonNullable<typeof score> => score !== null);
  
  if (listingScores.length === 0) {
    return {
      relistingCount: 0,
      weightedScore: 0,
      confidence: 0,
      daysSinceCreation: 0,
      isRecentRelist: false,
      allListingDates: allDates
    };
  }
  
  // Calculate total weighted score (sum of all weights)
  const totalWeightedScore = listingScores.reduce((sum, score) => sum + score.weight, 0);
  
  // Count total relistings
  const relistingCount = listingScores.length;
  
  // Use the most recent listing for daysSinceCreation
  const mostRecent = listingScores.reduce((most, current) => 
    current.daysSinceCreation < most.daysSinceCreation ? current : most
  );
  
  // Calculate confidence based on:
  // 1. Number of relistings (more = higher confidence)
  // 2. Recency of most recent listing (more recent = higher confidence)
  let baseConfidence = 0;
  if (mostRecent.daysSinceCreation <= 7) {
    baseConfidence = 85 + (7 - mostRecent.daysSinceCreation) * 1.4; // 85-95% for very recent
  } else if (mostRecent.daysSinceCreation <= 30) {
    baseConfidence = 60 + ((30 - mostRecent.daysSinceCreation) / 30) * 20; // 60-80% for recent
  } else if (mostRecent.daysSinceCreation <= 60) {
    baseConfidence = 40 + ((60 - mostRecent.daysSinceCreation) / 30) * 15; // 40-55% for moderate
  } else {
    baseConfidence = 30 + ((90 - mostRecent.daysSinceCreation) / 30) * 10; // 30-40% for older
  }
  
  // Boost confidence for multiple relistings
  // Each additional relisting adds 5-10% confidence (capped at 95%)
  const multiRelistBonus = Math.min(20, (relistingCount - 1) * 8);
  const confidence = Math.max(0, Math.min(100, Math.round(baseConfidence + multiRelistBonus)));
  
  return {
    relistingCount,
    weightedScore: totalWeightedScore,
    confidence,
    daysSinceCreation: mostRecent.daysSinceCreation,
    isRecentRelist: mostRecent.isRecentRelist,
    allListingDates: allDates
  };
}

/**
 * Client-side function to fetch listing data via API route
 */
async function fetchListingByVINViaAPI(vin: string): Promise<AutoDevListingResponse | null> {
  try {
    const response = await fetch(`/api/vehicle-listing/${vin}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[Client] Listing API route error:', response.status, errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[Client] Error calling Listing API route:', error);
    return null;
  }
}

/**
 * Test mode: Simulate multiple relistings for testing
 * Set ENABLE_RELISTING_TEST_MODE=true in environment to enable
 * Uses a special VIN pattern to trigger test mode
 */
function getTestRelistingDates(vin: string): string[] | null {
  // Check if test mode is enabled via environment variable
  const testModeEnabled = process.env.ENABLE_RELISTING_TEST_MODE === 'true';
  
  // Use a special VIN pattern for testing: VINs ending in "TEST" or starting with "TEST"
  const isTestVIN = vin.toUpperCase().endsWith('TEST') || vin.toUpperCase().startsWith('TEST');
  
  if (!testModeEnabled && !isTestVIN) {
    return null;
  }
  
  // Generate test relisting dates: multiple listings over the last 90 days
  const now = new Date();
  const testDates: string[] = [];
  
  // Most recent listing: 3 days ago (very recent, high weight)
  const date1 = new Date(now);
  date1.setDate(date1.getDate() - 3);
  testDates.push(date1.toISOString().replace('T', ' ').substring(0, 19));
  
  // Second listing: 15 days ago (recent, medium-high weight)
  const date2 = new Date(now);
  date2.setDate(date2.getDate() - 15);
  testDates.push(date2.toISOString().replace('T', ' ').substring(0, 19));
  
  // Third listing: 45 days ago (moderate, medium weight)
  const date3 = new Date(now);
  date3.setDate(date3.getDate() - 45);
  testDates.push(date3.toISOString().replace('T', ' ').substring(0, 19));
  
  // Fourth listing: 75 days ago (older, lower weight)
  const date4 = new Date(now);
  date4.setDate(date4.getDate() - 75);
  testDates.push(date4.toISOString().replace('T', ' ').substring(0, 19));
  
  console.log('[Seller Signals] TEST MODE: Simulating multiple relistings:', testDates);
  return testDates;
}

export async function analyzeListingBehavior(
  vin: string,
  listingUrl?: string
): Promise<ListingBehaviorSignals> {
  try {
    const config = getAutoDevConfig();
    
    // Check for test mode first
    const testDates = getTestRelistingDates(vin);
    
    if (testDates) {
      // Test mode: Use simulated relisting dates
      const relistingScore = calculateRelistingScore(testDates[0], testDates.slice(1));
      
      if (relistingScore.relistingCount === 0) {
        return {
          listingLongevity: undefined,
          relistingDetection: undefined
        };
      }
      
      // Format test dates for display
      const formattedDates = testDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      });
      
      return {
        relistingDetection: {
          detected: true,
          timesSeen: relistingScore.relistingCount,
          confidence: relistingScore.confidence,
          weightedScore: relistingScore.weightedScore,
          personalBackupHistory: formattedDates.map((date, index) => 
            `Listed on ${date}${index === 0 ? ' (Most Recent)' : ''}`
          ),
          timeLocation: formattedDates
        },
        listingLongevity: {
          daysListed: relistingScore.daysSinceCreation,
          isStale: relistingScore.daysSinceCreation > 45,
          sellingWithoutCorrection: false
        }
      };
    }
    
    // Normal mode: Fetch from API
    // If no API key configured, return empty signals
    if (!config.apiKey || !config.apiUrl) {
      console.warn('[Seller Signals] Auto.dev API key not configured, skipping relisting detection');
      return {};
    }
    
    // Fetch listing data
    let listingData: AutoDevListingResponse | null = null;
    
    if (isClientSide()) {
      console.log('[Seller Signals] Client-side call, using API route');
      listingData = await fetchListingByVINViaAPI(vin);
    } else {
      listingData = await fetchListingByVIN(vin, config.apiKey, config.apiUrl);
    }
    
    if (!listingData || !listingData.data || !listingData.data.createdAt) {
      console.log('[Seller Signals] No listing data found for relisting detection');
      // Return empty structure so card can still display "No signals detected"
      return {
        listingLongevity: undefined,
        relistingDetection: undefined
      };
    }
    
    const createdAt = listingData.data.createdAt;
    const relistingScore = calculateRelistingScore(createdAt);
    
    // Only report relisting if we have a meaningful score and it's within 90 days
    if (relistingScore.relistingCount === 0 || relistingScore.confidence < 25) {
      console.log('[Seller Signals] Listing is too old or confidence too low for relisting detection');
      // Still return listing longevity data so card can display it
      return {
        listingLongevity: {
          daysListed: relistingScore.daysSinceCreation,
          isStale: relistingScore.daysSinceCreation > 45,
          sellingWithoutCorrection: false // Would need price history to determine
        },
        relistingDetection: undefined
      };
    }
    
    // Calculate days listed
    const daysListed = relistingScore.daysSinceCreation;
    const isStale = daysListed > 45;
    
    // Format creation date for display
    const createdDate = new Date(createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Build location string if available
    const location = listingData.data.retailListing 
      ? `${listingData.data.retailListing.city || ''}, ${listingData.data.retailListing.state || ''}`.trim()
      : undefined;
    
    return {
      relistingDetection: {
        detected: true,
        timesSeen: relistingScore.relistingCount,
        confidence: relistingScore.confidence,
        weightedScore: relistingScore.weightedScore,
        personalBackupHistory: [
          `Listed on ${formattedDate}${location ? ` - ${location}` : ''}`
        ],
        timeLocation: location ? [
          `${formattedDate} - ${location}`
        ] : [
          formattedDate
        ]
      },
      listingLongevity: {
        daysListed,
        isStale,
        sellingWithoutCorrection: false // Would need price history to determine
      }
    };
  } catch (error) {
    console.error('[Seller Signals] Listing behavior analysis error:', error);
    return {};
  }
}

/**
 * Analyze "Unusually Low Price" signal
 * Flags when asking price is meaningfully below expected valuation anchors or market medians
 * Uses conservative, configurable thresholds
 */
export function analyzeUnusuallyLowPrice(
  askingPrice: number,
  estimatedValue: number,
  marketMedian?: number,
  config?: {
    lowPriceThreshold?: number; // Percentage below market to flag (default: -15%)
    highConfidenceThreshold?: number; // Percentage for high confidence (default: -25%)
  }
): PricingBehaviorSignals['unusuallyLowPrice'] {
  try {
    const threshold = config?.lowPriceThreshold ?? -15; // Default: 15% below market
    const highConfidenceThreshold = config?.highConfidenceThreshold ?? -25; // Default: 25% below for high confidence
    
    // Use market median if available, otherwise use estimated value
    const marketAnchor = marketMedian ?? estimatedValue;
    
    if (!marketAnchor || marketAnchor <= 0) {
      return undefined;
    }
    
    // Calculate percentage below market
    const belowMarketPercent = ((askingPrice - marketAnchor) / marketAnchor) * 100;
    
    // Only flag if below the threshold (negative percentage)
    if (belowMarketPercent >= threshold) {
      return undefined; // Not unusually low
    }
    
    // Calculate confidence based on how far below market
    let confidence = 50; // Base confidence
    if (belowMarketPercent <= highConfidenceThreshold) {
      confidence = 85; // High confidence for very low prices
    } else if (belowMarketPercent <= threshold * 1.5) {
      confidence = 70; // Medium-high confidence
    }
    
    // Increase confidence if we have market median (more reliable than estimated value)
    if (marketMedian) {
      confidence = Math.min(95, confidence + 10);
    }
    
    console.log('[Pricing Risk] Unusually Low Price detected:', {
      askingPrice,
      marketAnchor,
      belowMarketPercent: belowMarketPercent.toFixed(1) + '%',
      confidence
    });
    
    return {
      detected: true,
      belowMarketPercent: Math.round(belowMarketPercent * 10) / 10, // Round to 1 decimal
      marketMedian: marketMedian,
      askingPrice,
      confidence: Math.round(confidence),
      thresholdUsed: threshold
    };
  } catch (error) {
    console.error('[Pricing Risk] Error analyzing unusually low price:', error);
    return undefined;
  }
}

/**
 * Analyze "Too Good for Too Long" signal
 * Only evaluated if "Unusually Low Price" is already detected
 * Flags when unusually low-priced vehicle remains listed beyond reasonable time threshold
 */
export function analyzeTooGoodForTooLong(
  daysListed: number,
  hasUnusuallyLowPrice: boolean,
  vehicleClass?: 'common' | 'luxury' | 'exotic', // Vehicle class affects threshold
  config?: {
    commonVehicleThreshold?: number; // Days for common vehicles (default: 21)
    luxuryVehicleThreshold?: number; // Days for luxury vehicles (default: 30)
    exoticVehicleThreshold?: number; // Days for exotic vehicles (default: 45)
  }
): PricingBehaviorSignals['tooGoodForTooLong'] {
  try {
    // Only evaluate if unusually low price is detected
    if (!hasUnusuallyLowPrice) {
      return undefined;
    }
    
    // Determine threshold based on vehicle class
    const classThresholds = {
      common: config?.commonVehicleThreshold ?? 21, // 14-30 days range, using 21 as default
      luxury: config?.luxuryVehicleThreshold ?? 30,
      exotic: config?.exoticVehicleThreshold ?? 45
    };
    
    const vehicleClassKey = vehicleClass ?? 'common';
    const thresholdDays = classThresholds[vehicleClassKey];
    
    // Only flag if days listed exceeds threshold
    if (daysListed <= thresholdDays) {
      return undefined; // Not listed long enough to be suspicious
    }
    
    // Calculate confidence based on how long it's been listed
    let confidence = 50; // Base confidence
    const daysOverThreshold = daysListed - thresholdDays;
    
    if (daysOverThreshold >= 30) {
      confidence = 85; // High confidence if 30+ days over threshold
    } else if (daysOverThreshold >= 14) {
      confidence = 70; // Medium-high confidence if 14+ days over
    } else {
      confidence = 60; // Medium confidence if just over threshold
    }
    
    console.log('[Pricing Risk] Too Good for Too Long detected:', {
      daysListed,
      thresholdDays,
      daysOverThreshold,
      confidence,
      vehicleClass: vehicleClassKey
    });
    
    return {
      detected: true,
      daysListed,
      thresholdDays,
      confidence: Math.round(confidence),
      requiresLowPrice: true
    };
  } catch (error) {
    console.error('[Pricing Risk] Error analyzing too good for too long:', error);
    return undefined;
  }
}

/**
 * Price history entry for volatility analysis
 */
interface PriceHistoryEntry {
  price: number;
  date: string; // ISO date string
}

/**
 * Calculate price volatility from price history
 * Detects:
 * - Price drops of 5-10%+ within 45 days
 * - Multiple price changes within 90 days
 * - Price oscillations (drop then increase, or multiple drops)
 */
function calculatePriceVolatility(
  priceHistory: PriceHistoryEntry[],
  currentPrice: number
): {
  detected: boolean;
  volatilityLevel: 'low' | 'medium' | 'high';
  priceChanges: number;
  significantDrops: Array<{
    fromPrice: number;
    toPrice: number;
    dropPercent: number;
    daysAgo: number;
  }>;
  oscillations: number;
  timeWindow: number;
} {
  if (!priceHistory || priceHistory.length < 2) {
    return {
      detected: false,
      volatilityLevel: 'low',
      priceChanges: 0,
      significantDrops: [],
      oscillations: 0,
      timeWindow: 0
    };
  }

  const now = new Date();
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Analyze last 90 days
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  // Analyze last 45 days for significant drops
  const fortyFiveDaysAgo = new Date(now);
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  const recentHistory = sortedHistory.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= ninetyDaysAgo;
  });

  if (recentHistory.length < 2) {
    return {
      detected: false,
      volatilityLevel: 'low',
      priceChanges: 0,
      significantDrops: [],
      oscillations: 0,
      timeWindow: 90
    };
  }

  // Count price changes
  const priceChanges = recentHistory.length - 1;

  // Detect significant drops (5-10%+ within 45 days)
  const significantDrops: Array<{
    fromPrice: number;
    toPrice: number;
    dropPercent: number;
    daysAgo: number;
  }> = [];

  for (let i = 0; i < recentHistory.length - 1; i++) {
    const current = recentHistory[i];
    const previous = recentHistory[i + 1];
    
    const currentDate = new Date(current.date);
    const previousDate = new Date(previous.date);
    const daysDiff = Math.floor((now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if this change happened within 45 days
    if (currentDate >= fortyFiveDaysAgo && previousDate >= fortyFiveDaysAgo) {
      const dropPercent = ((previous.price - current.price) / previous.price) * 100;
      
      // Significant drop: 5% or more
      if (dropPercent >= 5 && current.price < previous.price) {
        significantDrops.push({
          fromPrice: previous.price,
          toPrice: current.price,
          dropPercent: Math.round(dropPercent * 10) / 10,
          daysAgo: daysDiff
        });
      }
    }
  }

  // Detect oscillations (price drops then increases, or multiple consecutive drops)
  let oscillations = 0;
  let consecutiveDrops = 0;
  let lastDirection: 'up' | 'down' | null = null;

  for (let i = 0; i < recentHistory.length - 1; i++) {
    const current = recentHistory[i];
    const next = recentHistory[i + 1];
    
    if (current.price < next.price) {
      // Price went down
      if (lastDirection === 'up') {
        oscillations++; // Oscillation detected: was going up, now going down
      }
      consecutiveDrops++;
      lastDirection = 'down';
    } else if (current.price > next.price) {
      // Price went up
      if (lastDirection === 'down' && consecutiveDrops > 0) {
        oscillations++; // Oscillation detected: was dropping, now increasing
      }
      consecutiveDrops = 0;
      lastDirection = 'up';
    }
  }

  // Determine volatility level
  let volatilityLevel: 'low' | 'medium' | 'high' = 'low';
  let detected = false;

  // High volatility: multiple significant drops OR high oscillation count OR many price changes
  if (significantDrops.length >= 2 || oscillations >= 2 || priceChanges >= 4) {
    volatilityLevel = 'high';
    detected = true;
  }
  // Medium volatility: one significant drop OR some oscillations OR moderate price changes
  else if (significantDrops.length >= 1 || oscillations >= 1 || priceChanges >= 2) {
    volatilityLevel = 'medium';
    detected = true;
  }
  // Low volatility: minor changes but still some activity
  else if (priceChanges >= 1) {
    volatilityLevel = 'low';
    detected = true;
  }

  return {
    detected,
    volatilityLevel,
    priceChanges,
    significantDrops,
    oscillations,
    timeWindow: 90
  };
}

/**
 * Test mode: Generate test price history for volatility detection
 */
function getTestPriceHistory(vin: string, currentPrice: number): PriceHistoryEntry[] | null {
  const testModeEnabled = process.env.ENABLE_RELISTING_TEST_MODE === 'true';
  const isTestVIN = vin.toUpperCase().endsWith('TEST') || vin.toUpperCase().startsWith('TEST');
  
  if (!testModeEnabled && !isTestVIN) {
    return null;
  }

  const now = new Date();
  const history: PriceHistoryEntry[] = [];

  // Scenario: Price volatility with multiple drops
  // Start high, drop significantly, then oscillate
  const startPrice = currentPrice * 1.15; // Started 15% higher
  const drop1Price = currentPrice * 1.05; // Dropped to 5% above current
  const drop2Price = currentPrice; // Current price

  // 60 days ago: Initial listing
  const date1 = new Date(now);
  date1.setDate(date1.getDate() - 60);
  history.push({ price: Math.round(startPrice), date: date1.toISOString().split('T')[0] });

  // 35 days ago: First significant drop (8% drop)
  const date2 = new Date(now);
  date2.setDate(date2.getDate() - 35);
  history.push({ price: Math.round(drop1Price), date: date2.toISOString().split('T')[0] });

  // 20 days ago: Slight increase (oscillation)
  const date3 = new Date(now);
  date3.setDate(date3.getDate() - 20);
  history.push({ price: Math.round(drop1Price * 1.02), date: date3.toISOString().split('T')[0] });

  // 10 days ago: Another drop (6% drop)
  const date4 = new Date(now);
  date4.setDate(date4.getDate() - 10);
  history.push({ price: Math.round(drop2Price * 1.03), date: date4.toISOString().split('T')[0] });

  // Current: Final price
  history.push({ price: currentPrice, date: now.toISOString().split('T')[0] });

  console.log('[Seller Signals] TEST MODE: Simulating price volatility:', history);
  return history;
}

export async function analyzePricingBehavior(
  vin: string,
  currentPrice: number
): Promise<PricingBehaviorSignals> {
  try {
    const config = getAutoDevConfig();
    
    // Check for test mode first
    const testPriceHistory = getTestPriceHistory(vin, currentPrice);
    
    if (testPriceHistory) {
      // Test mode: Use simulated price history
      const volatility = calculatePriceVolatility(testPriceHistory, currentPrice);
      
      return {
        priceVolatility: volatility.detected ? {
          detected: true,
          volatilityLevel: volatility.volatilityLevel,
          priceChanges: volatility.priceChanges,
          priceHistory: testPriceHistory.map(entry => ({
            price: entry.price,
            date: entry.date,
            changePercent: undefined
          })),
          significantDrops: volatility.significantDrops,
          oscillations: volatility.oscillations,
          timeWindow: volatility.timeWindow
        } : undefined,
        tooGoodTooBeLong: undefined
      };
    }

    // Normal mode: Try to fetch listing data to get current price and listing date
    // For now, we can only detect if price seems suspiciously low
    // Future: Integrate with price history API if available
    
    if (!config.apiKey || !config.apiUrl) {
      console.warn('[Seller Signals] Auto.dev API key not configured, skipping price volatility analysis');
      return {};
    }

    // Fetch listing data to get listing creation date
    let listingData: AutoDevListingResponse | null = null;
    
    if (isClientSide()) {
      listingData = await fetchListingByVINViaAPI(vin);
    } else {
      listingData = await fetchListingByVIN(vin, config.apiKey, config.apiUrl);
    }

    // If we have listing data with a price and date, we can do basic analysis
    // For now, without historical price data, we can only flag if price seems too good
    // This would require price history tracking over time
    
    // For now, return empty (no volatility detected without history)
    // In the future, this could integrate with a price history service
    return {
      priceVolatility: undefined,
      tooGoodTooBeLong: undefined
    };
  } catch (error) {
    console.error('[Seller Signals] Pricing behavior analysis error:', error);
    return {};
  }
}

export async function analyzeSellerProfile(
  sellerInfo?: string
): Promise<SellerProfileConsistency> {
  try {
    // TODO: Implement actual seller profile analysis
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const isDealer = Math.random() > 0.7;
    const hidingDealerStatus = isDealer && Math.random() > 0.5;
    
    return {
      sellerTypeRisk: {
        isDealerVsPrivate: isDealer ? 'dealer' : 'private',
        negotiatedSimilarListings: Math.random() > 0.6
      },
      autoDealerRevealed: hidingDealerStatus
    };
  } catch (error) {
    console.error('Seller profile analysis error:', error);
    return {};
  }
}

export async function analyzeAllSellerSignals(
  vin: string,
  currentPrice: number,
  listingUrl?: string,
  sellerInfo?: string
): Promise<{
  listingBehavior: ListingBehaviorSignals;
  pricingBehavior: PricingBehaviorSignals;
  profileConsistency: SellerProfileConsistency;
}> {
  try {
    const [listingBehavior, pricingBehavior, profileConsistency] = await Promise.all([
      analyzeListingBehavior(vin, listingUrl),
      analyzePricingBehavior(vin, currentPrice),
      analyzeSellerProfile(sellerInfo)
    ]);
    
    // Always return an object structure, even if empty
    return {
      listingBehavior: listingBehavior || {},
      pricingBehavior: pricingBehavior || {},
      profileConsistency: profileConsistency || {}
    };
  } catch (error) {
    console.error('[Seller Signals] Error in analyzeAllSellerSignals:', error);
    // Return empty structure on error so card can still display
    return {
      listingBehavior: {},
      pricingBehavior: {},
      profileConsistency: {}
    };
  }
}

export function calculateSellerCredibilityScore(signals: {
  listingBehavior?: ListingBehaviorSignals;
  pricingBehavior?: PricingBehaviorSignals;
  profileConsistency?: SellerProfileConsistency;
}): {
  score: number;
  insights: string[];
} {
  let score = 70; // Start with neutral score
  const insights: string[] = [];
  
  // Listing behavior analysis
  if (signals.listingBehavior?.relistingDetection?.detected) {
    const times = signals.listingBehavior.relistingDetection.timesSeen || 0;
    score -= times * 5;
    insights.push(`Vehicle has been relisted ${times} time${times === 1 ? '' : 's'} - may indicate issues discovered during previous inspections`);
  }
  
  if (signals.listingBehavior?.listingLongevity?.isStale) {
    score -= 10;
    insights.push('Listing has been active for an extended period without selling');
    
    if (signals.listingBehavior.listingLongevity.sellingWithoutCorrection) {
      score -= 5;
      insights.push('Seller has not adjusted price despite extended listing time');
    }
  }
  
  // Pricing behavior analysis
  if (signals.pricingBehavior?.priceVolatility?.hasChanged) {
    const increases = signals.pricingBehavior.priceVolatility.priceIncreases || 0;
    if (increases > 0) {
      score -= increases * 3;
      insights.push(`Price has been increased ${increases} time${increases === 1 ? '' : 's'} - unusual for private sales`);
    }
  }
  
  if (signals.pricingBehavior?.tooGoodTooBeLong?.isSuspicious) {
    score -= 15;
    insights.push('⚠️ Price is suspiciously low and vehicle remains unsold - investigate thoroughly');
  }
  
  // Seller profile analysis
  if (signals.profileConsistency?.autoDealerRevealed) {
    score -= 12;
    insights.push('⚠️ Seller appears to be a dealer posing as private party - no buyer protections');
  }
  
  if (signals.profileConsistency?.sellerTypeRisk?.negotiatedSimilarListings) {
    score += 5;
    insights.push('Seller has successfully sold similar vehicles before');
  }
  
  // Ensure score stays within 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return {
    score: Math.round(score),
    insights
  };
}
