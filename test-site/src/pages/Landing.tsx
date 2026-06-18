import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Briefcase, Building2, Landmark } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Link } from 'react-router-dom';
import Hls from 'hls.js';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

function HlsVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src]);

  return <video ref={videoRef} className={className} autoPlay muted loop playsInline />;
}

function WordReveal({ text }: { text: string }) {
  const { scrollYProgress } = useScroll();
  const words = text.split(' ');

  return (
    <div className="flex flex-wrap">
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
        const highlight = ["behavioral", "friction", "bugs", "sessions"].includes(word.replace(/[^a-zA-Z]/g, ''));
        return (
          <motion.span
            key={i}
            style={{ opacity }}
            className={`mr-2 ${highlight ? 'text-foreground' : 'text-hero-subtitle'}`}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function Landing() {
  return (
    <>
      {/* 2. Hero Section */}
      <section className="relative w-full h-screen overflow-hidden flex flex-col justify-end">
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay muted loop playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4"
        />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent z-[1]" />
        
        <div className="relative z-10 w-full px-8 md:px-28 pb-32 flex flex-col items-center text-center pt-28 md:pt-32">
          <motion.div {...fadeUp(0.1)} className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center">
                  <Briefcase size={12} className="text-muted-foreground" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-700 flex items-center justify-center">
                  <Building2 size={12} className="text-muted-foreground" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-600 flex items-center justify-center">
                  <Landmark size={12} className="text-muted-foreground" />
                </div>
              </div>
              <span className="text-muted-foreground text-sm">10,000+ businesses optimizing funnels</span>
            </div>

            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] max-w-4xl"
              style={{ textShadow: "0px 0px 40px rgba(0,0,0,1), 0px 4px 10px rgba(0,0,0,0.8)" }}
            >
              Get <span className="font-serif italic font-normal">Actionable</span> Insights
            </h1>

            <p className="text-lg text-hero-subtitle max-w-2xl mt-4">
              A fictional SaaS platform designed to generate real user interaction data. Click around to see session replays, heatmaps, and funnel analytics in action.
            </p>

            <div className="liquid-glass rounded-2xl sm:rounded-full p-2 max-w-lg w-full flex flex-col sm:flex-row items-center mt-8 gap-2 sm:gap-0">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 w-full bg-transparent border-none outline-none text-foreground px-4 py-2 sm:py-0 placeholder:text-muted-foreground text-center sm:text-left"
              />
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-foreground text-background font-medium rounded-xl sm:rounded-full px-8 py-3 w-full sm:w-auto cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                START FREE TRIAL
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Search has changed Section */}
      <section className="pt-52 md:pt-64 pb-6 md:pb-9 px-8 md:px-28">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2 {...fadeUp(0.1)} className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] mb-6">
            Analytics have <span className="font-serif italic">evolved.</span> Have you?
          </motion.h2>
          <motion.p {...fadeUp(0.2)} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-24">
            The way we understand user behavior is changing rapidly. Stop guessing and start seeing.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-20 text-left">
            {[
              { title: "Session Replay", desc: "Watch exactly how users navigate your product.", lottie: "/sessionreplay.lottie" },
              { title: "Interactive Heatmaps", desc: "Visualize aggregate click density and scroll depth.", lottie: "/heatmaps.lottie" },
              { title: "Funnel Tracking", desc: "Identify where users drop off and why.", lottie: "/funnel.lottie" }
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp(0.3 + (i * 0.1))} className="flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border/50">
                <div className="w-full aspect-square bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden p-8">
                  <DotLottieReact src={item.lottie} loop autoplay />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp(0.6)} className="text-muted-foreground text-sm text-center">
            If you don't track the friction, someone else will.
          </motion.p>
        </div>
      </section>

      {/* 4. Mission Section */}
      <section className="pt-0 pb-32 md:pb-44 px-8 md:px-28">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.div {...fadeUp(0.1)} className="w-full max-w-[800px] aspect-square rounded-full overflow-hidden mb-20 relative">
            <div className="absolute inset-0 bg-black/20 z-10" />
            <video 
              className="w-full h-full object-cover"
              autoPlay muted loop playsInline
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_132944_a0d124bb-eaa1-4082-aa30-2310efb42b4b.mp4"
            />
          </motion.div>

          <div className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-[-1px] leading-tight text-left">
            <WordReveal text="We're building a platform where data meets behavioral context — where product teams find friction points, engineers catch bugs, and every session becomes an opportunity to improve." />
          </div>
          
          <div className="text-xl md:text-2xl lg:text-3xl font-medium mt-10 text-left text-muted-foreground">
            A tool where events, recordings, and insights flow together — with less guesswork, fewer dead clicks, and more conversions for everyone involved.
          </div>
        </div>
      </section>

      {/* 5. Solution Section */}
      <section className="py-32 md:py-44 px-8 md:px-28 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0.1)} className="mb-16">
            <span className="text-xs tracking-[3px] uppercase text-muted-foreground block mb-6">SOLUTION</span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-[-1px]">
              The platform for <span className="font-serif italic">behavioral</span> analytics
            </h2>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="w-full aspect-[3/1] rounded-2xl overflow-hidden mb-24">
            <video 
              className="w-full h-full object-cover"
              autoPlay muted loop playsInline
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_125119_8e5ae31c-0021-4396-bc08-f7aebeb877a2.mp4"
            />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: "Rage Click Detection", desc: "Automatically highlight moments of user frustration." },
              { title: "Dead Click Tracking", desc: "Find elements that look clickable but aren't." },
              { title: "AI Summaries", desc: "Generate natural-language summaries of user sessions." },
              { title: "Conversion Funnels", desc: "Map your exact flow and see where users drop off." }
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp(0.3 + (i * 0.1))} className="flex flex-col gap-2">
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="py-32 md:py-44 border-t border-border/30 overflow-hidden relative flex items-center justify-center min-h-[70vh]">
        <HlsVideo 
          src="https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
        />
        <div className="absolute inset-0 bg-background/45 z-[1]" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <motion.div {...fadeUp(0.1)} className="mb-8 relative w-10 h-10 rounded-full border-2 border-foreground/60 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border border-foreground/60" />
          </motion.div>
          
          <motion.h2 {...fadeUp(0.2)} className="text-5xl md:text-7xl font-serif italic mb-6">
            Start Your Analysis
          </motion.h2>
          
          <motion.p {...fadeUp(0.3)} className="text-muted-foreground text-lg max-w-md mx-auto mb-10">
            Join the movement toward behavioral analytics and deeper user understanding.
          </motion.p>
          
          <motion.div {...fadeUp(0.4)} className="flex flex-col sm:flex-row items-center gap-4">
            <button className="bg-foreground text-background font-medium rounded-lg px-8 py-3.5 hover:scale-105 transition-transform cursor-pointer">
              Start Free Trial
            </button>
            <Link to="/pricing" className="liquid-glass font-medium rounded-lg px-8 py-3.5 hover:scale-105 transition-transform cursor-pointer">
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
