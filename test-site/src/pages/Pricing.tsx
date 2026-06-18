import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [proEnabled, setProEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setProEnabled(true);
    }, 5000); // 5 second intentional delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-32 px-8 md:px-28 min-h-screen">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-medium tracking-[-2px] mb-6">
          Simple, <span className="font-serif italic">transparent</span> pricing.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          Start for free, upgrade when you need more power.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Free Plan */}
          <div className="p-8 rounded-3xl bg-card border border-border/50 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><Check size={18} className="text-muted-foreground"/> 1,000 sessions/mo</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-muted-foreground"/> 1 month retention</li>
            </ul>
            <Link to="/signup" className="w-full py-3 rounded-lg border border-border text-center hover:bg-white/5 transition-colors font-medium">Get Started</Link>
          </div>

          {/* Pro Plan (Friction) */}
          <div className="p-8 rounded-3xl bg-zinc-900 border border-foreground/20 flex flex-col relative overflow-hidden shadow-2xl md:scale-105 z-10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-foreground/50 to-foreground" />
            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-6">$49<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><Check size={18} /> 50,000 sessions/mo</li>
              <li className="flex items-center gap-3"><Check size={18} /> 6 months retention</li>
              <li className="flex items-center gap-3"><Check size={18} /> Rage & Dead Click Tracking</li>
            </ul>
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors ${proEnabled ? 'bg-foreground text-background hover:scale-[1.02]' : 'bg-foreground/50 text-background/50 cursor-pointer'}`}
              onClick={(e) => {
                if (!proEnabled) {
                  e.preventDefault();
                  // Intentional rage click trap - does not navigate
                } else {
                  navigate("/signup");
                }
              }}
            >
              Choose Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 rounded-3xl bg-card border border-border/50 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-6">Custom</div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><Check size={18} className="text-muted-foreground"/> Unlimited sessions</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-muted-foreground"/> Custom retention</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-muted-foreground"/> Dedicated support</li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-border text-center hover:bg-white/5 transition-colors font-medium">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}
