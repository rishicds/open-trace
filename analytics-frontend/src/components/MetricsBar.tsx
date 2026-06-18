import { useState, useEffect } from 'react';
import { Activity, Users, MousePointerClick, Timer, Flame, BarChart3 } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchMetrics, type MetricsData, SOCKET_URL } from '../api';
import type { TimeRange } from '../pages/DashboardPage';

interface Props {
  timeRange?: TimeRange;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default function MetricsBar({ timeRange }: Props) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricsData = () => {
      setLoading(true);
      fetchMetrics(timeRange?.from, timeRange?.to)
        .then(setMetrics)
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchMetricsData();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    let timeout: ReturnType<typeof setTimeout>;

    socket.on('event', (event: any) => {
      if (event.event_type === 'mouse_move') return;
      clearTimeout(timeout);
      timeout = setTimeout(fetchMetricsData, 1500);
    });

    return () => {
      socket.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/60 backdrop-blur rounded-[2rem] p-4 animate-pulse border border-white/50 shadow-sm">
            <div className="h-4 w-20 bg-gray-200 rounded-full mb-3"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const ragePercent = metrics.total_sessions > 0
    ? (metrics.rage_click_sessions / metrics.total_sessions) * 100
    : 0;

  const cards = [
    {
      label: 'Total Sessions',
      value: metrics.total_sessions.toLocaleString(),
      icon: Users,
      color: 'text-[#3B3DFF]',
      bg: 'bg-[#E0E7FF]',
    },
    {
      label: 'Total Events',
      value: metrics.total_events.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Bounce Rate',
      value: `${metrics.bounce_rate_pct}%`,
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Avg Duration',
      value: formatDuration(metrics.avg_duration_ms),
      icon: Timer,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Rage Sessions',
      value: metrics.rage_click_sessions.toString(),
      icon: Flame,
      color: ragePercent > 10 ? 'text-white' : 'text-[#FF4F40]',
      bg: ragePercent > 10 ? 'bg-[#FF4F40]' : 'bg-[#F8D4D4]',
      warning: ragePercent > 10,
    },
    {
      label: 'Events/Session',
      value: metrics.avg_events_per_session.toString(),
      icon: MousePointerClick,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative rounded-[2rem] p-4 border shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all transform hover:-translate-y-1 ${
            card.warning 
              ? 'bg-[#FF4F40] border-[#FF4F40] text-white shadow-xl shadow-[#FF4F40]/20' 
              : 'bg-white border-white'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.warning ? 'bg-white/20' : card.bg}`}>
              <card.icon size={20} className={card.color} strokeWidth={2.5} />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter ${card.warning ? 'text-white' : 'text-gray-900'}`}>
            {card.value}
          </p>
          <p className={`text-xs font-bold mt-1 ${card.warning ? 'text-white/90' : 'text-gray-500'}`}>
            {card.label}
          </p>
          
          {/* Subtle decorative background element */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-current opacity-[0.03] rounded-bl-full pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
