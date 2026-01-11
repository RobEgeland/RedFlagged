import { MarketListingsData } from '@/types/vehicle';

/**
 * Market Listings Data Services
 * Free: Auto.dev listings (real market data)
 * Premium: Auto.dev, MarketCheck
 */

/**
 * Auto.dev API Configuration
 */
interface AutoDevConfig {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Auto.dev Listings Response Structure
 */
interface AutoDevListing {
  id?: string;
  price?: number;
  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
  };
  retailListing?: {
    miles?: number;
    price?: number;
    city?: string;
    state?: string;
    zip?: string;
    dealer?: string;
  };
  [key: string]: any;
}

interface AutoDevListingsResponse {
  listings?: AutoDevListing[];
  results?: AutoDevListing[];
  data?: AutoDevListing[];
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
 * Parse model names with embedded variants/trims
 * Many vehicles have trim designations embedded in the model name from VIN decode:
 * - "RX 450h" -> model: "RX", trim: "450h" (Lexus hybrid)
 * - "Camry Hybrid" -> model: "Camry", trim: "Hybrid" (Toyota hybrid)
 * - "Model 3" -> model: "Model 3" (Tesla, keep as-is)
 * - "F-150" -> model: "F-150" (Ford truck, keep as-is)
 */
function parseModelNameVariants(modelName: string, existingTrim?: string): { model: string; trim?: string } {
  if (!modelName) {
    return { model: modelName };
  }
  
  // If we already have a trim, don't try to parse one from the model name
  if (existingTrim) {
    return { model: modelName, trim: existingTrim };
  }
  
  // Patterns for hybrid/electric variants embedded in model names
  // Order matters: more specific patterns first
  const variantPatterns: Array<{ regex: RegExp; description: string }> = [
    // Lexus hybrid pattern: "RX 450h", "ES 300h", "NX 450h+", "LC 500h"
    { regex: /^([A-Z]{2,3})\s+(\d{3}h\+?)$/i, description: 'Lexus hybrid (RX 450h)' },
    
    // General hybrid pattern with "h" suffix: "Accord 2.0h", "Sonata 2.5h"
    { regex: /^(.+?)\s+(\d+\.?\d*h)$/i, description: 'Numeric hybrid trim' },
    
    // "Hybrid" suffix: "Camry Hybrid", "Accord Hybrid", "Highlander Hybrid"
    { regex: /^(.+?)\s+(Hybrid)$/i, description: 'Hybrid suffix' },
    
    // Plug-in hybrid: "Prius Prime", "RAV4 Prime"
    { regex: /^(.+?)\s+(Prime)$/i, description: 'Prime (PHEV)' },
    
    // Electric variants: "PHEV", "EV", "Electric"
    { regex: /^(.+?)\s+(PHEV|BEV|EV|Electric)$/i, description: 'Electric variant' },
    
    // Audi e-tron variants: "Q4 e-tron", "e-tron GT"
    { regex: /^(.+?)\s+(e-tron(?:\s+GT)?)$/i, description: 'Audi e-tron' },
    
    // BMW i variants: "X3 xDrive30e", "330e"
    { regex: /^(.+?)\s+(xDrive\d+e|\d+e)$/i, description: 'BMW plug-in hybrid' },
    
    // Mercedes EQ variants: "EQS 450+", "EQE 350"
    { regex: /^(EQ[A-Z])\s+(\d+\+?)$/i, description: 'Mercedes EQ' },
  ];
  
  for (const pattern of variantPatterns) {
    const match = modelName.match(pattern.regex);
    if (match) {
      const parsedModel = match[1].trim();
      const parsedTrim = match[2].trim();
      console.log(`[Model Parser] Parsed "${modelName}" -> model: "${parsedModel}", trim: "${parsedTrim}" (${pattern.description})`);
      return { model: parsedModel, trim: parsedTrim };
    }
  }
  
  // No variant pattern matched, return as-is
  return { model: modelName };
}


/**
 * Fetch vehicle listings from Auto.dev Listings API
 */
async function fetchFromAutoDevListingsAPI(
  filters: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    mileage?: number;
  },
  apiKey: string,
  apiUrl: string
): Promise<AutoDevListing[]> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.year) {
      params.append('vehicle.year', filters.year.toString());
    }
    if (filters.make) {
      params.append('vehicle.make', filters.make);
    }
    
    // Parse model name to extract embedded trim/variant (e.g., "RX 450h" -> model: "RX", trim: "450h")
    let modelName = filters.model || '';
    let parsedTrim = filters.trim;
    
    if (filters.model) {
      // First, remove body style suffixes
      const bodyStyles = ['Coupe', 'Sedan', 'Hatchback', 'Wagon', 'SUV', 'Truck', 'Van', 'Convertible'];
      for (const style of bodyStyles) {
        if (modelName.endsWith(` ${style}`)) {
          modelName = modelName.replace(` ${style}`, '').trim();
          console.log('[Auto.dev Listings] Removed body style:', filters.model, '->', modelName);
          break;
        }
      }
      
      // Then, parse for hybrid/variant patterns
      const parsed = parseModelNameVariants(modelName, filters.trim);
      modelName = parsed.model;
      if (parsed.trim && !filters.trim) {
        parsedTrim = parsed.trim;
        console.log('[Auto.dev Listings] Extracted trim from model name:', filters.model, '-> model:', modelName, ', trim:', parsedTrim);
      }
      
      params.append('vehicle.model', modelName);
    }
    
    // Include trim in the query for hybrid/variant vehicles to get better matching
    // This is important for vehicles like "RX 450h" where the hybrid trim affects pricing significantly
    if (parsedTrim) {
      params.append('vehicle.trim', parsedTrim);
      console.log('[Auto.dev Listings] Including trim in query:', parsedTrim);
    }
    
    const url = `${apiUrl}/listings?${params.toString()}`;
    console.log('[Auto.dev Listings] ===== LISTINGS API CALL =====');
    console.log('[Auto.dev Listings] URL:', url);
    console.log('[Auto.dev Listings] Filters:', filters);
    console.log('[Auto.dev Listings] Query params:', params.toString());
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[Auto.dev Listings] Response status:', response.status);
    console.log('[Auto.dev Listings] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('[Auto.dev Listings] ===== API ERROR =====');
      console.error('[Auto.dev Listings] Status:', response.status);
      console.error('[Auto.dev Listings] Error data:', errorData);
      console.error('[Auto.dev Listings] Error text:', errorText);
      
      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        console.error('[Auto.dev Listings] API authentication failed. Check your API key.');
        return []; // Return empty array to allow analysis to continue
      }
      
      if (response.status === 429) {
        console.error('[Auto.dev Listings] API rate limit exceeded.');
        return []; // Return empty array to allow analysis to continue
      }
      
      console.error('[Auto.dev Listings] API error:', response.status, errorData);
      return [];
    }
    
    const data: AutoDevListingsResponse = await response.json();
    console.log('[Auto.dev Listings] ===== API RESPONSE =====');
    console.log('[Auto.dev Listings] Full response object:', JSON.stringify(data, null, 2));
    console.log('[Auto.dev Listings] Response keys:', Object.keys(data));
    console.log('[Auto.dev Listings] Listings array:', data.listings);
    console.log('[Auto.dev Listings] Results array:', data.results);
    console.log('[Auto.dev Listings] Data array:', data.data);
    console.log('[Auto.dev Listings] Pagination links:', {
      next: (data as any).links?.next,
      prev: (data as any).links?.prev,
      first: (data as any).links?.first
    });
    console.log('[Auto.dev Listings] Listings count:', {
      listings: data.listings?.length || 0,
      results: data.results?.length || 0,
      data: data.data?.length || 0,
      total: data.listings?.length || data.results?.length || data.data?.length || 0
    });
    
    // Handle different response structures
    let listings = data.listings || data.results || data.data || [];
    
    // If first page is empty but there's a "next" link, try fetching page 2
    if (listings.length === 0 && (data as any).links?.next) {
      console.log('[Auto.dev Listings] First page empty, trying page 2...');
      try {
        const nextPageUrl = (data as any).links.next;
        const nextResponse = await fetch(nextPageUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (nextResponse.ok) {
          const nextData: AutoDevListingsResponse = await nextResponse.json();
          const nextListings = nextData.listings || nextData.results || nextData.data || [];
          console.log('[Auto.dev Listings] Page 2 results:', nextListings.length, 'listings');
          listings = nextListings;
        }
      } catch (pageError) {
        console.warn('[Auto.dev Listings] Error fetching page 2:', pageError);
      }
    }
    console.log('[Auto.dev Listings] Extracted listings array:', listings);
    console.log('[Auto.dev Listings] Listings array length:', listings.length);
    console.log('[Auto.dev Listings] Is array:', Array.isArray(listings));
    
    if (listings.length > 0) {
      console.log('[Auto.dev Listings] First listing sample:', JSON.stringify(listings[0], null, 2));
      console.log('[Auto.dev Listings] First listing price:', {
        retailListingPrice: listings[0]?.retailListing?.price,
        directPrice: listings[0]?.price,
        allPriceFields: {
          price: listings[0]?.price,
          'retailListing.price': listings[0]?.retailListing?.price,
        }
      });
    }
    
    console.log('[Auto.dev Listings] ===== END API CALL =====');
    
    return Array.isArray(listings) ? listings : [];
  } catch (error: any) {
    console.error('[Auto.dev Listings] ===== FETCH ERROR =====');
    console.error('[Auto.dev Listings] Error:', error);
    console.error('[Auto.dev Listings] Error message:', error?.message);
    console.error('[Auto.dev Listings] Error stack:', error?.stack);
    console.error('[Auto.dev Listings] ===== END ERROR =====');
    return [];
  }
}

