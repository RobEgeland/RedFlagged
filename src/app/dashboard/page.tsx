import DashboardNavbar from "@/components/dashboard-navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import { 
  InfoIcon, 
  UserCircle, 
  History, 
  FileText, 
  Search, 
  Zap,
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { redirect } from "next/navigation";
import { ReportsList } from "@/components/reports-list";
import Link from "next/link";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const user = await currentUser();
  
  // Fetch reports for stats
  let reportsCount = 0;
  let recentReportsCount = 0;
  let verdictBreakdown = { deal: 0, caution: 0, disaster: 0 };
  
  try {
    const supabase = await createClient();
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, verdict, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && reports) {
      reportsCount = reports.length;
      
      // Count reports from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      recentReportsCount = reports.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
      
      // Count verdicts
      reports.forEach(report => {
        if (report.verdict === 'deal') verdictBreakdown.deal++;
        else if (report.verdict === 'caution') verdictBreakdown.caution++;
        else if (report.verdict === 'disaster') verdictBreakdown.disaster++;
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gradient-to-b from-slate-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-4xl font-bold text-charcoal mb-2">
                  Dashboard
                </h1>
                <p className="text-charcoal/60">
                  Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Here's your overview.
                </p>
              </div>
              <Link 
                href="/#analyze"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-deal hover:bg-deal/90 text-white rounded-lg font-semibold transition-colors shadow-sm"
              >
                <Search className="w-5 h-5" />
                New Analysis
              </Link>
            </div>
          </header>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-deal/10 rounded-lg">
                  <FileText className="w-6 h-6 text-deal" />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-1">{reportsCount}</h3>
              <p className="text-sm text-charcoal/60">Total Reports</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-caution/10 rounded-lg">
                  <Clock className="w-6 h-6 text-caution" />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-1">{recentReportsCount}</h3>
              <p className="text-sm text-charcoal/60">Last 30 Days</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-deal/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-deal" />
                </div>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-1">{verdictBreakdown.deal}</h3>
              <p className="text-sm text-charcoal/60">Deal Verdicts</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-disaster/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-disaster" />
                </div>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-1">{verdictBreakdown.caution + verdictBreakdown.disaster}</h3>
              <p className="text-sm text-charcoal/60">Caution/Disaster</p>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold text-charcoal mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                href="/#analyze"
                className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-deal/30 transition-all group"
              >
                <div className="p-3 bg-deal/10 rounded-lg inline-block mb-4 group-hover:bg-deal/20 transition-colors">
                  <Search className="w-6 h-6 text-deal" />
                </div>
                <h3 className="font-display text-lg font-bold text-charcoal mb-2">New Analysis</h3>
                <p className="text-sm text-charcoal/60">Analyze a new vehicle deal</p>
              </Link>

              <Link 
                href="/dashboard#reports"
                className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className="p-3 bg-slate-100 rounded-lg inline-block mb-4 group-hover:bg-slate-200 transition-colors">
                  <History className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="font-display text-lg font-bold text-charcoal mb-2">View Reports</h3>
                <p className="text-sm text-charcoal/60">Browse your saved reports</p>
              </Link>

              <Link 
                href="/#pricing"
                className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-caution/30 transition-all group"
              >
                <div className="p-3 bg-caution/10 rounded-lg inline-block mb-4 group-hover:bg-caution/20 transition-colors">
                  <Shield className="w-6 h-6 text-caution" />
                </div>
                <h3 className="font-display text-lg font-bold text-charcoal mb-2">Upgrade</h3>
                <p className="text-sm text-charcoal/60">Unlock premium features</p>
              </Link>
            </div>
          </section>

          {/* Premium Status */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 relative overflow-hidden border border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-r from-caution/10 to-transparent opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-caution/20 rounded-xl backdrop-blur-sm">
                  <Zap className="w-7 h-7 text-caution" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-white mb-1">Upgrade to Premium</h3>
                  <p className="text-slate-300 text-sm">Get detailed analysis, risk indicators, and advanced insights</p>
                </div>
              </div>
              <Link 
                href="/#pricing"
                className="px-6 py-3 bg-caution hover:bg-caution/90 text-slate-900 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                View Pricing
              </Link>
            </div>
          </section>

          {/* Reports Section */}
          <section id="reports" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-lg">
                  <FileText className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-2xl text-charcoal">Your Reports</h2>
                  <p className="text-sm text-charcoal/60">All your saved vehicle analysis reports</p>
                </div>
              </div>
            </div>
            <ReportsList userId={userId} />
          </section>

          {/* Account Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <UserCircle size={32} className="text-slate-600" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-xl text-charcoal mb-1">Account Information</h2>
                  <p className="text-sm text-charcoal/60">{user?.emailAddresses[0]?.emailAddress || "No email"}</p>
                  {user?.firstName && (
                    <p className="text-sm text-charcoal/60 mt-1">{user.firstName} {user.lastName || ''}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
