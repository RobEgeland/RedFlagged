"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { AnalysisResults } from "@/components/redflagged/analysis-results";
import { VerdictResult } from "@/types/vehicle";
import Navbar from "@/components/navbar";
import { AnalysisLoading } from "@/components/redflagged/analysis-loading";
import { assessMaintenanceRisk, estimateVehicleClass } from "@/lib/services/maintenance-risk-assessment";
import { generateTailoredQuestions } from "@/lib/services/tailored-questions";
import { analyzeMarketPricing } from "@/lib/services/market-pricing-analysis";

// Helper function to extract state from location string
function extractStateFromLocation(location?: string): string | null {
  if (!location) return null;
  
  const stateMap: { [key: string]: string } = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
    'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
    'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
    'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
    'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
    'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
    'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY'
  };

  const upperLocation = location.toUpperCase();
  for (const fullName in stateMap) {
    if (upperLocation.includes(fullName)) {
      return stateMap[fullName];
    }
  }
  const stateAbbreviations = Object.values(stateMap);
  for (const abbr of stateAbbreviations) {
    if (upperLocation.includes(abbr)) {
      return abbr;
    }
  }
  return null;
}

function extractCityFromLocation(location?: string): string | null {
  if (!location) return null;
  const parts = location.split(',').map(p => p.trim());
  if (parts.length > 0 && parts[0]) {
    return parts[0].toUpperCase();
  }
  return null;
}

function calculateLocationPriority(
  listingState: string | undefined,
  listingCity: string | undefined,
  targetState: string | null,
  targetCity: string | null
): number {
  if (!targetState) return 0;
  if (targetCity && listingCity && listingState === targetState) {
    const listingCityUpper = listingCity.toUpperCase();
    const targetCityUpper = targetCity.toUpperCase();
    if (listingCityUpper === targetCityUpper || listingCityUpper.includes(targetCityUpper) || targetCityUpper.includes(listingCityUpper)) {
      return 100;
    }
  }
  if (listingState === targetState) {
    return 50;
  }
  return 0;
}