/**
 * Calculate average price from Auto.dev listings
 * If targetMileage is provided and we have enough listings, weights listings by mileage similarity
 */
function calculateAveragePriceFromListings(listings: AutoDevListing[], targetMileage?: number): number | null {
  if (!listings || listings.length === 0) {
    console.warn('[Auto.dev Listings] No listings provided for average calculation');
    return null;
  }
  
  // Collect valid listings with price and mileage
  interface ListingWithWeight {
    price: number;
    mileage?: number;
    weight: number;
  }
  
  const validListings: ListingWithWeight[] = [];
  
  for (const listing of listings) {
    // Try to get price from different possible locations
    const price = listing.retailListing?.price || listing.price;
    const mileage = listing.retailListing?.miles;
    
    // Validate price is a positive number
    if (price && typeof price === 'number' && price > 0 && price < 10000000) {
      validListings.push({
        price,
        mileage: mileage && typeof mileage === 'number' && mileage > 0 ? mileage : undefined,
        weight: 1 // Default weight
      });
    } else {
      console.warn('[Auto.dev Listings] Invalid price found:', { price, listing: listing.id || 'unknown' });
    }
  }
  
  if (validListings.length === 0) {
    console.warn('[Auto.dev Listings] No valid prices found in listings');
    return null;
  }
  
  // Apply mileage-based weighting if we have target mileage and enough listings
  const MIN_LISTINGS_FOR_WEIGHTING = 3;
  const shouldWeightByMileage = targetMileage && 
                                 targetMileage > 0 && 
                                 validListings.length >= MIN_LISTINGS_FOR_WEIGHTING &&
                                 validListings.some(l => l.mileage !== undefined);
  
  if (shouldWeightByMileage) {
    console.log('[Auto.dev Listings] Applying mileage-based weighting. Target mileage:', targetMileage);
    
    // Calculate weights based on mileage similarity
    // Weight decreases as mileage difference increases
    // Similar mileage (within 10k miles) gets weight 2.0
    // Within 25k miles gets weight 1.5
    // Within 50k miles gets weight 1.2
    // Beyond 50k miles gets weight 1.0
    const mileageRanges = [
      { maxDiff: 10000, weight: 2.0 },
      { maxDiff: 25000, weight: 1.5 },
      { maxDiff: 50000, weight: 1.2 },
      { maxDiff: Infinity, weight: 1.0 }
    ];
    
    for (const listing of validListings) {
      if (listing.mileage !== undefined) {
        const mileageDiff = Math.abs(listing.mileage - targetMileage);
        
        // Find appropriate weight based on mileage difference
        for (const range of mileageRanges) {
          if (mileageDiff <= range.maxDiff) {
            listing.weight = range.weight;
            break;
          }
        }
      }
      // If listing has no mileage, keep default weight of 1.0
    }
    
    // Calculate weighted average
    const totalWeight = validListings.reduce((sum, l) => sum + l.weight, 0);
    const weightedSum = validListings.reduce((sum, l) => sum + (l.price * l.weight), 0);
    const average = weightedSum / totalWeight;
    
    // Log weighting details
    const listingsWithMileage = validListings.filter(l => l.mileage !== undefined);
    const avgMileageDiff = listingsWithMileage.length > 0
      ? listingsWithMileage.reduce((sum, l) => sum + Math.abs((l.mileage || 0) - targetMileage!), 0) / listingsWithMileage.length
      : 0;
    
    console.log('[Auto.dev Listings] Mileage-weighted average calculated:', {
      average: Math.round(average),
      listingCount: validListings.length,
      listingsWithMileage: listingsWithMileage.length,
      averageMileageDifference: Math.round(avgMileageDiff),
      totalWeight,
      priceRange: {
        min: Math.min(...validListings.map(l => l.price)),
        max: Math.max(...validListings.map(l => l.price))
      },
      weightDistribution: {
        high: validListings.filter(l => l.weight >= 2.0).length,
        medium: validListings.filter(l => l.weight >= 1.5 && l.weight < 2.0).length,
        low: validListings.filter(l => l.weight < 1.5).length
      }
    });
    
    // Validate average is positive
    if (average <= 0 || !isFinite(average)) {
      console.error('[Auto.dev Listings] Invalid weighted average calculated:', average);
      // Fallback to simple average
      const simpleAverage = validListings.reduce((sum, l) => sum + l.price, 0) / validListings.length;
      return Math.round(simpleAverage);
    }
    
    return Math.round(average);
  } else {
    // Simple average (no mileage weighting)
    const average = validListings.reduce((sum, l) => sum + l.price, 0) / validListings.length;
    
    // Validate average is positive
    if (average <= 0 || !isFinite(average)) {
      console.error('[Auto.dev Listings] Invalid average calculated:', average);
      return null;
    }
    
    console.log('[Auto.dev Listings] Calculated simple average price (no mileage weighting):', {
      average: Math.round(average),
      listingCount: validListings.length,
      reason: !targetMileage ? 'No target mileage provided' : 
               validListings.length < MIN_LISTINGS_FOR_WEIGHTING ? `Less than ${MIN_LISTINGS_FOR_WEIGHTING} listings` :
               'No listings with mileage data',
      priceRange: {
        min: Math.min(...validListings.map(l => l.price)),
        max: Math.max(...validListings.map(l => l.price))
      }
    });
    
    return Math.round(average);
  }
}

