// @ts-ignore
import chairsGalleryImage from '../assets/images/chairs_gallery_biennale_1780976866968.png';
// @ts-ignore
import regeneratedGalleryImage from '../assets/images/regenerated_image_1780984495180.jpg';
// @ts-ignore
import chairCyA1 from '../assets/images/chair_cy_a1_1780977226697.png';
// @ts-ignore
import chairCyA2 from '../assets/images/chair_cy_a2_1780977239877.png';
// @ts-ignore
import chairCyA3 from '../assets/images/chair_cy_a3_1780977252659.png';
// @ts-ignore
import chairCyA4 from '../assets/images/chair_cy_a4_1780977265937.png';
// @ts-ignore
import chairCyA5 from '../assets/images/chair_cy_a5_1780977280067.png';
// @ts-ignore
import chairCyA6 from '../assets/images/chair_cy_a6_1780977291853.png';
// @ts-ignore
import chairCyA7 from '../assets/images/chair_cy_a7_1780977305320.png';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, ChevronRight, ArrowLeft, Package, Eye, Box } from 'lucide-react';
import { TableConfig } from '../types';
import { ModelPreviewModal, IsolatedChair } from './ModelPreviewModal';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const chairImageMap: Record<string, string> = {
  'CY-A1': chairCyA1,
  'CY-A2': chairCyA2,
  'CY-A3': chairCyA3,
  'CY-A4': chairCyA4,
  'CY-A5': chairCyA5,
  'CY-A6': chairCyA6,
  'CY-A7': chairCyA7,
};

// Global cache for transparent, retina-HD front-view screenshots of each 3D model
const capturedImagesCache: Record<string, string> = {};

// Helper camera controller to perfectly frame each preview card at straight front-view
function CameraController() {
  const { camera } = useThree();
  useEffect(() => {
    // Elegant elevated straight-front angle to showcase seat surface and depth, zoomed in closer
    camera.position.set(0, 0.92, 1.48);
    camera.lookAt(0, 0.38, 0);
  }, [camera]);
  return null;
}

// Sub-component inside dynamic R3F offscreen capture Canvas
interface CanvasCapturerProps {
  chairId: string;
  onCapture: (dataUrl: string) => void;
}

