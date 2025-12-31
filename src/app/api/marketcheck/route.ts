import { NextRequest, NextResponse } from "next/server";
import { fetchMarketCheckData } from "@/lib/services/market-listings";

/**
 * API route for MarketCheck Sales Stats
 * This route handles client-side calls to MarketCheck API,
 * keeping API keys secure and not exposed to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, make, model, mileage } = body;

    if (!year || !make || !model) {
      return NextResponse.json(
        { error: "Year, make, and model are required" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.MARKETCHECK_API_KEY;
    console.log('[API Route] MarketCheck API key configured:', !!apiKey, 'Length:', apiKey?.length || 0);

    if (!apiKey) {
      console.warn('[API Route] MARKETCHECK_API_KEY not set in environment variables');
      return NextResponse.json(
        { error: "MarketCheck API key not configured" },
        { status: 500 }
      );
    }

    const data = await fetchMarketCheckData(year, make, model, mileage);

    if (!data) {
      return NextResponse.json(
        { error: "No MarketCheck data found" },
        { status: 404 }
      );
    }

    console.log('[API Route] MarketCheck data retrieved successfully:', {
      hasSalesStats: !!data.salesStats,
      averagePrice: data.salesStats?.averagePrice
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Route] Error:", error);
    const errorMessage = error.message || "Failed to fetch MarketCheck data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
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

    const data = await fetchMarketCheckData(yearNum, make, model, mileageNum);

    if (!data) {
      return NextResponse.json(
        { error: "No MarketCheck data found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("MarketCheck API route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch MarketCheck data" },
      { status: 500 }
    );
  }
}

