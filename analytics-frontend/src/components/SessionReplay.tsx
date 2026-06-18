import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipForward } from 'lucide-react';
import { fetchSessionReplay, type ReplaySegment } from '../api';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export default function SessionReplay({ sessionId, onClose }: Props) {
  const [segments, setSegments] = useState<ReplaySegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const playingRef = useRef(false);

  const WIDTH = 1280;
  const HEIGHT = 800;

  useEffect(() => {
    fetchSessionReplay(sessionId)
      .then((data) => setSegments(data.segments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const drawCursor = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x + 5, y + 12);
    ctx.lineTo(x + 10, y + 18);
    ctx.lineTo(x + 13, y + 16);
    ctx.lineTo(x + 8, y + 10);
    ctx.lineTo(x + 14, y + 8);
    ctx.closePath();
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawClick = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, subType: string | null, age: number) => {
    const maxRadius = 30;
    const radius = maxRadius * Math.min(1, age / 300);
    const alpha = Math.max(0, 1 - age / 300);

    if (subType === 'rage') {
      // Triple ripple in amber
      for (let r = 0; r < 3; r++) {
        const rRadius = radius * (1 + r * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, rRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.fill();
    }
  }, []);

  const runReplay = useCallback(() => {
    if (!canvasRef.current || segments.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const segment = segments[currentSegmentIndex];
    if (!segment || !segment.path || segment.path.length === 0) return;

    let frameIndex = currentFrame;
    const totalFrames = segment.path.length;
    const clicks = segment.clicks || [];
    const clickTimestamps: { x: number; y: number; t: number; sub_type: string | null; shownAt: number }[] = [];

    function tick() {
      if (!playingRef.current || !ctx) return;

      if (frameIndex >= totalFrames) {
        // Move to next segment or stop
        if (currentSegmentIndex < segments.length - 1) {
          setCurrentSegmentIndex(prev => prev + 1);
          setCurrentFrame(0);
        } else {
          setPlaying(false);
          playingRef.current = false;
        }
        return;
      }

      const point = segment.path[frameIndex]!;

      // Clear and draw background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw page URL label
      ctx.fillStyle = '#374151';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(new URL(segment.page_url).pathname, 20, 30);

      // Draw trail (last 20 points)
      const trailStart = Math.max(0, frameIndex - 20);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 2;
      for (let i = trailStart; i <= frameIndex; i++) {
        const p = segment.path[i]!;
        if (i === trailStart) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Check for clicks near this time
      for (const click of clicks) {
        if (Math.abs(click.t - point.t) < 200 && !clickTimestamps.find(c => c.t === click.t)) {
          clickTimestamps.push({ ...click, shownAt: Date.now() });
        }
      }

      // Draw active click ripples
      const now = Date.now();
      for (const click of clickTimestamps) {
        const age = now - click.shownAt;
        if (age < 600) {
          drawClick(ctx, click.x, click.y, click.sub_type, age);
        }
      }

      // Draw cursor
      drawCursor(ctx, point.x, point.y);

      frameIndex++;
      setCurrentFrame(frameIndex);
      setProgress(frameIndex / totalFrames);

      animRef.current = window.setTimeout(tick, 100 / speed);
    }

    tick();
  }, [segments, currentSegmentIndex, currentFrame, speed, drawCursor, drawClick]);

  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      runReplay();
    } else {
      playingRef.current = false;
      clearTimeout(animRef.current);
    }
    return () => clearTimeout(animRef.current);
  }, [playing, runReplay]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const segment = segments[currentSegmentIndex];
    if (segment) {
      const frame = Math.floor(pct * segment.path.length);
      setCurrentFrame(frame);
      setProgress(pct);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900">Session Replay</h3>
            <span className="font-mono text-sm text-gray-500">{sessionId.slice(0, 8)}</span>
            {segments[currentSegmentIndex] && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                {new URL(segments[currentSegmentIndex]!.page_url).pathname}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas */}
        <div className="bg-gray-50 flex items-center justify-center overflow-auto" style={{ maxHeight: '60vh' }}>
          {loading ? (
            <div className="py-24 text-gray-400">Loading replay data…</div>
          ) : segments.length === 0 || (segments[0] && segments[0].path.length === 0) ? (
            <div className="py-24 text-gray-400">No mouse movement data for this session</div>
          ) : (
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-100">
          {/* Scrubber */}
          <div className="mb-3 cursor-pointer" onClick={handleSeek}>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlaying(!playing)}
                disabled={segments.length === 0}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    speed === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Segment indicator */}
            <div className="text-xs text-gray-500 font-medium">
              Segment {currentSegmentIndex + 1} of {segments.length}
              {segments.length > 1 && currentSegmentIndex < segments.length - 1 && (
                <button
                  onClick={() => { setCurrentSegmentIndex(prev => prev + 1); setCurrentFrame(0); setProgress(0); }}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <SkipForward size={14} className="inline" /> Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
