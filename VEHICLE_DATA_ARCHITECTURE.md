# Vehicle Data Architecture

This document describes the comprehensive vehicle analysis system that fetches data from multiple sources to provide accurate risk assessment for used car buyers.

## Data Flow Overview

```
User Input (VIN or Manual)
    ↓
Vehicle Data Fetching (Loading Screen)
    ↓
[Multiple Data Sources in Parallel]
    ↓
Analysis & Red Flag Generation
    ↓
Verdict & Results Display
```

## Data Sources

### 1. Vehicle History Databases

#### Free Tier
- **NMVTIS** (National Motor Vehicle Title Information System)
  - Title brands (salvage, rebuilt, junk)
  - Theft records
  - State title information
  - Basic odometer readings

#### Premium Tier
- **Carfax / AutoCheck / Auto.dev Class**
  - Accident indicators
  - Service history records
  - Ownership changes
  - Detailed mileage snapshots
  - Maintenance records

**Implementation**: `src/lib/services/vehicle-history.ts`

---

### 2. Market Listings Data

#### Free Tier
- **Edmunds API**: True Market Value, Retail Price
- **Kelley Blue Book**: Fair Purchase Price, Typical Listing Price
- **Limited Auto.dev calls**: Basic market average

#### Premium Tier
- **Auto.dev**: Full market average, price range analysis
- **MarketCheck**: Competitive pricing, days to price improvement

**Implementation**: `src/lib/services/market-listings.ts`

---

### 3. FEMA / Disaster Geography

#### Free Tier
- **FEMA Disaster Declarations API**
  - Federally declared disasters
  - Event types (flood, hurricane, wildfire, etc.)
  - Affected counties
  - Start/end dates

#### Premium Tier
- **NOAA Storm Event Data**
  - Historical storm events
  - Hurricane tracking
  - Severe weather patterns
  
- **USGS Wildfire Perimeters**
  - Active and historical wildfire zones
  - Fire perimeter mapping
  - Burn severity data

**Implementation**: `src/lib/services/disaster-geography.ts`

---

### 4. Seller Signals

#### All Signals (Premium Only)

**Listing Behavior**
- **Relisting Detection**
  - Number of times vehicle was listed
  - Personal backup/history tracking
  - Time + location changes
  
- **Listing Longevity**
  - Days on market
  - Stale listing detection
  - Selling without price correction

**Pricing Behavior**
- **Price Volatility**
  - Price changes over time
  - Price increases (red flag)
  - Re-post cycles
  
- **"Too Good to Be Long" Signal**
  - Price far below market + extended listing period
  - Fast listing periods
  - Seller refuses to sell quickly (scam indicator)

**Seller Profile Consistency**
- **Seller Type Risk**
  - Dealer vs private seller detection
  - Negotiated similar listings from same seller
  
- **Auto Dealer Revealed**
  - Dealer posing as private party
  - Multiple similar vehicle listings

**Implementation**: `src/lib/services/seller-signals.ts`

---

## Red Flag Categories

Red flags are generated from the data sources above and categorized as:

1. **Pricing** - Over/underpriced vehicles
2. **History** - Accidents, theft, odometer issues
3. **Title** - Salvage, rebuilt, branded titles
4. **Data Gap** - Missing critical information
5. **Listing** - Suspicious listing patterns
6. **Ownership** - Age, mileage, maintenance concerns
7. **Disaster** - Natural disaster exposure
8. **Seller** - Seller credibility issues

Each flag includes:
- Title and description
- Severity level (low, medium, high, critical)
- Expanded details (premium only)
- Methodology explanation (premium only)
- Data source attribution

---

## Free vs Premium Split

### Free Tier Gets:
- Basic VIN lookup via NMVTIS
- Simple market pricing from Edmunds + KBB
- FEMA disaster declarations
- Basic verdict and summary
- Limited red flag details (headlines only)
- 1 basic question to ask seller
- No seller signal analysis

### Premium Tier Gets:
- Full vehicle history (Carfax/AutoCheck)
- Comprehensive market data (4 sources)
- Advanced disaster data (NOAA + USGS)
- Full red flag details with methodology
- 8-10 contextual questions
- Complete seller credibility analysis including:
  - Listing behavior tracking
  - Pricing volatility analysis
  - Dealer detection
  - Relisting patterns
- Comparable local listings
- Confidence score and detailed reasoning

---

## Implementation Notes

### Parallel Data Fetching
All data sources are fetched in parallel using `Promise.all()` to minimize wait time:

```typescript
const [vehicleHistory, marketData, disasterData, sellerSignals] = 
  await Promise.all([
    fetchVehicleHistory(),
    fetchMarketData(),
    fetchDisasterData(),
    fetchSellerSignals()
  ]);
```

### Error Handling
Each data source service handles its own errors gracefully and returns `null` or empty data structures on failure, ensuring the analysis continues even if one source is unavailable.

### Mock Data
Currently, all services use mock data. To integrate real APIs:

1. Replace mock responses in each service file
2. Add API keys to environment variables
3. Implement rate limiting and caching as needed

### Future Enhancements
- Real-time API integrations
- Caching layer for frequently accessed vehicles
- Historical price tracking database
- Machine learning for seller credibility scoring
- Image analysis for damage detection
