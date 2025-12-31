"use client";

import { VerdictResult } from "@/types/vehicle";
import { Wrench, AlertTriangle, CheckCircle2, AlertCircle, ClipboardCheck } from "lucide-react";

interface MaintenanceRiskCardProps {
  assessment: VerdictResult['maintenanceRiskAssessment'];
}

export function MaintenanceRiskCard({ assessment }: MaintenanceRiskCardProps) {
  if (!assessment) {
    return null;
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'elevated':
        return {
          bg: 'bg-orange-50/50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50/50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      default:
        return {
          bg: 'bg-green-50/50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-700'
        };
    }
  };

  const colors = getRiskColor(assessment.overallRisk);
  const Icon = assessment.overallRisk === 'low' ? CheckCircle2 : 
               assessment.overallRisk === 'elevated' ? AlertTriangle : 
               AlertCircle;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50/30';
      case 'medium':
        return 'border-orange-300 bg-orange-50/30';
      default:
        return 'border-gray-300 bg-gray-50/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white p-6 md:p-8 rounded-xl border ${colors.border} shadow-sm`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 ${colors.bg} rounded-lg`}>
          <Wrench className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Maintenance Risk Assessment</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Forward-looking maintenance expectations based on vehicle lifecycle
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overall Risk Level */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colors.badge}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-semibold capitalize">
            {assessment.overallRisk === 'elevated' ? 'Elevated Risk' : 
             assessment.overallRisk === 'medium' ? 'Medium Risk' : 
             'Low Risk'}
          </span>
        </div>

        {/* Classification */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {assessment.classification}
          </p>
        </div>

        {/* Risk Factors */}
        {assessment.riskFactors.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Risk Factors:</h4>
            {assessment.riskFactors.map((factor, index) => (
              <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-900">
                    {factor.component}
                  </h5>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    factor.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    factor.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {factor.riskLevel}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  {factor.description}
                </p>
                {(factor.typicalMileageRange || factor.typicalAgeRange) && (
                  <p className="text-xs text-gray-500 italic">
                    {factor.typicalMileageRange && `Typical range: ${factor.typicalMileageRange}`}
                    {factor.typicalMileageRange && factor.typicalAgeRange && ' • '}
                    {factor.typicalAgeRange && `Age: ${factor.typicalAgeRange}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inspection Focus */}
        {assessment.inspectionFocus.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-gray-600" />
              Inspection Focus Areas
            </h4>
            <div className="space-y-3">
              {assessment.inspectionFocus.map((item, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(item.priority)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getPriorityIcon(item.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-semibold text-gray-900">
                          {item.component}
                        </h5>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Reason:</strong> {item.reason}
                      </p>
                      <p className="text-xs text-gray-700 font-medium">
                        <strong>What to check:</strong> {item.whatToCheck}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buyer Checklist */}
        {assessment.buyerChecklist.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Pre-Purchase Checklist:</h4>
            <ul className="space-y-2">
              {assessment.buyerChecklist.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Note */}
        {assessment.confidenceNote && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Confidence Level:</strong> {assessment.confidence.charAt(0).toUpperCase() + assessment.confidence.slice(1)}. {assessment.confidenceNote}
            </p>
          </div>
        )}

        {/* Important Note */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            <strong>Note:</strong> This assessment provides probabilistic maintenance expectations based on vehicle age, mileage, and ownership patterns. It does not confirm the presence of defects or specific repair needs. This assessment serves to inform buyer preparedness, budgeting expectations, and inspection focus, but does not independently change the overall verdict. Always have a professional pre-purchase inspection performed.
          </p>
        </div>
      </div>
    </div>
  );
}


