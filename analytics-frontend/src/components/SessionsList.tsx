import { useState, useEffect } from 'react';
import { Flame, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchSessions, type SessionData } from '../api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

interface Props {
  selectedSession: string | null;
  onSelectSession: (sessionId: string) => void;
  timeRange?: import('../pages/DashboardPage').TimeRange;
}

export default function SessionsList({ selectedSession, onSelectSession, timeRange }: Props) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rageOnly, setRageOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSessions(page, 20, rageOnly, timeRange?.from, timeRange?.to)
      .then((data) => {
        setSessions(data.sessions);
        setTotalPages(data.pages);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const socket = io('/', { transports: ['websocket', 'polling'] });
    let timeout: ReturnType<typeof setTimeout>;

    socket.on('event', (event: any) => {
      if (event.event_type === 'mouse_move') return;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchSessions(page, 20, rageOnly, timeRange?.from, timeRange?.to)
          .then((data) => {
            setSessions(data.sessions);
            setTotalPages(data.pages);
            setTotal(data.total);
          })
          .catch(console.error);
      }, 1500);
    });

    return () => {
      socket.disconnect();
      clearTimeout(timeout);
    };
  }, [page, rageOnly, timeRange]);

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col h-full overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#E0E7FF] to-transparent opacity-80 rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-gray-50 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-playfair tracking-tight text-gray-900">Session Log</h2>
          <span className="text-sm text-gray-500 font-medium mt-1 inline-block">{total.toLocaleString()} total sessions</span>
        </div>
        <button
          onClick={() => { setRageOnly(!rageOnly); setPage(1); }}
          className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm ${
            rageOnly
              ? 'bg-[#FF4F40] text-white shadow-[#FF4F40]/30 hover:bg-red-600'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Flame size={16} />
          {rageOnly ? 'Showing Rage Only' : 'Filter Rage Clicks'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-3xl bg-white border border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-32 bg-gray-200 rounded-full"></div>
                  <div className="h-3 w-48 bg-gray-100 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <p className="font-bold text-gray-600 text-lg">No sessions found</p>
            <p className="text-sm mt-1">
              {rageOnly ? "Great job! No rage clicks detected." : "Start tracking to see sessions."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => onSelectSession(s.session_id)}
                className={`w-full text-left p-4 rounded-[1.5rem] transition-all cursor-pointer group ${
                  selectedSession === s.session_id
                    ? 'bg-white border-2 border-[#3B3DFF] shadow-lg shadow-[#3B3DFF]/10 scale-[1.02]'
                    : 'bg-white border border-transparent hover:border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-base font-black ${selectedSession === s.session_id ? 'text-[#3B3DFF]' : 'text-gray-800'}`}>
                    {s.session_id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {s.has_rage_click && (
                      <span className="bg-[#F8D4D4] text-[#FF4F40] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#FF4F40]/10">
                        <Flame size={12} strokeWidth={3} /> RAGE
                      </span>
                    )}
                    {s.has_dead_click && (
                      <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                         DEAD
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-500">
                  <span className="text-gray-700">{timeAgo(s.started_at)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{formatDuration(s.duration_ms)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{s.event_count} events</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{s.page_count} pages</span>
                </div>
                {(s.browser || s.os || s.city || s.country) && (
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-400 mt-1.5">
                    {s.browser && <span>{s.browser}</span>}
                    {s.browser && s.os && <span className="w-1 h-1 rounded-full bg-gray-200"></span>}
                    {s.os && <span>{s.os}</span>}
                    {(s.browser || s.os) && s.city && s.country && <span className="w-1 h-1 rounded-full bg-gray-200"></span>}
                    {s.city && s.country && <span className="text-gray-500">{s.city}, {s.country}</span>}
                  </div>
                )}
                {s.max_scroll_pct > 0 && (
                  <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedSession === s.session_id ? 'bg-[#3B3DFF]' : 'bg-gray-300 group-hover:bg-[#3B3DFF]/50'
                      }`}
                      style={{ width: `${s.max_scroll_pct}%` }}
                    ></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-white z-10">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