/**
 * Client-side function to fetch Auto.dev listings via API route
 */
async function fetchAutoDevListingsViaAPI(
  year: number,
  make: string,
  model: string,
  trim?: string,
  mileage?: number
): Promise<{ 
  marketAverage: number; 
  priceRange: { min: number; max: number };
  rawListings?: Array<{
    price: number;
    mileage?: number;
    location?: { city?: string; state?: string; zip?: string };
    dealer?: string;
    listingType?: 'dealer' | 'private-party';
  }>;
} | null> {
  try {
    console.log('[Client] ===== fetchAutoDevListingsViaAPI START =====');
    console.log('[Client] Calling API route with:', { year, make, model, trim, mileage });
    
    const response = await fetch('/api/vehicle-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year,
        make,
        model,
        trim,
        mileage,
      }),
    });
    
    console.log('[Client] API route response status:', response.status);
    console.log('[Client] API route response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('[Client] ===== API ROUTE ERROR =====');
      console.error('[Client] Status:', response.status);
      console.error('[Client] Error data:', errorData);
      console.error('[Client] Error text:', errorText);
      console.error('[Client] ===== END ERROR =====');
      return null;
    }
    
    const data = await response.json();
    console.log('[Client] ===== API ROUTE RESPONSE =====');
    console.log('[Client] Full response object:', JSON.stringify(data, null, 2));
    console.log('[Client] Response keys:', Object.keys(data));
    console.log('[Client] Market average:', data.marketAverage);
    console.log('[Client] Price range:', data.priceRange);
    console.log('[Client] ===== END API ROUTE RESPONSE =====');
    return data;
  } catch (error: any) {
    console.error('[Client] ===== fetchAutoDevListingsViaAPI ERROR =====');
    console.error('[Client] Error:', error);
    console.error('[Client] Error message:', error?.message);
    console.error('[Client] Error stack:', error?.stack);
    console.error('[Client] ===== END ERROR =====');
    return null;
  }
}

