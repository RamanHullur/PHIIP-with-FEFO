import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Calculator, ShieldCheck, Copy, Check } from 'lucide-react';
import { Item, Batch, Prediction, ActionRecommendation } from '../../types/inventory';
import { getExplainRiskAI } from '../../services/ai/geminiClient';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  batch?: Batch;
  prediction?: Prediction;
  action?: ActionRecommendation;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  item,
  batch,
  prediction,
  action,
}) => {
  const [aiText, setAiText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    getExplainRiskAI(item, batch, prediction, action)
      .then(explanation => {
        if (isMounted) {
          setAiText(explanation);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, item, batch, prediction, action]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(aiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskBadgeColor =
    prediction?.riskLevel === 'Critical'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : prediction?.riskLevel === 'High'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : prediction?.riskLevel === 'Medium'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Explainable Decision Intelligence
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${riskBadgeColor}`}>
                  {prediction?.riskLevel || 'Review'} Risk ({prediction?.riskScore || 0}/100)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Transparent mathematical audit & Gemini reasoning for {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Item & Batch Reference Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
            <div>
              <div className="text-slate-400">Batch Number</div>
              <div className="font-semibold text-slate-800 font-mono">{batch?.batchNumber || 'All Batches'}</div>
            </div>
            <div>
              <div className="text-slate-400">Days to Expiry</div>
              <div className="font-semibold text-slate-800">
                {prediction?.daysToExpiry !== undefined ? `${prediction.daysToExpiry} days` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Current Stock</div>
              <div className="font-semibold text-slate-800">{batch?.currentStock?.toLocaleString() || 0} {item.unit}s</div>
            </div>
            <div>
              <div className="text-slate-400">Potential Loss</div>
              <div className="font-semibold text-rose-600 font-mono">
                ₹{prediction?.potentialExpiryLoss ? prediction.potentialExpiryLoss.toLocaleString() : 0}
              </div>
            </div>
          </div>

          {/* Transparent Mathematical Breakdown Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-slate-500" />
              Deterministic Calculation Audit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Consumption Rate:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {prediction?.breakdown?.consumptionVelocityDaily || 50} / day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Days to Expiry:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {prediction?.daysToExpiry || 0} days
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-700 font-medium">Expected Consumption:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {prediction?.forecastConsumption?.toLocaleString() || 0} units
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-slate-500">On-Hand Physical Stock:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {batch?.currentStock?.toLocaleString() || 0} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Minimum Safety Stock:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {item.safetyStock?.toLocaleString() || 0} units
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-rose-600 font-medium">Potential Unused Excess:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {prediction?.potentialExcess?.toLocaleString() || 0} units
                  </span>
                </div>
              </div>
            </div>

            {/* Score Weights Breakdown */}
            {prediction?.breakdown && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">
                  Factor Contributions to Total Risk Score ({prediction.riskScore}/100):
                </div>
                <div className="grid grid-cols-5 gap-2 text-[10px] text-center font-mono">
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Shelf-Life (30%)</div>
                    <div className="font-bold text-slate-700">{prediction.breakdown.expiryRiskScore} pts</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Excess Vol (25%)</div>
                    <div className="font-bold text-slate-700">{prediction.breakdown.excessRiskScore} pts</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Run-Rate (20%)</div>
                    <div className="font-bold text-slate-700">{prediction.breakdown.consumptionRiskScore} pts</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Demand (15%)</div>
                    <div className="font-bold text-slate-700">{prediction.breakdown.forecastRiskScore} pts</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Pending PO (10%)</div>
                    <div className="font-bold text-slate-700">{prediction.breakdown.poRiskScore} pts</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gemini AI Natural Language Rationale */}
          <div className="border border-indigo-100 rounded-xl p-4 bg-gradient-to-b from-indigo-50/40 to-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Gemini Clinical Intelligence Analysis
              </h3>
              <button
                onClick={handleCopy}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-md hover:bg-slate-100 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Analysis'}
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Consulting hospital supply-chain intelligence...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed whitespace-pre-line font-sans">
                {aiText}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Decision-support analysis only. Requires authorized clinical pharmacy sign-off.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
