import React from 'react';
import { Lock, Zap } from 'lucide-react';

interface PaywallProps {
  isLocked: boolean;
  children: React.ReactNode;
  onUpgrade: () => void;
  title?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ isLocked, children, onUpgrade, title = "Unlock Premium Insights" }) => {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="filter blur-sm select-none pointer-events-none opacity-50" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-[2px]">
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="bg-zinc-900 p-3 rounded-full mb-3 border border-zinc-800">
                <Lock className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 mb-4">
                Upgrade to the <span className="text-emerald-400 font-semibold">Pro Plan</span> to view detailed discrepancies and actionable fixes for your business.
            </p>
            <button 
                onClick={onUpgrade}
                className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition-all"
            >
                <Zap className="w-4 h-4 fill-current" />
                Upgrade Now
            </button>
        </div>
      </div>
    </div>
  );
};
