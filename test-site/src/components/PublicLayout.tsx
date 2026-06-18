import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { MessageCircle, Share2, Globe } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 md:px-28 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="relative w-7 h-7 rounded-full border-2 border-foreground/60 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border border-foreground/60" />
          </div>
          <span className="font-bold text-lg tracking-tight">ClickBaitr</span>
        </Link>
        
        <div className="hidden md:flex items-center text-muted-foreground text-sm space-x-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>&bull;</span>
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <span>&bull;</span>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <span>&bull;</span>
          <Link to="/signup" className="hover:text-foreground transition-colors">Signup</Link>
        </div>

        <div className="flex items-center gap-3">
          <button className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
            <MessageCircle size={16} />
          </button>
          <button className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
            <Share2 size={16} />
          </button>
          <button className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
            <Globe size={16} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-12 px-8 md:px-28 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-muted-foreground text-sm">© 2026 ClickBaitr. All rights reserved.</p>
        <div className="flex items-center gap-6 text-muted-foreground text-sm">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
