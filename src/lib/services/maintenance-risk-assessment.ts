/**
 * Maintenance Risk Assessment Service
 * Premium Feature: Provides forward-looking maintenance risk assessment based on
 * vehicle age, mileage, ownership patterns, and general usage expectations.
 * Focuses on probabilistic buyer risk rather than past events.
 */

export interface MaintenanceRiskAssessment {
  overallRisk: 'low' | 'medium' | 'elevated';
  classification: string;
  riskFactors: RiskFactor[];
  inspectionFocus: InspectionItem[];
  buyerChecklist: string[];
  confidence: 'high' | 'medium' | 'low';
  confidenceNote?: string;
}

export interface RiskFactor {
  component: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  typicalMileageRange?: string;
  typicalAgeRange?: string;
}

export interface InspectionItem {
  component: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  whatToCheck: string;
}

/**
 * Analyze maintenance risk based on vehicle characteristics
 */
export function assessMaintenanceRisk(
  year?: number,
  mileage?: number,
  ownershipHistory?: {
    ownerCount?: number;
    ownershipChanges?: number;
  },
  vehicleClass?: 'economy' | 'mid-range' | 'luxury' | 'sports' | 'truck' | 'unknown'
): MaintenanceRiskAssessment | null {
  // Year is required for assessment
  // Convert to number if it's a string
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  const currentYear = new Date().getFullYear();
  if (!yearNum || !Number.isInteger(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
    console.warn('[Maintenance Risk] Invalid or missing year:', year, 'Parsed as:', yearNum, 'Current year:', currentYear);
    return null;
  }

  const vehicleAge = currentYear - yearNum;
  const hasMileage = mileage !== undefined && mileage > 0;
  
  // Determine vehicle class if not provided (simplified heuristic)
  const estimatedClass = vehicleClass || 'unknown';
  
  // Calculate average annual mileage if we have both age and mileage
  const averageAnnualMileage = hasMileage && vehicleAge > 0 
    ? Math.round(mileage / vehicleAge) 
    : undefined;
  
  // Determine usage pattern
  const usagePattern = determineUsagePattern(averageAnnualMileage, mileage);
  
  const riskFactors: RiskFactor[] = [];
  const inspectionFocus: InspectionItem[] = [];
  const buyerChecklist: string[] = [];
  
  // Age-based risk factors
  if (vehicleAge >= 15) {
    riskFactors.push({
      component: 'Overall Vehicle Systems',
      riskLevel: 'high',
      description: 'Vehicles over 15 years old typically require more frequent maintenance as components reach end-of-life. Rubber seals, hoses, and electrical systems are particularly vulnerable.',
      typicalAgeRange: '15+ years'
    });
    
    inspectionFocus.push({
      component: 'Rubber Components & Seals',
      priority: 'high',
      reason: 'Age-related deterioration',
      whatToCheck: 'Check for dry rot, cracks, or leaks in hoses, belts, door seals, and weatherstripping'
    });
    
    inspectionFocus.push({
      component: 'Electrical System',
      priority: 'high',
      reason: 'Wiring and connectors degrade with age',
      whatToCheck: 'Test all electrical functions: lights, power windows, locks, dashboard displays, and charging system'
    });
  } else if (vehicleAge >= 10) {
    riskFactors.push({
      component: 'Wear Components',
      riskLevel: 'medium',
      description: 'Vehicles in the 10-15 year range often need replacement of original wear components like suspension, brakes, and drivetrain parts.',
      typicalAgeRange: '10-15 years'
    });
  }
  
  // Mileage-based risk factors
  if (hasMileage) {
    // High mileage vehicles
    if (mileage >= 150000) {
      riskFactors.push({
        component: 'Major Drivetrain Components',
        riskLevel: 'high',
        description: 'Vehicles with 150,000+ miles are approaching or past typical service life for transmissions, timing chains/belts, and engine internals. Major component replacement may be needed.',
        typicalMileageRange: '150,000+ miles'
      });
      
      inspectionFocus.push({
        component: 'Transmission',
        priority: 'high',
        reason: 'High mileage increases failure risk',
        whatToCheck: 'Test all gears, check for slipping, rough shifting, or transmission fluid condition and level'
      });
      
      inspectionFocus.push({
        component: 'Engine Compression & Timing',
        priority: 'high',
        reason: 'Wear on internal components',
        whatToCheck: 'Consider compression test, check for timing chain/belt replacement history, listen for unusual engine noises'
      });
      
      buyerChecklist.push('Verify transmission service history and test drive thoroughly');
      buyerChecklist.push('Ask about timing belt/chain replacement (critical maintenance item)');
    } else if (mileage >= 100000) {
      riskFactors.push({
        component: 'Scheduled Maintenance Items',
        riskLevel: 'medium',
        description: 'Vehicles with 100,000+ miles typically require major scheduled maintenance including timing belt/chain, water pump, and suspension component replacement.',
        typicalMileageRange: '100,000-150,000 miles'
      });
      
      inspectionFocus.push({
        component: 'Timing Belt/Chain',
        priority: 'high',
        reason: 'Critical maintenance milestone',
        whatToCheck: 'Verify replacement history - failure can cause catastrophic engine damage'
      });
      
      inspectionFocus.push({
        component: 'Suspension & Steering',
        priority: 'medium',
        reason: 'Wear components at replacement age',
        whatToCheck: 'Check for worn shocks/struts, ball joints, tie rods, and steering play'
      });
      
      buyerChecklist.push('Confirm timing belt/chain replacement has been performed');
      buyerChecklist.push('Inspect suspension for wear and test ride quality');
    } else if (mileage >= 60000) {
      riskFactors.push({
        component: 'Preventive Maintenance',
        riskLevel: 'low',
        description: 'Vehicles in the 60,000-100,000 mile range typically need routine maintenance and may require first-time replacement of original components.',
        typicalMileageRange: '60,000-100,000 miles'
      });
      
      inspectionFocus.push({
        component: 'Brake System',
        priority: 'medium',
        reason: 'Typical replacement interval',
        whatToCheck: 'Check brake pad thickness, rotor condition, and brake fluid quality'
      });
    }
    
    // Usage pattern analysis
    if (averageAnnualMileage) {
      if (averageAnnualMileage >= 20000) {
        riskFactors.push({
          component: 'High-Use Vehicle',
          riskLevel: 'medium',
          description: `Average annual mileage of ${averageAnnualMileage.toLocaleString()} miles indicates heavy use, which accelerates wear on all components, especially engine, transmission, and suspension.`,
          typicalMileageRange: '20,000+ miles/year'
        });
        
        inspectionFocus.push({
          component: 'Engine & Transmission',
          priority: 'high',
          reason: 'Heavy use accelerates wear',
          whatToCheck: 'Pay extra attention to engine performance, transmission shifting, and any signs of excessive wear'
        });
      } else if (averageAnnualMileage <= 8000) {
        riskFactors.push({
          component: 'Low-Use Vehicle',
          riskLevel: 'low',
          description: `Average annual mileage of ${averageAnnualMileage.toLocaleString()} miles suggests light use, which may reduce wear but can also indicate short-trip driving that's hard on engines.`,
          typicalMileageRange: 'Under 8,000 miles/year'
        });
        
        inspectionFocus.push({
          component: 'Battery & Charging System',
          priority: 'medium',
          reason: 'Short trips can strain electrical system',
          whatToCheck: 'Test battery voltage and alternator output, check for corrosion'
        });
      }
    }
  }
  
  // Ownership pattern analysis
  if (ownershipHistory) {
    const ownerCount = ownershipHistory.ownerCount || ownershipHistory.ownershipChanges || 0;
    
    if (ownerCount >= 4) {
      riskFactors.push({
        component: 'Multiple Ownership',
        riskLevel: 'medium',
        description: `Vehicle has had ${ownerCount} or more owners, which may indicate maintenance inconsistency or underlying issues that prompted frequent sales.`,
      });
      
      buyerChecklist.push('Request complete maintenance records from all owners if possible');
      buyerChecklist.push('Be extra thorough in inspection due to potential maintenance gaps');
    } else if (ownerCount >= 2 && vehicleAge >= 10) {
      riskFactors.push({
        component: 'Ownership Changes',
        riskLevel: 'low',
        description: 'Multiple owners on an older vehicle is common, but verify maintenance continuity between owners.',
      });
    }
  }
  
  // Vehicle class-specific considerations
  if (estimatedClass === 'luxury' || estimatedClass === 'sports') {
    riskFactors.push({
      component: 'Premium Vehicle Maintenance',
      riskLevel: 'medium',
      description: 'Luxury and sports vehicles typically have higher maintenance costs and may require specialized service. Parts and labor costs are generally 30-50% higher than economy vehicles.',
    });
    
    buyerChecklist.push('Budget for higher maintenance costs typical of premium vehicles');
    buyerChecklist.push('Verify access to qualified service facilities familiar with this make/model');
  } else if (estimatedClass === 'truck') {
    if (mileage && mileage >= 100000) {
      inspectionFocus.push({
        component: '4WD/Transfer Case',
        priority: 'medium',
        reason: 'High-mileage trucks often have 4WD system wear',
        whatToCheck: 'Test 4WD engagement, check for leaks, verify transfer case service history'
      });
    }
  }
  
  // Common inspection items for all vehicles
  if (vehicleAge >= 5 || (mileage && mileage >= 50000)) {
    inspectionFocus.push({
      component: 'Cooling System',
      priority: 'medium',
      reason: 'Age and mileage increase failure risk',
      whatToCheck: 'Check coolant condition, test for leaks, verify radiator and hoses are in good condition'
    });
    
    inspectionFocus.push({
      component: 'Fluid Levels & Quality',
      priority: 'medium',
      reason: 'Indicators of maintenance history',
      whatToCheck: 'Check all fluid levels (oil, transmission, brake, power steering, coolant) and their condition/color'
    });
  }
  
  // Build standard checklist items
  buyerChecklist.push('Review maintenance records for completeness and consistency');
  buyerChecklist.push('Have a pre-purchase inspection performed by an independent mechanic');
  buyerChecklist.push('Test drive the vehicle in various conditions (city, highway, parking)');
  buyerChecklist.push('Check for any warning lights on the dashboard');
  buyerChecklist.push('Verify tire condition and age (check DOT date codes)');
  
  // Determine overall risk level
  const highRiskCount = riskFactors.filter(f => f.riskLevel === 'high').length;
  const mediumRiskCount = riskFactors.filter(f => f.riskLevel === 'medium').length;
  
  let overallRisk: 'low' | 'medium' | 'elevated' = 'low';
  let classification = 'This vehicle appears to be in a relatively low-maintenance phase of its lifecycle.';
  
  if (highRiskCount >= 2 || (highRiskCount >= 1 && mediumRiskCount >= 2) || vehicleAge >= 15) {
    overallRisk = 'elevated';
    classification = 'This vehicle is entering a phase where maintenance needs and costs typically increase. Several components may be approaching replacement age, and proactive inspection is recommended.';
  } else if (highRiskCount >= 1 || mediumRiskCount >= 2 || vehicleAge >= 10 || (mileage && mileage >= 100000)) {
    overallRisk = 'medium';
    classification = 'This vehicle is at a stage where some maintenance items may be due. Regular inspection and preventive maintenance can help avoid larger issues.';
  } else {
    classification = 'This vehicle appears to be in a relatively low-maintenance phase of its lifecycle. Standard preventive maintenance should be sufficient.';
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  let confidenceNote: string | undefined;
  
  if (!hasMileage) {
    confidence = 'low';
    confidenceNote = 'Mileage information is missing, which limits our ability to assess maintenance risk accurately. Actual maintenance needs may vary significantly.';
  } else if (ownershipHistory && (ownershipHistory.ownerCount === undefined || ownershipHistory.ownershipChanges === undefined)) {
    confidence = 'medium';
    confidenceNote = 'Limited ownership history information available. Maintenance continuity between owners is uncertain.';
  } else if (hasMileage && vehicleAge > 0) {
    confidence = 'high';
  }
  
  return {
    overallRisk,
    classification,
    riskFactors,
    inspectionFocus: inspectionFocus.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    buyerChecklist: Array.from(new Set(buyerChecklist)), // Remove duplicates
    confidence,
    confidenceNote
  };
}

/**
 * Determine usage pattern from mileage data
 */
function determineUsagePattern(
  averageAnnualMileage?: number,
  totalMileage?: number
): 'heavy' | 'normal' | 'light' | 'unknown' {
  if (averageAnnualMileage) {
    if (averageAnnualMileage >= 20000) return 'heavy';
    if (averageAnnualMileage <= 8000) return 'light';
    return 'normal';
  }
  return 'unknown';
}

/**
 * Estimate vehicle class from make/model (simplified heuristic)
 */
export function estimateVehicleClass(make?: string, model?: string): 'economy' | 'mid-range' | 'luxury' | 'sports' | 'truck' | 'unknown' {
  if (!make) return 'unknown';
  
  const makeLower = make.toLowerCase();
  const modelLower = model?.toLowerCase() || '';
  
  // Luxury brands
  const luxuryBrands = ['mercedes-benz', 'mercedes', 'bmw', 'audi', 'lexus', 'acura', 'infiniti', 'cadillac', 'lincoln', 'porsche', 'jaguar', 'land rover', 'tesla', 'genesis'];
  if (luxuryBrands.some(brand => makeLower.includes(brand))) {
    return 'luxury';
  }
  
  // Sports/performance
  const sportsKeywords = ['corvette', 'mustang', 'camaro', 'challenger', 'charger', 'gt', 'gtr', 'm3', 'm4', 'amg', 'srt', 'type r', 'si'];
  if (sportsKeywords.some(keyword => makeLower.includes(keyword) || modelLower.includes(keyword))) {
    return 'sports';
  }
  
  // Trucks/SUVs
  const truckKeywords = ['f-150', 'f-250', 'f-350', 'silverado', 'sierra', 'ram', 'tundra', 'titan', 'tacoma', 'ranger', 'colorado', 'canyon'];
  if (truckKeywords.some(keyword => modelLower.includes(keyword))) {
    return 'truck';
  }
  
  // Economy brands
  const economyBrands = ['kia', 'hyundai', 'nissan', 'mitsubishi', 'suzuki'];
  if (economyBrands.some(brand => makeLower.includes(brand))) {
    return 'economy';
  }
  
  return 'mid-range';
}

