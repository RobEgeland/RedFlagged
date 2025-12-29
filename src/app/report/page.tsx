"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnalysisResults } from "@/components/redflagged/analysis-results";
import { VerdictResult } from "@/types/vehicle";
import Navbar from "@/components/navbar";
import { AnalysisLoading } from "@/components/redflagged/analysis-loading";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get report data from URL params or localStorage
    const reportData = searchParams.get("data");
    
    if (reportData) {
      try {
        // Decode from base64
        const decoded = decodeURIComponent(atob(reportData));
        const parsedResult = JSON.parse(decoded) as VerdictResult;
        setResult(parsedResult);
        setIsLoading(false);
        
        // Also store in localStorage for refresh
        localStorage.setItem("currentReport", reportData);
      } catch (err) {
        console.error("Error parsing report data:", err);
        setError("Invalid report data");
        setIsLoading(false);
      }
    } else {
      // Try to get from localStorage
      const stored = localStorage.getItem("currentReport");
      if (stored) {
        try {
          const decoded = decodeURIComponent(atob(stored));
          const parsedResult = JSON.parse(decoded) as VerdictResult;
          setResult(parsedResult);
          setIsLoading(false);
        } catch (err) {
          console.error("Error parsing stored report:", err);
          setError("Invalid report data");
          setIsLoading(false);
        }
      } else {
        setError("No report data found");
        setIsLoading(false);
      }
    }
  }, [searchParams]);

  const handleReset = () => {
    localStorage.removeItem("currentReport");
    router.push("/");
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <AnalysisLoading />
      </>
    );
  }

  if (error || !result) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-4 bg-disaster/10 border border-disaster/30 rounded-lg text-disaster mb-4">
              <p className="font-semibold mb-2">Error Loading Report</p>
              <p className="text-sm">{error || "Report not found"}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-charcoal text-cream rounded-lg hover:bg-charcoal/90 transition-colors font-medium"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AnalysisResults result={result} onReset={handleReset} />
        </div>
      </div>
    </>
  );
}

