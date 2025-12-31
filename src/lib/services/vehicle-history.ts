import { NMVTISData, CarfaxAutoCheckData } from '@/types/vehicle';

/**
 * Vehicle History Database Services
 * Free: Auto.dev (Vehicle History via VIN Decode)
 * Premium: Carfax/AutoCheck/Auto.dev Class
 */

/**
 * Auto.dev API Configuration
 */
interface AutoDevConfig {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Auto.dev VIN Decode Response Structure
 * Based on Auto.dev API documentation
 */
interface AutoDevVINResponse {
  vin?: string;
  // Vehicle specifications (can be at top level or in vehicle object)
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  // Vehicle object (nested structure)
  vehicle?: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    manufacturer?: string;
  };
  
  // Title and history information
  title?: {
    brand?: string;
    brands?: string[];
    state?: string;
    status?: string;
  };
  
  // History data
  history?: {
    accidents?: boolean;
    accidentCount?: number;
    theft?: boolean;
    salvage?: boolean;
    totalLoss?: boolean;
    odometer?: Array<{
      reading: number;
      date: string;
      mileage?: number;
    }>;
    ownershipHistory?: Array<{
      ownerCount?: number;
      purchaseDate?: string;
    }>;
  };
  
  // Recalls
  recalls?: Array<{
    recallNumber?: string;
    description?: string;
    date?: string;
  }>;
  
  // Additional fields
  [key: string]: any;
}

/**
 * Get Auto.dev API configuration from environment variables
 * 
 * NOTE: For security, API keys should only be used server-side.
 * If calling from a client component, it automatically uses the /api/vehicle-history route
 * that calls this function server-side.
 */
function getAutoDevConfig(): AutoDevConfig {
  // Use server-side environment variables only (not NEXT_PUBLIC_)
  // This ensures API keys are not exposed to the client
  return {
    apiKey: process.env.AUTO_DEV_API_KEY,
    apiUrl: process.env.AUTO_DEV_API_URL || 'https://api.auto.dev',
  };
}

/**
 * Fetch vehicle history data from Auto.dev VIN Decode API
 */
