import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchHeatmap, fetchDistinctUrls, type HeatmapPoint } from '../api';
import { Loader2, Flame, Map } from 'lucide-react';
import type { TimeRange } from '../pages/DashboardPage';

interface Props {
  timeRange?: TimeRange;
}

export default function HeatmapView({ timeRange }: Props) {
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'rage' | 'dead'>('all');
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const WIDTH = 1280;
  const HEIGHT = 800;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = (width - 48) / WIDTH;
        const scaleY = (height - 48) / HEIGHT;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchDistinctUrls()
      .then((data) => {
        setUrls(data.urls);
        if (data.urls.length > 0) setSelectedUrl(data.urls[0]!);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedUrl) return;
    setLoading(true);
    fetchHeatmap(selectedUrl, filterType, timeRange?.from, timeRange?.to)
      .then((data) => {
        setPoints(data.points);
        setTotalClicks(data.total_clicks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUrl, filterType, timeRange]);

  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (points.length === 0) return;

    // KDE heatmap using OffscreenCanvas
    const offscreen = document.createElement('canvas');
    offscreen.width = WIDTH;
    offscreen.height = HEIGHT;
    const octx = offscreen.getContext('2d')!;
    octx.globalCompositeOperation = 'lighter';

    for (const { x, y } of points) {
      const grad = octx.createRadialGradient(x, y, 0, x, y, 35);
      grad.addColorStop(0, 'rgba(255,0,0,0.15)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      octx.fillStyle = grad;
      octx.beginPath();
      octx.arc(x, y, 35, 0, Math.PI * 2);
      octx.fill();
    }

    // Map density to color ramp
    const imageData = octx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const density = data[i]! / 255;
      if (density < 0.01) {
        data[i + 3] = 0; 
        continue;
      }
      
      // Color ramp matching the playful brand: Blue -> Green -> Yellow -> Coral Red
      if (density < 0.25) {
        const t = density / 0.25;
        data[i] = Math.round(59 * (1 - t) + 0 * t); // R: 3B -> 00
        data[i + 1] = Math.round(61 * (1 - t) + 200 * t); // G: 3D -> C8
        data[i + 2] = Math.round(255 * (1 - t) + 100 * t); // B: FF -> 64
      } else if (density < 0.5) {
        const t = (density - 0.25) / 0.25;
        data[i] = Math.round(0 * (1 - t) + 255 * t); // R -> FF
        data[i + 1] = Math.round(200 * (1 - t) + 200 * t); // G -> C8
        data[i + 2] = Math.round(100 * (1 - t) + 0 * t); // B -> 0
      } else {
        const t = (density - 0.5) / 0.5;
        data[i] = 255; // R: FF
        data[i + 1] = Math.round(200 * (1 - t) + 79 * t); // G: C8 -> 4F
        data[i + 2] = Math.round(0 * (1 - t) + 64 * t); // B: 0 -> 40 (Coral red is FF4F40)
      }
      data[i + 3] = Math.round(Math.min(1, density * 3) * 200);
    }
    octx.putImageData(imageData, 0, 0);
    ctx.drawImage(offscreen, 0, 0);

    // Overlay rage clicks as solid coral red rings
    const ragePoints = points.filter(p => p.sub_type === 'rage');
    for (const { x, y } of ragePoints) {
      ctx.strokeStyle = '#FF4F40';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [points]);

  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  return (
    <div className="h-full bg-white rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col overflow-hidden relative">
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-white p-3 md:p-6 shrink-0 z-10 flex flex-col min-h-0">
          <div className="hidden md:flex items-center gap-3 mb-6 shrink-0">
            <Map className="text-[#3B3DFF]" />
            <h2 className="text-xl font-bold font-playfair">Target Page</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar md:pr-2 flex flex-row md:flex-col gap-2 md:gap-2">
            {loading && urls.length === 0 ? (
              <div className="animate-pulse space-y-3 w-full">
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
              </div>
            ) : urls.map(url => {
              const isSelected = selectedUrl === url;
              return (
                <button
                  key={url}
                  onClick={() => setSelectedUrl(url)}
                  className={`shrink-0 md:w-full text-left px-4 py-2 rounded-xl transition-all font-bold text-xs md:text-sm border-2 ${
                    isSelected 
                      ? 'bg-white border-[#3B3DFF] text-[#3B3DFF] shadow-sm transform scale-[1.01]' 
                      : 'bg-transparent border-transparent text-gray-600 hover:bg-white hover:border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {(() => {
                    try {
                      return new URL(url).pathname || '/';
                    } catch {
                      return url;
                    }
                  })()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative flex flex-col min-w-0 bg-[#FDFDF8]">
          {/* Top Toolbar */}
          <div className="flex items-center justify-center pt-4 md:pt-6 shrink-0 z-20 px-2">
            <div className="flex items-center flex-wrap justify-center gap-2 md:gap-4 bg-white/90 backdrop-blur p-1.5 md:p-2 rounded-2xl shadow-xl shadow-[#3B3DFF]/5 border border-gray-200 w-full sm:w-auto">
            <div className="flex bg-gray-100/80 rounded-xl p-1">
              {(['all', 'rage', 'dead'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    filterType === type
                      ? type === 'rage' 
                        ? 'bg-[#FF4F40] text-white shadow-sm' 
                        : 'bg-[#3B3DFF] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {type === 'all' ? 'All Clicks' : type === 'rage' ? 'Rage🔥' : 'Dead💀'}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

            <div className="flex items-center justify-center gap-2 md:gap-3 px-2 md:px-3 py-1 w-full sm:w-auto">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-[#FF4F40] animate-pulse'}`}></div>
              {totalClicks > 0 ? (
                <span className="text-xs md:text-sm font-black text-gray-800">{totalClicks.toLocaleString()} <span className="font-medium text-gray-500 hidden sm:inline">interactions</span></span>
              ) : (
                <span className="text-xs md:text-sm font-bold text-gray-400">No data</span>
              )}
              {loading && <Loader2 size={14} className="animate-spin text-[#3B3DFF]" />}
            </div>
          </div>
        </div>

        {/* Canvas Wrapper */}
        <div ref={containerRef} className="relative flex-1 min-h-0 overflow-hidden bg-[#FDFDF8] flex items-center justify-center p-2 md:p-6">
          {points.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center m-auto py-32 text-gray-400">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
                <Flame size={40} className="text-gray-300" />
              </div>
              <p className="font-playfair font-bold text-2xl text-gray-600">No thermal data</p>
              <p className="text-sm mt-2 font-medium">Browse the test site to generate clicks for this page.</p>
            </div>
          ) : (
            <div 
              className="relative m-auto shrink-0" 
              style={{ 
                width: (WIDTH + 32) * scale, 
                height: (HEIGHT + 32) * scale,
                transition: 'width 0.2s, height 0.2s'
              }}
            >
              <div 
                className="absolute top-0 left-0 bg-white p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200 transform-gpu"
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top left',
                  width: WIDTH + 32,
                  height: HEIGHT + 32,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
              >
                <div className="relative rounded-xl overflow-hidden border border-gray-100" style={{ width: WIDTH, height: HEIGHT }}>
                  <iframe 
                    src={selectedUrl}
                    className="absolute inset-0"
                    style={{ width: `${WIDTH}px`, height: `${HEIGHT}px`, border: 'none', pointerEvents: 'none' }}
                    title="Target Page Background"
                  />
                  <canvas
                    ref={canvasRef}
                    width={WIDTH}
                    height={HEIGHT}
                    className="absolute inset-0 z-10 cursor-crosshair opacity-80"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
