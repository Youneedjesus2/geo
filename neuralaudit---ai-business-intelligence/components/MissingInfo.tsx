import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Paywall } from './Paywall';

interface MissingInfoProps {
  suggestions: string[];
  isLocked: boolean;
  onUpgrade: () => void;
}

export const MissingInfo: React.FC<MissingInfoProps> = ({ suggestions, isLocked, onUpgrade }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-rose-950/10 rounded-lg border border-rose-900/30 overflow-hidden">
        <div className="p-5">
            <h3 className="text-rose-400 font-bold text-sm mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Knowledge Gaps Detected
            </h3>
            
            <Paywall isLocked={isLocked} onUpgrade={onUpgrade} title="Unlock Fixes">
                <ul className="space-y-3">
                    {suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                            <span className="mt-2 w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                            {s}
                        </li>
                    ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-rose-900/30 flex items-center justify-between">
                    <p className="text-xs text-rose-400/80 font-medium">Fixing these gaps improves AI visibility by ~15%</p>
                    <button className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-semibold transition-colors">
                        Apply Fixes
                    </button>
                </div>
            </Paywall>
        </div>
    </div>
  );
};