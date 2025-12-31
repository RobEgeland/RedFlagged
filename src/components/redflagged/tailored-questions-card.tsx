"use client";

import { VerdictResult } from "@/types/vehicle";
import { MessageSquare, AlertCircle, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { useState } from "react";

interface TailoredQuestionsCardProps {
  analysis: VerdictResult['tailoredQuestions'];
}

export function TailoredQuestionsCard({ analysis }: TailoredQuestionsCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['critical', 'high']));
  
  if (!analysis || !analysis.questions || analysis.questions.length === 0) {
    return null;
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50/50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700'
        };
      case 'high':
        return {
          bg: 'bg-orange-50/50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-100 text-orange-700'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50/50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50/50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'title-history': 'Title & History',
      'pricing': 'Pricing',
      'maintenance': 'Maintenance',
      'condition': 'Condition',
      'seller': 'Seller',
      'environmental': 'Environmental',
      'general': 'General'
    };
    return labels[category] || category;
  };

  const renderQuestionsByPriority = (questions: typeof analysis.questions, priority: 'critical' | 'high' | 'medium' | 'low') => {
    const priorityQuestions = questions.filter(q => q.priority === priority);
    if (priorityQuestions.length === 0) return null;

    const isExpanded = expandedCategories.has(priority);
    const colors = getPriorityColor(priority);

    return (
      <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
        <button
          onClick={() => toggleCategory(priority)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {getPriorityIcon(priority)}
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 capitalize">
                {priority} Priority ({priorityQuestions.length})
              </h4>
              <p className="text-xs text-gray-600">
                {priority === 'critical' && 'Addresses critical issues that could significantly impact value or safety'}
                {priority === 'high' && 'Important questions about pricing, maintenance, and condition'}
                {priority === 'medium' && 'Additional context and verification questions'}
                {priority === 'low' && 'General questions for complete information'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${colors.badge}`}>
            {isExpanded ? 'Hide' : 'Show'}
          </span>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 pt-2">
            {priorityQuestions.map((question, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {question.question}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>Why this matters:</strong> {question.context}
                      </p>
                      {question.relatedFindings && question.relatedFindings.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.relatedFindings.map((finding, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                            >
                              {finding}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1">
                        {getCategoryLabel(question.category)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-purple-600/10 rounded-lg">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Tailored Questions to Ask</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Report-specific questions based on your vehicle's analysis
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        {/* Questions by Priority */}
        <div className="space-y-4">
          {renderQuestionsByPriority(analysis.questions, 'critical')}
          {renderQuestionsByPriority(analysis.questions, 'high')}
          {renderQuestionsByPriority(analysis.questions, 'medium')}
          {renderQuestionsByPriority(analysis.questions, 'low')}
        </div>

        {/* Tips */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Tip:</strong> These questions are tailored specifically to this vehicle based on the analysis findings. 
            Use them as a guide during your conversation with the seller, but adapt them to your own communication style. 
            The context provided explains why each question matters for this particular vehicle.
          </p>
        </div>
      </div>
    </div>
  );
}


