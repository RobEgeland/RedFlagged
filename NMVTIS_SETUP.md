# NMVTIS Integration Setup Guide

This guide explains how to configure and use the National Motor Vehicle Title Information System (NMVTIS) integration in this application.

## Overview

The NMVTIS integration provides vehicle history data including:
- Title brands (salvage, rebuilt, junk)
- Theft records
- State title information
- Basic odometer readings

## Architecture

The integration is designed with security in mind:
- **Client-side calls**: Automatically route through `/api/nmvtis` API route to keep API keys secure
- **Server-side calls**: Make direct API calls to the NMVTIS provider
- **Fallback**: Returns mock data if API credentials are not configured (for development)

## Configuration

### Step 1: Choose an Approved NMVTIS Provider

You must use an approved NMVTIS data provider. Some options include:
- **Vitu**: https://www.vitu.com/api/nmvtisapi.html
- Other approved providers listed on the Department of Justice website

### Step 2: Obtain API Credentials

Register with your chosen provider to obtain:
- API Key
- API Endpoint URL (if required by provider)

### Step 3: Set Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment platform's environment variable settings):

```bash
# Required: Your NMVTIS provider API key
NMVTIS_API_KEY=your_api_key_here

# Optional: API endpoint URL (required for generic provider, optional for Vitu)
NMVTIS_API_URL=https://api.provider.com/nmvtis

# Optional: Provider type ('vitu' or 'generic', default: 'generic')
NMVTIS_PROVIDER=generic
```

**Important**: 
- These environment variables are **server-side only** and should NOT be prefixed with `NEXT_PUBLIC_`
- Never commit API keys to version control
- Add `.env.local` to your `.gitignore` file

### Step 4: Verify Configuration

The integration will:
1. Check if API credentials are configured
2. If configured, make real API calls to fetch vehicle history
3. If not configured, use mock data (with a console warning)

## Usage

The NMVTIS integration is automatically used when analyzing a vehicle with a VIN. No additional code changes are needed.

### Example

```typescript
import { fetchNMVTISData } from '@/lib/services/vehicle-history';

// This will automatically:
// - Use API route if called from client component
// - Use direct API call if called from server component
// - Fall back to mock data if API key not configured
const data = await fetchNMVTISData('1HGCM82633A004352');
```

## API Route

The integration includes a secure API route at `/api/nmvtis` that:
- Validates VIN format (17 characters)
- Makes server-side API calls to NMVTIS providers
- Returns standardized NMVTIS data
- Handles errors gracefully

### API Route Endpoints

**POST /api/nmvtis**
```json
{
  "vin": "1HGCM82633A004352"
}
```

**GET /api/nmvtis?vin=1HGCM82633A004352**

## Supported Providers

### Vitu

If using Vitu as your provider:
```bash
NMVTIS_PROVIDER=vitu
NMVTIS_API_KEY=your_vitu_api_key
# NMVTIS_API_URL is optional for Vitu (defaults to https://api.vitu.com/nmvtis)
```

### Generic Provider

For other approved NMVTIS providers:
```bash
NMVTIS_PROVIDER=generic
NMVTIS_API_KEY=your_api_key
NMVTIS_API_URL=https://api.provider.com/nmvtis
```

The generic provider will try common API endpoint patterns:
- `{apiUrl}/vehicle/{vin}` (GET)
- `{apiUrl}/report` (POST)
- `{apiUrl}/nmvtis/{vin}` (GET)

## Response Format

The integration returns data in the following format:

```typescript
{
  titleBrands?: string[];        // e.g., ["Salvage", "Rebuilt"]
  salvageRecord?: boolean;        // true if vehicle has salvage record
  theftRecords?: boolean;          // true if vehicle has theft record
  stateTitle?: string;            // e.g., "Clean", "Salvage"
  odometer?: Array<{
    reading: number;              // Odometer reading
    date: string;                 // Date of reading (ISO format)
  }>;
}
```

## Error Handling

The integration handles errors gracefully:
- Invalid VIN format: Returns `null` with console warning
- API authentication errors: Returns `null` with error message
- Network errors: Returns `null` and logs error
- Missing data: Returns `null` (404 from API)

All errors allow the vehicle analysis to continue with other data sources.

## Testing

### Development Mode (No API Key)

Without API credentials, the integration returns mock data:
```typescript
{
  titleBrands: [],
  salvageRecord: false,
  theftRecords: false,
  stateTitle: 'Clean',
  odometer: [
    { reading: 50000, date: '2023-01-15' },
    { reading: 45000, date: '2022-01-10' }
  ]
}
```

### Production Mode (With API Key)

With valid API credentials, the integration makes real API calls to fetch actual vehicle history data.

## Troubleshooting

### "NMVTIS API key not configured"
- Check that `NMVTIS_API_KEY` is set in your environment variables
- Ensure the variable is not prefixed with `NEXT_PUBLIC_`
- Restart your development server after adding environment variables

### "NMVTIS_API_URL is required for generic provider"
- Set `NMVTIS_API_URL` environment variable
- Or switch to `NMVTIS_PROVIDER=vitu` if using Vitu

### "NMVTIS API authentication failed"
- Verify your API key is correct
- Check with your provider that the API key is active
- Ensure you're using the correct provider type

### "No data found for VIN"
- This is normal if the VIN has no records in NMVTIS
- The integration will return `null` and continue with other data sources

## Security Best Practices

1. **Never expose API keys**: Always use server-side environment variables
2. **Use API routes**: Client components automatically use the `/api/nmvtis` route
3. **Validate input**: VIN format is validated before making API calls
4. **Handle errors**: All errors are caught and logged without exposing sensitive information

## Additional Resources

- [NMVTIS Overview](https://bja.ojp.gov/program/nmvtis/overview)
- [AAMVA NMVTIS Information](https://www.aamva.org/vehicles/nmvtis)
- [Vitu NMVTIS API Documentation](https://www.vitu.com/api/nmvtisapi.html)

