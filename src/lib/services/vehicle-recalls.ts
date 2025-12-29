/**
 * NHTSA Vehicle Recalls Service
 * Fetches open recalls for vehicles using the NHTSA Recalls API
 * 
 * API Documentation: https://www.nhtsa.gov/nhtsa-datasets-and-apis
 */

export interface VehicleRecall {
  recallNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  nhtsaCampaignNumber?: string;
  reportReceivedDate?: string;
  nhtsaActionNumber?: string;
}

export interface NHTSARecallResponse {
  Count: number;
  Message: string;
  results?: Array<{
    Manufacturer?: string;
    NHTSACampaignNumber?: string;
    ReportReceivedDate?: string;
    Component?: string;
    Summary?: string;
    Consequence?: string;
    Remedy?: string;
    Notes?: string;
    ModelYear?: string;
    Make?: string;
    Model?: string;
  }>;
  Results?: Array<{
    Manufacturer?: string;
    NHTSACampaignNumber?: string;
    ReportReceivedDate?: string;
    Component?: string;
    Summary?: string;
    Consequence?: string;
    Remedy?: string;
    Notes?: string;
    ModelYear?: string;
    Make?: string;
    Model?: string;
  }>;
}

/**
 * Fetch vehicle recalls from NHTSA API by Make, Model, and Year
 * 
 * @param make - Vehicle make (e.g., "Honda", "Toyota")
 * @param model - Vehicle model (e.g., "Civic", "Camry")
 * @param modelYear - Vehicle model year (e.g., 2020)
 * @returns Array of open recalls, or null if error or no recalls
 */
export async function fetchVehicleRecalls(
  make?: string,
  model?: string,
  modelYear?: number
): Promise<VehicleRecall[] | null> {
  try {
    // Validate required parameters
    if (!make || !model || !modelYear) {
      console.warn(`[NHTSA] Missing required parameters: make=${make}, model=${model}, year=${modelYear}`);
      return null;
    }

    // NHTSA Recalls API endpoint by vehicle
    // Format: https://api.nhtsa.gov/recalls/recallsByVehicle?make={MAKE}&model={MODEL}&modelYear={MODEL_YR}
    const endpoint = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${modelYear}`;
    
    console.log(`[NHTSA] Fetching recalls for: ${modelYear} ${make} ${model}`);
    console.log(`[NHTSA] Endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[NHTSA] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[NHTSA] Error response: ${response.status}`, errorText);
      
      if (response.status === 404) {
        console.warn(`[NHTSA] No recalls found for ${modelYear} ${make} ${model}`);
        return [];
      }
      
      return null;
    }

    const data: NHTSARecallResponse = await response.json();
    
    // Check if we got valid data
    if (!data || data.Count === undefined) {
      console.warn('[NHTSA] Invalid response format');
      return null;
    }
    
    console.log(`[NHTSA] Found ${data.Count || 0} recall(s)`);
    
    // NHTSA API returns 'results' (lowercase) not 'Results'
    const recallResults = data.results || data.Results;
    
    // If no recalls found
    if (!recallResults || recallResults.length === 0) {
      return [];
    }

    // Map NHTSA response to our format
    const recalls: VehicleRecall[] = recallResults.map((recall) => ({
      recallNumber: recall.NHTSACampaignNumber || 'N/A',
      component: recall.Component || 'Unknown Component',
      summary: recall.Summary || 'No summary available',
      consequence: recall.Consequence || recall.Notes || 'No consequence details available',
      remedy: recall.Remedy || 'Contact manufacturer for remedy information',
      nhtsaCampaignNumber: recall.NHTSACampaignNumber,
      reportReceivedDate: recall.ReportReceivedDate,
      nhtsaActionNumber: recall.NHTSACampaignNumber,
    }));

    console.log('[NHTSA] Mapped recalls:', recalls.length, 'recalls mapped');
    console.log('[NHTSA] First recall sample:', recalls[0] ? {
      component: recalls[0].component,
      summary: recalls[0].summary?.substring(0, 100),
      hasConsequence: !!recalls[0].consequence,
      hasRemedy: !!recalls[0].remedy
    } : 'none');

    return recalls;
  } catch (error) {
    console.error('[NHTSA] Error fetching recalls:', error);
    return null;
  }
}

