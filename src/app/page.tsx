import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { VehicleAnalyzer } from "@/components/redflagged/vehicle-analyzer";
import { 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  MessageSquare,
  Eye,
  CheckCircle2,
  FileQuestion,
  Zap
} from 'lucide-react';

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* Vehicle Analyzer Section */}
      <section className="py-16 md:py-24" id="analyze">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
              Analyze Your Deal
            </h2>
            <p className="text-charcoal/60 max-w-xl mx-auto">
              Enter a VIN or vehicle details to get an instant verdict on whether this deal is worth pursuing.
            </p>
          </div>
          
          <VehicleAnalyzer />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
              How RedFlagged Works
            </h2>
            <p className="text-charcoal/60 max-w-xl mx-auto">
              We do the heavy lifting so you can make confident decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: "01", 
                icon: FileQuestion,
                title: "Enter Vehicle Info", 
                description: "Provide the VIN or basic details (year, make, model) plus the asking price." 
              },
              { 
                step: "02", 
                icon: Zap,
                title: "Instant Analysis", 
                description: "We analyze pricing data, history patterns, and risk factors in seconds." 
              },
              { 
                step: "03", 
                icon: Shield,
                title: "Get Your Verdict", 
                description: "Receive a clear Deal, Caution, or Disaster verdict with actionable insights." 
              },
            ].map((item, index) => (
              <div key={index} className="relative p-6 bg-background rounded-lg border border-charcoal/10 card-hover">
                <span className="font-mono text-4xl font-bold text-charcoal/10 absolute top-4 right-4">
                  {item.step}
                </span>
                <div className="p-3 bg-charcoal/5 rounded-lg inline-block mb-4">
                  <item.icon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">{item.title}</h3>
                <p className="text-charcoal/60 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Check Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
              What We Check
            </h2>
            <p className="text-charcoal/60 max-w-xl mx-auto">
              RedFlagged goes beyond traditional history reports to catch what others miss.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: DollarSign, title: "Price vs. Market", description: "Is it overpriced, fairly priced, or suspiciously cheap?" },
              { icon: AlertTriangle, title: "Hidden Red Flags", description: "Data gaps, suspicious relisting, and private-sale risks" },
              { icon: Eye, title: "Title & History", description: "Title brands, accident indicators, and ownership patterns" },
              { icon: MessageSquare, title: "Seller Questions", description: "Specific questions to ask based on detected flags" },
            ].map((feature, index) => (
              <div key={index} className="p-5 bg-card rounded-lg border border-charcoal/10 card-hover">
                <div className="p-2 bg-charcoal/5 rounded inline-block mb-3">
                  <feature.icon className="w-5 h-5 text-charcoal" />
                </div>
                <h3 className="font-display text-lg font-bold text-charcoal mb-1">{feature.title}</h3>
                <p className="text-charcoal/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-24 bg-charcoal text-cream relative overflow-hidden">
        {/* Noise texture */}
        <div className="absolute inset-0 noise-texture pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Transparency Over Perfection
            </h2>
            <p className="text-xl text-cream/80 mb-8 leading-relaxed">
              We believe a report that says &ldquo;We couldn&apos;t verify this&rdquo; is more trustworthy than one that pretends to know everything. 
              That&apos;s why every RedFlagged analysis clearly shows what we know, what we don&apos;t, and how those gaps affect our confidence.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { stat: "Free", label: "Basic verdict & flags" },
                { stat: "$20", label: "One-time premium report" },
                { stat: "0", label: "Recurring fees or subscriptions" },
              ].map((item, index) => (
                <div key={index} className="p-4">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-caution mb-1">{item.stat}</div>
                  <div className="text-sm text-cream/60">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 md:py-24 bg-card" id="pricing">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
                Free vs. Premium
              </h2>
              <p className="text-charcoal/60 max-w-xl mx-auto">
                The free analysis gives you the essentials. Premium unlocks the full picture.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tier */}
              <div className="p-6 md:p-8 bg-background rounded-lg border border-charcoal/20">
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-bold text-charcoal mb-1">Free</h3>
                  <p className="text-charcoal/60 text-sm">Build trust before you buy</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Deal / Caution / Disaster verdict",
                    "Price vs. market comparison",
                    "Top red flags identified",
                    "5 questions to ask the seller",
                    "Transparency disclosure",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-charcoal/80 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-deal flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Tier */}
              <div className="p-6 md:p-8 bg-charcoal rounded-lg text-cream relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-caution text-cream text-xs font-bold">
                  ONE-TIME
                </div>
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-bold mb-1">Premium</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-mono text-4xl font-bold">$20</span>
                    <span className="text-cream/60 text-sm">one-time</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Everything in Free, plus:",
                    "Complete vehicle history deep-dive",
                    "Accident & title risk signals",
                    "Flood & lemon indicators",
                    "Ownership pattern analysis",
                    "Detailed market comparables",
                    "30-day shareable report link",
                    "PDF download for your records",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-cream/90 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Ready to make smarter car decisions?
          </h2>
          <p className="text-charcoal/60 mb-8 max-w-2xl mx-auto">
            Stop second-guessing yourself. Get clarity on any private-party used car deal in seconds.
          </p>
          <a 
            href="#analyze" 
            className="inline-flex items-center px-8 py-4 text-cream bg-charcoal rounded-lg hover:bg-charcoal/90 transition-all hover:scale-[1.02] font-display font-bold text-lg"
          >
            Analyze a Deal Now
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
