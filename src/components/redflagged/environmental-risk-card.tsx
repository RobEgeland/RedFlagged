"use client";

import { EnvironmentalRisk } from "@/types/vehicle";
import { AlertTriangle, Droplets, MapPin } from "lucide-react";

interface EnvironmentalRiskCardProps {
  environmentalRisk: EnvironmentalRisk;
}

export function EnvironmentalRiskCard({ environmentalRisk }: EnvironmentalRiskCardProps) {
  const hasDisasters = environmentalRisk.disasterPresence;
  const hasRecent = environmentalRisk.recency === 'recent';
  const hasHistorical = environmentalRisk.recency === 'historical';
  const floodRisk = environmentalRisk.floodZoneRisk;
  const disasterTypes = environmentalRisk.disasterTypes;
  const recentDisasters = environmentalRisk.recentDisasters || [];
  const historicalDisasters = environmentalRisk.historicalDisasters || [];

  // Determine overall risk level
  const getRiskLevel = (): 'low' | 'medium' | 'high' => {
    if (hasRecent && floodRisk === 'high') return 'high';
    if (hasRecent || floodRisk === 'high') return 'medium';
    if (hasHistorical || floodRisk === 'medium') return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel();

  // Filter for flood-related disasters
  const floodRelatedDisasters = disasterTypes.filter(type => {
    const lower = type.toLowerCase();
    return lower.includes('flood') || lower.includes('hurricane') || lower.includes('storm');
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-600/10 rounded-lg">
          <Droplets className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Environmental Risk</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Potential flood or disaster exposure based on location
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Disaster Presence */}
        {hasDisasters ? (
          <div className={`border rounded-lg p-4 ${
            riskLevel === 'high' ? 'border-red-200 bg-red-50/50' :
            riskLevel === 'medium' ? 'border-orange-200 bg-orange-50/50' :
            'border-yellow-200 bg-yellow-50/50'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                riskLevel === 'high' ? 'bg-red-100' :
                riskLevel === 'medium' ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${
                  riskLevel === 'high' ? 'text-red-600' :
                  riskLevel === 'medium' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Disaster History Detected</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    riskLevel === 'high' ? 'text-red-700 bg-red-100' :
                    riskLevel === 'medium' ? 'text-orange-700 bg-orange-100' :
                    'text-yellow-700 bg-yellow-100'
                  }`}>
                    {riskLevel.toUpperCase()} risk
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  This vehicle appears to be located in an area with {hasRecent ? 'recent' : 'historical'} 
                  {' '}FEMA disaster declaration{disasterTypes.length === 1 ? '' : 's'}.
                </p>

                {/* Recent Disasters */}
                {recentDisasters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Recent Disasters (Last 3 Years):</p>
                    <ul className="space-y-1">
                      {recentDisasters.map((disaster, index) => {
                        const date = new Date(disaster.declarationDate);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                        return (
                          <li key={index} className="text-xs text-gray-600">
                            <span className="font-semibold">{disaster.disasterType}</span>
                            {' - '}
                            <span>{formattedDate}</span>
                            {' '}
                            <span className="text-gray-500">({disaster.daysAgo} days ago)</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Historical Disasters */}
                {historicalDisasters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Historical Disasters (3-5 Years Ago):</p>
                    <ul className="space-y-1">
                      {historicalDisasters.map((disaster, index) => {
                        const date = new Date(disaster.declarationDate);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                        return (
                          <li key={index} className="text-xs text-gray-600">
                            <span className="font-semibold">{disaster.disasterType}</span>
                            {' - '}
                            <span>{formattedDate}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Disaster Types Summary */}
                {disasterTypes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Disaster Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {disasterTypes.map((type, index) => (
                        <span 
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            floodRelatedDisasters.includes(type)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">No Disaster History Detected</h4>
                <p className="text-sm text-gray-700">
                  No FEMA disaster declarations found for this location in the last 5 years.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Flood Zone Risk */}
        {floodRisk !== 'unknown' && (
          <div className={`border rounded-lg p-4 ${
            floodRisk === 'high' ? 'border-red-200 bg-red-50/50' :
            floodRisk === 'medium' ? 'border-orange-200 bg-orange-50/50' :
            'border-blue-200 bg-blue-50/50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                floodRisk === 'high' ? 'bg-red-100' :
                floodRisk === 'medium' ? 'bg-orange-100' :
                'bg-blue-100'
              }`}>
                <Droplets className={`w-4 h-4 ${
                  floodRisk === 'high' ? 'text-red-600' :
                  floodRisk === 'medium' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Flood Zone Risk</h4>
                <p className="text-sm text-gray-700">
                  {floodRisk === 'high' && 'Area is located in a high-risk flood zone (FEMA Zone A, AE, AO, or AH).'}
                  {floodRisk === 'medium' && 'Area is located in a moderate-risk flood zone (FEMA Zone X shaded or Zone D).'}
                  {floodRisk === 'low' && 'Area is located in a low-risk flood zone (FEMA Zone X unshaded or Zone C).'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Note */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            <strong>Important:</strong> This is a probabilistic signal based on location data, not proof of actual damage. 
            The vehicle appears exposed to disaster-affected areas, but this does not confirm damage occurred. 
            Always inspect carefully for water damage, corrosion, or other environmental issues. 
            This signal never alone triggers a "Disaster" verdict but may lower confidence when combined with other risk signals.
          </p>
        </div>
      </div>
    </div>
  );
}