export async function fetchAutoDevData(
  year: number,
  make: string,
  model: string,
  trim?: string,
  mileage?: number
): Promise<{ 
  marketAverage: number; 
  priceRange: { min: number; max: number };
  rawListings?: Array<{
    price: number;
    mileage?: number;
    location?: { city?: string; state?: string; zip?: string };
    dealer?: string;
    listingType?: 'dealer' | 'private-party';
  }>;
} | null> {
  try {
    console.log('[Auto.dev Listings] ===== fetchAutoDevData START =====');
    console.log('[Auto.dev Listings] Input:', { year, make, model, trim, mileage });
    
    // If running client-side, use API route (API key is server-side only)
    if (isClientSide()) {
      console.log('[Auto.dev Listings] Client-side call, using API route');
      const result = await fetchAutoDevListingsViaAPI(year, make, model, trim, mileage);
      console.log('[Auto.dev Listings] Client-side result:', result);
      return result;
    }
    
    // Server-side: Check API key configuration
    const config = getAutoDevConfig();
    console.log('[Auto.dev Listings] Server-side Config:', {
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length || 0,
      apiUrl: config.apiUrl
    });
    
    // If no API key configured, return null (fallback to other sources)
    if (!config.apiKey || !config.apiUrl) {
      console.warn('[Auto.dev Listings] API key not configured, skipping listings fetch');
      return null;
    }
    
    // Server-side: Fetch listings directly from Auto.dev
    console.log('[Auto.dev Listings] Server-side call, fetching directly from Auto.dev');
    
    // First, try to parse the model name to extract any embedded trim (e.g., "RX 450h")
    const parsed = parseModelNameVariants(model, trim);
    const effectiveTrim = parsed.trim || trim;
    const effectiveModel = parsed.model;
    
    if (parsed.trim && !trim) {
      console.log('[Auto.dev Listings] Parsed hybrid/variant model:', model, '-> model:', effectiveModel, ', trim:', effectiveTrim);
    }
    
    // First attempt: Try with the trim (important for hybrids like RX 450h)
    let listings = await fetchFromAutoDevListingsAPI(
      { year, make, model: effectiveModel, trim: effectiveTrim, mileage },
      config.apiKey,
      config.apiUrl
    );
    
    console.log('[Auto.dev Listings] First attempt (with trim) received listings:', {
      count: listings.length,
      trim: effectiveTrim,
      model: effectiveModel
    });
    
    // Fallback: If no results with trim, try without trim
    if (listings.length === 0 && effectiveTrim) {
      console.log('[Auto.dev Listings] No listings with trim, trying without trim...');
      listings = await fetchFromAutoDevListingsAPI(
        { year, make, model: effectiveModel, mileage },
        config.apiKey,
        config.apiUrl
      );
      console.log('[Auto.dev Listings] Fallback (no trim) received listings:', listings.length);
      
      // If we got results without trim, filter to prefer listings that match our trim
      if (listings.length > 0 && effectiveTrim) {
        const trimLower = effectiveTrim.toLowerCase();
        const trimMatchingListings = listings.filter(l => {
          const listingTrim = l.vehicle?.trim?.toLowerCase() || '';
          return listingTrim.includes(trimLower) || trimLower.includes(listingTrim);
        });
        
        if (trimMatchingListings.length >= 3) {
          console.log('[Auto.dev Listings] Filtered to trim-matching listings:', trimMatchingListings.length, 'of', listings.length);
          listings = trimMatchingListings;
        } else {
          console.log('[Auto.dev Listings] Not enough trim-matching listings, using all:', listings.length);
        }
      }
    }
    
    console.log('[Auto.dev Listings] Final listings count:', listings.length);
    if (listings.length > 0) {
      console.log('[Auto.dev Listings] Sample listings:', listings.slice(0, 3).map((l, i) => ({
        index: i,
        id: l.id,
        price: l.retailListing?.price || l.price,
        trim: l.vehicle?.trim,
        mileage: l.retailListing?.miles
      })));
    }
    
    if (listings.length === 0) {
      console.warn('[Auto.dev Listings] No listings found after all attempts');
      return null;
    }
    
    // Calculate average price (with mileage weighting if mileage is provided)
    console.log('[Auto.dev Listings] Calculating average price from', listings.length, 'listings', mileage ? `(target mileage: ${mileage})` : '');
    const averagePrice = calculateAveragePriceFromListings(listings, mileage);
    console.log('[Auto.dev Listings] Calculated average price:', averagePrice);
    
    if (!averagePrice) {
      console.warn('[Auto.dev Listings] Could not calculate average price from listings');
      return null;
    }
    
    // Calculate price range
    const prices = listings
      .map(listing => listing.retailListing?.price || listing.price)
      .filter((price): price is number => typeof price === 'number' && price > 0);
    
    console.log('[Auto.dev Listings] Extracted prices:', prices);
    
    if (prices.length === 0) {
      console.warn('[Auto.dev Listings] No valid prices found in listings');
      return null;
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Prepare raw listings for detailed analysis (paid tier)
    const rawListings = listings
      .map(listing => {
        const price = listing.retailListing?.price || listing.price;
        if (typeof price !== 'number' || price <= 0) return null;
        
        return {
          price,
          mileage: listing.retailListing?.miles,
          location: listing.retailListing ? {
            city: listing.retailListing.city,
            state: listing.retailListing.state,
            zip: listing.retailListing.zip,
          } : undefined,
          dealer: listing.retailListing?.dealer,
          listingType: listing.retailListing?.dealer ? 'dealer' as const : undefined,
        };
      })
      .filter((listing): listing is NonNullable<typeof listing> => listing !== null);
    
    const result = {
      marketAverage: averagePrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      rawListings: rawListings.length > 0 ? rawListings : undefined,
    };
    
    console.log('[Auto.dev Listings] Final result:', {
      ...result,
      rawListingsCount: rawListings.length
    });
    console.log('[Auto.dev Listings] ===== fetchAutoDevData END =====');
    
    return result;
  } catch (error) {
    console.error('[Auto.dev Listings] ===== fetchAutoDevData ERROR =====');
    console.error('[Auto.dev Listings] Error:', error);
    console.error('[Auto.dev Listings] Error message:', (error as any)?.message);
    console.error('[Auto.dev Listings] Error stack:', (error as any)?.stack);
    console.error('[Auto.dev Listings] ===== END ERROR =====');
    return null;
  }
}

/**
 * MarketCheck API Configuration
 */
interface MarketCheckConfig {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Get MarketCheck API configuration from environment variables
 * Note: MarketCheck migrated from marketcheck-prod.apigee.net to api.marketcheck.com in 2024
 * We always use the new URL regardless of environment variable to prevent using deprecated endpoints
 */
function getMarketCheckConfig(): MarketCheckConfig {
  // Always use the new MarketCheck API URL - the old apigee.net domain is deprecated
  const MARKETCHECK_V2_URL = 'https://api.marketcheck.com/v2';
  
  // Check if user has old deprecated URL configured and warn them
  const configuredUrl = process.env.MARKETCHECK_API_URL;
  if (configuredUrl && configuredUrl.includes('apigee.net')) {
    console.warn('[MarketCheck] Deprecated API URL detected in MARKETCHECK_API_URL. Using new URL:', MARKETCHECK_V2_URL);
  }
  
  return {
    apiKey: process.env.MARKETCHECK_API_KEY,
    apiUrl: MARKETCHECK_V2_URL,  // Always use new URL
  };
}

/**
 * MarketCheck v2 API Response for /sales/car
 * Returns sales statistics from the last 90 days
 * Documentation: https://docs.marketcheck.com
 */
interface MarketCheckSalesResponse {
  mean?: number;
  median?: number;
  count?: number;
  min?: number;
  max?: number;
  std_deviation?: number;
  price_range?: {
    min?: number;
    max?: number;
  };
  // Additional fields that might be returned
  [key: string]: any;
}

/**
 * MarketCheck v2 API Response for /search/car/active (fallback)
 * Documentation: https://docs.marketcheck.com
 */
interface MarketCheckV2Response {
  num_found?: number;
  listings?: Array<{
    id?: string;
    price?: number;
    miles?: number;
    city?: string;
    state?: string;
    dealer?: {
      name?: string;
      city?: string;
      state?: string;
    };
    build?: {
      year?: number;
      make?: string;
      model?: string;
      trim?: string;
    };
  }>;
  stats?: {
    price?: {
      mean?: number;
      median?: number;
      min?: number;
      max?: number;
      count?: number;
      std_deviation?: number;
    };
  };
  [key: string]: any;
}

/**
 * Fetch MarketCheck v2 API data using /sales/car endpoint (primary)
 * This provides actual sales statistics from the last 90 days - most accurate for market valuation
 * Falls back to /search/car/active if sales data isn't available
 */
async function fetchMarketCheckSalesStats(
  year: number,
  make: string,
  model: string,
  apiKey: string,
  apiUrl: string
): Promise<{ averagePrice: number; medianPrice: number; salesCount: number; priceRange?: { min: number; max: number } } | null> {
  try {
    // Clean up model name for MarketCheck API
    // Remove common suffixes and extra details that might not match API expectations
    let cleanModel = model;
    let parsedTrim: string | undefined;
    
    // Remove body style suffixes
    const bodyStyles = ['Coupe', 'Sedan', 'Hatchback', 'Wagon', 'SUV', 'Truck', 'Van', 'Convertible', 'DRW', 'SRW'];
    for (const style of bodyStyles) {
      if (cleanModel.endsWith(` ${style}`)) {
        cleanModel = cleanModel.replace(` ${style}`, '').trim();
      }
    }
    
    // For "Super Duty" models, simplify the model name
    if (cleanModel.includes('Super Duty')) {
      const superDutyMatch = cleanModel.match(/Super Duty\s+(.+)/i);
      if (superDutyMatch) {
        cleanModel = `Super Duty ${superDutyMatch[1].trim()}`;
      }
    }
    
    // Parse hybrid/variant model names (e.g., "RX 450h" -> model: "RX", trim: "450h")
    const parsed = parseModelNameVariants(cleanModel);
    if (parsed.trim) {
      cleanModel = parsed.model;
      parsedTrim = parsed.trim;
      console.log('[MarketCheck] Parsed hybrid/variant model:', model, '-> model:', cleanModel, ', trim:', parsedTrim);
    }
    
    console.log('[MarketCheck] Model name cleaned:', model, '->', cleanModel, parsedTrim ? `(trim: ${parsedTrim})` : '');
    
    // STEP 1: Try /v2/sales/car endpoint first (actual sales data from last 90 days)
    const salesParams = new URLSearchParams({
      api_key: apiKey,
      year: year.toString(),
      make: make,
      model: cleanModel,
    });
    
    // Add trim parameter for hybrids/variants to get more accurate pricing
    if (parsedTrim) {
      salesParams.append('trim', parsedTrim);
    }
    
    const salesUrl = `${apiUrl}/sales/car?${salesParams.toString()}`;
    console.log('[MarketCheck] Fetching sales stats from /v2/sales/car:', salesUrl.replace(apiKey, '***'));
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const salesResponse = await fetch(salesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (salesResponse.ok) {
        const salesText = await salesResponse.text();
        let salesData: MarketCheckSalesResponse;
        
        try {
          salesData = JSON.parse(salesText);
          console.log('[MarketCheck] /v2/sales/car response:', salesData);
          
          // Check if we got valid sales data
          if (salesData.mean || salesData.median) {
            const result = {
              averagePrice: Math.round(salesData.mean || salesData.median || 0),
              medianPrice: Math.round(salesData.median || salesData.mean || 0),
              salesCount: salesData.count || 0,
              priceRange: (salesData.min && salesData.max) ? {
                min: Math.round(salesData.min),
                max: Math.round(salesData.max)
              } : (salesData.price_range?.min && salesData.price_range?.max) ? {
                min: Math.round(salesData.price_range.min),
                max: Math.round(salesData.price_range.max)
              } : undefined
            };
            
            console.log('[MarketCheck] Sales stats (90-day actual sales):', result);
            return result;
          }
        } catch (parseError) {
          console.warn('[MarketCheck] Failed to parse /v2/sales/car response:', salesText.substring(0, 200));
        }
      } else {
        const errorText = await salesResponse.text().catch(() => '');
        console.log('[MarketCheck] /v2/sales/car returned:', salesResponse.status, errorText.substring(0, 100));
      }
    } catch (salesError: any) {
      console.warn('[MarketCheck] /v2/sales/car fetch error:', salesError.message);
    }
    
    // STEP 2: Fallback to active listings (dealer + private party in parallel)
    console.log('[MarketCheck] Falling back to active listings (dealer + FSBO)...');
    
    const baseSearchParams: Record<string, string> = {
      api_key: apiKey,
      year: year.toString(),
      make: make.toLowerCase(),
      model: cleanModel.toLowerCase(),
      start: '0',
      rows: '50',
      stats: 'price',
    };
    
    // Add trim parameter for hybrids/variants
    if (parsedTrim) {
      baseSearchParams.trim = parsedTrim.toLowerCase();
    }
    
    // Fetch dealer listings and private party (FSBO) listings in parallel
    const dealerUrl = `${apiUrl}/search/car/active?${new URLSearchParams(baseSearchParams).toString()}`;
    const fsboUrl = `${apiUrl}/search/car/fsbo/active?${new URLSearchParams(baseSearchParams).toString()}`;
    
    console.log('[MarketCheck] Fetching dealer listings:', dealerUrl.replace(apiKey, '***'));
    console.log('[MarketCheck] Fetching FSBO listings:', fsboUrl.replace(apiKey, '***'));
    
    // Helper function to fetch and parse listings
    const fetchListings = async (url: string, source: string): Promise<{ prices: number[]; count: number; stats?: { mean?: number; median?: number; min?: number; max?: number } } | null> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`[MarketCheck] ${source} error:`, response.status);
          return null;
        }
        
        const text = await response.text();
        const data: MarketCheckV2Response = JSON.parse(text);
        
        console.log(`[MarketCheck] ${source} response:`, {
          num_found: data.num_found,
          listingsCount: data.listings?.length || 0,
          hasStats: !!data.stats?.price,
        });
        
        const prices = (data.listings || [])
          .map(l => l.price)
          .filter((p): p is number => typeof p === 'number' && p > 0);
        
        return {
          prices,
          count: data.num_found || prices.length,
          stats: data.stats?.price ? {
            mean: data.stats.price.mean,
            median: data.stats.price.median,
            min: data.stats.price.min,
            max: data.stats.price.max,
          } : undefined
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.warn(`[MarketCheck] ${source} fetch error:`, error.message);
        return null;
      }
    };
    
    // Fetch both in parallel
    const [dealerData, fsboData] = await Promise.all([
      fetchListings(dealerUrl, 'Dealer listings'),
      fetchListings(fsboUrl, 'FSBO (private party) listings'),
    ]);
    
    // Combine prices from both sources
    const allPrices: number[] = [];
    let totalCount = 0;
    
    if (dealerData) {
      allPrices.push(...dealerData.prices);
      totalCount += dealerData.count;
    }
    if (fsboData) {
      allPrices.push(...fsboData.prices);
      totalCount += fsboData.count;
    }
    
    console.log('[MarketCheck] Combined results:', {
      dealerPrices: dealerData?.prices.length || 0,
      fsboPrices: fsboData?.prices.length || 0,
      totalPrices: allPrices.length,
      totalCount,
    });
    
    // If we have API stats from either source, prefer those
    const bestStats = dealerData?.stats || fsboData?.stats;
    if (bestStats?.mean) {
      const result = {
        averagePrice: Math.round(bestStats.mean || 0),
        medianPrice: Math.round(bestStats.median || bestStats.mean || 0),
        salesCount: totalCount,
        priceRange: (bestStats.min && bestStats.max) ? {
          min: Math.round(bestStats.min),
          max: Math.round(bestStats.max)
        } : undefined
      };
      
      console.log('[MarketCheck] Price stats from API:', result);
      return result;
    }
    
    // Calculate stats from combined listings
    if (allPrices.length > 0) {
      allPrices.sort((a, b) => a - b);
      const sum = allPrices.reduce((acc, p) => acc + p, 0);
      const mean = sum / allPrices.length;
      const mid = Math.floor(allPrices.length / 2);
      const median = allPrices.length % 2 === 0
        ? (allPrices[mid - 1] + allPrices[mid]) / 2
        : allPrices[mid];
      
      const result = {
        averagePrice: Math.round(mean),
        medianPrice: Math.round(median),
        salesCount: totalCount,
        priceRange: {
          min: Math.round(allPrices[0]),
          max: Math.round(allPrices[allPrices.length - 1])
        }
      };
      
      console.log('[MarketCheck] Calculated stats from dealer + FSBO listings:', result);
      return result;
    }
    
    console.log('[MarketCheck] No usable data from any endpoint');
    return null;
    
  } catch (error: any) {
    // Handle errors gracefully
    if (error.message?.includes('DNS') || error.message?.includes('timeout') || error.message?.includes('network')) {
      console.error('[MarketCheck] Network error:', error.message);
    } else {
      console.error('[MarketCheck] API error:', error);
    }
    return null;
  }
}

