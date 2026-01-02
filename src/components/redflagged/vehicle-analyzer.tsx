"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { VinInputForm } from "./vin-input-form";
import { AnalysisLoading } from "./analysis-loading";
import { analyzeVehicle } from "@/lib/vehicle-analysis";
import { AnalysisRequest } from "@/types/vehicle";

export function VehicleAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const posthog = usePostHog();

  const handleSubmit = async (data: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    
    // Track analysis started
    posthog?.capture("analysis_started", {
      has_vin: !!data.vin,
      has_manual_input: !!(data.year && data.make && data.model),
      asking_price: data.askingPrice,
    });
    
    try {
      const analysisResult = await analyzeVehicle(data);
      
      // Track successful analysis
      posthog?.capture("analysis_completed", {
        verdict: analysisResult.verdict,
        has_red_flags: (analysisResult.redFlags?.length || 0) > 0,
        red_flags_count: analysisResult.redFlags?.length || 0,
        estimated_value: analysisResult.estimatedValue,
        asking_price: data.askingPrice,
      });
      
      // Encode result as base64 for localStorage
      // Store in localStorage (URL was causing 431 errors due to size)
      const encoded = btoa(encodeURIComponent(JSON.stringify(analysisResult)));
      localStorage.setItem("currentReport", encoded);
      
      // Redirect to report page without data in URL (report page reads from localStorage)
      router.push("/report");
    } catch (err: any) {
      // Track analysis error
      posthog?.capture("analysis_failed", {
        error_message: err?.message || "Unknown error",
      });
      
      console.error('Analysis error:', err);
      console.error('Error details:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      });
      setError(`An error occurred while analyzing the vehicle: ${err?.message || 'Unknown error'}. Please check the console for details.`);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Show form if not loading */}
      {!isLoading && (
        <VinInputForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {/* Show loading state - full page loading screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-background z-50">
          <AnalysisLoading />
        </div>
      )}

      {/* Show error */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-disaster/10 border border-disaster/30 rounded-lg text-disaster text-center mt-4">
          <p>{error}</p>
          <button 
            onClick={handleReset}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
