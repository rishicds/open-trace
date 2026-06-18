
import { BarChart3, LineChart, Users, ArrowUpRight, ArrowDownRight, Activity, GitMerge } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium">Dashboard</h1>
        <div className="flex gap-2">
          <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-muted-foreground text-sm font-medium">Total Sessions</div>
            <Users size={16} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-semibold mb-2">12,482</div>
          <div className="flex items-center text-sm text-emerald-500">
            <ArrowUpRight size={16} className="mr-1" />
            <span>14% from last week</span>
          </div>
        </div>
        
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-muted-foreground text-sm font-medium">Friction Events</div>
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-semibold mb-2">3,201</div>
          <div className="flex items-center text-sm text-red-500">
            <ArrowUpRight size={16} className="mr-1" />
            <span>5% from last week</span>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-muted-foreground text-sm font-medium">Avg. Drop-off</div>
            <GitMerge size={16} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-semibold mb-2">42.3%</div>
          <div className="flex items-center text-sm text-emerald-500">
            <ArrowDownRight size={16} className="mr-1" />
            <span>2.1% from last week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col h-96">
          <h3 className="font-medium mb-6">Sessions Overview</h3>
          <div className="flex-1 flex items-center justify-center border border-dashed border-border/50 rounded-lg">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <LineChart size={48} className="opacity-50" />
              <span className="text-sm">Chart loading...</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col h-96">
          <h3 className="font-medium mb-6">Top Friction Points</h3>
          <div className="flex-1 flex items-center justify-center border border-dashed border-border/50 rounded-lg">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <BarChart3 size={48} className="opacity-50" />
              <span className="text-sm">Chart loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
