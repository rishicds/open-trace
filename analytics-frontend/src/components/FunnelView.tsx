import { useState, useEffect } from 'react';
import { Plus, Trash2, BarChart3, Loader2, Zap, GitBranch, Play } from 'lucide-react';
import { fetchFunnels, createFunnel, analyzeFunnel, type FunnelData, type FunnelAnalysis } from '../api';

export default function FunnelView() {
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [newName, setNewName] = useState('');
  const [newSteps, setNewSteps] = useState(['', '']);
  const [analysis, setAnalysis] = useState<FunnelAnalysis | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFunnels()
      .then((data) => setFunnels(data.funnels))
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    const validSteps = newSteps.filter(s => s.trim());
    if (!newName.trim() || validSteps.length < 2) return;
    setCreating(true);
    try {
      const funnel = await createFunnel(newName.trim(), validSteps);
      setFunnels(prev => [funnel, ...prev]);
      setNewName('');
      setNewSteps(['', '']);
    } catch (err) {
      console.error('Failed to create funnel:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async (funnelId: string) => {
    setSelectedFunnel(funnelId);
    setLoading(true);
    try {
      const data = await analyzeFunnel(funnelId);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to analyze funnel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Funnel Builder & Saved list in a grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Builder */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3B3DFF]/10 to-transparent opacity-80 rounded-bl-full pointer-events-none" />
          
          <h2 className="text-2xl font-bold font-playfair tracking-tight text-gray-900 mb-6">Build a Funnel</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 pl-1">Funnel Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Checkout Flow"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3B3DFF]/50 focus:border-[#3B3DFF] transition-all shadow-inner"
              />
            </div>
            
            <div className="pt-2">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 pl-1">URL Steps (In Order)</label>
               <div className="space-y-3">
                {newSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 relative">
                    <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-sm font-black text-[#3B3DFF] shrink-0 z-10">
                      {i + 1}
                    </div>
                    {i > 0 && <div className="absolute left-5 -top-3 w-0.5 h-3 bg-gray-200 -z-0"></div>}
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const updated = [...newSteps];
                        updated[i] = e.target.value;
                        setNewSteps(updated);
                      }}
                      placeholder={`Step ${i + 1} URL (e.g., /pricing)`}
                      className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B3DFF]/50 transition-all shadow-sm"
                    />
                    {newSteps.length > 2 && (
                      <button
                        onClick={() => setNewSteps(prev => prev.filter((_, j) => j !== i))}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-[#FF4F40] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-50">
              <button
                onClick={() => setNewSteps(prev => [...prev, ''])}
                className="text-sm text-[#3B3DFF] hover:text-blue-800 font-bold flex items-center gap-2 cursor-pointer bg-blue-50 px-4 py-2 rounded-full transition-colors"
              >
                <Plus size={16} strokeWidth={3}/> Add Step
              </button>
              
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || newSteps.filter(s => s.trim()).length < 2}
                className="bg-[#FF4F40] hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-[#FF4F40]/30 hover:shadow-[#FF4F40]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                Save Funnel
              </button>
            </div>
          </div>
        </div>

        {/* Saved Funnels List */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-8 flex flex-col">
          <h2 className="text-2xl font-bold font-playfair tracking-tight text-gray-900 mb-6">Saved Funnels</h2>
          
          {funnels.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-[1.5rem] flex flex-col items-center justify-center text-gray-400 p-6">
              <GitBranch size={32} className="mb-2 text-gray-300" />
              <p className="font-bold text-gray-500">No funnels yet</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {funnels.map((funnel) => (
                <div
                  key={funnel._id}
                  className={`p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer group ${
                    selectedFunnel === funnel._id
                      ? 'border-[#3B3DFF] bg-[#3B3DFF] text-white shadow-xl shadow-[#3B3DFF]/20 transform scale-[1.02]'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => handleAnalyze(funnel._id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-black text-lg ${selectedFunnel === funnel._id ? 'text-white' : 'text-gray-900'}`}>
                        {funnel.name}
                      </h3>
                      <p className={`text-xs mt-1 font-mono ${selectedFunnel === funnel._id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {funnel.steps.length} STEPS
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      selectedFunnel === funnel._id ? 'bg-white/20 text-white' : 'bg-white text-[#3B3DFF] shadow-sm'
                    }`}>
                      {loading && selectedFunnel === funnel._id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results (Scrapbook style overlap) */}
      {analysis && (
        <div className="relative mt-12">
          {/* Wavy Faux Divider overlapping the top */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full border border-gray-100 shadow-md z-20 flex items-center gap-2 text-sm font-bold text-[#FF4F40]">
            <Zap size={16} fill="currentColor" /> Analysis Complete
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-10 pt-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-playfair font-bold text-gray-900 tracking-tighter mb-2">{analysis.name}</h2>
                <p className="text-gray-500 font-medium">Tracking conversion across {analysis.steps.length} sequential steps.</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Conversion</p>
                <p className="text-5xl font-black text-[#3B3DFF] tracking-tighter leading-none">{analysis.overall_conversion_pct}%</p>
              </div>
            </div>

            {/* Stepped bar chart */}
            <div className="space-y-6">
              {analysis.steps.map((step, i) => {
                const maxSessions = analysis.steps[0]?.sessions || 1;
                const widthPct = (step.sessions / maxSessions) * 100;
                const prevStep = analysis.steps[i - 1];
                const dropOff = prevStep ? Math.round((1 - step.sessions / prevStep.sessions) * 1000) / 10 : 0;

                return (
                  <div key={step.step} className="relative group">
                    {i > 0 && dropOff > 0 && (
                      <div className="absolute right-0 -top-4 bg-white z-10 px-3 py-1 rounded-full shadow-md border border-gray-50 text-xs font-bold text-[#FF4F40] transform translate-x-4 hover:scale-110 transition-transform cursor-default">
                        ↓ {dropOff}% Drop-off
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-gray-200 hover:bg-white transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl font-black text-gray-300 shrink-0">
                        0{step.step}
                      </div>
                      
                      <div className="flex-1 pr-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-gray-800">
                            {(() => { try { return new URL(step.url).pathname; } catch { return step.url; } })()}
                          </span>
                          <span className="text-xl font-black text-gray-900">
                            {step.pct_of_start}%
                          </span>
                        </div>
                        
                        <div className="h-10 bg-gray-200 rounded-xl overflow-hidden relative shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-[#3B3DFF] to-[#6366f1] rounded-xl transition-all duration-1000 ease-out flex items-center justify-end pr-4"
                            style={{ width: `${Math.max(widthPct, 4)}%` }}
                          >
                            <span className="text-xs font-black text-white drop-shadow-md">
                              {step.sessions}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
