import { NextRequest, NextResponse } from "next/server";

/**
 * API Route for Vehicle Listing Data by VIN (via Auto.dev)
 * 
 * This route provides server-side access to vehicle listing data,
 * keeping API keys secure and not exposed to the client.
 * 
 * GET /api/vehicle-listing/{vin}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vin: string } }
) {
  try {
    const vin = params.vin;

    console.log('[API Route] Received request for listing VIN:', vin);

    if (!vin) {
      return NextResponse.json(
        { error: "VIN is required" },
        { status: 400 }
      );
    }

    // Validate VIN format (17 characters)
    if (vin.length !== 17) {
      return NextResponse.json(
        { error: "Invalid VIN format. VIN must be 17 characters." },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.AUTO_DEV_API_KEY;
    const apiUrl = process.env.AUTO_DEV_API_URL || 'https://api.auto.dev';
    
    console.log('[API Route] API key configured:', !!apiKey, 'Length:', apiKey?.length || 0);

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Fetch listing data from Auto.dev
    const url = `${apiUrl}/listings/${vin}`;
    console.log('[API Route] Fetching listing from:', url.replace(apiKey, '***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[API Route] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        console.error('[API Route] Authentication error');
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        console.log('[API Route] No listing found for VIN');
        return NextResponse.json(
          { error: "No listing found for this VIN" },
          { status: 404 }
        );
      }
      
      if (response.status === 429) {
        console.error('[API Route] Rate limit exceeded');
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
      
      console.error('[API Route] API error:', response.status, errorData);
      return NextResponse.json(
        { error: "Failed to fetch listing data" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[API Route] Successfully returning listing data');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Route] Error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch listing data" },
      { status: 500 }
    );
  }
}

