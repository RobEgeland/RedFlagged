export type VerdictType = 'deal' | 'caution' | 'disaster';

export type AnalysisTier = 'free' | 'paid';

export interface VehicleInfo {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  askingPrice: number;
}

// Vehicle History Database Types
export interface NMVTISData {
  titleBrands?: string[];
  salvageRecord?: boolean;
  theftRecords?: boolean;
  stateTitle?: string;
  odometer?: {
    reading: number;
    date: string;
  }[];
  // Vehicle details from Auto.dev
  vehicleDetails?: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
  };
}

export interface CarfaxAutoCheckData {
  accidentIndicators?: boolean;
  serviceHistory?: string[];
  ownershipChanges?: number;
  mileageSnapshots?: Array<{
    mileage: number;
    date: string;
  }>;
}

// Market Listings Data Types
export interface RawListing {
  price: number;
  mileage?: number;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  dealer?: string;
  listingType?: 'dealer' | 'private-party';
}

export interface MarketListingsData {
  autoDev?: {
    marketAverage: number;
    priceRange: { min: number; max: number };
    rawListings?: RawListing[]; // Raw listings for detailed analysis (paid tier)
  };
  marketCheck?: {
    competitivePrice?: number;
    daysToPriceImprovement?: number;
    salesStats?: {
      averagePrice: number;
      medianPrice: number;
      salesCount: number;
      priceRange?: { min: number; max: number };
    };
  };
}

// FEMA / Disaster Geography Types
export interface FEMADisasterData {
  femaDeclarations?: Array<{
    disasterType: string;
    declarationDate: string;
    affectedCounties: string[];
  }>;
  noaaStormEvents?: Array<{
    eventType: string;
    date: string;
    location: string;
  }>;
  usgsWildfirePerimeters?: Array<{
    fireName: string;
    startDate: string;
    endDate?: string;
  }>;
}

// Environmental Risk Types
export interface EnvironmentalRisk {
  disasterPresence: boolean;
  disasterTypes: string[];
  recency: 'recent' | 'historical' | 'none';
  floodZoneRisk: 'low' | 'medium' | 'high' | 'unknown';
  confidence: number; // 0-100
  affectedCounties?: string[];
  recentDisasters?: Array<{
    disasterType: string;
    declarationDate: string;
    daysAgo: number;
  }>;
  historicalDisasters?: Array<{
    disasterType: string;
    declarationDate: string;
    daysAgo: number;
  }>;
}

// Seller Signals Types
export interface ListingBehaviorSignals {
  relistingDetection?: {
    detected: boolean;
    timesSeen: number;
    confidence?: number;
    weightedScore?: number;
    personalBackupHistory?: string[];
    timeLocation?: string[];
  };
  listingLongevity?: {
    daysListed: number;
    isStale: boolean;
    sellingWithoutCorrection: boolean;
  };
}

export interface PricingBehaviorSignals {
  priceVolatility?: {
    detected: boolean;
    volatilityLevel: 'low' | 'medium' | 'high';
    priceChanges: number;
    priceHistory?: Array<{
      price: number;
      date: string;
      changePercent?: number;
    }>;
    significantDrops?: Array<{
      fromPrice: number;
      toPrice: number;
      dropPercent: number;
      daysAgo: number;
    }>;
    oscillations?: number; // Number of price oscillations (drop then increase, or multiple drops)
    timeWindow: number; // Days analyzed (45 or 90)
  };
  unusuallyLowPrice?: {
    detected: boolean;
    belowMarketPercent: number; // How much below market (e.g., -15 means 15% below)
    marketMedian?: number;
    askingPrice: number;
    confidence: number; // 0-100
    thresholdUsed: number; // The threshold that triggered this (e.g., -15%)
  };
  tooGoodForTooLong?: {
    detected: boolean;
    daysListed: number;
    thresholdDays: number; // The threshold that was exceeded (e.g., 21 days)
    confidence: number; // 0-100
    requiresLowPrice: boolean; // Only true if unusuallyLowPrice was also detected
  };
  tooGoodTooBeLong?: {
    isSuspicious: boolean;
    belowMarket: boolean;
    fastListingPeriods: number;
    sellerRefusesToSellQuickly: boolean;
  };
}

export interface SellerProfileConsistency {
  sellerTypeRisk?: {
    isDealerVsPrivate: string;
    negotiatedSimilarListings: boolean;
  };
  autoDealerRevealed?: boolean;
}

export interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'pricing' | 'history' | 'title' | 'data-gap' | 'listing' | 'ownership' | 'disaster' | 'seller';
  expandedDetails?: string;
  methodology?: string;
  isPremium?: boolean;
  dataSource?: string;
}

export interface DataQualityFactor {
  id: string;
  name: string;
  status: 'complete' | 'partial' | 'missing' | 'unavailable';
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface DataQualityAssessment {
  overallConfidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  factors: DataQualityFactor[];
  summary: string;
  recommendations: string[];
}

export interface VerdictResult {
  tier: AnalysisTier;
  verdict: VerdictType;
  confidenceScore: number;
  summary: string;
  redFlags: RedFlag[];
  questionsToAsk: string[];
  knownData: string[];
  unknownData: string[];
  vehicleInfo: VehicleInfo & {
    estimatedValue?: number;
    priceDifference?: number;
    priceDifferencePercent?: number;
  };
  // Data sources
  vehicleHistory?: {
    nmvtis?: NMVTISData;
    carfaxAutoCheck?: CarfaxAutoCheckData;
  };
  marketData?: MarketListingsData;
  disasterData?: FEMADisasterData;
  environmentalRisk?: EnvironmentalRisk;
  sellerSignals?: {
    listingBehavior?: ListingBehaviorSignals;
    pricingBehavior?: PricingBehaviorSignals;
    profileConsistency?: SellerProfileConsistency;
  };
  maintenanceRiskAssessment?: {
    overallRisk: 'low' | 'medium' | 'elevated';
    classification: string;
    riskFactors: Array<{
      component: string;
      riskLevel: 'low' | 'medium' | 'high';
      description: string;
      typicalMileageRange?: string;
      typicalAgeRange?: string;
    }>;
    inspectionFocus: Array<{
      component: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
      whatToCheck: string;
    }>;
    buyerChecklist: string[];
    confidence: 'high' | 'medium' | 'low';
    confidenceNote?: string;
  };
  marketPricingAnalysis?: {
    priceRanges: {
      low: number;
      median: number;
      high: number;
      percentile25: number;
      percentile75: number;
    };
    askingPricePosition: {
      percentile: number;
      position: 'below' | 'at' | 'above';
      differencePercent: number;
    };
    comparableCount: number;
    geographicScope: string;
    listingType: 'dealer' | 'private-party' | 'mixed' | 'unknown';
    marketComparison: string;
    negotiationLeverage: {
      level: 'strong' | 'moderate' | 'limited' | 'none';
      explanation: string;
      suggestedApproach: string;
    };
    confidence: 'high' | 'medium' | 'low';
    limitations: string[];
    dataQuality: {
      hasEnoughData: boolean;
      dataSparsity: 'sparse' | 'moderate' | 'adequate';
      regionalVariance: boolean;
    };
  };
  tailoredQuestions?: {
    questions: Array<{
      question: string;
      category: 'title-history' | 'pricing' | 'maintenance' | 'condition' | 'seller' | 'environmental' | 'general';
      priority: 'critical' | 'high' | 'medium' | 'low';
      context: string;
      relatedFindings?: string[];
    }>;
    summary: string;
    categories: {
      critical: Array<{
        question: string;
        category: string;
        priority: string;
        context: string;
        relatedFindings?: string[];
      }>;
      high: Array<{
        question: string;
        category: string;
        priority: string;
        context: string;
        relatedFindings?: string[];
      }>;
      medium: Array<{
        question: string;
        category: string;
        priority: string;
        context: string;
        relatedFindings?: string[];
      }>;
      low: Array<{
        question: string;
        category: string;
        priority: string;
        context: string;
        relatedFindings?: string[];
      }>;
    };
  };
  // Premium features (computed from above)
  carfaxSummary?: string;
  comparableListings?: Array<{
    price: number;
    mileage: number;
    location: string;
    daysOnMarket: number;
    source?: string;
  }>;
  sellerAnalysis?: {
    credibilityScore: number;
    insights: string[];
  };
  // Vehicle recalls
  recalls?: Array<{
    recallNumber: string;
    component: string;
    summary: string;
    consequence: string;
    remedy: string;
    nhtsaCampaignNumber?: string;
    reportReceivedDate?: string;
  }>;
  // Data quality and confidence assessment
  dataQuality?: DataQualityAssessment;
}

export interface AnalysisRequest {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  askingPrice: number;
  tier?: AnalysisTier;
  location?: string; // For disaster geography checking
}
