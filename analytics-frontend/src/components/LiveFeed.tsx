import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Radio, Pause, Play, Eye, MousePointerClick, ScrollText, Flame, AlertTriangle } from 'lucide-react';
import type { EventData } from '../api';

const EVENT_ICONS: Record<string, typeof Eye> = {
  page_view: Eye,
  click: MousePointerClick,
  scroll_depth: ScrollText,
  mouse_move: MousePointerClick,
  rage_click: Flame,
  dead_click: AlertTriangle,
};

export default function LiveFeed() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('event', (event: EventData) => {
      if (pausedRef.current) return;
      if (event.event_type === 'mouse_move') return; // Skip verbose mouse data
      setEvents(prev => [event, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
  }

  function truncateUrl(url: string, maxLen = 25): string {
    try {
      const path = new URL(url).pathname;
      return path.length > maxLen ? path.slice(0, maxLen) + '…' : path;
    } catch {
      return url.slice(0, maxLen);
    }
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </div>
          <span className="text-lg font-bold font-playfair text-gray-900 tracking-tight">Live Stream</span>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border cursor-pointer ${
            paused 
              ? 'bg-[#F8D4D4] text-[#FF4F40] border-[#FF4F40]/20 hover:bg-red-100' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
          title={paused ? "Resume stream" : "Pause stream"}
        >
          {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
        </button>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <Radio size={24} className="animate-pulse text-[#3B3DFF]" />
            </div>
            <p className="font-bold text-sm">Awaiting activity...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => {
              const Icon = EVENT_ICONS[event.event_type] || MousePointerClick;
              const isRage = event.event_type === 'rage_click' || event.sub_type === 'rage';
              const isDead = event.event_type === 'dead_click' || event.sub_type === 'dead';

              return (
                <div
                  key={`${event._id || i}-${event.timestamp}`}
                  className={`flex flex-col gap-2 p-3.5 rounded-2xl text-sm transition-all shadow-sm ${
                    isRage
                      ? 'bg-[#FF4F40] text-white shadow-md shadow-[#FF4F40]/20'
                      : isDead
                      ? 'bg-white border border-red-200 shadow-sm'
                      : 'bg-white border border-gray-100 hover:border-[#3B3DFF]/30 hover:shadow-md'
                  }`}
                  style={isRage && i === 0 ? { animation: 'pulse 2s ease-in-out' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isRage ? 'bg-white/20' : isDead ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <span className={`font-bold capitalize ${isRage ? 'text-white' : 'text-gray-800'}`}>
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`font-mono text-xs ${isRage ? 'text-white/80' : 'text-gray-400'}`}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pl-10">
                    <span className={`truncate text-xs font-medium ${isRage ? 'text-white/90' : 'text-gray-600'}`}>
                      {truncateUrl(event.page_url)}
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${isRage ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {event.session_id.slice(0, 6)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
