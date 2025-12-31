import { EnvironmentalRisk } from '@/types/vehicle';

/**
 * Environmental Risk Services
 * Detects potential flood or disaster exposure based on vehicle location
 * Uses FEMA Disaster Declarations API and flood zone data
 */

/**
 * FEMA Disaster Declaration Response Structure
 */
interface FEMADisasterDeclaration {
  disasterNumber?: string;
  state?: string;
  declarationType?: string;
  declarationDate?: string;
  incidentType?: string;
  title?: string;
  [key: string]: any;
}

/**
 * Location to County mapping (simplified - in production, use geocoding API)
 * This is a basic lookup - for production, use a geocoding service
 */
async function locationToCounty(location?: string, zipCode?: string): Promise<string | null> {
  if (!location && !zipCode) {
    return null;
  }

  try {
    // For now, extract county from location string if it contains "County"
    // In production, use a geocoding API like Google Geocoding, Mapbox, or US Census Geocoder
    if (location) {
      const countyMatch = location.match(/(\w+\s+County)/i);
      if (countyMatch) {
        return countyMatch[1];
      }
    }

    // If ZIP code provided, could use USPS or Census geocoding API
    // For now, return null and let the API search by state/county from location string
    return null;
  } catch (error) {
    console.error('[Environmental Risk] Error converting location to county:', error);
    return null;
  }
}

/**
 * Extract state from location string
 * Handles both abbreviations (FL) and full names (Florida)
 */
