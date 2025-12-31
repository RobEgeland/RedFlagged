import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "../../../../supabase/server";

// GET - Fetch all reports for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Reports table not found",
            details: "The reports table has not been created yet. Please run the database migration: create_reports_table.sql",
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch reports",
          details: error.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports: data || [] });
  } catch (error: any) {
    console.error("Error in GET /api/reports:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save a new report
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      reportId,
      stripeSessionId,
      vehicleInfo,
      reportData,
      verdict,
      askingPrice,
      estimatedValue,
    } = body;

    if (!reportData || !vehicleInfo || !verdict) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[API] Saving report with data:", {
      userId,
      reportId,
      hasVehicleInfo: !!vehicleInfo,
      hasReportData: !!reportData,
      verdict,
      askingPrice,
      estimatedValue,
    });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        report_id: reportId,
        stripe_session_id: stripeSessionId,
        vehicle_info: vehicleInfo,
        report_data: reportData,
        verdict,
        asking_price: askingPrice,
        estimated_value: estimatedValue,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Error saving report:", error);
      console.error("[API] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Check if Supabase is not configured
      if (error.message === "Supabase not configured") {
        return NextResponse.json(
          { 
            error: "Database not configured",
            details: "Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
          },
          { status: 500 }
        );
      }
      
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Reports table not found",
            details: "The reports table has not been created yet. Please run the database migration: create_reports_table.sql",
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to save report",
          details: error.message || "Unknown error",
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log("[API] Report saved successfully:", data?.id);
    return NextResponse.json({ report: data });
  } catch (error: any) {
    console.error("[API] Error in POST /api/reports:", error);
    console.error("[API] Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