// Helper function to generate comparable listings from market data (for regenerating old reports)
function generateComparableListingsFromMarketData(
  marketData: any,
  estimatedValue: number,
  vehicleMileage?: number,
  targetLocation?: string
): Array<{ price: number; mileage: number; location: string; daysOnMarket: number; source?: string }> {
  const listings: Array<{ price: number; mileage: number; location: string; daysOnMarket: number; source?: string; priority?: number }> = [];
  
  const targetState = extractStateFromLocation(targetLocation);
  const targetCity = extractCityFromLocation(targetLocation);
  
  // Use real listings from Auto.dev if available
  if (marketData?.autoDev?.rawListings && marketData.autoDev.rawListings.length > 0) {
    const rawListings = marketData.autoDev.rawListings;
    
    for (const listing of rawListings) {
      if (!listing.price || listing.price <= 0) continue;
      
      const locationParts: string[] = [];
      if (listing.location?.city) locationParts.push(listing.location.city);
      if (listing.location?.state) locationParts.push(listing.location.state);
      const locationStr = locationParts.length > 0 
        ? locationParts.join(', ')
        : 'Location not specified';
      
      const priority = calculateLocationPriority(
        listing.location?.state,
        listing.location?.city,
        targetState,
        targetCity
      );
      
      listings.push({
        price: listing.price || 0,
        mileage: listing.mileage || 0,
        location: locationStr,
        daysOnMarket: Math.floor(Math.random() * 30) + 1,
        source: listing.dealer ? 'Dealer Listing' : 'Private Party',
        priority: priority
      });
    }
    
    listings.sort((a, b) => {
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return a.price - b.price;
    });
    
    const selectedListings = listings.slice(0, 5).map(({ priority, ...rest }) => rest);
    return selectedListings;
  }
  
  // Fallback: Generate mock listings
  const numListings = 3 + Math.floor(Math.random() * 3);
  const baseMileage = vehicleMileage || 50000;
  
  for (let i = 0; i < numListings; i++) {
    const priceVariation = 0.85 + (Math.random() * 0.3);
    const mileageVariation = 0.8 + (Math.random() * 0.4);
    
    listings.push({
      price: Math.round(estimatedValue * priceVariation),
      mileage: Math.round(baseMileage * mileageVariation),
      location: `${15 + Math.floor(Math.random() * 50)} miles away`,
      daysOnMarket: 5 + Math.floor(Math.random() * 35),
      source: 'Market Estimate'
    });
  }
  
  return listings.sort((a, b) => a.price - b.price);
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const posthog = usePostHog();
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if returning from successful checkout
    const sessionId = searchParams.get("session_id");
    const reportId = searchParams.get("report_id");
    const dbReportId = searchParams.get("id"); // Database report ID
    const canceled = searchParams.get("canceled");

    // First, try to load from database if ID is provided (for saved reports)
    if (dbReportId && isSignedIn && user) {
      setIsLoading(true);
      fetch(`/api/reports/${dbReportId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error("Report not found");
          }
          return res.json();
        })
        .then(data => {
          if (data.report && data.report.report_data) {
            const parsedResult = data.report.report_data as VerdictResult;
            setResult(parsedResult);
            setIsLoading(false);
            console.log('[Report] Loaded from database:', dbReportId);
            
            // Track report viewed
            posthog?.capture("report_viewed", {
              report_id: dbReportId,
              verdict: parsedResult.verdict,
              tier: parsedResult.tier || "free",
              source: "database",
            });
          } else {
            throw new Error("Invalid report data");
          }
        })
        .catch(err => {
          console.error("[Report] Error loading from database:", err);
          setError("Failed to load report. It may have been deleted or you may not have access.");
          setIsLoading(false);
        });
      return;
    }

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
            
            // Generate market pricing analysis if missing
            if (!upgradedResult.marketPricingAnalysis && upgradedResult.marketData && upgradedResult.vehicleInfo?.askingPrice) {
              const pricingAnalysis = analyzeMarketPricing(
                upgradedResult.marketData,
                upgradedResult.vehicleInfo.askingPrice,
                undefined, // location not available in stored report
                upgradedResult.marketData.autoDev?.rawListings
              );
              
              if (pricingAnalysis) {
                upgradedResult = {
                  ...upgradedResult,
                  marketPricingAnalysis: pricingAnalysis,
                };
                console.log('[Report] Generated market pricing analysis on upgrade:', {
                  hasAnalysis: !!pricingAnalysis,
                  comparableCount: pricingAnalysis.comparableCount
                });
              }
            }
            
            // Generate comparable listings if missing
            if (!upgradedResult.comparableListings && upgradedResult.marketData) {
              // Try to get location from stored report (may not be available in old reports)
              const storedLocation = (upgradedResult as any).location || undefined;
              const comparableListings = generateComparableListingsFromMarketData(
                upgradedResult.marketData,
                upgradedResult.vehicleInfo?.estimatedValue || 0,
                upgradedResult.vehicleInfo?.mileage,
                storedLocation
              );
              
              if (comparableListings.length > 0) {
                upgradedResult = {
                  ...upgradedResult,
                  comparableListings: comparableListings,
                };
                console.log('[Report] Generated comparable listings on upgrade:', {
                  count: comparableListings.length
                });
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
            
            // Track checkout completed
            posthog?.capture("checkout_completed", {
              session_id: sessionId,
              report_id: reportId,
              verdict: upgradedResult.verdict,
            });
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
            
            // Check if market pricing analysis is missing for paid tier
            if (parsedResult.tier === 'paid' && !parsedResult.marketPricingAnalysis && 
                parsedResult.marketData && parsedResult.vehicleInfo?.askingPrice) {
              const pricingAnalysis = analyzeMarketPricing(
                parsedResult.marketData,
                parsedResult.vehicleInfo.askingPrice,
                undefined, // location not available in stored report
                parsedResult.marketData.autoDev?.rawListings
              );
              
              if (pricingAnalysis) {
                const updatedResult: VerdictResult = {
                  ...parsedResult,
                  marketPricingAnalysis: pricingAnalysis,
                };
                
                const updatedData = btoa(encodeURIComponent(JSON.stringify(updatedResult)));
                localStorage.setItem("currentReport", updatedData);
                
                setResult(updatedResult);
                console.log('[Report] Generated missing market pricing analysis:', {
                  hasAnalysis: !!pricingAnalysis,
                  comparableCount: pricingAnalysis.comparableCount
                });
                setIsLoading(false);
                return;
              }
            }
            
            // Check if comparable listings are missing for paid tier
            if (parsedResult.tier === 'paid' && !parsedResult.comparableListings && parsedResult.marketData) {
              // Try to get location from stored report (may not be available in old reports)
              const storedLocation = (parsedResult as any).location || undefined;
              const comparableListings = generateComparableListingsFromMarketData(
                parsedResult.marketData,
                parsedResult.vehicleInfo?.estimatedValue || 0,
                parsedResult.vehicleInfo?.mileage,
                storedLocation
              );
              
              if (comparableListings.length > 0) {
                const updatedResult: VerdictResult = {
                  ...parsedResult,
                  comparableListings: comparableListings,
                };
                
                const updatedData = btoa(encodeURIComponent(JSON.stringify(updatedResult)));
                localStorage.setItem("currentReport", updatedData);
                
                setResult(updatedResult);
                console.log('[Report] Generated missing comparable listings:', {
                  count: comparableListings.length
                });
                setIsLoading(false);
                return;
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
            
            // Track report viewed (free report)
            posthog?.capture("report_viewed", {
              verdict: parsedResult.verdict,
              tier: parsedResult.tier || "free",
              source: "localStorage",
            });
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
  }, [searchParams, isSignedIn, user]);

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

      const currentReportId = reportId || `report_${Date.now()}`;
      
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: currentReportId,
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
        
        // Track report save failure
        posthog?.capture("report_save_failed", {
          report_id: currentReportId,
          error: errorMessage,
        });
        
        alert(`Failed to save report: ${errorMessage}`);
      } else {
        console.log("[Report] Report saved successfully:", responseData);
        
        // Track report saved successfully
        posthog?.capture("report_saved", {
          report_id: currentReportId,
          session_id: sessionId,
          verdict: reportData.verdict,
        });
      }
    } catch (err: any) {
      console.error("[Report] Error saving report to database:", err);
      
      // Track report save error
      posthog?.capture("report_save_error", {
        report_id: reportId || "unknown",
        error: err.message || "Network error",
      });
      
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
        <div className="w-full px-6 md:px-8 lg:px-12 py-8">
          <AnalysisResults result={result} onReset={handleReset} />
        </div>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <AnalysisLoading />
      </>
    }>
      <ReportPageContent />
    </Suspense>
  );
}

