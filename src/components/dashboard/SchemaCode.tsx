import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

interface SchemaCodeProps {
  json: string;
}

export const SchemaCode: React.FC<SchemaCodeProps> = ({ json }) => {
  const [copied, setCopied] = useState(false);

  // Format JSON for display
  let formattedJson = json;
  try {
    const obj = JSON.parse(json);
    formattedJson = JSON.stringify(obj, null, 2);
  } catch (e) {
    // leave as string if parse fails
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <div>
                <h3 className="text-sm font-bold text-zinc-200">Schema.org JSON-LD</h3>
                <p className="text-xs text-zinc-500">Structured data for SEO optimization</p>
            </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#0d1117] custom-scrollbar">
        <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
          <code>{formattedJson}</code>
        </pre>
      </div>
    </div>
  );
};
