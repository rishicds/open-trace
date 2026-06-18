import { useState, useMemo } from 'react';
import { LayoutDashboard, Users, Flame as HeatmapIcon, GitBranch, Radio, Clock, ChevronDown } from 'lucide-react';
import MetricsBar from '../components/MetricsBar';
import SessionsList from '../components/SessionsList';
import SessionDetail from '../components/SessionDetail';
import SessionReplay from '../components/SessionReplay';
import HeatmapView from '../components/HeatmapView';
import FunnelView from '../components/FunnelView';
import LiveFeed from '../components/LiveFeed';
import { Link } from 'react-router-dom';

type View = 'sessions' | 'heatmap' | 'funnels' | 'live';
type TimeRangeType = '1h' | '24h' | '7d' | 'custom';

export interface TimeRange {
  from?: string;
  to?: string;
}

const NAV_ITEMS: { key: View; label: string; icon: typeof Users }[] = [
  { key: 'sessions', label: 'Sessions', icon: Users },
  { key: 'heatmap', label: 'Heatmap', icon: HeatmapIcon },
  { key: 'funnels', label: 'Funnels', icon: GitBranch },
  { key: 'live', label: 'Live Stream', icon: Radio },
];

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<View>('sessions');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);

  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const timeRange = useMemo<TimeRange>(() => {
    if (timeRangeType === 'custom') {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : undefined,
        to: customTo ? new Date(customTo).toISOString() : undefined,
      };
    }
    const now = new Date();
    if (timeRangeType === '1h') {
      return { from: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), to: now.toISOString() };
    }
    if (timeRangeType === '24h') {
      return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), to: now.toISOString() };
    }
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to: now.toISOString() };
  }, [timeRangeType, customFrom, customTo]);

  return (
    <div className="fixed inset-0 bg-[#FDFDF8] flex flex-col-reverse md:flex-row text-[#1A1A1A] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Playful background element */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-[#F8D4D4]/40 via-[#E0E7FF]/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-gradient-to-tr from-[#3B3DFF]/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4" />

      {/* Floating Sidebar / Bottom Nav */}
      <aside className="w-full md:w-24 lg:w-64 flex flex-row md:flex-col shrink-0 p-2 md:p-3 lg:p-6 z-50 transition-all duration-300">
        <div className="flex-1 bg-white/90 backdrop-blur-md md:bg-white rounded-2xl md:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-row md:flex-col overflow-hidden relative group">
          {/* Decorative corner */}
          <div className="hidden md:block absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF4F40]/10 to-transparent opacity-80 rounded-bl-full -z-10" />

          {/* Logo */}
          <div className="hidden md:flex items-center justify-center lg:justify-start gap-3 border-b border-gray-50 p-4 lg:p-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B3DFF] to-blue-600 flex items-center justify-center shadow-lg shadow-[#3B3DFF]/30 shrink-0">
              <svg width="14" height="14" viewBox="0 0 256 256" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
            </div>
            <span className="hidden lg:block text-2xl font-playfair font-bold italic tracking-tight text-gray-900">Trace</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start p-1.5 md:p-2 lg:p-3 space-x-1 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex-1 md:flex-none w-full flex flex-col md:flex-row items-center justify-center lg:justify-start gap-1 md:gap-4 rounded-[1rem] md:rounded-[1.5rem] transition-all cursor-pointer ${
                  activeView === item.key
                    ? 'bg-[#3B3DFF] text-white shadow-md md:shadow-lg shadow-[#3B3DFF]/30 md:translate-x-1'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                } py-2 px-1 md:p-3 lg:px-4 lg:py-3.5`}
              >
                <item.icon size={20} className={activeView === item.key ? 'text-white' : 'text-gray-400'} />
                <span className="block md:hidden lg:block text-[10px] md:text-sm font-bold md:font-bold mt-1 md:mt-0 whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 z-10 relative">
        {/* Top bar */}
        <header className="px-4 md:px-6 py-4 md:py-6 lg:py-8 flex items-center justify-between shrink-0 flex-wrap gap-4 bg-[#FDFDF8]/80 backdrop-blur md:bg-transparent z-20">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={24} className="text-[#3B3DFF] hidden md:block" />
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-900 tracking-tight">
              {activeView === 'sessions' && 'User Sessions'}
              {activeView === 'heatmap' && 'Interaction Heatmaps'}
              {activeView === 'funnels' && 'Conversion Funnels'}
              {activeView === 'live' && 'Live Stream'}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 overflow-visible pb-1 md:pb-0 w-full sm:w-auto relative z-30">
            <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm relative">
              <Clock size={16} className="text-gray-400" />
              
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-transparent text-xs md:text-sm font-bold text-gray-700 outline-none cursor-pointer flex items-center gap-1.5"
                >
                  {timeRangeType === '1h' && 'Last 1 Hour'}
                  {timeRangeType === '24h' && 'Last 24 Hours'}
                  {timeRangeType === '7d' && 'Last 7 Days'}
                  {timeRangeType === 'custom' && 'Custom Range...'}
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {[
                        { value: '1h', label: 'Last 1 Hour' },
                        { value: '24h', label: 'Last 24 Hours' },
                        { value: '7d', label: 'Last 7 Days' },
                        { value: 'custom', label: 'Custom Range...' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRangeType(option.value as TimeRangeType);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                            timeRangeType === option.value
                              ? 'bg-gray-50 text-[#3B3DFF] font-bold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {timeRangeType === 'custom' && (
                <div className="flex items-center gap-2 ml-2 border-l border-gray-200 pl-2">
                  <input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="text-[10px] md:text-xs font-medium outline-none bg-gray-50 rounded px-1 md:px-2 py-1"
                  />
                  <span className="text-gray-400 text-[10px] md:text-xs font-medium">to</span>
                  <input
                    type="datetime-local"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="text-[10px] md:text-xs font-medium outline-none bg-gray-50 rounded px-1 md:px-2 py-1"
                  />
                </div>
              )}
            </div>
            <Link to="/" className="shrink-0 text-xs md:text-sm font-bold text-[#FF4F40] hover:text-red-700 bg-white px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer">
              ← Back
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex px-4 pb-4 md:pl-0 md:pb-6 md:pr-6 lg:pb-6 lg:pr-6 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 md:pr-2 space-y-6 overflow-hidden">
            {activeView === 'sessions' && (
              <>
                <div className="shrink-0">
                  <MetricsBar timeRange={timeRange} />
                </div>
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0 overflow-y-auto md:overflow-hidden pb-4 md:pb-0">
                  <div className={`flex flex-col min-h-[400px] md:min-h-0 md:h-full ${selectedSession ? 'hidden xl:flex' : 'flex'}`}>
                    <SessionsList
                      selectedSession={selectedSession}
                      onSelectSession={setSelectedSession}
                      timeRange={timeRange}
                    />
                  </div>
                  <div className={`flex flex-col min-h-[400px] md:min-h-0 md:h-full ${!selectedSession ? 'hidden xl:flex' : 'flex'}`}>
                    {selectedSession ? (
                      <SessionDetail
                        sessionId={selectedSession}
                        onWatchReplay={() => setShowReplay(true)}
                        onBack={() => setSelectedSession(null)}
                      />
                    ) : (
                      <div className="bg-white/80 backdrop-blur rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 h-full p-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={32} className="text-gray-300" />
                          </div>
                          <p className="font-bold text-gray-600">Select a session</p>
                          <p className="text-sm mt-1">Click any session on the left to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeView === 'heatmap' && (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <HeatmapView timeRange={timeRange} />
              </div>
            )}
            {activeView === 'funnels' && (
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                <FunnelView />
              </div>
            )}
            {activeView === 'live' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="max-w-2xl w-full h-full mx-auto">
                  <LiveFeed />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Session Replay Modal */}
      {showReplay && selectedSession && (
        <SessionReplay
          sessionId={selectedSession}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
}
