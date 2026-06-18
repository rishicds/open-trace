import React, { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';

export default function Reports() {
  const [exporting, setExporting] = useState<number | null>(null);

  const handleExport = (id: number) => {
    setExporting(id);
    // Friction: Infinite loading state (never completes)
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium">Reports</h1>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900 border-b border-border/50 text-sm text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Report Name</th>
              <th className="px-6 py-4 font-medium">Date Generated</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-sm">
            {[1, 2, 3, 4, 5].map((item) => (
              <tr key={item} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <FileText size={16} className="text-muted-foreground" />
                  Weekly Friction Summary
                </td>
                <td className="px-6 py-4 text-muted-foreground">Oct {item + 10}, 2026</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full text-xs">Ready</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleExport(item)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    {exporting === item ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-foreground" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Export
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
