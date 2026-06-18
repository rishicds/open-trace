import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Friction: 3-second intentional delay for password validation / signup
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 pt-20">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <h2 className="text-3xl font-medium mb-2 tracking-tight">Create an account</h2>
        <p className="text-muted-foreground text-sm mb-8">Start tracking user friction today.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <input 
              type="email" 
              required 
              className="bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-foreground transition-colors"
              placeholder="you@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Password</label>
            <input 
              type="password" 
              required 
              className="bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-foreground transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-foreground text-background font-medium py-3 rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validating...
              </>
            ) : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="#" className="text-foreground hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
