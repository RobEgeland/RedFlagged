"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AnalysisResults } from "@/components/redflagged/analysis-results";
import { VerdictResult } from "@/types/vehicle";
import Navbar from "@/components/navbar";
import { AnalysisLoading } from "@/components/redflagged/analysis-loading";
import { assessMaintenanceRisk, estimateVehicleClass } from "@/lib/services/maintenance-risk-assessment";
import { generateTailoredQuestions } from "@/lib/services/tailored-questions";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if returning from successful checkout
    const sessionId = searchParams.get("session_id");
    const reportId = searchParams.get("report_id");
    const canceled = searchParams.get("canceled");

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
          
          // If returning from successful checkout, upgrade to premium and save to database
          if (sessionId && !canceled) {
            // Upgrade the report to premium tier
            let upgradedResult: VerdictResult = {
              ...parsedResult,
              tier: 'paid',
            };
            
            // If maintenance risk assessment is missing, generate it now
            if (!upgradedResult.maintenanceRiskAssessment && upgradedResult.vehicleInfo?.year) {
              const year = typeof upgradedResult.vehicleInfo.year === 'string' 
                ? parseInt(upgradedResult.vehicleInfo.year, 10) 
                : upgradedResult.vehicleInfo.year;
              
              if (year && !isNaN(year)) {
                const ownershipHistory = upgradedResult.vehicleHistory?.carfaxAutoCheck?.ownershipChanges !== undefined
                  ? { 
                      ownerCount: upgradedResult.vehicleHistory.carfaxAutoCheck.ownershipChanges, 
                      ownershipChanges: upgradedResult.vehicleHistory.carfaxAutoCheck.ownershipChanges 
                    }
                  : undefined;
                
                const vehicleClass = estimateVehicleClass(
                  upgradedResult.vehicleInfo.make, 
                  upgradedResult.vehicleInfo.model
                );
                
                const maintenanceAssessment = assessMaintenanceRisk(
                  year,
                  upgradedResult.vehicleInfo.mileage,
                  ownershipHistory,
                  vehicleClass
                );
                
                if (maintenanceAssessment) {
                  upgradedResult = {
                    ...upgradedResult,
                    maintenanceRiskAssessment: maintenanceAssessment,
                  };
                  console.log('[Report] Generated maintenance risk assessment on upgrade:', {
                    hasAssessment: !!maintenanceAssessment,
                    overallRisk: maintenanceAssessment.overallRisk
                  });
                }
              }
            }
            
            // Generate tailored questions if missing
            if (!upgradedResult.tailoredQuestions) {
              const tailoredQuestions = generateTailoredQuestions(upgradedResult);
              upgradedResult = {
                ...upgradedResult,
                tailoredQuestions: tailoredQuestions,
              };
              console.log('[Report] Generated tailored questions on upgrade:', {
                totalQuestions: tailoredQuestions.questions.length
              });
            }
            
            // Re-encode and store the upgraded report
            const upgradedData = btoa(encodeURIComponent(JSON.stringify(upgradedResult)));
            localStorage.setItem("currentReport", upgradedData);
            
            setResult(upgradedResult);
          } else {
            // Even if not upgrading, check if paid tier report is missing assessment
            if (parsedResult.tier === 'paid' && !parsedResult.maintenanceRiskAssessment && parsedResult.vehicleInfo?.year) {
              const year = typeof parsedResult.vehicleInfo.year === 'string' 
                ? parseInt(parsedResult.vehicleInfo.year, 10) 
                : parsedResult.vehicleInfo.year;
              
              if (year && !isNaN(year)) {
                const ownershipHistory = parsedResult.vehicleHistory?.carfaxAutoCheck?.ownershipChanges !== undefined
                  ? { 
                      ownerCount: parsedResult.vehicleHistory.carfaxAutoCheck.ownershipChanges, 
                      ownershipChanges: parsedResult.vehicleHistory.carfaxAutoCheck.ownershipChanges 
                    }
                  : undefined;
                
                const vehicleClass = estimateVehicleClass(
                  parsedResult.vehicleInfo.make, 
                  parsedResult.vehicleInfo.model
                );
                
                const maintenanceAssessment = assessMaintenanceRisk(
                  year,
                  parsedResult.vehicleInfo.mileage,
                  ownershipHistory,
                  vehicleClass
                );
                
                if (maintenanceAssessment) {
                  const updatedResult: VerdictResult = {
                    ...parsedResult,
                    maintenanceRiskAssessment: maintenanceAssessment,
                  };
                  
                  // Update localStorage with the assessment
                  const updatedData = btoa(encodeURIComponent(JSON.stringify(updatedResult)));
                  localStorage.setItem("currentReport", updatedData);
                  
                  // Also generate tailored questions if missing
                  if (!updatedResult.tailoredQuestions) {
                    const tailoredQuestions = generateTailoredQuestions(updatedResult);
                    const finalResult: VerdictResult = {
                      ...updatedResult,
                      tailoredQuestions: tailoredQuestions,
                    };
                    
                    const finalData = btoa(encodeURIComponent(JSON.stringify(finalResult)));
                    localStorage.setItem("currentReport", finalData);
                    
                    setResult(finalResult);
                    console.log('[Report] Generated missing tailored questions:', {
                      totalQuestions: tailoredQuestions.questions.length
                    });
                    setIsLoading(false);
                    return;
                  }
                  
                  setResult(updatedResult);
                  console.log('[Report] Generated missing maintenance risk assessment:', {
                    hasAssessment: !!maintenanceAssessment,
                    overallRisk: maintenanceAssessment.overallRisk
                  });
                  setIsLoading(false);
                  return;
                }
              }
            }
            
            // Check if tailored questions are missing for paid tier
            if (parsedResult.tier === 'paid' && !parsedResult.tailoredQuestions) {
              const tailoredQuestions = generateTailoredQuestions(parsedResult);
              const updatedResult: VerdictResult = {
                ...parsedResult,
                tailoredQuestions: tailoredQuestions,
              };
              
              const updatedData = btoa(encodeURIComponent(JSON.stringify(updatedResult)));
              localStorage.setItem("currentReport", updatedData);
              
              setResult(updatedResult);
              console.log('[Report] Generated missing tailored questions:', {
                totalQuestions: tailoredQuestions.questions.length
              });
              setIsLoading(false);
              return;
            }
            
            setResult(parsedResult);
          }
          
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

  // Separate effect to save report after user data is loaded
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const reportId = searchParams.get("report_id");
    const canceled = searchParams.get("canceled");
    
    // Only save if we have a session ID (payment successful) and user is signed in
    if (sessionId && !canceled && isSignedIn && user && result && result.tier === 'paid') {
      console.log("[Report] Saving report to database after payment...", {
        sessionId,
        reportId,
        hasUser: !!user,
        userId: user.id,
      });
      
      // Check if we've already saved this report (prevent duplicates)
      const savedSessionId = localStorage.getItem(`saved_session_${sessionId}`);
      if (!savedSessionId) {
        saveReportToDatabase(result, sessionId, reportId || undefined);
        localStorage.setItem(`saved_session_${sessionId}`, "true");
      } else {
        console.log("[Report] Report already saved for this session");
      }
    }
  }, [isSignedIn, user, result, searchParams]);

  const saveReportToDatabase = async (
    reportData: VerdictResult,
    sessionId: string,
    reportId?: string
  ) => {
    if (!isSignedIn || !user) {
      console.warn("[Report] Cannot save: user not signed in");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("[Report] Attempting to save report...", {
        reportId: reportId || `report_${Date.now()}`,
        sessionId,
        hasVehicleInfo: !!reportData.vehicleInfo,
        hasReportData: !!reportData,
        verdict: reportData.verdict,
      });

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: reportId || `report_${Date.now()}`,
          stripeSessionId: sessionId,
          vehicleInfo: reportData.vehicleInfo,
          reportData: reportData,
          verdict: reportData.verdict,
          askingPrice: reportData.vehicleInfo.askingPrice,
          estimatedValue: reportData.vehicleInfo.estimatedValue,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("[Report] Error saving report:", responseData);
        const errorMessage = responseData.details || responseData.error || "Unknown error";
        console.error("[Report] Full error response:", JSON.stringify(responseData, null, 2));
        alert(`Failed to save report: ${errorMessage}`);
      } else {
        console.log("[Report] Report saved successfully:", responseData);
      }
    } catch (err: any) {
      console.error("[Report] Error saving report to database:", err);
      alert(`Failed to save report: ${err.message || "Network error"}`);
    } finally {
      setIsSaving(false);
    }
  };

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