async function fetchFromAutoDevAPI(vin: string, apiKey: string, apiUrl: string): Promise<NMVTISData | null> {
  try {
    // Auto.dev VIN decode endpoint
    // Format: https://api.auto.dev/vin/{vin}
    const endpoint = `${apiUrl}/vin/${vin}`;

    console.log(`[Auto.dev] Fetching from: ${endpoint.replace(apiKey, '***')}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[Auto.dev] Response status: ${response.status}`);

    if (!response.ok) {
      // Try to parse error response as JSON
      let errorData: any = {};
      try {
        const errorText = await response.text();
        errorData = JSON.parse(errorText);
        console.error(`[Auto.dev] Error response: ${response.status}`, errorData);
      } catch (parseError) {
        // If parsing fails, use the raw text
        const errorText = await response.text().catch(() => '');
        console.error(`[Auto.dev] Error response (non-JSON): ${response.status} ${response.statusText}`, errorText);
        errorData = { error: errorText || response.statusText };
      }
      
      // Handle specific error codes from Auto.dev
      if (response.status === 400) {
        // Invalid VIN format - show to user
        const errorMessage = errorData.error || 'Invalid VIN format';
        console.error(`[Auto.dev] Invalid VIN: ${errorMessage}`);
        throw new Error(`Invalid VIN: ${errorMessage}. Please check that your VIN is exactly 17 characters and contains only valid characters (no I, O, or Q).`);
      }
      
      if (response.status === 401 || response.status === 403) {
        // Authentication errors - hide from user, log internally
        console.error('[Auto.dev] API authentication failed. Check your API key. Continuing without vehicle history data.');
        return null; // Return null to allow analysis to continue without history data
      }
      
      if (response.status === 404) {
        // VIN not found - return null to allow analysis to continue
        const errorMessage = errorData.error || `No vehicle data found for VIN ${vin}`;
        console.warn(`[Auto.dev] VIN not found: ${errorMessage}. Continuing without vehicle history data.`);
        return null; // Not a fatal error - analysis can continue
      }
      
      if (response.status === 429) {
        // Rate limit errors - hide from user, log internally
        console.error('[Auto.dev] API rate limit exceeded. Continuing without vehicle history data.');
        return null; // Return null to allow analysis to continue without history data
      }
      
      // Generic error
      const errorMessage = errorData.error || `Auto.dev API error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data: AutoDevVINResponse = await response.json();
    console.log('[Auto.dev] Successfully fetched data:', Object.keys(data));
    console.log('[Auto.dev] Vehicle details from response:', { 
      year: data.year || data.vehicle?.year, 
      make: data.make || data.vehicle?.make, 
      model: data.model || data.vehicle?.model, 
      trim: data.trim,
      hasVehicleObject: !!data.vehicle
    });
    return mapAutoDevResponse(data);
  } catch (error) {
    console.error('[Auto.dev] Fatal error:', error);
    throw error;
  }
}

/**
 * Map Auto.dev VIN decode response to our standardized NMVTISData format
 */
function mapAutoDevResponse(data: AutoDevVINResponse): NMVTISData {
  // Extract title brands from title information
  const titleBrands: string[] = [];
  if (data.title) {
    if (data.title.brands && Array.isArray(data.title.brands)) {
      titleBrands.push(...data.title.brands);
    } else if (data.title.brand) {
      titleBrands.push(data.title.brand);
    }
  }

  // Extract salvage record from history
  const salvageRecord = data.history?.salvage ?? data.history?.totalLoss ?? false;

  // Extract theft records from history
  const theftRecords = data.history?.theft ?? false;

  // Extract state title
  const stateTitle = data.title?.state || data.title?.status || 'Unknown';

  // Extract odometer readings from history
  const odometer: Array<{ reading: number; date: string }> = [];
  if (data.history?.odometer && Array.isArray(data.history.odometer)) {
    data.history.odometer.forEach((reading) => {
      const mileage = reading.reading || reading.mileage;
      const date = reading.date;
      if (mileage && date) {
        odometer.push({ reading: mileage, date });
      }
    });
  }

  return {
    titleBrands: titleBrands.length > 0 ? titleBrands : undefined,
    salvageRecord,
    theftRecords,
    stateTitle,
    odometer: odometer.length > 0 ? odometer : undefined,
    // Extract vehicle details from Auto.dev response
    // Check both top-level and nested vehicle object for year/make/model
    vehicleDetails: (data.year || data.vehicle?.year || data.make || data.vehicle?.make || data.model || data.vehicle?.model || data.trim) ? {
      year: data.year || data.vehicle?.year,
      make: data.make || data.vehicle?.make,
      model: data.model || data.vehicle?.model,
      trim: data.trim,
    } : undefined,
  };
}

/**
 * Check if code is running on the client side
 */
function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Fetch vehicle history data via API route (for client-side calls)
 */
async function fetchVehicleHistoryViaAPI(vin: string): Promise<NMVTISData | null> {
  try {
    console.log('[Client] Calling API route for VIN:', vin);
    const response = await fetch('/api/vehicle-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vin }),
    });

    console.log('[Client] API route response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Client] API route error:', response.status, errorData);
      
      // Extract error message from response
      const errorMessage = errorData.error || `API error: ${response.status}`;
      
      // For 400 (Invalid VIN), throw error with user-friendly message
      // This is a fatal error - the VIN is invalid and we can't proceed
      if (response.status === 400) {
        throw new Error(errorMessage);
      }
      
      // For 404 (VIN not found), return null to allow analysis to continue without history data
      // This is not a fatal error - we can still analyze with other data sources
      if (response.status === 404) {
        console.warn(`[Client] No data found for VIN ${vin}: ${errorMessage}. Continuing without vehicle history data.`);
        return null;
      }
      
      // For authentication errors, hide from user and continue without history data
      if (response.status === 401 || response.status === 403) {
        console.error(`[Client] API authentication error (${response.status}). Continuing without vehicle history data.`);
        return null;
      }
      
      // For rate limit errors, hide from user and continue without history data
      if (response.status === 429) {
        console.error(`[Client] API rate limit exceeded. Continuing without vehicle history data.`);
        return null;
      }
      
      // For other errors, throw with the error message
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[Client] Received data from API route:', data ? 'Success' : 'No data');
    return data;
  } catch (error) {
    console.error('[Client] Vehicle history API route error:', error);
    return null;
  }
}

/**
 * Fetch vehicle history data for a vehicle by VIN using Auto.dev
 * 
 * This function integrates with Auto.dev's VIN Decode API to provide vehicle history.
 * 
 * When called from the client, it automatically uses the /api/vehicle-history route
 * to keep API keys secure. When called server-side, it makes direct API calls.
 * 
 * To configure, set the following environment variables (server-side only):
 * - AUTO_DEV_API_KEY: Your Auto.dev API key
 * - AUTO_DEV_API_URL: (Optional) The API endpoint URL (defaults to https://api.auto.dev)
 * 
 * Auto.dev provides:
 * - Title brands (salvage, rebuilt, junk)
 * - Theft records
 * - State title information
 * - Odometer readings
 * - Accident history (in premium tier)
 * 
 * Documentation: https://docs.auto.dev
 * 
 * If API credentials are not configured, returns mock data for development.
 */
export async function fetchNMVTISData(vin: string): Promise<NMVTISData | null> {
  try {
    // Validate VIN format (basic check)
    if (!vin || vin.length !== 17) {
      console.warn(`Invalid VIN format: ${vin}`);
      return null;
    }

    // If running on client side, use API route for security
    if (isClientSide()) {
      return await fetchVehicleHistoryViaAPI(vin);
    }

    // Server-side: fetch directly from Auto.dev
    const config = getAutoDevConfig();

    console.log('[Auto.dev] Config check:', {
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length || 0,
      apiUrl: config.apiUrl,
    });

    // If no API key is configured, return mock data for development
    if (!config.apiKey) {
      console.warn('[Auto.dev] API key not configured. Using mock data. Set AUTO_DEV_API_KEY to use real data.');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      titleBrands: [],
      salvageRecord: false,
      theftRecords: false,
      stateTitle: 'Clean',
      odometer: [
        { reading: 50000, date: '2023-01-15' },
        { reading: 45000, date: '2022-01-10' }
      ]
    };
    }

    console.log(`[Auto.dev] Fetching data for VIN: ${vin}`);
    // Fetch from Auto.dev API
    if (!config.apiKey || !config.apiUrl) {
      console.error('[Auto.dev] Missing API key or URL');
      return null;
    }
    const result = await fetchFromAutoDevAPI(vin, config.apiKey, config.apiUrl);
    console.log('[Auto.dev] Fetch result:', result ? 'Success' : 'Failed/No data');
    return result;
  } catch (error) {
    console.error('Vehicle history fetch error:', error);
    // Return null on error to allow the analysis to continue with other data sources
    return null;
  }
}

export async function fetchCarfaxAutoCheckData(vin: string): Promise<CarfaxAutoCheckData | null> {
  try {
    // TODO: Integrate with Carfax/AutoCheck API (Premium only)
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      accidentIndicators: false,
      serviceHistory: [
        'Oil change - 2023-06-15',
        'Tire rotation - 2023-03-20',
        'Brake inspection - 2022-12-10'
      ],
      ownershipChanges: 2,
      mileageSnapshots: [
        { mileage: 52000, date: '2023-06-15' },
        { mileage: 48000, date: '2023-01-10' },
        { mileage: 42000, date: '2022-06-15' }
      ]
    };
  } catch (error) {
    console.error('Carfax/AutoCheck fetch error:', error);
    return null;
  }
}

export function generateHistorySummary(
  nmvtis: NMVTISData | null,
  carfax: CarfaxAutoCheckData | null
): string {
  const parts: string[] = [];
  
  if (carfax) {
    if (carfax.accidentIndicators) {
      parts.push('Accident history detected');
    } else {
      parts.push('No major accidents reported');
    }
    
    parts.push(`${carfax.ownershipChanges} previous owner${carfax.ownershipChanges === 1 ? '' : 's'}`);
    
    if (carfax.serviceHistory && carfax.serviceHistory.length > 0) {
      parts.push('Regular maintenance records available');
    }
  }
  
  if (nmvtis) {
    if (nmvtis.titleBrands && nmvtis.titleBrands.length > 0) {
      parts.push(`Title brands: ${nmvtis.titleBrands.join(', ')}`);
    } else {
      parts.push('Clean title history');
    }
    
    if (nmvtis.theftRecords) {
      parts.push('⚠️ Theft record found');
    }
  }
  
  return parts.join('. ') + '.';
}
