import { FEMADisasterData } from '@/types/vehicle';

/**
 * FEMA / Disaster Geography Services
 * Free: Basic FEMA Disaster Declarations API
 * Premium: NOAA storm event data, USGS wildfire perimeters
 */

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
 * Location to County mapping (simplified - in production, use geocoding API)
 */
async function locationToCounty(location?: string, zipCode?: string): Promise<string | null> {
  if (!location && !zipCode) {
    return null;
  }

  try {
    // Extract county from location string if it contains "County"
    if (location) {
      const countyMatch = location.match(/(\w+\s+County)/i);
      if (countyMatch) {
        return countyMatch[1];
      }
    }
    return null;
  } catch (error) {
    console.error('[Disaster Geography] Error converting location to county:', error);
    return null;
  }
}

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
  designatedArea?: string;
  [key: string]: any;
}

/**
 * Fetch FEMA Disaster Declarations from OpenFEMA API
 * API: https://www.fema.gov/about/openfema/data-sets
 * Endpoint: https://www.fema.gov/api/open/v1/DisasterDeclarationsSummaries
 */
export async function fetchFEMADisasterData(
  location?: string,
  zipCode?: string
): Promise<FEMADisasterData['femaDeclarations']> {
  try {
    if (!location && !zipCode) {
      return [];
    }

    // Extract state from location
    const state = extractState(location);
    if (!state) {
      console.warn('[Disaster Geography] No state found in location:', location);
      return [];
    }
    
    // Convert location to county (simplified)
    const county = await locationToCounty(location, zipCode);

    // Calculate date range (last 5 years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build API URL
    // OpenFEMA API endpoint for Disaster Declarations
    let apiUrl = `https://www.fema.gov/api/open/v1/DisasterDeclarationsSummaries?$filter=state eq '${state}' and declarationDate ge '${startDateStr}' and declarationDate le '${endDateStr}'&$orderby=declarationDate desc&$top=100`;
    
    console.log('[Disaster Geography] Fetching FEMA disasters:', { state, county, location, apiUrl: apiUrl.substring(0, 100) + '...' });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Disaster Geography] FEMA API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    // Handle different response structures
    let disasters: FEMADisasterDeclaration[] = data.DisasterDeclarationsSummaries || data || [];
    
    // Filter by county if provided (check designatedArea field)
    if (county && Array.isArray(disasters)) {
      disasters = disasters.filter((disaster: FEMADisasterDeclaration) => {
        const designatedArea = disaster.designatedArea || disaster.designatedarea || '';
        return designatedArea.toLowerCase().includes(county.toLowerCase());
      });
    }
    
    console.log('[Disaster Geography] FEMA disasters found:', disasters.length, county ? `(filtered for ${county})` : '');

    // Map to our format
    return disasters.map((disaster: FEMADisasterDeclaration) => ({
      disasterType: disaster.incidentType || disaster.title || 'Unknown',
      declarationDate: disaster.declarationDate || '',
      affectedCounties: disaster.designatedArea ? [disaster.designatedArea] : []
    }));
  } catch (error) {
    console.error('[Disaster Geography] Error fetching FEMA disasters:', error);
    return [];
  }
}

export async function fetchNOAAStormData(
  location?: string,
  startDate?: Date
): Promise<FEMADisasterData['noaaStormEvents']> {
  try {
    // TODO: Integrate with NOAA Storm Events API (Premium)
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const hasStorms = Math.random() > 0.6;
    
    if (!hasStorms) return [];
    
    return [
      {
        eventType: 'Hurricane',
        date: '2022-09-28',
        location: 'Regional'
      },
      {
        eventType: 'Hail',
        date: '2023-04-12',
        location: 'Local'
      }
    ];
  } catch (error) {
    console.error('NOAA API error:', error);
    return [];
  }
}

export async function fetchUSGSWildfireData(
  location?: string
): Promise<FEMADisasterData['usgsWildfirePerimeters']> {
  try {
    // TODO: Integrate with USGS Wildfire Perimeters API (Premium)
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const hasWildfires = Math.random() > 0.8;
    
    if (!hasWildfires) return [];
    
    return [
      {
        fireName: 'Mountain Fire',
        startDate: '2022-07-10',
        endDate: '2022-08-05'
      }
    ];
  } catch (error) {
    console.error('USGS API error:', error);
    return [];
  }
}

export async function fetchAllDisasterData(
  location?: string,
  tier: 'free' | 'paid' = 'free'
): Promise<FEMADisasterData> {
  const data: FEMADisasterData = {};
  
  // Free tier gets basic FEMA data
  data.femaDeclarations = await fetchFEMADisasterData(location);
  
  // Premium tier gets additional sources
  if (tier === 'paid') {
    const [noaa, usgs] = await Promise.all([
      fetchNOAAStormData(location),
      fetchUSGSWildfireData(location)
    ]);
    
    data.noaaStormEvents = noaa;
    data.usgsWildfirePerimeters = usgs;
  }
  
  return data;
}

export function analyzeDisasterRisk(data: FEMADisasterData): {
  hasRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  details: string[];
} {
  const details: string[] = [];
  let riskScore = 0;
  
  if (data.femaDeclarations && data.femaDeclarations.length > 0) {
    riskScore += data.femaDeclarations.length * 2;
    
    const recentDisasters = data.femaDeclarations.filter(d => {
      const disasterDate = new Date(d.declarationDate);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      return disasterDate > threeYearsAgo;
    });
    
    if (recentDisasters.length > 0) {
      details.push(`${recentDisasters.length} FEMA disaster declaration(s) in the past 3 years`);
      
      const floodEvents = recentDisasters.filter(d => 
        d.disasterType.toLowerCase().includes('flood')
      );
      
      if (floodEvents.length > 0) {
        details.push('⚠️ Flooding history detected - inspect for water damage');
        riskScore += 3;
      }
    }
  }
  
  if (data.noaaStormEvents && data.noaaStormEvents.length > 0) {
    const hurricanes = data.noaaStormEvents.filter(e => 
      e.eventType.toLowerCase().includes('hurricane')
    );
    
    if (hurricanes.length > 0) {
      details.push(`${hurricanes.length} hurricane event(s) in area`);
      riskScore += 2;
    }
  }
  
  if (data.usgsWildfirePerimeters && data.usgsWildfirePerimeters.length > 0) {
    details.push(`${data.usgsWildfirePerimeters.length} wildfire(s) in region`);
    riskScore += 2;
  }
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 7) riskLevel = 'high';
  else if (riskScore >= 4) riskLevel = 'medium';
  
  return {
    hasRisk: riskScore > 0,
    riskLevel,
    details
  };
}
