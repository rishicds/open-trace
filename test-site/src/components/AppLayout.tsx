import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Bell } from 'lucide-react';

export default function AppLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground selection:bg-foreground selection:text-background font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/30 bg-card flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="relative w-6 h-6 rounded-full border-2 border-foreground/60 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full border border-foreground/60" />
            </div>
            <span className="font-bold text-md tracking-tight">ClickBaitr</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-zinc-800 text-foreground' : 'text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground'}`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/30">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <LogOut size={18} />
            Log out
          </Link>
        </div>
      </aside>

      {/* Main App Window */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden bg-background">
        <header className="h-16 min-h-[4rem] border-b border-border/30 flex items-center justify-end px-8 bg-background">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border/50 ml-4 flex items-center justify-center text-sm font-medium">
            JD
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
