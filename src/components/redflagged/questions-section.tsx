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
              {isFree ? 'Essential questions to ask the seller' : 'Use these when talking to the seller'}
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
        {(isFree ? questions.slice(0, 2) : questions).map((question, index) => (
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
      {isFree && questions.length > 2 && (
        <div className="mt-6 p-4 bg-caution/10 border border-caution/30 rounded-lg text-center">
          <p className="text-sm text-charcoal/70">
            {questions.length - 2} more question{questions.length - 2 === 1 ? '' : 's'} available. 
            <a href="#upgrade" className="text-caution font-semibold ml-1 hover:underline">
              Upgrade to Premium
            </a> to see all questions.
          </p>
        </div>
      )}

      {/* Tip */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
          💡 Tip: {isFree ? 'These essential questions help you verify key information. Upgrade for a complete list of contextual questions.' : 'Screenshot or copy these questions to have them ready when you meet the seller.'}
          </p>
        </div>
    </div>
  );
}