/**
 * Fetch MarketCheck data (Sales Stats API as backup when Auto.dev has no listings)
 */
export async function fetchMarketCheckData(
  year: number,
  make: string,
  model: string,
  mileage?: number,
  useAsBackup: boolean = false // When true, only fetch if Auto.dev failed
): Promise<{ competitivePrice?: number; daysToPriceImprovement?: number; salesStats?: { averagePrice: number; medianPrice: number; salesCount: number; priceRange?: { min: number; max: number } } } | null> {
  try {
    // If running client-side, route through API route
    if (isClientSide()) {
      console.log('[MarketCheck] Client-side call, routing through API route');
      const response = await fetch('/api/marketcheck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, make, model, mileage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[MarketCheck] API route error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      console.log('[MarketCheck] Received data from API route:', {
        hasSalesStats: !!data.salesStats,
        averagePrice: data.salesStats?.averagePrice
      });
      return data;
    }
    
    // Server-side: Check API key configuration
    const config = getMarketCheckConfig();
    
    // Log API key configuration status (without exposing the key)
    console.log('[MarketCheck] Configuration check:', {
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length || 0,
      apiUrl: config.apiUrl,
      isClientSide: isClientSide()
    });
    
    // Check if API key is configured
    if (!config.apiKey || !config.apiUrl) {
      console.warn('[MarketCheck] API key not configured. Set MARKETCHECK_API_KEY in .env.local');
      return null;
    }
    
    // Fetch Sales Stats from MarketCheck (server-side)
    const salesStats = await fetchMarketCheckSalesStats(year, make, model, config.apiKey, config.apiUrl);
    
    if (!salesStats || salesStats.averagePrice === 0) {
      console.log('[MarketCheck] No sales stats available');
      return null;
    }
    
    return {
      salesStats: {
        averagePrice: salesStats.averagePrice,
        medianPrice: salesStats.medianPrice,
        salesCount: salesStats.salesCount,
        priceRange: salesStats.priceRange
      }
    };
  } catch (error: any) {
    console.error('[MarketCheck] API error:', error);
    return null;
  }
}