function CanvasCapturer({ chairId, onCapture }: CanvasCapturerProps) {
  const { gl } = useThree();

  useEffect(() => {
    let active = true;
    let frameId: number;
    let count = 0;

    const doCapture = () => {
      if (!active) return;
      count++;
      // Wait exactly 18 frames to let the model load and full lighting/subdivisions stabilize nicely
      if (count > 18) {
        try {
          const dataUrl = gl.domElement.toDataURL('image/png');
          if (dataUrl && dataUrl.length > 500) {
            onCapture(dataUrl);
            return;
          }
        } catch (e) {
          console.warn(`Canvas capturer error for ${chairId}:`, e);
        }
      }
      frameId = requestAnimationFrame(doCapture);
    };

    frameId = requestAnimationFrame(doCapture);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [gl, chairId, onCapture]);

  return null;
}

interface ChairCropperProps {
  chairId: string;
  className?: string;
}

export function ChairCropper({ chairId, className = '' }: ChairCropperProps) {
  const imgSrc = capturedImagesCache[chairId] || chairImageMap[chairId];

  return (
    <div className={`relative overflow-hidden w-full h-full bg-[radial-gradient(circle_at_center,_#ffffff_40%,_#f2f2f2_100%)] select-none flex items-center justify-center p-3 md:p-4 ${className}`}>
      <img
        src={imgSrc}
        alt={chairId}
        referrerPolicy="no-referrer"
        className="max-w-full max-h-full object-contain transition-all duration-500 filter contrast-[1.04] saturate-[1.01] brightness-[1.01] drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] group-hover/image:scale-[1.08]"
        style={{
          imageRendering: 'high-quality' as any,
        }}
      />
      {/* Exquisite micro-vignette inner shadow for lighting depth */}
      <div className="absolute inset-0 pointer-events-none border border-zinc-900/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]" />
    </div>
  );
}

interface WelcomeScreenProps {
  onEnterCustomizer: () => void;
  onEnterReadyMade: () => void;
}

function MouseFollower({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse coordinates to [-1, 1] relative to viewport
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useFrame(() => {
    if (group.current) {
      // Smooth interpolation of horizontal rotation (Y-axis) based on window-wide mouse X position
      // The chair stays flat (no X-axis tilt or pitch up/down)
      const targetY = mouseRef.current.x * 0.5;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06);
      group.current.rotation.x = 0; // Keep flat
    }
  });
  
  return <group ref={group}>{children}</group>;
}

export function WelcomeScreen({ onEnterCustomizer, onEnterReadyMade }: WelcomeScreenProps) {
  return (
    <div className="absolute inset-0 bg-[#f9f9f9] text-[#111111] select-none flex flex-col justify-between font-mono overflow-hidden">
      {/* Precision millimeter design grid lines matching customizer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ececec_1px,transparent_1px),linear-gradient(to_bottom,#ececec_1px,transparent_1px)] bg-[size:20px_20px] opacity-75 pointer-events-none" />
      
      {/* Absolute background 3D model - Right half-ish view */}
      <div className="absolute right-0 top-0 bottom-0 w-[50%] h-full pointer-events-none select-none z-0 hidden lg:block overflow-hidden">
        <div className="w-full h-full relative opacity-100">
          <div className="w-full h-full transform translate-x-[5%] translate-y-[10%] scale-[1.1]">
            <Suspense fallback={null}>
              <Canvas
                shadows={false}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
              >
                <PerspectiveCamera makeDefault position={[1.8, 1.1, 2.2]} fov={35} />
                <ambientLight intensity={0.55} />
                <hemisphereLight intensity={0.35} color="#ffffff" groundColor="#dcdcdc" />
                <directionalLight position={[4, 8, 5]} intensity={1.2} />
                
                <Suspense fallback={null}>
                  <MouseFollower>
                    <IsolatedChair chairId="CY-A7" />
                  </MouseFollower>
                </Suspense>
                
                <Environment preset="studio" environmentIntensity={0.5} />
                
                <ContactShadows
                  position={[0, 0, 0]}
                  opacity={0.35}
                  scale={3.5}
                  blur={1.8}
                  far={1.2}
                />
                
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  enableRotate={false}
                  autoRotate={false}
                  autoRotateSpeed={0.8}
                  target={[0, 0.45, 0]}
                />
              </Canvas>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Drafting aesthetic header */}
      <header className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 md:pt-10 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-none border-2 border-[#111111] flex items-center justify-center bg-transparent">
            <span className="font-sans font-black text-[10px] sm:text-xs tracking-tighter">N</span>
          </div>
          <div>
            <span className="font-sans font-black text-[10px] sm:text-xs md:text-sm tracking-widest block uppercase text-zinc-900 leading-none">NONG STUDIO</span>
            <span className="text-[6.5px] sm:text-[7.5px] text-zinc-400 block uppercase tracking-wider mt-0.5 leading-none">BESPOKE ATELIER / v1.0.4r</span>
          </div>
        </div>
        <div className="text-[7.5px] sm:text-[9px] text-zinc-500 font-bold tracking-widest border border-zinc-300 px-1.5 sm:px-2 py-0.5 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
          CRAFT_EDITION.ENG
        </div>
      </header>

      {/* Main heroic dual-column workspace layout - flex centered, strictly flex-shrink safe */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4 md:py-8 flex flex-col justify-center z-10 min-h-0">
        <div className="max-w-3xl mb-4 sm:mb-6 md:mb-10 space-y-1 sm:space-y-2 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 text-white font-semibold text-[7px] sm:text-[8px] tracking-widest uppercase"
          >
            <Sparkles size={6} />
            HEIRLOOM QUALITY FURNITURE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex flex-col gap-1 sm:gap-2 animate-fade-in"
          >
            <span className="font-mono font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tighter text-zinc-950 leading-[0.95] block">
              EndlessForm<sup className="text-[0.4em] align-super font-sans font-light -ml-0.5 tracking-normal select-none text-zinc-400">®</sup>
            </span>
            <span className="font-sans font-medium text-sm sm:text-base md:text-xl lg:text-2xl tracking-[0.25em] text-zinc-400 uppercase block pl-0.5">
              无尽之形
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[9px] sm:text-xs md:text-sm text-zinc-500 max-w-xl font-sans tracking-wide leading-tight sm:leading-relaxed font-light mt-0.5"
          >
            Welcome to high-precision furniture customization. Real-time stress test parameters combined with premium curated craftsmanship.
          </motion.p>
        </div>

        {/* Dual primary navigation choice blocks - completely neutral/graphite styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full mt-1 flex-shrink min-h-0 select-none">
          {/* Option A: Bespoke Customization */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            onClick={onEnterCustomizer}
            className="group relative cursor-pointer bg-white border-[1.5px] border-zinc-900 p-3 sm:p-5 md:p-8 flex flex-col justify-between hover:bg-zinc-900 hover:text-white transition-all duration-300 shadow-[3px_3px_0px_rgba(0,0,0,0.15)] hover:shadow-[5px_5px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {/* Background design coordinates subtle line */}
            <div className="absolute right-0 top-0 w-16 h-16 sm:w-32 sm:h-32 border-b border-l border-dashed border-zinc-100 group-hover:border-zinc-800 pointer-events-none transition-colors duration-300" />
            
            <div className="space-y-2 sm:space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-7 h-7 sm:w-10 sm:h-10 border border-zinc-900 group-hover:border-white flex items-center justify-center bg-zinc-50 group-hover:bg-zinc-800 transition-colors">
                  <Compass size={14} className="text-zinc-700 group-hover:text-white sm:size-5" />
                </div>
                <span className="text-[7px] sm:text-[9px] font-bold text-zinc-400 group-hover:text-zinc-300 uppercase tracking-widest">SYS_MOD: ACTIVE</span>
              </div>
              
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="font-sans font-black text-sm sm:text-lg md:text-2xl tracking-tight uppercase flex items-center gap-1.5 text-zinc-900 group-hover:text-white leading-tight">
                  进入定制界面 <span className="text-[8px] sm:text-[10px] md:text-[12px] text-zinc-400 group-hover:text-zinc-300 font-normal">/ Customizer</span>
                </h2>
                <p className="text-[8.5px] sm:text-[10px] md:text-xs leading-tight sm:leading-relaxed text-zinc-500 group-hover:text-zinc-300 font-sans font-light">
                  高精度交互工作室。自由调节尺寸，甄选橡木、极简玻璃、不锈钢与卡拉拉大理石顶级工艺板。
                </p>
              </div>
            </div>

            <div className="mt-2 sm:mt-6 pt-1.5 sm:pt-4 border-t border-dashed border-zinc-100 group-hover:border-zinc-800 flex justify-between items-center transition-colors duration-300">
              <span className="text-[6.5px] sm:text-[8px] font-bold tracking-widest text-zinc-400 group-hover:text-zinc-300">LAUNCHING_ENGINE_EXE</span>
              <div className="flex items-center gap-1 text-[8.5px] sm:text-xs font-bold font-sans">
                <span>CONFIG NOW</span>
                <ChevronRight size={10} className="transition-transform group-hover:translate-x-1 sm:size-3.5" />
              </div>
            </div>
          </motion.div>

          {/* Option B: Pre-curated Masterpieces */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={onEnterReadyMade}
            className="group relative cursor-pointer bg-white border-[1.5px] border-zinc-300 p-3 sm:p-5 md:p-8 flex flex-col justify-between hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-300 shadow-[3px_3px_0px_rgba(0,0,0,0.05)] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <div className="absolute right-0 top-0 w-16 h-16 sm:w-32 sm:h-32 border-b border-l border-dotted border-zinc-100 pointer-events-none group-hover:border-zinc-800 transition-colors duration-300" />
            
            <div className="space-y-2 sm:space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-7 h-7 sm:w-10 sm:h-10 border border-zinc-200 group-hover:border-zinc-700 flex items-center justify-center bg-zinc-50 group-hover:bg-zinc-800 transition-colors">
                  <Package size={14} className="text-zinc-600 group-hover:text-white sm:size-5" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[6.5px] sm:text-[8px] font-black text-zinc-650 bg-zinc-100 px-1.5 py-0.2 border border-zinc-200 uppercase tracking-widest leading-none group-hover:!text-zinc-950 group-hover:!bg-white group-hover:!border-white">COLLECTION</span>
                </div>
              </div>
              
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="font-sans font-black text-sm sm:text-lg md:text-2xl tracking-tight uppercase text-zinc-800 group-hover:text-white leading-tight">
                  选择现样款 <span className="text-[8px] sm:text-[10px] md:text-[12px] text-zinc-400 font-normal">/ Curated Models</span>
                </h2>
                <p className="text-[8.5px] sm:text-[10px] md:text-xs leading-tight sm:leading-relaxed text-zinc-500 group-hover:text-zinc-300 font-sans font-light">
                  浏览由资深设计师和结构力学专家预先搭配、美学比例极致优化的经典样款，涵盖包豪斯与意式经典风。
                </p>
              </div>
            </div>

            <div className="mt-2 sm:mt-6 pt-1.5 sm:pt-4 border-t border-dashed border-zinc-200 group-hover:border-zinc-800 flex justify-between items-center transition-colors duration-300">
              <span className="text-[6.5px] sm:text-[8px] font-bold tracking-widest text-zinc-400 group-hover:text-zinc-300">DESIGNER_TEMPLATES</span>
              <div className="flex items-center gap-1 text-[8.5px] sm:text-xs font-bold text-zinc-700 group-hover:text-white font-sans">
                <span>BROWSE STYLES</span>
                <ChevronRight size={10} className="transition-transform group-hover:translate-x-1 sm:size-3.5" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Decorative footer metrics bar - tight style on mobile */}
      <footer className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-200/60 z-10 flex flex-col sm:flex-row justify-between items-center gap-2 text-[6.5px] sm:text-[8px] text-zinc-400 font-medium flex-shrink-0">
        <div className="flex gap-3">
          <span>COORDINATE_GRID: ON</span>
          <span>STRESS_TESTS: PASSED</span>
          <span>MATERIAL_ROB: EX_A1</span>
        </div>
        <div className="text-zinc-400 uppercase tracking-wider hidden sm:block">
          DESIGNED BY ARCHITECTS, FOR FINE SPACES.
        </div>
      </footer>
    </div>
  );
}

// -------------------------------------------------------------
import { CURATED_MASTERPIECES } from '../data/chairs';

interface ReadyMadeGalleryProps {
  onBackToLanding: () => void;
  onApplyConfig: (config: TableConfig) => void;
}

// Technical specs lookup specifically for each individual chair (Size & Weight)
const CHAIR_DIMS_SPECS: Record<string, { size: string; weight: string }> = {
  'CY-A1': { size: '56 x 52 x 78 cm', weight: '11.5 KG' },
  'CY-A2': { size: '54 x 50 x 82 cm', weight: '12.3 KG' },
  'CY-A3': { size: '62 x 58 x 76 cm', weight: '14.8 KG' },
  'CY-A4': { size: '58 x 54 x 85 cm', weight: '13.5 KG' },
  'CY-A5': { size: '55 x 52 x 80 cm', weight: '10.9 KG' },
  'CY-A6': { size: '60 x 56 x 84 cm', weight: '14.2 KG' },
  'CY-A7': { size: '56 x 53 x 81 cm', weight: '12.0 KG' },
};

export function ReadyMadeGallery({ onBackToLanding, onApplyConfig }: ReadyMadeGalleryProps) {
  const [previewMaster, setPreviewMaster] = useState<Masterpiece | null>(null);

  // Setup list of models for flat-front perspective cover captures
  const AJ_CHAIR_IDS = React.useMemo(() => ['CY-A1', 'CY-A2', 'CY-A3', 'CY-A4', 'CY-A5', 'CY-A6', 'CY-A7'], []);
  const [currentCaptureId, setCurrentCaptureId] = useState<string | null>(() => {
    // Determine the first model that does not have its transparent HD screen capture cached
    for (const id of AJ_CHAIR_IDS) {
      if (!capturedImagesCache[id]) return id;
    }
    return null;
  });

  useEffect(() => {
    // Force clear the cache on mount to ensure the freshly adjusted higher-angle perspective is captured correctly
    for (const id of AJ_CHAIR_IDS) {
      delete capturedImagesCache[id];
    }
    setCurrentCaptureId('CY-A1');
  }, [AJ_CHAIR_IDS]);

  return (
    <div className="absolute inset-0 bg-[#f9f9f9] text-[#111111] select-none flex flex-col font-mono overflow-y-auto custom-scrollbar">
      {/* Precision grid pattern layout */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:16px_16px] opacity-75 pointer-events-none" />
      
      {/* Gallery Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-4 border-b border-zinc-200 z-10 flex justify-between items-center bg-[#f9f9f9]/95 backdrop-blur-md sticky top-0">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-zinc-900 text-[9px] font-bold uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.15)] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowLeft size={12} />
          返回主页 (Back)
        </button>
        <div className="text-right">
          <span className="text-[10px] font-black text-zinc-900 block uppercase tracking-widest">CURATED MASTERPIECES</span>
          <span className="text-[7px] text-zinc-400 block uppercase tracking-wider font-bold">美学设计现样款展阁</span>
        </div>
      </header>

      {/* Main exhibition area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 z-10 space-y-12">
        <div className="max-w-5xl space-y-4">
          <div className="space-y-2">
            <h1 className="font-sans font-black text-2xl md:text-3xl tracking-tight text-zinc-900 uppercase">
              Curated Masterpieces / 经典现样款
            </h1>
            <div className="font-sans font-black text-xl md:text-2xl text-zinc-800 tracking-tight uppercase mt-1">
              8200元
            </div>
            <p className="text-[10px] md:text-xs text-zinc-500 font-sans tracking-wide leading-relaxed font-light">
              Each composition represents an optimal configuration of thickness, overhang spans, and leg dimensions curated by structural specialists. Select a model to apply its exact parameters immediately to the real-time workstation.
            </p>
          </div>

          {/* Overview Image (总览图) */}
          <div className="bg-white border border-zinc-900/15 p-2 sm:p-3 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),_0_8px_10px_-6px_rgba(0,0,0,0.05)] overflow-hidden rounded-sm transition-all duration-300 hover:border-zinc-900/35">
            <img 
              src={regeneratedGalleryImage} 
              alt="Chairs Overview" 
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain filter contrast-[1.06] saturate-[1.03] brightness-[1.01] transition-transform duration-700 hover:scale-[1.015]"
              style={{ imageRendering: 'high-quality' as any }}
            />
          </div>
        </div>

        {/* Gallery grid list of premium masterpiece combinations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          {CURATED_MASTERPIECES.map((master) => {
            return (
              <motion.div
                key={master.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="bg-white border-2 border-zinc-900/10 p-5 md:p-6 flex flex-col justify-between hover:border-zinc-900 shadow-[2px_12px_28px_rgba(0,0,0,0.03)] hover:shadow-[4px_16px_36px_rgba(0,0,0,0.08)] transition-all relative group"
              >


                <div className="space-y-4">
                  {/* Real-world high-precision exhibition image of chairs gallery with vertical portrait layout */}
                  <div 
                    onClick={() => setPreviewMaster(master)}
                    className="aspect-[3/4.2] bg-white border border-zinc-150 relative overflow-hidden transition-all duration-300 cursor-pointer group/image"
                  >
                    <ChairCropper 
                      chairId={master.id} 
                      className="w-full h-full"
                    />
                    
                    {/* Exquisite hover mask indicating 3D view availability - Premium layout spotlight */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/25 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white z-10 p-4">
                      {/* Floating frosted-glass capsule */}
                      <div className="bg-zinc-950/85 backdrop-blur-md border border-white/12 px-5 py-3.5 rounded-xl flex flex-col items-center text-center space-y-1.5 shadow-[0_15px_30px_rgba(0,0,0,0.25)] transition-transform duration-300 scale-95 group-hover/image:scale-100">
                        <div className="w-8.5 h-8.5 rounded-full bg-white/8 border border-white/18 flex items-center justify-center">
                          <Box size={15} className="text-white logo-spin" style={{ animation: 'spin 10s linear infinite' }} />
                        </div>
                        <div className="text-center font-sans">
                          <span className="text-[10px] font-black tracking-widest text-white uppercase block">3D 交互预览</span>
                          <span className="text-[7.5px] font-mono tracking-wider text-zinc-300 block mt-0.5">CLICK TO PREVIEW</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 text-[6.5px] text-zinc-650 bg-white/95 px-1.5 py-0.5 border border-zinc-250 font-mono uppercase tracking-widest leading-none z-10">
                      EXHIBIT_SCHEME_#{master.id.toUpperCase()}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-black text-lg md:text-xl tracking-tight text-zinc-900 group-hover:text-zinc-950 transition-colors uppercase">
                      {master.name}
                    </h3>
                    <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans font-light pt-1.5 border-t border-zinc-150">
                      {master.desc}
                    </p>
                  </div>

                  {/* Technical values table with only Chair Size and Chair Weight */}
                  <div className="bg-zinc-50 p-3 border border-zinc-200/50 space-y-1.5 text-[8.5px]">
                    <span className="font-black text-zinc-400 text-[7px] uppercase block tracking-widest pb-1 border-b border-zinc-200/40">TECH SPEC_PARAMETERS</span>
                    <div className="flex justify-between text-zinc-650 font-medium font-mono">
                      <span>椅子尺寸 / Size:</span>
                      <span className="text-zinc-900 font-bold">
                        {CHAIR_DIMS_SPECS[master.id]?.size || '56 x 52 x 78 cm'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-650 font-medium font-mono">
                      <span>椅子重量 / Weight:</span>
                      <span className="text-zinc-900 font-bold">
                        {CHAIR_DIMS_SPECS[master.id]?.weight || '12.5 KG'}
                      </span>
                    </div>
                  </div>
                </div>


              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer message */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-zinc-200/60 z-10 text-[8px] text-zinc-400 font-bold tracking-widest text-center uppercase">
        NEXT STAGE WILL ENABLE DYNAMIC Isomorphic Render Overrides. FOR NOW, ALL SIZES CAN BE FULLY ADAPTED IN CONFIGURATOR.
      </footer>

      {/* 3D Model Modal Overlay */}
      {previewMaster && (
        <ModelPreviewModal
          chairId={previewMaster.id}
          chairName={previewMaster.name}
          desc={previewMaster.desc}
          specs={previewMaster.specs}
          onClose={() => setPreviewMaster(null)}
          onApplyConfig={() => {
            onApplyConfig(previewMaster.config);
            setPreviewMaster(null);
          }}
        />
      )}

      {/* Dynamic Background Screenshot Engine: captures retina-HD transparent positives in sequence */}
      {currentCaptureId && (
        <div style={{ position: 'absolute', width: 512, height: 600, left: -9999, top: -9999, overflow: 'hidden', pointerEvents: 'none', visibility: 'hidden' }}>
          <Canvas
            shadows={false}
            gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
            dpr={2}
          >
            <CameraController />
            <ambientLight intensity={0.5} />
            <hemisphereLight intensity={0.35} color="#ffffff" groundColor="#dcdcdc" />
            <directionalLight position={[3, 5, 4]} intensity={1.1} />
            <directionalLight position={[-3, 4, -2]} intensity={0.5} />
            <Environment preset="studio" environmentIntensity={0.55} />
            
            <Suspense fallback={null}>
              <IsolatedChair key={currentCaptureId} chairId={currentCaptureId} />
            </Suspense>

            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.35}
              scale={3.5}
              blur={2.0}
              far={1.2}
            />

            <CanvasCapturer 
              chairId={currentCaptureId} 
              onCapture={(dataUrl) => {
                capturedImagesCache[currentCaptureId] = dataUrl;
                
                // Advance schedule queue to next uncached chair model
                let nextId: string | null = null;
                for (const id of AJ_CHAIR_IDS) {
                  if (!capturedImagesCache[id]) {
                    nextId = id;
                    break;
                  }
                }
                setCurrentCaptureId(nextId);
              }} 
            />
          </Canvas>
        </div>
      )}
    </div>
  );
}
