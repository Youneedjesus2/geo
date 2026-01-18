import React, { useState } from 'react';
import { ComparisonData, ComparisonField } from '../types';
import { ChevronDown, ChevronUp, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { Paywall } from './Paywall';

interface DiscrepancyDetailProps {
  fields: ComparisonData;
  isLocked: boolean;
  onUpgrade: () => void;
}

export const DiscrepancyDetail: React.FC<DiscrepancyDetailProps> = ({ fields, isLocked, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(true);
  const mismatches = (Object.values(fields) as ComparisonField[]).filter(f => f.status === 'MISMATCH');

  if (mismatches.length === 0) return null;

  return (
    <div className="w-full bg-yellow-900/10 border border-yellow-700/30 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-yellow-900/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
                <h3 className="text-yellow-500 font-semibold text-sm">Discrepancy Detected</h3>
                <p className="text-yellow-500/70 text-xs">{mismatches.length} fields have conflicting AI data points</p>
            </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-yellow-500" /> : <ChevronDown className="w-5 h-5 text-yellow-500" />}
      </button>

      {isOpen && (
        <Paywall isLocked={isLocked} onUpgrade={onUpgrade} title="See What's Wrong">
            <div className="p-4 border-t border-yellow-700/30 space-y-4">
            {mismatches.map((item, idx) => (
                <div key={idx} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-300 mb-3 border-b border-zinc-800 pb-2">{item.label} Conflict</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                        <Sparkles className="w-3 h-3" /> Gemini
                    </div>
                    <p className="text-sm text-zinc-400 bg-zinc-950/50 p-3 rounded border border-zinc-800/50 font-mono">
                        {item.geminiValue || "No data"}
                    </p>
                    </div>
                    <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                        <Bot className="w-3 h-3" /> ChatGPT
                    </div>
                    <p className="text-sm text-zinc-400 bg-zinc-950/50 p-3 rounded border border-zinc-800/50 font-mono">
                        {item.gptValue || "No data"}
                    </p>
                    </div>
                </div>
                <div className="mt-3 text-xs text-rose-400 font-medium">
                    Recommendation: Standardize this data across all public directories.
                </div>
                </div>
            ))}
            </div>
        </Paywall>
      )}
    </div>
  );
};