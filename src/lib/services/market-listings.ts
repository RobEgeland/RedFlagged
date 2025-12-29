import { MarketListingsData } from '@/types/vehicle';

/**
 * Market Listings Data Services
 * Free: Edmunds API, Kelley Blue Book, limited Auto.dev calls
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

export async function fetchEdmundsData(
  year: number,
  make: string,
  model: string,
  mileage?: number
): Promise<{ trueMarketValue: number; retailPrice: number } | null> {
  try {
    // TODO: Integrate with Edmunds API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const baseValue = 25000;
    const ageDepreciation = (new Date().getFullYear() - year) * 0.1;
    const mileageDepreciation = mileage ? (mileage / 100000) * 0.15 : 0;
    
    const tmv = Math.round(baseValue * (1 - ageDepreciation - mileageDepreciation));
    
    return {
      trueMarketValue: tmv,
      retailPrice: Math.round(tmv * 1.08)
    };
  } catch (error) {
    console.error('Edmunds API error:', error);
    return null;
  }
}

export async function fetchKelleyBlueBookData(
  year: number,
  make: string,
  model: string,
  mileage?: number
): Promise<{ fairPurchasePrice: number; typicalListingPrice: number } | null> {
  try {
    // TODO: Integrate with KBB API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const baseValue = 24500;
    const ageDepreciation = (new Date().getFullYear() - year) * 0.1;
    const mileageDepreciation = mileage ? (mileage / 100000) * 0.15 : 0;
    
    const fpp = Math.round(baseValue * (1 - ageDepreciation - mileageDepreciation));
    
    return {
      fairPurchasePrice: fpp,
      typicalListingPrice: Math.round(fpp * 1.12)
    };
  } catch (error) {
    console.error('KBB API error:', error);
    return null;
  }
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
    if (filters.model) {
      params.append('vehicle.model', filters.model);
    }
    if (filters.trim) {
      params.append('vehicle.trim', filters.trim);
    }
    if (filters.mileage) {
      params.append('retailListing.miles', filters.mileage.toString());
    }
    
    const url = `${apiUrl}/listings?${params.toString()}`;
    console.log('[Auto.dev Listings] Fetching listings:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[Auto.dev Listings] Response status:', response.status);
    
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
    console.log('[Auto.dev Listings] Received data:', {
      listingsCount: data.listings?.length || data.results?.length || data.data?.length || 0,
      hasListings: !!(data.listings || data.results || data.data)
    });
    
    // Handle different response structures
    const listings = data.listings || data.results || data.data || [];
    
    return Array.isArray(listings) ? listings : [];
  } catch (error: any) {
    console.error('[Auto.dev Listings] Fetch error:', error);
    return [];
  }
}

/**
 * Calculate average price from Auto.dev listings
 */
function calculateAveragePriceFromListings(listings: AutoDevListing[]): number | null {
  if (!listings || listings.length === 0) {
    return null;
  }
  
  const prices: number[] = [];
  
  for (const listing of listings) {
    // Try to get price from different possible locations
    const price = listing.retailListing?.price || listing.price;
    
    if (price && typeof price === 'number' && price > 0) {
      prices.push(price);
    }
  }
  
  if (prices.length === 0) {
    return null;
  }
  
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  console.log('[Auto.dev Listings] Calculated average price:', {
    average: Math.round(average),
    listingCount: prices.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  });
  
  return Math.round(average);
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
): Promise<{ marketAverage: number; priceRange: { min: number; max: number } } | null> {
  try {
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[Client] Auto.dev Listings API route error:', response.status, errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[Client] Error calling Auto.dev Listings API route:', error);
    return null;
  }
}

