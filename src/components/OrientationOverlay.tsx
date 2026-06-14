import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OrientationOverlay() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkState = () => {
      const portrait = window.innerHeight > window.innerWidth;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < 1024 && window.innerWidth < window.innerHeight);
      setIsPortrait(portrait);
      setIsMobile(mobile);
    };

    checkState();
    window.addEventListener('resize', checkState);
    return () => window.removeEventListener('resize', checkState);
  }, []);

  useEffect(() => {
    if (isMobile && isPortrait) {
      setShowPrompt(true);
      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [isMobile, isPortrait]);

  useEffect(() => {
    if (showPrompt) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 5;
        });
      }, 125);
      return () => clearInterval(interval);
    }
  }, [showPrompt]);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] bg-[#f3f3f3] text-black flex flex-col items-center justify-center p-12 text-center select-none"
        >
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          
          {/* Retro-Tech Borders */}
          <div className="absolute inset-4 border border-black/10 pointer-events-none" />
          <div className="absolute inset-6 border border-dashed border-black/5 pointer-events-none" />

          {/* Key rotating smartphone icon */}
          <motion.div
            animate={{ 
              rotate: [0, 90, 90, 0, 0],
              scale: [1, 1.05, 1, 0.95, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-12 relative"
          >
            <div className="absolute -inset-6 border border-dashed border-black/20 rounded-full animate-[spin_12s_linear_infinity]" />
            <div className="bg-black text-white p-6 shadow-2xl relative z-10 border-2 border-white/10">
              <Smartphone size={44} />
            </div>
          </motion.div>
          
          <div className="space-y-6 relative z-10 max-w-[280px]">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.3em] text-gray-500 uppercase">
                TABLE_VIEWPORT.SYS
              </span>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                LAYOUT ADAPT<br/>PROTOCOL
              </h2>
              <div className="h-0.5 bg-black w-14 mx-auto"></div>
            </div>
            
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed border-y border-black/10 py-4 text-gray-800">
              横竖屏自适应界面已启用<br/>
              <span className="text-[9px] text-gray-500 font-normal tracking-wide lowercase mt-1 block">
                请任意方向旋转或握持手机，界面均已完美适配
              </span>
            </p>
          </div>
          
          {/* System status & Progress Indicator */}
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-mono opacity-50 uppercase tracking-[0.45em]">
                CALIBRATING 3D CANVAS: {progress}%
              </span>
              <div className="w-48 h-2 bg-black/5 shadow-[inset_1px_1px_0px_0px_#808080,inset_-1px_-1px_0px_0px_#ffffff] p-[1px] relative overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.8, ease: "easeInOut" }}
                  className="h-full bg-black"
                />
              </div>
            </div>
            
            {/* Retro Technical Log status lines */}
            <div className="font-mono text-[7px] text-gray-400 uppercase tracking-widest flex gap-3 text-center">
              <span>VIEW_RESOLVED</span>
              <span>-&gt;</span>
              <span className="text-black font-semibold animate-pulse">AUTO_RESPONSIVE</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
