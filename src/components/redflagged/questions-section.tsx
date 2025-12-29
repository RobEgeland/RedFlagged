"use client";

import { useState } from "react";
import { Copy, Check, MessageSquare, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisTier } from "@/types/vehicle";

interface QuestionsSectionProps {
  questions: string[];
  tier?: AnalysisTier;
}

export function QuestionsSection({ questions, tier = 'free' }: QuestionsSectionProps) {
  const [copied, setCopied] = useState(false);
  const isFree = tier === 'free';

  const handleCopy = async () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 md:p-8 border-l-4 border-gray-900 animate-fade-in-up relative">
      {/* Lock overlay for free tier */}
      {isFree && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-gray-900/10 backdrop-blur-[2px] z-10 rounded-lg flex items-center justify-center">
          <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">Full Questions List</span>
            </div>
            <p className="text-sm text-gray-600">Upgrade to see all questions</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-900/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">
              Questions to Ask
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isFree ? 'Starter question' : 'Use these when talking to the seller'}
            </p>
          </div>
        </div>
        
        {!isFree && (
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Copy All</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Questions List */}
      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li key={index} className="flex gap-4">
            <span className="font-mono text-lg font-semibold text-gray-400 flex-shrink-0 min-w-[2rem]">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <p className="text-gray-900 text-base md:text-lg leading-relaxed">
              {question}
            </p>
          </li>
        ))}
      </ol>

      {/* Tip */}
      {!isFree && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Tip: Screenshot or copy these questions to have them ready when you meet the seller.
          </p>
        </div>
      )}
    </div>
  );
}
