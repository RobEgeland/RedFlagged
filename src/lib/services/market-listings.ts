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
    // Note: We don't include trim or exact mileage as they're too restrictive
    // Auto.dev will return listings that match year/make/model, and we'll filter/average them
    const params = new URLSearchParams();
    
    if (filters.year) {
      params.append('vehicle.year', filters.year.toString());
    }
    if (filters.make) {
      params.append('vehicle.make', filters.make);
    }
    if (filters.model) {
      // Clean up model name - remove body style suffixes that might not match
      // e.g., "Civic Coupe" -> "Civic", "Accord Sedan" -> "Accord"
      let modelName = filters.model;
      const bodyStyles = ['Coupe', 'Sedan', 'Hatchback', 'Wagon', 'SUV', 'Truck', 'Van', 'Convertible'];
      for (const style of bodyStyles) {
        if (modelName.endsWith(` ${style}`)) {
          modelName = modelName.replace(` ${style}`, '').trim();
          console.log('[Auto.dev Listings] Simplified model name:', filters.model, '->', modelName);
          break;
        }
      }
      params.append('vehicle.model', modelName);
    }
    // Skip trim - too specific and may not match listings
    // Skip exact mileage - too restrictive, we'll calculate average from all matching listings
    
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
          'vehicle.price': listings[0]?.vehicle?.price
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
    const listings = await fetchFromAutoDevListingsAPI(
      { year, make, model, trim, mileage },
      config.apiKey,
      config.apiUrl
    );
    
    console.log('[Auto.dev Listings] Received listings:', {
      count: listings.length,
      listings: listings.map((l, i) => ({
        index: i,
        id: l.id,
        price: l.price,
        retailListingPrice: l.retailListing?.price,
        vehicle: l.vehicle
      }))
    });
    
    if (listings.length === 0) {
      console.warn('[Auto.dev Listings] No listings found');
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
 */
function getMarketCheckConfig(): MarketCheckConfig {
  return {
    apiKey: process.env.MARKETCHECK_API_KEY,
    apiUrl: process.env.MARKETCHECK_API_URL || 'https://marketcheck-prod.apigee.net/v1',
  };
}

/**
 * MarketCheck Sales Stats API Response
 */
interface MarketCheckSalesStatsResponse {
  sales_stats?: {
    avg_price?: number;
    median_price?: number;
    sales_count?: number;
    min_price?: number;
    max_price?: number;
  };
  [key: string]: any;
}

/**
 * Fetch MarketCheck Sales Stats API data
 * This provides inferred sales figures over the past 90 days as a backup when Auto.dev has no listings
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
    
    // Remove body style suffixes
    const bodyStyles = ['Coupe', 'Sedan', 'Hatchback', 'Wagon', 'SUV', 'Truck', 'Van', 'Convertible', 'DRW', 'SRW'];
    for (const style of bodyStyles) {
      if (cleanModel.endsWith(` ${style}`)) {
        cleanModel = cleanModel.replace(` ${style}`, '').trim();
      }
    }
    
    // For "Super Duty" models, try both with and without "Super Duty"
    // MarketCheck might expect just "F-350" or "Super Duty"
    if (cleanModel.includes('Super Duty')) {
      // Try with "Super Duty" first, then fallback to just the model number
      const superDutyMatch = cleanModel.match(/Super Duty\s+(.+)/i);
      if (superDutyMatch) {
        cleanModel = `Super Duty ${superDutyMatch[1].trim()}`;
      }
    }
    
    console.log('[MarketCheck] Model name cleaned:', model, '->', cleanModel);
    
    // MarketCheck Sales Stats API endpoint
    // Documentation: https://docs.marketcheck.com/docs/api/cars/market/sales-stats
    const params = new URLSearchParams({
      year: year.toString(),
      make: make,
      model: cleanModel,
      api_key: apiKey,
    });
    
    const url = `${apiUrl}/stats/cars/sales_stats?${params.toString()}`;
    console.log('[MarketCheck] Fetching sales stats from:', url.replace(apiKey, '***'));
    
    // Add timeout to fetch to help with DNS issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('[MarketCheck] Sales Stats API error:', response.status, response.statusText);
        return null;
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if it's a DNS/network error
      if (fetchError.name === 'AbortError') {
        console.error('[MarketCheck] Request timeout - DNS or network issue');
        throw new Error('MarketCheck API request timed out - possible DNS or network connectivity issue');
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.message?.includes('getaddrinfo')) {
        console.error('[MarketCheck] DNS resolution failed:', fetchError.message);
        throw new Error('MarketCheck API DNS resolution failed - check network connectivity');
      }
      throw fetchError;
    }
    
    const responseText = await response.text();
    let data: MarketCheckSalesStatsResponse;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[MarketCheck] Failed to parse response:', responseText.substring(0, 200));
      return null;
    }
    
    if (!data.sales_stats || !data.sales_stats.avg_price) {
      console.log('[MarketCheck] No sales stats data available');
      return null;
    }
    
    const stats = data.sales_stats;
    const result = {
      averagePrice: Math.round(stats.avg_price || 0),
      medianPrice: Math.round(stats.median_price || stats.avg_price || 0),
      salesCount: stats.sales_count || 0,
      priceRange: (stats.min_price && stats.max_price) ? {
        min: Math.round(stats.min_price),
        max: Math.round(stats.max_price)
      } : undefined
    };
    
    console.log('[MarketCheck] Sales stats retrieved:', {
      averagePrice: result.averagePrice,
      medianPrice: result.medianPrice,
      salesCount: result.salesCount,
      priceRange: result.priceRange
    });
    
    return result;
  } catch (error: any) {
    // Re-throw DNS/network errors so they can be handled upstream
    if (error.message?.includes('DNS') || error.message?.includes('timeout') || error.message?.includes('network')) {
      throw error;
    }
    console.error('[MarketCheck] Sales Stats API error:', error);
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
  
  // Fetch Auto.dev listings (real market data from actual listings)
  const autoDev = await fetchAutoDevData(year, make, model, trim, mileage);
  if (autoDev && autoDev.marketAverage > 0) {
    data.autoDev = autoDev;
    console.log('[Market Data] Auto.dev listings found:', autoDev.marketAverage);
  } else {
    console.log('[Market Data] Auto.dev returned no listings, will use MarketCheck as backup');
  }
  
  // Use MarketCheck Sales Stats as backup when Auto.dev has no listings
  // Also available for paid tier even if Auto.dev has data (for additional insights)
  const shouldFetchMarketCheck = !data.autoDev || tier === 'paid';
  
  if (shouldFetchMarketCheck) {
    try {
      const marketCheck = await fetchMarketCheckData(year, make, model, mileage, !data.autoDev);
      if (marketCheck) {
        data.marketCheck = marketCheck;
        console.log('[Market Data] MarketCheck data retrieved:', {
          hasSalesStats: !!marketCheck.salesStats,
          averagePrice: marketCheck.salesStats?.averagePrice
        });
      }
    } catch (error: any) {
      // MarketCheck is optional - failures (e.g., DNS issues) shouldn't break the analysis
      // Auto.dev data is sufficient for market pricing analysis
      console.warn('[Market Data] MarketCheck fetch failed (non-critical):', error?.message || 'Unknown error');
      console.log('[Market Data] Continuing with Auto.dev data only');
    }
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
    hasMarketCheck: !!data.marketCheck,
    marketCheckSalesStats: !!data.marketCheck?.salesStats,
    marketCheckAveragePrice: data.marketCheck?.salesStats?.averagePrice,
  });
  
  const values: number[] = [];
  
  // Prioritize Auto.dev listings average if available (most accurate from real listings)
  if (data.autoDev?.marketAverage && data.autoDev.marketAverage > 0) {
    values.push(data.autoDev.marketAverage);
    console.log('[Market Value] Added Auto.dev value:', data.autoDev.marketAverage);
  }
  
  // Add MarketCheck Sales Stats as backup (when Auto.dev has no listings) or additional source
  if (data.marketCheck?.salesStats?.averagePrice && data.marketCheck.salesStats.averagePrice > 0) {
    values.push(data.marketCheck.salesStats.averagePrice);
    console.log('[Market Value] Added MarketCheck Sales Stats average price:', data.marketCheck.salesStats.averagePrice);
  }
  
  // Legacy: Also check for competitivePrice if it exists
  if (data.marketCheck?.competitivePrice && data.marketCheck.competitivePrice > 0) {
    values.push(data.marketCheck.competitivePrice);
    console.log('[Market Value] Added MarketCheck competitive price:', data.marketCheck.competitivePrice);
  }
  
  console.log('[Market Value] All values collected:', values);
  
  if (values.length === 0) {
    console.warn('[Market Value] No valid market values found');
    return 0;
  }
  
  // Validate all values are positive
  const invalidValues = values.filter(v => v <= 0 || !isFinite(v));
  if (invalidValues.length > 0) {
    console.error('[Market Value] Invalid values found:', invalidValues);
    // Remove invalid values
    const validValues = values.filter(v => v > 0 && isFinite(v));
    if (validValues.length === 0) return 0;
    values.splice(0, values.length, ...validValues);
    console.log('[Market Value] After filtering invalid values:', values);
  }
  
  // If we have Auto.dev data from real listings, use weighted average if other sources available
  // Auto.dev listings are actual market prices (most accurate)
  if (data.autoDev?.marketAverage && data.autoDev.marketAverage > 0) {
    const autoDevValue = data.autoDev.marketAverage;
    const otherValues = values.filter(v => v !== autoDevValue && v > 0);
    
    if (otherValues.length > 0) {
      // Use weighted average: 80% Auto.dev (real listings), 20% other sources
      const otherAverage = otherValues.reduce((a, b) => a + b, 0) / otherValues.length;
      const result = Math.round((autoDevValue * 0.8) + (otherAverage * 0.2));
      
      console.log('[Market Value] Weighted calculation (80% Auto.dev, 20% other sources):', {
        autoDevValue,
        otherAverage,
        otherSourcesCount: otherValues.length,
        result
      });
      
      if (result <= 0) {
        console.error('[Market Value] Calculated negative or zero result:', result);
        return Math.round(autoDevValue); // Fallback to Auto.dev only
      }
      
      console.log('[Market Value] ===== FINAL RESULT (weighted):', result, '=====');
      return result;
    } else {
      // Only Auto.dev available, use it directly
      console.log('[Market Value] Using Auto.dev value only (no other sources):', autoDevValue);
      console.log('[Market Value] ===== FINAL RESULT (Auto.dev only):', Math.round(autoDevValue), '=====');
      return Math.round(autoDevValue);
    }
  }
  
  // Fallback: If Auto.dev has no listings, use MarketCheck Sales Stats
  if (data.marketCheck?.salesStats?.averagePrice && data.marketCheck.salesStats.averagePrice > 0) {
    const marketCheckValue = data.marketCheck.salesStats.averagePrice;
    console.log('[Market Value] Auto.dev has no listings, using MarketCheck Sales Stats as backup');
    console.log('[Market Value] MarketCheck average price:', marketCheckValue);
    console.log('[Market Value] Sales count:', data.marketCheck.salesStats.salesCount);
    console.log('[Market Value] ===== FINAL RESULT (MarketCheck backup):', Math.round(marketCheckValue), '=====');
    return Math.round(marketCheckValue);
  }
  
  // Simple average if we have multiple values but no Auto.dev
  if (values.length > 0) {
    const result = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    console.log('[Market Value] Simple average calculation:', {
      sum: values.reduce((a, b) => a + b, 0),
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      rounded: result,
    });
    if (result <= 0) {
      console.error('[Market Value] Calculated negative or zero result:', result);
      return 0;
    }
    console.log('[Market Value] ===== FINAL RESULT (simple):', result, '=====');
    return result;
  }
  
  // No market data available
  console.warn('[Market Value] No market data available from any source');
  return 0;
}