export async function fetchAllMarketData(
  year: number,
  make: string,
  model: string,
  mileage?: number,
  tier: 'free' | 'paid' = 'free',
  trim?: string
): Promise<MarketListingsData> {
  const data: MarketListingsData = {};
  
  // Fetch from both sources in parallel for more accurate market value comparison
  // Auto.dev provides current listings, MarketCheck provides actual sales data
  console.log('[Market Data] Fetching from Auto.dev and MarketCheck in parallel...');
  
  const [autoDev, marketCheck] = await Promise.all([
    // Auto.dev listings (real market data from actual listings)
    fetchAutoDevData(year, make, model, trim, mileage).catch((err) => {
      console.warn('[Market Data] Auto.dev fetch failed:', err?.message || 'Unknown error');
      return null;
    }),
    // MarketCheck Sales Stats (actual recent sales data)
    fetchMarketCheckData(year, make, model, mileage, false).catch((err) => {
      console.warn('[Market Data] MarketCheck fetch failed:', err?.message || 'Unknown error');
      return null;
    })
  ]);
  
  if (autoDev && autoDev.marketAverage > 0) {
    data.autoDev = autoDev;
    console.log('[Market Data] Auto.dev listings found:', {
      marketAverage: autoDev.marketAverage,
      listingsCount: autoDev.rawListings?.length || 0
    });
  } else {
    console.log('[Market Data] Auto.dev returned no listings');
  }
  
  if (marketCheck) {
    data.marketCheck = marketCheck;
    console.log('[Market Data] MarketCheck data retrieved:', {
      hasSalesStats: !!marketCheck.salesStats,
      averagePrice: marketCheck.salesStats?.averagePrice,
      salesCount: marketCheck.salesStats?.salesCount
    });
  } else {
    console.log('[Market Data] MarketCheck returned no data');
  }
  
  console.log('[Market Data] All sources fetched:', {
    hasAutoDev: !!data.autoDev,
    autoDevValue: data.autoDev?.marketAverage,
    hasMarketCheck: !!data.marketCheck,
    marketCheckSalesStats: !!data.marketCheck?.salesStats,
    marketCheckAveragePrice: data.marketCheck?.salesStats?.averagePrice
  });
  
  return data;
}

