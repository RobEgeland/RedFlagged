import DashboardNavbar from "@/components/dashboard-navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import { InfoIcon, UserCircle, History, FileText, Search, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import Link from "next/link";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="font-display text-3xl font-bold text-charcoal">Dashboard</h1>
            <div className="bg-charcoal/5 text-sm p-3 px-4 rounded-lg text-charcoal/70 flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Welcome back! Manage your reports and account here.</span>
            </div>
          </header>

          {/* Quick Actions */}
          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/#analyze"
              className="p-6 bg-card border border-charcoal/10 rounded-lg card-hover group"
            >
              <div className="p-3 bg-deal/10 rounded-lg inline-block mb-3 group-hover:bg-deal/20 transition-colors">
                <Search className="w-6 h-6 text-deal" />
              </div>
              <h3 className="font-display text-lg font-bold text-charcoal mb-1">New Analysis</h3>
              <p className="text-sm text-charcoal/60">Check a new vehicle deal</p>
            </Link>

            <div className="p-6 bg-card border border-charcoal/10 rounded-lg opacity-60">
              <div className="p-3 bg-charcoal/10 rounded-lg inline-block mb-3">
                <History className="w-6 h-6 text-charcoal/60" />
              </div>
              <h3 className="font-display text-lg font-bold text-charcoal mb-1">Past Reports</h3>
              <p className="text-sm text-charcoal/60">Coming soon</p>
            </div>

            <div className="p-6 bg-card border border-charcoal/10 rounded-lg opacity-60">
              <div className="p-3 bg-charcoal/10 rounded-lg inline-block mb-3">
                <FileText className="w-6 h-6 text-charcoal/60" />
              </div>
              <h3 className="font-display text-lg font-bold text-charcoal mb-1">Saved VINs</h3>
              <p className="text-sm text-charcoal/60">Coming soon</p>
            </div>
          </section>

          {/* Premium Status */}
          <section className="bg-gradient-to-br from-charcoal to-charcoal/95 text-cream rounded-lg p-6 relative overflow-hidden">
            <div className="absolute inset-0 noise-texture pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cream/10 rounded-lg">
                  <Zap className="w-6 h-6 text-caution" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Upgrade to Premium</h3>
                  <p className="text-cream/70 text-sm">Get complete vehicle history and detailed analysis</p>
                </div>
              </div>
              <Link 
                href="/#pricing"
                className="px-6 py-3 bg-cream text-charcoal rounded-lg font-display font-bold hover:bg-cream/90 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </section>

          {/* User Profile Section */}
          <section className="bg-card rounded-lg p-6 border border-charcoal/10">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-charcoal/30" />
              <div>
                <h2 className="font-display font-semibold text-xl text-charcoal">Account</h2>
                <p className="text-sm text-charcoal/60">{user?.emailAddresses[0]?.emailAddress || "No email"}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
