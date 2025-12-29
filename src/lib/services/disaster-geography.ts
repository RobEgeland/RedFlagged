import { FEMADisasterData } from '@/types/vehicle';

/**
 * FEMA / Disaster Geography Services
 * Free: Basic FEMA Disaster Declarations API
 * Premium: NOAA storm event data, USGS wildfire perimeters
 */

export async function fetchFEMADisasterData(
  location?: string,
  zipCode?: string
): Promise<FEMADisasterData['femaDeclarations']> {
  try {
    // TODO: Integrate with FEMA Disaster Declarations API
    // https://www.fema.gov/about/openfema/data-sets
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock data - check if location has disaster history
    const hasDisaster = Math.random() > 0.7;
    
    if (!hasDisaster) return [];
    
    return [
      {
        disasterType: 'Severe Storm(s)',
        declarationDate: '2022-08-15',
        affectedCounties: ['County A', 'County B']
      },
      {
        disasterType: 'Flooding',
        declarationDate: '2021-05-20',
        affectedCounties: ['County B', 'County C']
      }
    ];
  } catch (error) {
    console.error('FEMA API error:', error);
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
