# Auto.dev Vehicle History Integration Setup Guide

This guide explains how to configure and use the Auto.dev integration for vehicle history data in this application.

## Overview

The Auto.dev integration provides vehicle history data including:
- Title brands (salvage, rebuilt, junk)
- Theft records
- State title information
- Odometer readings
- Accident history (via VIN decode)

## Architecture

The integration is designed with security in mind:
- **Client-side calls**: Automatically route through `/api/vehicle-history` API route to keep API keys secure
- **Server-side calls**: Make direct API calls to Auto.dev
- **Fallback**: Returns mock data if API credentials are not configured (for development)

## Configuration

### Step 1: Get Your Auto.dev API Key

Since you already have an Auto.dev account:

1. Log in to your [Auto.dev dashboard](https://auto.dev)
2. Navigate to the "API Keys" section
3. Create a new API key if you don't have one
4. Copy your API key securely

### Step 2: Set Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment platform's environment variable settings):

```bash
# Required: Your Auto.dev API key
AUTO_DEV_API_KEY=your_api_key_here

# Optional: API endpoint URL (defaults to https://api.auto.dev)
AUTO_DEV_API_URL=https://api.auto.dev
```

**Important**: 
- These environment variables are **server-side only** and should NOT be prefixed with `NEXT_PUBLIC_`
- Never commit API keys to version control
- Add `.env.local` to your `.gitignore` file

### Step 3: Verify Configuration

The integration will:
1. Check if API credentials are configured
2. If configured, make real API calls to Auto.dev to fetch vehicle history
3. If not configured, use mock data (with a console warning)

## Usage

The Auto.dev integration is automatically used when analyzing a vehicle with a VIN. No additional code changes are needed.

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

The integration includes a secure API route at `/api/vehicle-history` that:
- Validates VIN format (17 characters)
- Makes server-side API calls to Auto.dev
- Returns standardized vehicle history data
- Handles errors gracefully

### API Route Endpoints

**POST /api/vehicle-history**
```json
{
  "vin": "1HGCM82633A004352"
}
```

**GET /api/vehicle-history?vin=1HGCM82633A004352**

## Auto.dev API Details

### Endpoint
- **Base URL**: `https://api.auto.dev`
- **VIN Decode**: `GET /vin/{vin}`
- **Authentication**: Bearer token in `Authorization` header

### Response Format

Auto.dev returns comprehensive vehicle data. The integration maps it to our standard format:

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
- Rate limit errors (429): Returns `null` with helpful message
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

With valid API credentials, the integration makes real API calls to Auto.dev to fetch actual vehicle history data.

## Pricing & Rate Limits

Auto.dev offers:
- **Starter Plan**: 1,000 free API calls per month
- **Usage-based pricing**: Additional calls charged per request
- **Rate limits**: Vary by plan (check your dashboard)

Monitor your usage through the Auto.dev dashboard to manage costs effectively.

## Troubleshooting

### "Auto.dev API key not configured"
- Check that `AUTO_DEV_API_KEY` is set in your environment variables
- Ensure the variable is not prefixed with `NEXT_PUBLIC_`
- Restart your development server after adding environment variables

### "Auto.dev API authentication failed"
- Verify your API key is correct
- Check with Auto.dev that your API key is active
- Ensure you're using the correct API endpoint URL

### "Auto.dev API rate limit exceeded"
- You've exceeded your monthly API call limit
- Check your usage in the Auto.dev dashboard
- Consider upgrading your plan or waiting for the limit to reset

### "No data found for VIN"
- This is normal if the VIN has no records in Auto.dev's database
- The integration will return `null` and continue with other data sources

## Security Best Practices

1. **Never expose API keys**: Always use server-side environment variables
2. **Use API routes**: Client components automatically use the `/api/vehicle-history` route
3. **Validate input**: VIN format is validated before making API calls
4. **Handle errors**: All errors are caught and logged without exposing sensitive information

## Additional Resources

- [Auto.dev Documentation](https://docs.auto.dev)
- [Auto.dev API Reference](https://docs.auto.dev/v2)
- [Auto.dev Dashboard](https://auto.dev)

## Migration from NMVTIS

If you were previously using NMVTIS, the migration to Auto.dev is complete. The function name `fetchNMVTISData` is kept for backward compatibility, but it now uses Auto.dev under the hood.

**Old environment variables (no longer used):**
- `NMVTIS_API_KEY`
- `NMVTIS_API_URL`
- `NMVTIS_PROVIDER`

**New environment variables:**
- `AUTO_DEV_API_KEY` (required)
- `AUTO_DEV_API_URL` (optional, defaults to https://api.auto.dev)

