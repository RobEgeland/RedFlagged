"use client";

import { useState } from "react";
import { 
  Zap, 
  Check, 
  X,
  Shield,
  FileText,
  TrendingUp,
  AlertTriangle,
  Wrench,
  Share2,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpgradePromptProps {
  reportId?: string;
}

const freeFeatures = [
  { name: "Basic verdict (Deal/Caution/Disaster)", included: true },
  { name: "Price vs. market comparison", included: true },
  { name: "Top 3 red flags", included: true },
  { name: "5 questions to ask seller", included: true },
  { name: "Full vehicle history deep-dive", included: false },
  { name: "Accident & title risk signals", included: false },
  { name: "Flood & lemon indicators", included: false },
  { name: "Ownership pattern analysis", included: false },
  { name: "30-day shareable report link", included: false },
];

const premiumFeatures = [
  { icon: FileText, name: "Complete vehicle history analysis" },
  { icon: AlertTriangle, name: "Accident, title, flood & lemon indicators" },
  { icon: TrendingUp, name: "Detailed market pricing comparables" },
  { icon: Wrench, name: "Maintenance risk assessment" },
  { icon: Share2, name: "Shareable report link (30 days)" },
];

export function UpgradePrompt({ reportId }: UpgradePromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: reportId || "unknown",
          amount: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      alert(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Card Prompt */}
      <div className="bg-gray-900 text-white rounded-xl p-6 md:p-8 animate-fade-in-up shadow-[0_2px_16px_rgba(0,0,0,0.12)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Zap className="w-6 h-6 text-caution" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold leading-tight mb-1">
                Unlock Full Report
              </h3>
              <p className="text-white/70 text-base">
                Get the complete picture before you buy
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3.5 mb-6">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className="w-5 h-5 text-caution flex-shrink-0" />
                <span className="text-sm text-white/85">{feature.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-gray-900 hover:bg-gray-50 font-semibold text-lg px-8 py-6 rounded-lg shadow-md hover:scale-[1.01] transition-all"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Get Premium Report — $20
              </span>
            </Button>
            <p className="text-xs text-white/60">
              One-time payment. No subscription.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">
              Free vs. Premium Report
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6">
            {/* Comparison Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="p-4 text-sm font-semibold text-gray-600">Feature</div>
                <div className="p-4 text-center border-l border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">Free</span>
                </div>
                <div className="p-4 text-center border-l border-gray-200 bg-deal/5">
                  <span className="text-sm font-semibold text-deal">Premium</span>
                </div>
              </div>

              {/* Features */}
              {freeFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-3 ${
                    index < freeFeatures.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="p-3 text-sm text-gray-700">{feature.name}</div>
                  <div className="p-3 flex justify-center items-center border-l border-gray-100">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-deal" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="p-3 flex justify-center items-center border-l border-gray-100 bg-deal/5">
                    <Check className="w-5 h-5 text-deal" />
                  </div>
                </div>
              ))}
            </div>

            {/* Price & CTA */}
            <div className="mt-8 text-center">
              <div className="mb-4">
                <span className="font-mono text-4xl font-semibold text-gray-900">$20</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full sm:w-auto bg-deal hover:bg-deal/90 text-white font-semibold text-lg px-12 py-6 rounded-lg shadow-md hover:scale-[1.01] transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Unlock Premium Report
                  </span>
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                Secure checkout powered by Stripe. Report available immediately after payment.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