function extractState(location?: string): string | null {
  if (!location) return null;
  
  // US state abbreviations and full names mapping
  const stateMap: Record<string, string> = {
    'AL': 'AL', 'ALABAMA': 'AL',
    'AK': 'AK', 'ALASKA': 'AK',
    'AZ': 'AZ', 'ARIZONA': 'AZ',
    'AR': 'AR', 'ARKANSAS': 'AR',
    'CA': 'CA', 'CALIFORNIA': 'CA',
    'CO': 'CO', 'COLORADO': 'CO',
    'CT': 'CT', 'CONNECTICUT': 'CT',
    'DE': 'DE', 'DELAWARE': 'DE',
    'FL': 'FL', 'FLORIDA': 'FL',
    'GA': 'GA', 'GEORGIA': 'GA',
    'HI': 'HI', 'HAWAII': 'HI',
    'ID': 'ID', 'IDAHO': 'ID',
    'IL': 'IL', 'ILLINOIS': 'IL',
    'IN': 'IN', 'INDIANA': 'IN',
    'IA': 'IA', 'IOWA': 'IA',
    'KS': 'KS', 'KANSAS': 'KS',
    'KY': 'KY', 'KENTUCKY': 'KY',
    'LA': 'LA', 'LOUISIANA': 'LA',
    'ME': 'ME', 'MAINE': 'ME',
    'MD': 'MD', 'MARYLAND': 'MD',
    'MA': 'MA', 'MASSACHUSETTS': 'MA',
    'MI': 'MI', 'MICHIGAN': 'MI',
    'MN': 'MN', 'MINNESOTA': 'MN',
    'MS': 'MS', 'MISSISSIPPI': 'MS',
    'MO': 'MO', 'MISSOURI': 'MO',
    'MT': 'MT', 'MONTANA': 'MT',
    'NE': 'NE', 'NEBRASKA': 'NE',
    'NV': 'NV', 'NEVADA': 'NV',
    'NH': 'NH', 'NEW HAMPSHIRE': 'NH',
    'NJ': 'NJ', 'NEW JERSEY': 'NJ',
    'NM': 'NM', 'NEW MEXICO': 'NM',
    'NY': 'NY', 'NEW YORK': 'NY',
    'NC': 'NC', 'NORTH CAROLINA': 'NC',
    'ND': 'ND', 'NORTH DAKOTA': 'ND',
    'OH': 'OH', 'OHIO': 'OH',
    'OK': 'OK', 'OKLAHOMA': 'OK',
    'OR': 'OR', 'OREGON': 'OR',
    'PA': 'PA', 'PENNSYLVANIA': 'PA',
    'RI': 'RI', 'RHODE ISLAND': 'RI',
    'SC': 'SC', 'SOUTH CAROLINA': 'SC',
    'SD': 'SD', 'SOUTH DAKOTA': 'SD',
    'TN': 'TN', 'TENNESSEE': 'TN',
    'TX': 'TX', 'TEXAS': 'TX',
    'UT': 'UT', 'UTAH': 'UT',
    'VT': 'VT', 'VERMONT': 'VT',
    'VA': 'VA', 'VIRGINIA': 'VA',
    'WA': 'WA', 'WASHINGTON': 'WA',
    'WV': 'WV', 'WEST VIRGINIA': 'WV',
    'WI': 'WI', 'WISCONSIN': 'WI',
    'WY': 'WY', 'WYOMING': 'WY'
  };
  
  // Try to find state abbreviation or full name in location
  const upperLocation = location.toUpperCase();
  
  // First try abbreviations (2-letter codes)
  for (const [key, value] of Object.entries(stateMap)) {
    if (key.length === 2 && upperLocation.includes(key)) {
      return value;
    }
  }
  
  // Then try full state names (longer matches first)
  const sortedEntries = Object.entries(stateMap)
    .filter(([key]) => key.length > 2)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [key, value] of sortedEntries) {
    if (upperLocation.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Fetch FEMA Disaster Declarations from OpenFEMA API
 * API: https://www.fema.gov/about/openfema/data-sets
 * Endpoint: https://www.fema.gov/api/open/v1/DisasterDeclarationsSummaries
 */
async function fetchFEMADisasterDeclarations(
  state?: string,
  county?: string,
  years: number = 5
): Promise<FEMADisasterDeclaration[]> {
  try {
    if (!state) {
      console.warn('[Environmental Risk] No state provided for FEMA disaster lookup');
      return [];
    }

    // Calculate date range (last N years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build API URL
    // OpenFEMA API endpoint for Disaster Declarations
    // Note: OpenFEMA uses OData query syntax
    let apiUrl = `https://www.fema.gov/api/open/v1/DisasterDeclarationsSummaries?$filter=state eq '${state}' and declarationDate ge '${startDateStr}' and declarationDate le '${endDateStr}'&$orderby=declarationDate desc&$top=100`;
    
    // Note: County filtering in FEMA API is complex - designatedArea field contains county names
    // For now, we'll filter by state and filter results client-side if county is provided

    console.log('[Environmental Risk] Fetching FEMA disasters:', { state, county, years, apiUrl: apiUrl.substring(0, 100) + '...' });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Environmental Risk] FEMA API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    // Handle different response structures
    let disasters = data.DisasterDeclarationsSummaries || data || [];
    
    // Filter by county if provided (check designatedArea field)
    if (county && Array.isArray(disasters)) {
      disasters = disasters.filter((disaster: any) => {
        const designatedArea = disaster.designatedArea || disaster.designatedarea || '';
        return designatedArea.toLowerCase().includes(county.toLowerCase());
      });
    }
    
    console.log('[Environmental Risk] FEMA disasters found:', disasters.length, county ? `(filtered for ${county})` : '');
    
    return Array.isArray(disasters) ? disasters : [];
  } catch (error) {
    console.error('[Environmental Risk] Error fetching FEMA disasters:', error);
    return [];
  }
}

/**
 * Determine flood zone risk based on location
 * This is a simplified version - in production, use FEMA Flood Map Service API
 * or integrate with FEMA's National Flood Hazard Layer
 */
async function determineFloodZoneRisk(
  location?: string,
  zipCode?: string
): Promise<'low' | 'medium' | 'high' | 'unknown'> {
  try {
    // For now, return 'unknown' as we'd need FEMA Flood Map Service API integration
    // In production, this would:
    // 1. Geocode location to lat/lng
    // 2. Query FEMA National Flood Hazard Layer
    // 3. Determine flood zone (A, AE, X, etc.)
    // 4. Map to risk level:
    //    - High: Zones A, AE, AO, AH (1% annual chance)
    //    - Medium: Zones X (shaded), D (undetermined)
    //    - Low: Zones X (unshaded), C
    
    // Placeholder: Could use a simple heuristic based on known high-risk areas
    // For now, return unknown and let disaster declarations inform the risk
    
    return 'unknown';
  } catch (error) {
    console.error('[Environmental Risk] Error determining flood zone:', error);
    return 'unknown';
  }
}

/**
 * Analyze environmental risk based on location
 * Returns structured environmental risk assessment
 */
export async function analyzeEnvironmentalRisk(
  location?: string,
  zipCode?: string
): Promise<EnvironmentalRisk> {
  try {
    if (!location && !zipCode) {
      return {
        disasterPresence: false,
        disasterTypes: [],
        recency: 'none',
        floodZoneRisk: 'unknown',
        confidence: 0
      };
    }

    // Extract state from location
    const state = extractState(location);
    
    // Convert location to county (simplified)
    const county = await locationToCounty(location, zipCode);

    // Fetch FEMA disaster declarations
    const disasters = await fetchFEMADisasterDeclarations(state || undefined, county || undefined, 5);

    // Determine flood zone risk
    const floodZoneRisk = await determineFloodZoneRisk(location, zipCode);

    // Analyze disasters
    const now = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const recentDisasters: Array<{
      disasterType: string;
      declarationDate: string;
      daysAgo: number;
    }> = [];
    
    const historicalDisasters: Array<{
      disasterType: string;
      declarationDate: string;
      daysAgo: number;
    }> = [];

    const disasterTypes = new Set<string>();
    const affectedCounties = new Set<string>();

    disasters.forEach(disaster => {
      const declarationDate = disaster.declarationDate || disaster.incidentBeginDate || '';
      if (!declarationDate) return;

      const disasterDate = new Date(declarationDate);
      const daysAgo = Math.floor((now.getTime() - disasterDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const disasterType = disaster.incidentType || disaster.title || 'Unknown';
      disasterTypes.add(disasterType);

      // Track affected counties if available
      if (disaster.designatedArea) {
        affectedCounties.add(disaster.designatedArea);
      }

      const disasterEntry = {
        disasterType,
        declarationDate,
        daysAgo
      };

      if (disasterDate >= threeYearsAgo) {
        recentDisasters.push(disasterEntry);
      } else {
        historicalDisasters.push(disasterEntry);
      }
    });

    // Determine recency
    let recency: 'recent' | 'historical' | 'none' = 'none';
    if (recentDisasters.length > 0) {
      recency = 'recent';
    } else if (historicalDisasters.length > 0) {
      recency = 'historical';
    }

    // Calculate confidence based on data quality
    let confidence = 0;
    if (state) confidence += 30;
    if (county) confidence += 20;
    if (disasters.length > 0) confidence += 30;
    if (floodZoneRisk !== 'unknown') confidence += 20;
    confidence = Math.min(100, confidence);

    // Filter for flood-related events
    const floodRelatedTypes = Array.from(disasterTypes).filter(type => {
      const lowerType = type.toLowerCase();
      return lowerType.includes('flood') || 
             lowerType.includes('hurricane') || 
             lowerType.includes('storm') ||
             lowerType.includes('severe weather');
    });

    return {
      disasterPresence: disasters.length > 0,
      disasterTypes: Array.from(disasterTypes),
      recency,
      floodZoneRisk,
      confidence,
      affectedCounties: Array.from(affectedCounties),
      recentDisasters: recentDisasters.length > 0 ? recentDisasters : undefined,
      historicalDisasters: historicalDisasters.length > 0 ? historicalDisasters : undefined
    };
  } catch (error) {
    console.error('[Environmental Risk] Error analyzing environmental risk:', error);
    return {
      disasterPresence: false,
      disasterTypes: [],
      recency: 'none',
      floodZoneRisk: 'unknown',
      confidence: 0
    };
  }
}

