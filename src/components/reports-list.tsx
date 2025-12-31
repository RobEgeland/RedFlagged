"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictType } from "@/types/vehicle";

interface Report {
  id: string;
  report_id: string;
  vehicle_info: {
    year?: number;
    make?: string;
    model?: string;
    vin?: string;
    askingPrice?: number;
  };
  verdict: VerdictType;
  asking_price: number | null;
  estimated_value: number | null;
  created_at: string;
  report_data: any; // Full VerdictResult
}

interface ReportsListProps {
  userId: string;
}

const verdictConfig = {
  deal: {
    label: "Deal",
    color: "text-deal",
    bgColor: "bg-deal/10",
    borderColor: "border-deal",
    icon: CheckCircle2,
  },
  caution: {
    label: "Caution",
    color: "text-caution",
    bgColor: "bg-caution/10",
    borderColor: "border-caution",
    icon: AlertTriangle,
  },
  disaster: {
    label: "Disaster",
    color: "text-disaster",
    bgColor: "bg-disaster/10",
    borderColor: "border-disaster",
    icon: XCircle,
  },
};

export function ReportsList({ userId }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports");
      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.details || data.error || "Failed to fetch reports");
      }
      
      setReports(data.reports || []);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeletingId(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      // Remove from local state
      setReports(reports.filter((r) => r.id !== reportId));
    } catch (err: any) {
      console.error("Error deleting report:", err);
      alert(err.message || "Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use consistent format to avoid hydration issues
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "—";
    return `$${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal/60">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-disaster/10 border border-disaster/30 rounded-lg p-6 text-center">
        <p className="text-disaster font-semibold mb-2">Error Loading Reports</p>
        <p className="text-sm text-charcoal/60 mb-2">{error}</p>
        {error.includes("table not found") && (
          <div className="bg-charcoal/5 border border-charcoal/20 rounded p-4 mb-4 text-left text-xs">
            <p className="font-semibold mb-2">Setup Required:</p>
            <p className="text-charcoal/70 mb-2">
              The reports table needs to be created in your Supabase database.
            </p>
            <p className="text-charcoal/70">
              Run the migration file: <code className="bg-charcoal/10 px-1 rounded">supabase/migrations/create_reports_table.sql</code>
            </p>
          </div>
        )}
        <Button onClick={fetchReports} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card border border-charcoal/10 rounded-lg p-12 text-center">
        <FileText className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
          No Reports Yet
        </h3>
        <p className="text-sm text-charcoal/60 mb-6">
          Your paid reports will appear here. Purchase a premium report to get started.
        </p>
        <Link href="/#analyze">
          <Button className="bg-deal hover:bg-deal/90 text-white">
            Analyze a Vehicle
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const config = verdictConfig[report.verdict];
        const VerdictIcon = config.icon;
        const vehicleName = report.vehicle_info.make && report.vehicle_info.model
          ? `${report.vehicle_info.year || ''} ${report.vehicle_info.make} ${report.vehicle_info.model}`.trim()
          : report.vehicle_info.vin || "Unknown Vehicle";

        // Use database ID instead of encoding full data (prevents 431 errors for large reports)
        const viewUrl = `/report?id=${report.id}`;

        return (
          <div
            key={report.id}
            className={`bg-card border-2 ${config.borderColor} rounded-lg p-6 hover:shadow-lg transition-all`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${config.bgColor} rounded-lg`}>
                    <VerdictIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-charcoal truncate">
                      {vehicleName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-charcoal/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-charcoal/60 mb-1">Asking Price</p>
                    <p className="font-semibold text-charcoal flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(report.asking_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/60 mb-1">Est. Market Value</p>
                    <p className="font-semibold text-charcoal flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(report.estimated_value)}
                    </p>
                  </div>
                  {report.vehicle_info.vin && (
                    <div>
                      <p className="text-xs text-charcoal/60 mb-1">VIN</p>
                      <p className="font-mono text-sm text-charcoal truncate">
                        {report.vehicle_info.vin}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={viewUrl}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Report
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(report.id)}
                  disabled={deletingId === report.id}
                  className="text-disaster hover:text-disaster hover:bg-disaster/10 border-disaster/30"
                >
                  {deletingId === report.id ? (
                    <span className="w-4 h-4 border-2 border-disaster/30 border-t-disaster rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

