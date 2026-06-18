import { useState, useEffect } from 'react';
import { Eye, MousePointerClick, ScrollText, Flame, AlertTriangle, Sparkles, Play, Loader2, RefreshCw, ChevronLeft } from 'lucide-react';
import { fetchSessionEvents, generateSessionSummary, type EventData } from '../api';

const EVENT_ICONS: Record<string, { icon: typeof Eye; color: string; bg: string }> = {
  page_view: { icon: Eye, color: 'text-[#3B3DFF]', bg: 'bg-[#E0E7FF]' },
  click: { icon: MousePointerClick, color: 'text-gray-700', bg: 'bg-gray-100' },
  scroll_depth: { icon: ScrollText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  mouse_move: { icon: MousePointerClick, color: 'text-gray-400', bg: 'bg-gray-50' },
  rage_click: { icon: Flame, color: 'text-[#FF4F40]', bg: 'bg-[#F8D4D4]' },
  dead_click: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
};

interface Props {
  sessionId: string;
  onWatchReplay: () => void;
  onBack?: () => void;
}

export default function SessionDetail({ sessionId, onWatchReplay, onBack }: Props) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    fetchSessionEvents(sessionId)
      .then((data) => {
        setEvents(data.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleGenerateSummary = async (regenerate = false) => {
    setSummaryLoading(true);
    try {
      const data = await generateSessionSummary(sessionId, regenerate);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  function getRelativeTime(ts: string, baseTs: string): string {
    const diff = new Date(ts).getTime() - new Date(baseTs).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `+${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `+${mins}m ${remainSecs}s`;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-8 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-[#3B3DFF]" />
      </div>
    );
  }

  const baseTimestamp = events[0]?.timestamp || '';
  const nonMouseEvents = events.filter(e => e.event_type !== 'mouse_move');

  return (
    <div className="bg-[#0A0A0A] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-gray-800 flex flex-col h-full overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#3B3DFF] rounded-full blur-[80px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4F40] rounded-full blur-[60px] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-gray-800 relative z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold font-playfair tracking-tight text-white">
              Session Details
            </h2>
            <div className="font-mono text-sm text-gray-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3B3DFF] animate-pulse" />
              {sessionId.slice(0, 8)}
            </div>
          </div>
        </div>
        <button
          onClick={onWatchReplay}
          className="hidden items-center gap-2 bg-[#FF4F40] text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-[#FF4F40]/30 hover:bg-red-500 transition-all hover:scale-105"
        >
          <Play size={16} fill="currentColor" /> Watch Replay
        </button>
      </div>

      {/* AI Summary */}
      <div className="p-6 border-b border-gray-800 relative z-10 shrink-0">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#3B3DFF]" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#3B3DFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#3B3DFF]/30">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide uppercase">AI Summary</span>
            </div>
            {summary && (
              <button
                onClick={() => handleGenerateSummary(true)}
                disabled={summaryLoading}
                className="text-xs text-gray-400 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer bg-white/5 px-3 py-1.5 rounded-full transition-colors"
              >
                <RefreshCw size={12} className={summaryLoading ? 'animate-spin' : ''} /> Regenerate
              </button>
            )}
          </div>
          
          <div className="pl-11">
            {summary ? (
              <p className="text-sm text-gray-300 leading-relaxed font-mono">{summary}</p>
            ) : (
              <button
                onClick={() => handleGenerateSummary(false)}
                disabled={summaryLoading}
                className="text-sm text-[#3B3DFF] hover:text-blue-400 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                {summaryLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating insights...
                  </>
                ) : (
                  <>
                    Analyze this session
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10">
        <div className="relative">
          {/* Vertical line connecting events */}
          <div className="absolute top-4 bottom-4 left-[1.15rem] w-px bg-gray-800" />
          
          <div className="space-y-4">
            {nonMouseEvents.map((event, i) => {
              const meta = EVENT_ICONS[event.event_type] || EVENT_ICONS.click!;
              const Icon = meta.icon;
              const isRage = event.event_type === 'rage_click' || event.sub_type === 'rage';
              const isDead = event.event_type === 'dead_click' || event.sub_type === 'dead';

              return (
                <div key={event._id || i} className="flex gap-4 relative group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-gray-800 z-10 transition-transform group-hover:scale-110 ${
                    isRage ? 'bg-[#FF4F40]/20 border-[#FF4F40]/50' :
                    isDead ? 'bg-red-900/50 border-red-500/50' :
                    'bg-gray-900'
                  }`}>
                    <Icon size={16} className={isRage ? 'text-[#FF4F40]' : isDead ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  
                  <div className={`flex-1 min-w-0 bg-white/5 border border-white/5 rounded-[1.5rem] p-4 transition-colors group-hover:bg-white/10 ${
                    isRage ? 'ring-1 ring-[#FF4F40]/30' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </span>
                        {isRage && (
                          <span className="text-[10px] bg-[#FF4F40] text-white font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                            Rage
                          </span>
                        )}
                        {isDead && (
                          <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                            Dead
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded-md">
                        {getRelativeTime(event.timestamp, baseTimestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 truncate font-mono mt-2">
                      <span className="text-[#3B3DFF] bg-[#3B3DFF]/10 px-1.5 py-0.5 rounded">
                        {new URL(event.page_url).pathname}
                      </span>
                      {event.target_tag && ` · ${event.target_tag}`}
                      {event.target_id && `#${event.target_id}`}
                      {event.depth_pct != null && ` · ${event.depth_pct}%`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
