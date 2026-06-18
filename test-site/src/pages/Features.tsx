
import { PlayCircle, MousePointerClick, GitMerge, Activity, Zap } from 'lucide-react';

export default function Features() {
  return (
    <div className="pt-32 px-8 md:px-28 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-medium tracking-[-2px] mb-6">
          Everything you need to <span className="font-serif italic">optimize</span>.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mb-16">
          Powerful tools designed to uncover friction and boost conversions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50">
            <PlayCircle size={32} className="text-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Session Replay</h3>
              <p className="text-muted-foreground">Watch user sessions as if you were looking over their shoulder.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50">
            <MousePointerClick size={32} className="text-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Heatmaps</h3>
              <p className="text-muted-foreground">See exactly where users click, move, and scroll on every page.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50">
            <GitMerge size={32} className="text-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Conversion Funnels</h3>
              <p className="text-muted-foreground">Track drop-offs step by step and identify bottlenecks.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50">
            <Activity size={32} className="text-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Error Tracking</h3>
              <p className="text-muted-foreground">Capture JS errors and API failures automatically.</p>
            </div>
          </div>

          {/* Friction Point: Dead Click */}
          <div 
            className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50 cursor-pointer hover:bg-white/5 transition-colors group relative overflow-hidden"
            onClick={(e) => {
              e.preventDefault();
              // Intentionally does nothing to trigger dead click tracking
            }}
          >
            <Zap size={32} className="text-foreground group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Advanced Predictor AI &rarr;</h3>
              <p className="text-muted-foreground">Use our beta AI to predict user churn before it happens.</p>
            </div>
            <div className="absolute top-4 right-4 text-xs font-medium bg-foreground/10 text-foreground px-2 py-1 rounded">BETA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
