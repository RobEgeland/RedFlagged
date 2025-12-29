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
export interface MarketListingsData {
  edmundsAPI?: {
    trueMarketValue: number;
    retailPrice: number;
  };
  kelleyBlueBook?: {
    fairPurchasePrice: number;
    typicalListingPrice: number;
  };
  autoDev?: {
    marketAverage: number;
    priceRange: { min: number; max: number };
  };
  marketCheck?: {
    competitivePrice: number;
    daysToPriceImprovement: number;
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
