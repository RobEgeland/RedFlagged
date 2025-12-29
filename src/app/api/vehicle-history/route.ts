import { NextRequest, NextResponse } from "next/server";
import { fetchNMVTISData } from "@/lib/services/vehicle-history";

/**
 * API Route for Vehicle History Data (via Auto.dev)
 * 
 * This route provides server-side access to vehicle history data,
 * keeping API keys secure and not exposed to the client.
 * 
 * POST /api/vehicle-history
 * Body: { vin: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin } = body;

    console.log('[API Route] Received request for VIN:', vin);

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
    console.log('[API Route] API key configured:', !!apiKey, 'Length:', apiKey?.length || 0);

    // Fetch vehicle history data server-side using Auto.dev
    const data = await fetchNMVTISData(vin);

    if (!data) {
      console.log('[API Route] No data returned from fetchNMVTISData');
      return NextResponse.json(
        { error: "No vehicle history data found for this VIN" },
        { status: 404 }
      );
    }

    console.log('[API Route] Successfully returning data');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Route] Error:", error);
    
    // Check if error message indicates specific error types
    const errorMessage = error.message || "Failed to fetch vehicle history data";
    
    // Determine status code based on error message
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (errorMessage.includes('Invalid VIN') || errorMessage.includes('VIN must be')) {
      // Invalid VIN - show to user
      statusCode = 400;
      userMessage = errorMessage;
    } else if (errorMessage.includes('Vehicle not found') || errorMessage.includes('VIN not found') || errorMessage.includes('No vehicle data')) {
      // VIN not found - return 404 but don't show error to user (analysis can continue)
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    } else if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
      // Authentication errors - hide from user, return 404 so analysis can continue
      console.error('[API Route] Authentication error hidden from user');
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    } else if (errorMessage.includes('rate limit')) {
      // Rate limit errors - hide from user, return 404 so analysis can continue
      console.error('[API Route] Rate limit error hidden from user');
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}

/**
 * GET endpoint for vehicle history data (alternative to POST)
 * 
 * GET /api/vehicle-history?vin=XXXXXXXXXXXXXXX
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vin = searchParams.get("vin");

    if (!vin) {
      return NextResponse.json(
        { error: "VIN is required as query parameter" },
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

    // Fetch vehicle history data server-side using Auto.dev
    const data = await fetchNMVTISData(vin);

    if (!data) {
      return NextResponse.json(
        { error: "No vehicle history data found for this VIN" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Vehicle history API route error:", error);
    
    // Check if error message indicates specific error types
    const errorMessage = error.message || "Failed to fetch vehicle history data";
    
    // Determine status code based on error message
    let statusCode = 500;
    let userMessage = errorMessage;
    
    if (errorMessage.includes('Invalid VIN') || errorMessage.includes('VIN must be')) {
      // Invalid VIN - show to user
      statusCode = 400;
      userMessage = errorMessage;
    } else if (errorMessage.includes('Vehicle not found') || errorMessage.includes('VIN not found') || errorMessage.includes('No vehicle data')) {
      // VIN not found - return 404 but don't show error to user (analysis can continue)
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    } else if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
      // Authentication errors - hide from user, return 404 so analysis can continue
      console.error('[API Route] Authentication error hidden from user');
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    } else if (errorMessage.includes('rate limit')) {
      // Rate limit errors - hide from user, return 404 so analysis can continue
      console.error('[API Route] Rate limit error hidden from user');
      statusCode = 404;
      userMessage = "No vehicle history data found for this VIN";
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}