export async function fetchAutoDevData(
  year: number,
  make: string,
  model: string,
  trim?: string,
  mileage?: number
): Promise<{ marketAverage: number; priceRange: { min: number; max: number } } | null> {
  try {
    const config = getAutoDevConfig();
    
    // If no API key configured, return null (fallback to other sources)
    if (!config.apiKey || !config.apiUrl) {
      console.warn('[Auto.dev Listings] API key not configured, skipping listings fetch');
      return null;
    }
    
    // If running client-side, use API route
    if (isClientSide()) {
      console.log('[Auto.dev Listings] Client-side call, using API route');
      return await fetchAutoDevListingsViaAPI(year, make, model, trim, mileage);
    }
    
    // Server-side: Fetch listings directly from Auto.dev
    const listings = await fetchFromAutoDevListingsAPI(
      { year, make, model, trim, mileage },
      config.apiKey,
      config.apiUrl
    );
    
    if (listings.length === 0) {
      console.warn('[Auto.dev Listings] No listings found');
      return null;
    }
    
    // Calculate average price
    const averagePrice = calculateAveragePriceFromListings(listings);
    
    if (!averagePrice) {
      console.warn('[Auto.dev Listings] Could not calculate average price from listings');
      return null;
    }
    
    // Calculate price range
    const prices = listings
      .map(listing => listing.retailListing?.price || listing.price)
      .filter((price): price is number => typeof price === 'number' && price > 0);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      marketAverage: averagePrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      }
    };
  } catch (error) {
    console.error('[Auto.dev Listings] Error:', error);
    return null;
  }
}

export async function fetchMarketCheckData(
  year: number,
  make: string,
  model: string,
  mileage?: number
): Promise<{ competitivePrice: number; daysToPriceImprovement: number } | null> {
  try {
    // TODO: Integrate with MarketCheck API (Premium)
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const baseValue = 24600;
    const ageDepreciation = (new Date().getFullYear() - year) * 0.1;
    const mileageDepreciation = mileage ? (mileage / 100000) * 0.15 : 0;
    
    const competitive = Math.round(baseValue * (1 - ageDepreciation - mileageDepreciation));
    
    return {
      competitivePrice: competitive,
      daysToPriceImprovement: Math.floor(Math.random() * 30) + 10
    };
  } catch (error) {
    console.error('MarketCheck API error:', error);
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
  
  // Free tier gets basic market data
  const [edmunds, kbb] = await Promise.all([
    fetchEdmundsData(year, make, model, mileage),
    fetchKelleyBlueBookData(year, make, model, mileage)
  ]);
  
  if (edmunds) data.edmundsAPI = edmunds;
  if (kbb) data.kelleyBlueBook = kbb;
  
  // Premium tier gets additional sources
  if (tier === 'paid') {
    const [autoDev, marketCheck] = await Promise.all([
      fetchAutoDevData(year, make, model, trim, mileage),
      fetchMarketCheckData(year, make, model, mileage)
    ]);
    
    if (autoDev) data.autoDev = autoDev;
    if (marketCheck) data.marketCheck = marketCheck;
  }
  
  return data;
}

export function calculateAverageMarketValue(data: MarketListingsData): number {
  const values: number[] = [];
  
  // Prioritize Auto.dev listings average if available (most accurate from real listings)
  if (data.autoDev?.marketAverage) {
    values.push(data.autoDev.marketAverage);
  }
  
  // Add other sources
  if (data.edmundsAPI) values.push(data.edmundsAPI.trueMarketValue);
  if (data.kelleyBlueBook) values.push(data.kelleyBlueBook.fairPurchasePrice);
  if (data.marketCheck) values.push(data.marketCheck.competitivePrice);
  
  if (values.length === 0) return 0;
  
  // If we have Auto.dev data, weight it more heavily (50% weight)
  if (data.autoDev?.marketAverage && values.length > 1) {
    const autoDevValue = data.autoDev.marketAverage;
    const otherValues = values.filter(v => v !== autoDevValue);
    const otherAverage = otherValues.length > 0 
      ? otherValues.reduce((a, b) => a + b, 0) / otherValues.length 
      : autoDevValue;
    
    // Weighted average: 50% Auto.dev, 50% other sources
    return Math.round((autoDevValue * 0.5) + (otherAverage * 0.5));
  }
  
  // Simple average if no Auto.dev or only Auto.dev
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
