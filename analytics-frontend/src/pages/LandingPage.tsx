import React, { useRef, useState, useEffect } from 'react';
import { Zap, Activity, MousePointerClick, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const BG_IMAGE_1 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';
const BG_IMAGE_2 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85';
const SPOTLIGHT_R = 260;

function RevealLayer({ image, cursorX, cursorY }: { image: string; cursorX: number; cursorY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const div = divRef.current;
    if (!canvas || !div) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    const dataUrl = canvas.toDataURL();
    div.style.maskImage = `url(${dataUrl})`;
    div.style.webkitMaskImage = `url(${dataUrl})`;
    div.style.maskSize = '100% 100%';
    div.style.webkitMaskSize = '100% 100%';
  }, [cursorX, cursorY]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
      <div
        ref={divRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
      />
    </>
  );
}

function InteractiveHeatmap() {
  const [clicks, setClicks] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setClicks(prev => [...prev, { x, y }]);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative border border-white/60 transform rotate-1 hover:rotate-0 transition-transform duration-500">
      <div 
        ref={containerRef}
        onClick={handleClick}
        className="bg-gray-50 rounded-2xl aspect-square w-full overflow-hidden relative border border-gray-100 cursor-crosshair group"
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Mock Page Content */}
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6 pointer-events-none">
          <div className="w-1/3 h-4 bg-gray-200 rounded-full mb-8"></div>
          <div className="w-full h-32 bg-gray-100 rounded-lg mb-6"></div>
          <div className="w-1/2 h-4 bg-gray-200 rounded-full mb-4"></div>
          <div className="w-1/4 h-10 bg-[#1A1A1A] rounded-lg mt-10"></div>
        </div>

        {/* Existing KDE Heatmap Overlay */}
        <div className="absolute top-[20%] left-[30%] w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-40 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-20"></div>
        <div className="absolute top-[30%] left-[40%] w-32 h-32 bg-green-400 rounded-full blur-2xl opacity-50 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-20"></div>
        <div className="absolute top-[40%] left-[45%] w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-60 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-20"></div>
        <div className="absolute bottom-[25%] right-[25%] w-20 h-20 bg-[#FF4F40] rounded-full blur-lg opacity-80 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-20"></div>
        
        {/* Interactive Clicks */}
        {clicks.map((click, i) => (
          <div 
            key={`blur-${i}`} 
            className="absolute w-24 h-24 bg-[#FF4F40] rounded-full blur-xl opacity-60 mix-blend-multiply pointer-events-none animate-pulse"
            style={{ left: click.x, top: click.y, transform: 'translate(-50%, -50%)' }}
          ></div>
        ))}
        {clicks.map((click, i) => (
           <div 
             key={`center-${i}`}
             className="absolute w-2 h-2 bg-white border border-[#FF4F40] rounded-full pointer-events-none shadow-sm"
             style={{ left: click.x, top: click.y, transform: 'translate(-50%, -50%)' }}
           ></div>
        ))}

        {/* Faux Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100 flex gap-4 text-xs font-bold text-gray-500 tracking-wider pointer-events-none transition-all">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>VIEWS</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF4F40]"></div>CLICKS {clicks.length > 0 && <span className="text-[#FF4F40]">+{clicks.length}</span>}</div>
        </div>
        
        {/* Helper instruction */}
        {clicks.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl animate-bounce pointer-events-none whitespace-nowrap">
            Click to generate heatmap
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
      setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">Trace</span>
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-white px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer">Features</button>
          <button onClick={() => document.getElementById('heatmaps')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer">Heatmaps</button>
          <button onClick={() => document.getElementById('replay')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer">Session Replay</button>
          <button onClick={() => document.getElementById('funnels')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer">Funnels</button>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 cursor-pointer">
            Sign Up
          </Link>
          <Link to="/dashboard" className="hidden md:block bg-gray-900/50 backdrop-blur text-white text-sm font-bold px-5 py-2 rounded-full border border-white/20 hover:bg-gray-900 cursor-pointer">
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} />

        <h1 className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50 text-white leading-[0.95]">
          <span className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal" style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}>
            See what they
          </span>
          <span className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal" style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}>
            actually do
          </span>
        </h1>

        <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade" style={{ animationDelay: '0.7s' }}>
          <p className="text-sm text-white/80 leading-relaxed">
            Traditional analytics tell you how many people visited. Trace shows you exactly where they clicked, scrolled, and got stuck, revealing the hidden friction in your user journey.
          </p>
        </div>

        <div className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Our tracking captures every interaction, rage click, and drop-off, giving you the power to optimize conversions with AI-driven insights.
          </p>
          <div className="relative inline-block mt-2 w-full sm:w-auto">
            <div className="absolute inset-0 bg-[#e8702a] rounded-full animate-ping opacity-40"></div>
            <Link to="/dashboard" className="relative block text-center bg-[#e8702a] hover:bg-[#d2611f] text-white text-lg font-bold px-10 py-4 rounded-full transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-[#e8702a]/40 cursor-pointer">
              Start Tracking
            </Link>
          </div>
        </div>
      </section>
      {/* Wavy Divider transitioning from Black to Cream */}
      <div className="w-full overflow-hidden leading-none bg-black">
        <svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,93.25,105.47,85.29,157.6,76.5,212.8,67.14,267.8,66,321.39,56.44Z" fill="#FDFDF8"></path>
        </svg>
      </div>

      <main className="bg-[#FDFDF8] text-[#1A1A1A] overflow-hidden">
        {/* Section 1: Features Overview */}
        <section id="features" className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-playfair font-bold text-5xl md:text-7xl tracking-tighter mb-6">Everything you need, <br/><span className="text-[#FF4F40]">nothing you don't.</span></h2>
            <p className="text-xl opacity-70 max-w-2xl mx-auto font-medium">A modern stack designed to give you clarity on user behavior without the bloated complexity of traditional tools.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white rounded-[2rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-shadow duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
              <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-[#FF4F40]/10 via-[#FF4F40]/5 to-transparent rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000 translate-x-1/3 -translate-y-1/3"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF4F40] to-red-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-[#FF4F40]/30 transform group-hover:scale-105 transition-transform duration-500">
                  <Zap size={32} />
                </div>
                <h3 className="text-4xl font-bold mb-4 tracking-tight">Zero-Config Setup</h3>
                <p className="text-xl opacity-70 leading-relaxed max-w-xl">Drop in our 8KB script and instantly start capturing page views, clicks, and scroll depth across your entire web application. No complex tagging plans required.</p>
                
                <div className="mt-10 bg-[#0A0A0A] rounded-2xl w-full border border-gray-800 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4F40] to-red-500"></div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="text-xs font-mono text-gray-500">install.html</div>
                  </div>
                  <div className="p-6 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
                    <code>
                      <span className="text-gray-500">&lt;!-- Paste this snippet in your &lt;head&gt; --&gt;</span>{'\n'}
                      <span className="text-pink-400">&lt;script</span> <span className="text-blue-400">src</span>=<span className="text-green-400">"https://cdn.trace.com/tracker.js"</span> <span className="text-blue-400">defer</span><span className="text-pink-400">&gt;&lt;/script&gt;</span>{'\n'}
                      <span className="text-pink-400">&lt;script&gt;</span>{'\n'}
                      {'  '}window.<span className="text-blue-400">trace</span>.init(<span className="text-green-400">'YOUR_WORKSPACE_ID'</span>);{'\n'}
                      <span className="text-pink-400">&lt;/script&gt;</span>
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group flex-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-100 to-transparent opacity-80 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#3B3DFF] to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#3B3DFF]/30 transform group-hover:scale-105 transition-transform duration-500">
                  <Activity size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Real-Time Feed</h3>
                <p className="opacity-70 text-base leading-relaxed">Watch events stream in live via our ultra-fast WebSocket connection.</p>
                
                <div className="absolute bottom-4 right-4 flex items-end gap-1.5 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                  <div className="w-2 h-8 bg-[#3B3DFF] rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-12 bg-[#3B3DFF] rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-2 h-6 bg-[#3B3DFF] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-16 bg-[#3B3DFF] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
              
              <div className="bg-[#0A0A0A] text-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-800 relative overflow-hidden group flex-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500">
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#3B3DFF] rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl transform group-hover:scale-105 transition-transform duration-500">
                  <Flame size={28} className="text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Rage Clicks</h3>
                <p className="text-gray-400 text-base leading-relaxed relative z-10">Automatically flag user frustration moments and broken elements.</p>
                
                <div className="absolute top-8 right-8 w-12 h-12 rounded-full border border-orange-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700"></div>
              </div>
            </div>

            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group flex-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/30 transform group-hover:scale-105 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Global Time Filters</h3>
                <p className="opacity-70 text-base leading-relaxed">Slice and dice your dashboard instantly. Filter heatmaps, funnels, and sessions by the last hour, 24 hours, week, or a custom range.</p>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group flex-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/30 transform group-hover:scale-105 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Audience Insights</h3>
                <p className="opacity-70 text-base leading-relaxed">Automatically extract detailed device info, operating systems, browsers, and geographic locations (city and country) for every session.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Heatmap Deep Dive */}
        <section id="heatmaps" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8D4D4]/30 to-transparent -skew-y-3 z-0 origin-top-left transform-gpu"></div>
          <div className="max-w-7xl mx-auto px-6 md:px-16 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3B3DFF]/10 to-blue-400/10 rounded-3xl blur-3xl transform -rotate-6 scale-110"></div>
              <InteractiveHeatmap />
            </div>
            
            <div className="order-1 md:order-2 pl-0 md:pl-10">
              <div className="inline-block px-4 py-1.5 bg-white rounded-full text-xs font-bold text-[#FF4F40] tracking-widest mb-6 shadow-sm border border-[#FF4F40]/10 uppercase">Behavioral Insights</div>
              <h2 className="font-playfair font-bold text-5xl md:text-6xl tracking-tighter mb-6 leading-[1.1]">See exactly <br/>where they click.</h2>
              <p className="text-xl opacity-70 mb-10 leading-relaxed font-medium">Our interactive KDE heatmaps map aggregate click density across your pages, visualizing the hottest zones of user interest without slowing down your site.</p>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#FF4F40] shadow-md border border-gray-50 shrink-0 mt-1"><MousePointerClick size={18} /></div> 
                  <div>
                    <span className="block font-bold text-lg">Filter standard vs dead clicks</span>
                    <span className="block opacity-60 text-sm mt-1">Isolate clicks that didn't trigger any interaction.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#FF4F40] shadow-md border border-gray-50 shrink-0 mt-1"><MousePointerClick size={18} /></div> 
                  <div>
                    <span className="block font-bold text-lg">Spot broken CTAs instantly</span>
                    <span className="block opacity-60 text-sm mt-1">See where users expect a link but find text.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Replay & AI */}
        <section id="replay" className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-[#E0E7FF] rounded-full text-xs font-bold text-[#3B3DFF] tracking-widest mb-6 shadow-sm uppercase">AI-Powered Replay</div>
              <h2 className="font-playfair font-bold text-5xl md:text-6xl tracking-tighter mb-6 leading-[1.1]">Understand the <br/>"Why" instantly.</h2>
              <p className="text-xl opacity-70 mb-10 leading-relaxed font-medium">Stop watching hours of full-DOM recordings. Our lightweight mouse-path replay reconstructs sessions, while our generative AI writes a plain-language summary of what happened.</p>
              <Link to="/dashboard" className="bg-white border-2 border-gray-200 hover:border-[#3B3DFF] text-[#1A1A1A] px-8 py-3.5 rounded-full font-bold transition-all flex items-center gap-3 shadow-sm hover:shadow-md cursor-pointer group inline-flex">
                 Open Dashboard <Zap size={18} className="text-[#3B3DFF] group-hover:scale-110 transition-transform"/>
              </Link>
            </div>
            
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#3B3DFF]/20 to-blue-400/20 rounded-[3rem] blur-3xl transform rotate-3 scale-105"></div>
               
               <div className="bg-[#1A1A1A] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative border border-gray-800 overflow-hidden">
                 <div className="bg-white/5 backdrop-blur-md px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-black/50 px-3 py-1.5 rounded-full">
                       <Activity size={12} className="text-[#3B3DFF]"/> session_8f92a1b
                    </div>
                 </div>
                 
                 <div className="p-8">
                    <div className="mb-8">
                      <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                         <span>00:00</span>
                         <span>02:14</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3B3DFF] to-blue-400 w-[65%] rounded-full"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-[20%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-[65%] w-3 h-3 bg-[#FF4F40] rounded-full shadow-[0_0_15px_#FF4F40]"></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 p-6 rounded-2xl border border-gray-700/50 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B3DFF] to-blue-400"></div>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#3B3DFF] to-blue-400 flex items-center justify-center">
                           <Zap size={12} className="text-white"/>
                         </div>
                         <span className="text-white font-bold text-sm">Trace AI Summary</span>
                       </div>
                       <p className="text-sm text-gray-300 leading-relaxed font-mono">
                         The user landed on the homepage and scrolled to 50% before navigating to <span className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded">/pricing</span>. They clicked the 'Buy now' button three times in quick succession <span className="text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">(rage click detected)</span>, then moved to <span className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded">/contact</span> where they abandoned the session.
                       </p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 4: Funnels */}
        <section id="funnels" className="py-32 px-6 md:px-16 max-w-7xl mx-auto text-center">
          <h2 className="font-playfair font-bold text-5xl md:text-7xl tracking-tighter mb-6">Pinpoint exact <span className="text-[#FF4F40]">drop-offs.</span></h2>
          <p className="text-xl opacity-70 max-w-2xl mx-auto mb-20 font-medium">Define multi-step conversion funnels and track percentage drop-off between steps. Discover the exact page where you lose your users.</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center max-w-5xl mx-auto relative px-4">
             <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
             
             <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 w-full md:w-1/3 relative z-10 hover:-translate-y-2 transition-transform duration-500 mx-2 mb-8 md:mb-0">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400 font-mono text-sm">01</div>
                <h4 className="font-bold text-xl mb-2">Homepage</h4>
                <p className="text-4xl font-black text-[#3B3DFF] mb-3 tracking-tighter">100%</p>
                <p className="text-sm font-medium opacity-50">1,284 sessions</p>
             </div>
             
             <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 w-full md:w-1/3 relative z-10 hover:-translate-y-2 transition-transform duration-500 mx-2 mb-8 md:mb-0">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400 font-mono text-sm">02</div>
                <h4 className="font-bold text-xl mb-2">Pricing</h4>
                <p className="text-4xl font-black text-gray-800 mb-3 tracking-tighter">64.8%</p>
                <p className="text-sm font-medium opacity-50">832 sessions</p>
                
                <div className="absolute -top-4 right-1/2 translate-x-1/2 md:translate-x-0 md:-right-4 bg-white shadow-lg text-[#FF4F40] text-sm font-bold px-4 py-1.5 rounded-full border border-gray-100 flex items-center gap-1">
                   <Zap size={14}/> -35.2%
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 w-full md:w-1/3 relative z-10 hover:-translate-y-2 transition-transform duration-500 mx-2">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400 font-mono text-sm">03</div>
                <h4 className="font-bold text-xl mb-2">Checkout</h4>
                <p className="text-4xl font-black text-gray-800 mb-3 tracking-tighter">24.2%</p>
                <p className="text-sm font-medium opacity-50">311 sessions</p>
                
                <div className="absolute -top-4 right-1/2 translate-x-1/2 md:translate-x-0 md:-right-4 bg-white shadow-lg text-[#FF4F40] text-sm font-bold px-4 py-1.5 rounded-full border border-gray-100 flex items-center gap-1">
                   <Zap size={14}/> -40.6%
                </div>
             </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B3DFF] to-[#1d1e99] text-white z-0"></div>
          
          <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform rotate-180 z-10">
             <svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
               <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,93.25,105.47,85.29,157.6,76.5,212.8,67.14,267.8,66,321.39,56.44Z" fill="#FDFDF8"></path>
             </svg>
          </div>
          
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl z-0"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FF4F40]/20 rounded-full blur-3xl z-0"></div>
          
          <div className="relative z-20 max-w-4xl mx-auto px-6 text-center mt-10">
            <h2 className="font-playfair font-bold text-6xl md:text-8xl tracking-tighter mb-8 text-white">Start tracking in <br/><span className="text-[#F8D4D4] italic">5 minutes.</span></h2>
            
            <div className="bg-[#0A0A0A] rounded-3xl p-8 text-left max-w-2xl mx-auto mb-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative border border-white/10 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3B3DFF] to-blue-400 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 -z-10"></div>
              
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-xs font-mono text-gray-500">index.html</div>
              </div>
              
              <pre className="text-sm md:text-base font-mono text-gray-300 overflow-x-auto leading-relaxed">
                <code>
                  <span className="text-pink-400">&lt;script&gt;</span>{'\n'}
                  {'  '}window.<span className="text-blue-400">CF_CONFIG</span> = {'{'}{'\n'}
                  {'    '}endpoint: <span className="text-green-400">'https://api.trace.com'</span>{'\n'}
                  {'  '}{'}'};{'\n'}
                  <span className="text-pink-400">&lt;/script&gt;</span>{'\n'}
                  <span className="text-pink-400">&lt;script</span> <span className="text-blue-400">src</span>=<span className="text-green-400">"https://cdn.trace.com/tracker.js"</span> <span className="text-blue-400">defer</span><span className="text-pink-400">&gt;&lt;/script&gt;</span>
                </code>
              </pre>
            </div>
            
            <Link to="/dashboard" className="inline-block bg-white hover:bg-[#FF4F40] text-[#1A1A1A] hover:text-white px-12 py-5 rounded-full font-bold text-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,79,64,0.6)] hover:-translate-y-1 cursor-pointer">
               Get Started for Free
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-white py-16 px-6 md:px-16 border-t border-gray-900">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 256 256" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
              <span className="text-2xl font-playfair italic tracking-tight">Trace</span>
            </div>
            <p className="text-sm font-medium opacity-50">© 2026 Trace Analytics. All rights reserved.</p>
            <div className="flex gap-6 text-sm font-medium">
               <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Privacy</a>
               <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Terms</a>
               <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Contact</a>
            </div>
         </div>
      </footer>
    </div>
  );
}
