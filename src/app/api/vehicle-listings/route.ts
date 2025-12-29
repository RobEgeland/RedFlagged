import { NextRequest, NextResponse } from "next/server";
import { fetchAutoDevData } from "@/lib/services/market-listings";

/**
 * API Route for Vehicle Listings Data (via Auto.dev)
 * 
 * This route provides server-side access to vehicle listings data,
 * keeping API keys secure and not exposed to the client.
 * 
 * POST /api/vehicle-listings
 * Body: { year: number, make: string, model: string, trim?: string, mileage?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, make, model, trim, mileage } = body;

    console.log('[API Route] Received request for listings:', { year, make, model, trim, mileage });

    if (!year || !make || !model) {
      return NextResponse.json(
        { error: "Year, make, and model are required" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.AUTO_DEV_API_KEY;
    console.log('[API Route] API key configured:', !!apiKey, 'Length:', apiKey?.length || 0);

    // Fetch vehicle listings data server-side using Auto.dev
    const data = await fetchAutoDevData(year, make, model, trim, mileage);

    if (!data) {
      console.log('[API Route] No data returned from fetchAutoDevData');
      return NextResponse.json(
        { error: "No vehicle listings data found" },
        { status: 404 }
      );
    }

    console.log('[API Route] Successfully returning data');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Route] Error:", error);
    
    const errorMessage = error.message || "Failed to fetch vehicle listings data";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for vehicle listings data (alternative to POST)
 * 
 * GET /api/vehicle-listings?year=2020&make=Honda&model=Civic&trim=EX&mileage=50000
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const trim = searchParams.get("trim");
    const mileage = searchParams.get("mileage");

    if (!year || !make || !model) {
      return NextResponse.json(
        { error: "Year, make, and model are required as query parameters" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: "Year must be a valid number" },
        { status: 400 }
      );
    }

    const mileageNum = mileage ? parseInt(mileage, 10) : undefined;
    if (mileage && isNaN(mileageNum!)) {
      return NextResponse.json(
        { error: "Mileage must be a valid number" },
        { status: 400 }
      );
    }

    // Fetch vehicle listings data server-side using Auto.dev
    const data = await fetchAutoDevData(yearNum, make, model, trim || undefined, mileageNum);

    if (!data) {
      return NextResponse.json(
        { error: "No vehicle listings data found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Vehicle listings API route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vehicle listings data" },
      { status: 500 }
    );
  }
}