export function calculateAverageMarketValue(data: MarketListingsData): number {
  console.log('[Market Value] ===== CALCULATING AVERAGE MARKET VALUE =====');
  console.log('[Market Value] Input data:', {
    hasAutoDev: !!data.autoDev?.marketAverage,
    autoDevValue: data.autoDev?.marketAverage,
    autoDevListingsCount: data.autoDev?.rawListings?.length || 0,
    hasMarketCheck: !!data.marketCheck,
    marketCheckSalesStats: !!data.marketCheck?.salesStats,
    marketCheckAveragePrice: data.marketCheck?.salesStats?.averagePrice,
    marketCheckSalesCount: data.marketCheck?.salesStats?.salesCount,
  });
  
  const autoDevValue = data.autoDev?.marketAverage && data.autoDev.marketAverage > 0 
    ? data.autoDev.marketAverage 
    : null;
  const autoDevCount = data.autoDev?.rawListings?.length || 0;
  
  const marketCheckValue = data.marketCheck?.salesStats?.averagePrice && data.marketCheck.salesStats.averagePrice > 0
    ? data.marketCheck.salesStats.averagePrice
    : null;
  const marketCheckCount = data.marketCheck?.salesStats?.salesCount || 0;
  
  // Also check for competitivePrice as fallback
  const competitivePrice = data.marketCheck?.competitivePrice && data.marketCheck.competitivePrice > 0
    ? data.marketCheck.competitivePrice
    : null;
  
  console.log('[Market Value] Extracted values:', {
    autoDevValue,
    autoDevCount,
    marketCheckValue,
    marketCheckCount,
    competitivePrice
  });
  
  // Case 1: We have both Auto.dev and MarketCheck data
  if (autoDevValue && marketCheckValue) {
    const discrepancy = Math.abs(autoDevValue - marketCheckValue) / Math.max(autoDevValue, marketCheckValue);
    console.log('[Market Value] Both sources available, discrepancy:', (discrepancy * 100).toFixed(1) + '%');
    
    // If there's a large discrepancy (>30%), use dynamic weighting based on data quality
    if (discrepancy > 0.30) {
      console.log('[Market Value] Large discrepancy detected - using dynamic weighting');
      
      // If MarketCheck has more sales data points, trust it more
      // Auto.dev listings are current for-sale inventory; MarketCheck has actual sales history
      if (marketCheckCount > autoDevCount * 2) {
        // MarketCheck has significantly more data - weight it higher
        const result = Math.round((autoDevValue * 0.3) + (marketCheckValue * 0.7));
        console.log('[Market Value] MarketCheck has more data, using 30/70 weighting:', {
          autoDevValue,
          marketCheckValue,
          result
        });
        console.log('[Market Value] ===== FINAL RESULT (MarketCheck-weighted):', result, '=====');
        return result;
      } else if (autoDevCount > marketCheckCount * 2) {
        // Auto.dev has significantly more data - weight it higher
        const result = Math.round((autoDevValue * 0.7) + (marketCheckValue * 0.3));
        console.log('[Market Value] Auto.dev has more data, using 70/30 weighting:', {
          autoDevValue,
          marketCheckValue,
          result
        });
        console.log('[Market Value] ===== FINAL RESULT (Auto.dev-weighted):', result, '=====');
        return result;
      } else {
        // Similar data counts with large discrepancy - use 50/50 split
        const result = Math.round((autoDevValue + marketCheckValue) / 2);
        console.log('[Market Value] Similar data counts, using 50/50 average:', {
          autoDevValue,
          marketCheckValue,
          result
        });
        console.log('[Market Value] ===== FINAL RESULT (equal average):', result, '=====');
        return result;
      }
    } else {
      // Small discrepancy - use balanced 50/50 average since both sources agree
      const result = Math.round((autoDevValue + marketCheckValue) / 2);
      console.log('[Market Value] Sources agree (small discrepancy), using 50/50 average:', {
        autoDevValue,
        marketCheckValue,
        result
      });
      console.log('[Market Value] ===== FINAL RESULT (balanced):', result, '=====');
      return result;
    }
  }
  
  // Case 2: Only Auto.dev data available
  if (autoDevValue) {
    console.log('[Market Value] Using Auto.dev value only (no MarketCheck):', autoDevValue);
    console.log('[Market Value] ===== FINAL RESULT (Auto.dev only):', Math.round(autoDevValue), '=====');
    return Math.round(autoDevValue);
  }
  
  // Case 3: Only MarketCheck data available
  if (marketCheckValue) {
    console.log('[Market Value] Using MarketCheck value only (no Auto.dev):', marketCheckValue);
    console.log('[Market Value] Sales count:', marketCheckCount);
    console.log('[Market Value] ===== FINAL RESULT (MarketCheck only):', Math.round(marketCheckValue), '=====');
    return Math.round(marketCheckValue);
  }
  
  // Case 4: Only competitive price available
  if (competitivePrice) {
    console.log('[Market Value] Using competitive price as fallback:', competitivePrice);
    console.log('[Market Value] ===== FINAL RESULT (competitive price):', Math.round(competitivePrice), '=====');
    return Math.round(competitivePrice);
  }
  
  // No market data available
  console.warn('[Market Value] No market data available from any source');
  return 0;
}
