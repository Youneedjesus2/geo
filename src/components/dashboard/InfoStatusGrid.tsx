import React from 'react';
import { ComparisonData, FieldStatus, ComparisonField } from '@/types/audit';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface InfoStatusGridProps {
  fields: ComparisonData;
}

const StatusIcon = ({ status }: { status: FieldStatus }) => {
  switch (status) {
    case 'MATCH':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'MISMATCH':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case 'MISSING':
      return <XCircle className="w-5 h-5 text-rose-400" />;
  }
};

const StatusLabel = ({ status }: { status: FieldStatus }) => {
    switch (status) {
      case 'MATCH':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Match</span>;
      case 'MISMATCH':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">Mismatch</span>;
      case 'MISSING':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20">Missing</span>;
    }
  };

export const InfoStatusGrid: React.FC<InfoStatusGridProps> = ({ fields }) => {
  // Safety check - return null if fields is undefined, empty object, or incomplete
  if (!fields || 
      typeof fields !== 'object' || 
      Object.keys(fields).length === 0 ||
      !fields.address || 
      !fields.phone || 
      !fields.hours || 
      !fields.description) {
    return null;
  }

  // Ensure order is consistent
  const displayFields: ComparisonField[] = [
      fields.address,
      fields.phone,
      fields.hours,
      fields.description
  ];

  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {displayFields.map((item, idx) => (
        <div key={idx} className="group flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                 <StatusIcon status={item.status} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold text-zinc-200 truncate pr-4" title={item.value}>
                {item.value || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
             <StatusLabel status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
};
