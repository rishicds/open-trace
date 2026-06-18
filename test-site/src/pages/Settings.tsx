import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Settings() {
  const [toggles, setToggles] = useState([true, false, true]);

  const handleToggle = (index: number) => {
    // Intentionally bad UX: toggle reverses itself after a brief delay
    const newToggles = [...toggles];
    newToggles[index] = !newToggles[index];
    setToggles(newToggles);

    setTimeout(() => {
      setToggles((prev) => {
        const reset = [...prev];
        reset[index] = !reset[index];
        return reset;
      });
    }, 400); // Reverts after 400ms
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-8 mb-8">
        <h3 className="text-lg font-medium mb-6">Notification Preferences</h3>
        
        <div className="space-y-6">
          {[
            { title: "Weekly Reports", desc: "Receive weekly summaries of your funnel performance." },
            { title: "Rage Click Alerts", desc: "Get instantly notified when a rage click occurs." },
            { title: "Marketing Emails", desc: "Receive news, updates, and promotional content." }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
              
              <button 
                onClick={() => handleToggle(i)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out flex items-center px-1 cursor-pointer ${toggles[i] ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <motion.div 
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: toggles[i] ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
