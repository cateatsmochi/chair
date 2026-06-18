/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Minimize2, X, MousePointer2, Brush, Wand2, 
  Rotate3d, Maximize, Move, Ruler, MessageSquare, 
  Send, RefreshCcw, Download, Minus, Cpu, ChevronUp, ChevronDown, Undo,
  Library, Home, ChevronLeft, ReceiptText, Grid
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Scene, SceneHandle } from './components/Scene';
import { BlueprintTable } from './components/BlueprintTable';
import { WelcomeScreen, ReadyMadeGallery } from './components/WelcomeScreen';
import { ChairShowroomModal } from './components/ChairShowroomModal';
import { TableConfig, DEFAULT_CONFIG, MaterialType } from './types';
import { processChatCommand } from './services/geminiService';
import { calculatePrice } from './utils/pricing';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MATERIAL_COLORS: Record<MaterialType, string> = {
  oak: '#8B5E3C',
  steel: '#333333',
  glass: '#ffffff',
  chrome: '#c7c6c6',
  marble: '#ffffff'
};

// Replicate HSL color conversion functions to match model rendering
function hexToHsl(hex: string): { h: number, s: number, l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generates the exact multi-stop aurora tech gradient that renders on the model
function getFabricGradientForColor(baseColor: string): { bgStyle: string, border: string } {
  const hsl = hexToHsl(baseColor);
  
  // Dynamic color stops aligned with createFabricMaterialForColor in Chair3D
  const color1 = hslToHex(hsl.h, Math.max(hsl.s * 0.9, 50), Math.max(hsl.l * 0.5, 15)); // Base mid
  const color2 = hslToHex((hsl.h + 25) % 360, Math.max(hsl.s, 70), Math.min(hsl.l * 1.1, 75)); // Shimmer warm
  const color3 = hslToHex((hsl.h - 45 + 360) % 360, Math.min(hsl.s * 1.2, 100), Math.min(hsl.l * 0.85, 55)); // Counter tone
  const color4 = hslToHex((hsl.h + 75) % 360, Math.min(hsl.s * 1.3, 100), Math.min(hsl.l * 1.2, 80)); // Vivid top peak

  return {
    bgStyle: `linear-gradient(135deg, ${color1} 0%, ${color2} 33%, ${color3} 66%, ${color4} 100%)`,
    border: color2 // Beautiful active outer accent matching the shimmering highlights on the 3D model
  };
}

const TITANIUM_COLORS = [
  { id: 'raw', name: '原色', eng: 'ORIGINAL SLATE', color: '#original', bgStyle: 'linear-gradient(135deg, #abb4b9, #dbe0e3)', border: '#8e9397' },
  { id: 'purple', name: '紫', eng: 'SHIMMER PURPLE', color: '#bfa2db', bgStyle: 'linear-gradient(135deg, #bfa2db, #9c7cb0)', border: '#a88dbd' },
  { id: 'gold', name: '金', eng: 'SHIMMER GOLD', color: '#dec185', bgStyle: 'linear-gradient(135deg, #dec185, #cbae71)', border: '#c0a76a' },
  { id: 'blue', name: '蓝', eng: 'SHIMMER BLUE', color: '#5faade', bgStyle: 'linear-gradient(135deg, #5faade, #4a8ec2)', border: '#4fa0cf' },
  { id: 'green', name: '绿', eng: 'SHIMMER GREEN', color: '#6ec491', bgStyle: 'linear-gradient(135deg, #6ec491, #6fa685)', border: '#5cb07f' },
  { id: 'pink', name: '粉', eng: 'SHIMMER PINK', color: '#f0a3c2', bgStyle: 'linear-gradient(135deg, #f0a3c2, #cb819c)', border: '#e08cae' }
];

const FABRIC_BASE_COLORS = [
  { id: 'f1', name: '极光蓝紫', eng: 'AURORA BLUE-PURPLE', color: '#5d5fdf' },
  { id: 'f2', name: '幻影粉蓝', eng: 'PHANTOM PINK-BLUE', color: '#e8a7cb' },
  { id: 'f3', name: '曜石深黑', eng: 'OBSIDIAN BLACK', color: '#2d2d30' },
  { id: 'f4', name: '活力蓝黄', eng: 'VIBRANT BLUE-YELLOW', color: '#3c76f2' },
  { id: 'f5', name: '暮色黄紫', eng: 'TWILIGHT YELLOW-PURPLE', color: '#eec13a' },
  { id: 'f6', name: '春樱粉红', eng: 'CHERRY PINK-RED', color: '#fc678a' },
  { id: 'f7', name: '翡翠绿', eng: 'EMERALD GREEN', color: '#155e54' },
  { id: 'f8', name: '暖杏粉', eng: 'ALMOND PINK', color: '#ffb3ba' },
  { id: 'f9', name: '魅惑红', eng: 'CHARM RED', color: '#fc427b' },
  { id: 'f10', name: '晨曦黄', eng: 'AURORA YELLOW', color: '#f9ca24' },
  { id: 'f11', name: '薄荷绿', eng: 'MINT GREEN', color: '#a3e4d7' },
  { id: 'f12', name: '晴空蓝', eng: 'CLEAR SKY BLUE', color: '#74b9ff' }
];

const FABRIC_COLORS = FABRIC_BASE_COLORS.map(item => {
  const info = getFabricGradientForColor(item.color);
  return {
    ...item,
    bgStyle: info.bgStyle,
    border: info.border
  };
});

export default function App() {
  const [appMode, setAppMode] = useState<'welcome' | 'customizer' | 'ready-made'>('welcome');
  const [prevMode, setPrevMode] = useState<'welcome' | 'ready-made'>('welcome');
  const [showChairShowroom, setShowChairShowroom] = useState(false);

  useEffect(() => {
    if (appMode === 'welcome' || appMode === 'ready-made') {
      setPrevMode(appMode);
    }
  }, [appMode]);

  const [config, setConfig] = useState<TableConfig>(() => {
    // Basic validation helper for initialization
    const cfg = DEFAULT_CONFIG;
    const minSum = cfg.legTopSize + 5;
    let validated = { ...cfg };
    if (validated.frameThickness < validated.legTopSize) validated.frameThickness = validated.legTopSize;
    if (validated.legInnerDepth + validated.frameThickness < minSum) {
      validated.frameThickness = Math.max(validated.frameThickness, minSum - validated.legInnerDepth);
    }
    return validated;
  });
  const [history, setHistory] = useState<TableConfig[]>([]);

  const pushToHistory = (cfg: TableConfig) => {
    setHistory(prev => {
      if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(cfg)) {
        return prev;
      }
      return [...prev.slice(-49), cfg];
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setHistory(prev => {
      const newHistory = [...prev];
      const prevConfig = newHistory.pop();
      if (prevConfig) {
        setConfig(prevConfig);
      }
      return newHistory;
    });
  };

  const canUndo = history.length > 0;

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
    { role: 'ai', text: 'Hello. How can I optimize your table configuration today?', time: '09:41' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle>(null);

  // Quote State
  const [quoteResult, setQuoteResult] = useState<{ image: string; price: number } | null>(null);

  // Library State for saved table designs
  const [library, setLibrary] = useState<{ id: string; name: string; config: TableConfig; image: string; price: number; date: string }[]>(() => {
    try {
      const saved = localStorage.getItem('table_config_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [libraryName, setLibraryName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalTab, setModalTab] = useState<'quote' | 'library'>('quote');

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingGLB, setIsExportingGLB] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepText, setExportStepText] = useState('');
  const [exportParticles, setExportParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; size: number; color: string }[]>([]);

  const calculateWeight = (cfg: TableConfig) => {
    if (cfg.showTable === false && cfg.chairId) {
      const baseWeight = cfg.chairMaterial === 'wood' ? 6.5 : (cfg.chairMaterial === 'fabric' ? 5.5 : 4.5);
      const armrestWeight = cfg.chairHasArmrest ? 1.2 : 0;
      return (baseWeight + armrestWeight).toFixed(1) + ' kg';
    }

    const wM = cfg.width / 100;
    const dM = cfg.depth / 100;
    const tM = cfg.topThickness / 1000;
    const tabletopVolume = wM * dM * tM;

    let density = 1400; // default (matte)
    if (cfg.material === 'glass') density = 2500;
    else if (cfg.material === 'marble') density = 2700;
    else if (cfg.material === 'oak') density = 750;
    else if (cfg.material === 'steel' || cfg.material === 'chrome') density = 7800;

    const tabletopWeight = tabletopVolume * density;

    const legH = (cfg.height - cfg.topThickness) / 100;
    const legWeight = 4 * 0.08 * 0.08 * legH * 7800 * 0.15;
    const frameWeight = (wM + dM) * 2 * 0.04 * 0.04 * 0.045 * 7800;

    let chairsWeight = 0;
    if (cfg.chairId && cfg.chairCount && cfg.chairCount > 0) {
      const singleChairWeight = (cfg.chairMaterial === 'wood' ? 6.5 : (cfg.chairMaterial === 'fabric' ? 5.5 : 4.5)) + (cfg.chairHasArmrest ? 1.2 : 0);
      chairsWeight = singleChairWeight * cfg.chairCount;
    }

    const totalWeight = tabletopWeight + legWeight + frameWeight + chairsWeight;
    return totalWeight.toFixed(1) + ' kg';
  };

  // Main canvas generation animation state
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStepText, setGenerationStepText] = useState('');
  const [generationParticles, setGenerationParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; size: number; color: string }[]>([]);

  const triggerGenerationParticles = () => {
    const list = [];
    const colors = [
      MATERIAL_COLORS[config.material] || '#deab5d',
      '#000000', // Solid black
      '#808080', // Slate gray
      '#c6c6c6', // Retro Win95 silver
      '#ffffff'  // Paper white
    ];
    for (let i = 0; i < 50; i++) {
      list.push({
        id: i + Date.now() + 5000,
        x: Math.random() * 100,
        y: 75 + Math.random() * 20, // Lower section of viewport
        vx: (Math.random() - 0.5) * 6,
        vy: -3 - Math.random() * 5, // Rush upwards!
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setGenerationParticles(list);
  };

  const triggerExportParticles = () => {
    const list = [];
    const colors = [
      MATERIAL_COLORS[config.material] || '#deab5d', // Selected material color
      '#000000', // Deep black matching classic layout
      '#808080', // Sleek slate gray
      '#c6c6c6', // Retro Win95 silver-gray
      '#ffffff'  // Clean white
    ];
    for (let i = 0; i < 40; i++) {
      list.push({
        id: i + Date.now(),
        x: Math.random() * 100, // percentage x of thumbnail container
        y: 80 + Math.random() * 20, // start near the bottom
        vx: (Math.random() - 0.5) * 5, // Horizontal velocity
        vy: -2 - Math.random() * 4, // Upward velocity
        size: 2.5 + Math.random() * 4.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setExportParticles(list);
  };

  useEffect(() => {
    localStorage.setItem('table_config_library', JSON.stringify(library));
  }, [library]);

  const handleSaveToLibrary = () => {
    if (!quoteResult) return;
    
    // Save the element instantly without the delay animation
    const nameToSave = libraryName.trim() || `CHAIR_${config.chairId || 'CY-A1'}_${(config.chairMaterial || 'titanium').toUpperCase()}_${config.chairCount || 1}PCS`;
    const newItem = {
      id: Date.now().toString(),
      name: nameToSave,
      config: { ...config },
      image: quoteResult.image,
      price: quoteResult.price,
      date: new Date().toLocaleDateString()
    };

    setLibrary(prev => [newItem, ...prev]);
    setLibraryName('');
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      // Automatically switch to library tab to show it's saved successfully!
      setModalTab('library');
    }, 1000);
  };

  const handleExportPNG = () => {
    if (!quoteResult || isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStepText('INITIALIZING PNG_RASTER.EXE...');
    
    const colors = [
      MATERIAL_COLORS[config.material] || '#deab5d',
      '#000000',
      '#808080',
      '#c6c6c6',
      '#ffffff'
    ];
    
    triggerExportParticles();

    let progress = 0;
    const interval = setInterval(() => {
      // Step up progress
      progress += Math.floor(Math.random() * 14) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExportStepText('DATABLOCK EXPORT SUCCESSFUL!');

        // Trigger real file download
        const link = document.createElement('a');
        link.download = `chair-${config.chairId || 'CY-A1'}-${config.chairMaterial || 'titanium'}-${Date.now()}.png`;
        link.href = quoteResult.image;
        link.click();

        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          setExportParticles([]);
        }, 1100);
      } else {
        setExportProgress(progress);
        
        // Update high-tech step subtext labels for export
        if (progress < 25) {
          setExportStepText('RASTERIZING GEOMETRY MATRIX...');
        } else if (progress < 50) {
          setExportStepText('COMPILING MATERIAL SHADERS...');
        } else if (progress < 75) {
          setExportStepText('ENCODING PORTABLE NET GRAPHIC (PNG)...');
        } else {
          setExportStepText('SIGNING CHECKSUM COORD...');
        }

        // Keep emitting micro-bursts of particles
        setExportParticles(prev => [
          ...prev,
          ...Array.from({ length: 4 }).map((_, idx) => ({
            id: Date.now() + idx + progress,
            x: Math.random() * 100,
            y: 40 + Math.random() * 50,
            vx: (Math.random() - 0.5) * 6,
            vy: -1.5 - Math.random() * 4,
            size: 2 + Math.random() * 3.5,
            color: colors[Math.floor(Math.random() * colors.length)]
          }))
        ]);
      }
    }, 120);
  };

  const handleExportGLB = () => {
    if (!sceneRef.current || isExportingGLB || isExporting) return;

    setIsExportingGLB(true);
    triggerExportParticles();
    setExportProgress(10);
    setExportStepText('INITIALIZING GLB_PACKER.EXE...');

    const colors = [
      MATERIAL_COLORS[config.material] || '#deab5d',
      '#000000',
      '#808080',
      '#c6c6c6',
      '#ffffff'
    ];

    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 6;
      if (progress >= 95) {
        clearInterval(interval);
      } else {
        setExportProgress(progress);
        if (progress < 40) {
          setExportStepText('PACKING GEOMETRIAL WIREFRAME COORDS...');
        } else if (progress < 70) {
          setExportStepText('SERIALIZING SUB-MESH TRANSFORM DATA...');
        } else {
          setExportStepText('GENERATING COMPRESSED GLB BUFFER...');
        }

        // Emit some micro-burst particles
        setExportParticles(prev => [
          ...prev,
          ...Array.from({ length: 4 }).map((_, idx) => ({
            id: Date.now() + idx + progress + 999,
            x: Math.random() * 100,
            y: 40 + Math.random() * 50,
            vx: (Math.random() - 0.5) * 6,
            vy: -1.5 - Math.random() * 4,
            size: 2 + Math.random() * 3.5,
            color: colors[Math.floor(Math.random() * colors.length)]
          }))
        ]);
      }
    }, 120);

    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.exportGLB(
          (buffer) => {
            clearInterval(interval);
            setExportProgress(100);
            setExportStepText('GLB EXPORT SUCCESSFUL!');

            const blob = new Blob([buffer], { type: 'model/gltf-binary' });
            const link = document.createElement('a');
            link.download = `chair-${config.chairId || 'CY-A1'}-${config.chairMaterial || 'titanium'}-${Date.now()}.glb`;
            link.href = URL.createObjectURL(blob);
            link.click();

            setTimeout(() => {
              setIsExportingGLB(false);
              setExportProgress(0);
              setExportParticles([]);
            }, 1100);
          },
          (error) => {
            clearInterval(interval);
            console.error(error);
            setExportStepText('GLB EXPORT ERROR: ' + (error?.message || 'UNKNOWN'));
            setTimeout(() => {
              setIsExportingGLB(false);
              setExportProgress(0);
              setExportParticles([]);
            }, 2500);
          }
        );
      } else {
        clearInterval(interval);
        setExportStepText('GLB EXPORT FAILED: SCENE NOT READY');
        setTimeout(() => {
          setIsExportingGLB(false);
          setExportProgress(0);
          setExportParticles([]);
        }, 1500);
      }
    }, 900);
  };

  const handleLoadFromLibrary = (loadedConfig: TableConfig, image: string, price: number) => {
    pushToHistory(config);
    setConfig(loadedConfig);
    setQuoteResult({ image, price });
    setModalTab('quote');
  };

  const handleDeleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(item => item.id !== id));
  };

  // Chat window state
  const [chatPos, setChatPos] = useState({ x: 48, y: 48 });
  const [chatSize, setChatSize] = useState({ width: 320, height: 320 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPricingLogic, setShowPricingLogic] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let initialSet = false;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });

      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || width < 1024;
      setIsMobile(mobile);
      if (mobile && !initialSet) {
        setIsMinimized(true);
        initialSet = true;
      }
    };

    const handleResizeWithDelay = () => {
      handleResize();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    handleResize();
    window.addEventListener('resize', handleResizeWithDelay);
    window.addEventListener('orientationchange', handleResizeWithDelay);

    return () => {
      window.removeEventListener('resize', handleResizeWithDelay);
      window.removeEventListener('orientationchange', handleResizeWithDelay);
      clearTimeout(timeoutId);
    };
  }, []);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const inspectorScrollRef = useRef<HTMLDivElement>(null);

  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const startScrolling = (direction: 'up' | 'down') => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollDirectionRef.current = direction;

    const loop = () => {
      if (scrollDirectionRef.current && inspectorScrollRef.current) {
        const speed = 4.5; // Smooth speed (approx 270px/sec at 60fps)
        inspectorScrollRef.current.scrollTop += scrollDirectionRef.current === 'up' ? -speed : speed;
        scrollRafRef.current = requestAnimationFrame(loop);
      }
    };
    scrollRafRef.current = requestAnimationFrame(loop);
  };

  const stopScrolling = () => {
    scrollDirectionRef.current = null;
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateConfig = (cfg: TableConfig): TableConfig => {
    let validated = { ...cfg };

    // 1. Geometric integrity: frameThickness MUST be >= legTopSize
    // This ensures the "rectangle-based" leg doesn't poke out of the frame boundaries
    if (validated.frameThickness < validated.legTopSize) {
      validated.frameThickness = validated.legTopSize;
    }

    // 2. Leg integrity (pentagon mode): sum must allow at least 1mm gap/extension
    const minSum = validated.legTopSize + 5; 
    if (validated.legInnerDepth + validated.frameThickness < minSum) {
      // Prioritize increasing frameThickness slightly or maintaining balance
      validated.frameThickness = Math.max(validated.frameThickness, minSum - validated.legInnerDepth);
    }

    // 3. Center-crossing prevention
    const maxExtension = Math.min(validated.width, validated.depth) * 5 - 20; 
    const currentExtension = validated.frameInwardOffset + validated.frameThickness + validated.legInnerDepth;

    if (currentExtension > maxExtension) {
      const overflow = currentExtension - maxExtension;
      if (validated.legInnerDepth >= overflow) {
        validated.legInnerDepth -= overflow;
      } else {
        const remainingOverflow = overflow - validated.legInnerDepth;
        validated.legInnerDepth = 0;
        validated.frameInwardOffset = Math.max(0, validated.frameInwardOffset - remainingOverflow);
        // If still overflowing, we might need to reduce thickness as a last resort
        if (validated.frameInwardOffset + validated.frameThickness > maxExtension) {
          validated.frameThickness = maxExtension - validated.frameInwardOffset;
        }
      }
    }

    // 4. Ensure legTopSize doesn't exceed center (avoiding overlap of opposing legs)
    const maxLts = (Math.min(validated.width, validated.depth) * 5) - validated.frameInwardOffset - 20;
    if (validated.legTopSize > maxLts) {
      validated.legTopSize = Math.max(20, maxLts);
      // Re-run thickness check if lts changed
      if (validated.frameThickness < validated.legTopSize) {
        validated.frameThickness = validated.legTopSize;
      }
    }

    // 5. Delete armrests if selected chair material is wood or fabric
    if (validated.chairMaterial === 'wood' || validated.chairMaterial === 'fabric') {
      validated.chairHasArmrest = false;
    }

    return validated;
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isProcessing) return;

    const userMsg = chatInput;
    setChatInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: userMsg, time: now }]);
    
    setIsProcessing(true);
    const result = await processChatCommand(userMsg, config);
    
    if (Object.keys(result.config).length > 0) {
      pushToHistory(config);
      setConfig(prev => validateConfig({ ...prev, ...result.config }));
    }
    
    setMessages(prev => [...prev, { role: 'ai', text: result.message, time: now }]);
    setIsProcessing(false);
  };

  const updateParam = (key: keyof TableConfig, value: any) => {
    setConfig(prev => validateConfig({ ...prev, [key]: value }));
  };

  const handleMaterialChange = (type: MaterialType) => {
    pushToHistory(config);
    setConfig(prev => validateConfig({ 
      ...prev, 
      material: type,
      color: MATERIAL_COLORS[type]
    }));
  };

  const handleOpenLibrary = () => {
    if (sceneRef.current) {
      const image = sceneRef.current.capture();
      const price = calculatePrice(config);
      setQuoteResult({ image, price });
      setModalTab('library');
    } else {
      setQuoteResult({ image: '', price: calculatePrice(config) });
      setModalTab('library');
    }
  };

  const handleGenerateAndQuote = () => {
    if (!sceneRef.current || isGeneratingQuote) return;
    
    setIsGeneratingQuote(true);
    setGenerationProgress(0);
    setGenerationStepText('INIT: CONNECT_TO_MODEL_RENDERER...');
    triggerGenerationParticles();

    const colors = [
      MATERIAL_COLORS[config.material] || '#deab5d',
      '#000000',
      '#808080',
      '#c6c6c6',
      '#ffffff'
    ];

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 9) + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setGenerationStepText('RENDER EXTRACTION COMPLETE!');

        setTimeout(() => {
          if (sceneRef.current) {
            const image = sceneRef.current.capture();
            const price = calculatePrice(config);
            setQuoteResult({ image, price });
            setModalTab('quote');
            setLibraryName('');
          }
          setIsGeneratingQuote(false);
          setGenerationProgress(0);
          setGenerationParticles([]);
        }, 450);
      } else {
        setGenerationProgress(progress);
        
        if (progress < 20) {
          setGenerationStepText('MAPPING TENSION NODES...');
        } else if (progress < 40) {
          setGenerationStepText('CALCULATING VOLUME BOUNDARIES...');
        } else if (progress < 60) {
          setGenerationStepText('SAMPLING MATERIAL TEXTURE...');
        } else if (progress < 80) {
          setGenerationStepText('RUNNING STRESS DEVIATION RATIOS...');
        } else {
          setGenerationStepText('RETRIEVING QUOTATION MATRIX...');
        }

        // Inject active upward vector particles
        setGenerationParticles(prev => [
          ...prev,
          ...Array.from({ length: 5 }).map((_, idx) => ({
            id: Date.now() + idx + progress * 3,
            x: Math.random() * 100,
            y: 80 + Math.random() * 20,
            vx: (Math.random() - 0.5) * 5.2,
            vy: -2.2 - Math.random() * 4.5,
            size: 2.2 + Math.random() * 3.8,
            color: colors[Math.floor(Math.random() * colors.length)]
          }))
        ]);
      }
    }, 75);
  };

  const currentPrice = calculatePrice(config);

  // Chat dragging logic
  const onChatMouseDown = (e: React.MouseEvent) => {
    setIsDraggingChat(true);
    dragStartPos.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizingChat(true);
    resizeStartSize.current = { width: chatSize.width, height: chatSize.height };
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingChat) {
        setChatPos({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      } else if (isResizingChat) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        setChatSize({
          width: Math.max(260, resizeStartSize.current.width + deltaX),
          height: Math.max(220, resizeStartSize.current.height + deltaY)
        });
      }
    };
    const onMouseUp = () => {
      setIsDraggingChat(false);
      setIsResizingChat(false);
    };

    if (isDraggingChat || isResizingChat) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDraggingChat, isResizingChat]);

  const isPortrait = dimensions.height > dimensions.width;
  const isVertical = isPortrait;

  return (
    <div className="fixed inset-0 bg-[#f9f9f9] overflow-hidden select-none z-[10]">
      {appMode !== 'customizer' && (
        <div className="absolute inset-0 bg-[#f9f9f9] z-[99]" />
      )}

      <AnimatePresence mode="wait">
        {appMode === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[1000] overflow-hidden"
          >
            <WelcomeScreen
              onEnterCustomizer={() => setAppMode('customizer')}
              onEnterReadyMade={() => setAppMode('ready-made')}
            />
          </motion.div>
        )}

        {appMode === 'ready-made' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[1000] overflow-hidden"
          >
            <ReadyMadeGallery
              onBackToLanding={() => setAppMode('welcome')}
              onApplyConfig={(selectedConfig) => {
                setConfig({
                  ...selectedConfig,
                  chairMaterial: 'titanium',
                  color: '#original',
                  showTable: false
                });
                setAppMode('customizer');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="w-full h-full flex flex-col bg-[#f9f9f9] text-[#000000] font-['Space_Grotesk'] overflow-hidden"
      >
        <AnimatePresence>
          {quoteResult && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "bg-[#f3f3f3] shadow-[inset_2px_2px_0px_0px_#ffffff,inset_-2px_-2px_0px_0px_#474747] w-full flex flex-col overflow-hidden max-h-[90vh]",
                isMobile ? "max-w-md scale-[0.85]" : "max-w-2xl"
              )}
            >
              {/* Modal Top Title Bar */}
              <div className="bg-[#000000] text-[#ffffff] force-white-text px-4 py-1 md:py-2 flex justify-between items-center h-8 md:h-10 shrink-0 select-none">
                <span className="text-[9px] md:text-xs font-bold tracking-[0.2em] uppercase font-mono force-white-text">EXPORTER_UTILITY_v1.0</span>
                <button 
                  onClick={() => setQuoteResult(null)}
                  className="bg-[#c6c6c6] text-[#000000] h-5 w-5 md:h-6 md:w-6 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-red-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Tab Bar Selector */}
              <div className="flex bg-[#e2e2e2] border-b border-gray-300 px-3 pt-1.5 shrink-0 select-none items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setModalTab('quote')}
                    className={cn(
                      "px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all relative top-[1px] border-b-0",
                      modalTab === 'quote' 
                        ? "bg-[#f3f3f3] text-[#000000] border-t border-x border-gray-400 font-extrabold shadow-[inset_0px_1px_0px_#f3f3f3]"
                        : "text-gray-500 hover:text-black hover:bg-gray-100"
                    )}
                  >
                    QUOTE_EXPORT.EXE
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('library')}
                    className={cn(
                      "px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all relative top-[1px] border-b-0",
                      modalTab === 'library'
                        ? "bg-[#f3f3f3] text-[#000000] border-t border-x border-gray-400 font-extrabold shadow-[inset_0px_1px_0px_#f3f3f3]"
                        : "text-gray-500 hover:text-black hover:bg-gray-100"
                    )}
                  >
                    DESIGN_LIBRARY.EXE ({library.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChairShowroom(true)}
                  className="mb-1 text-[8.5px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 px-2.5 py-1 bg-[#fcfcfc] hover:bg-zinc-200 active:scale-95 text-black border border-zinc-300 transition-all"
                >
                  <Grid size={11} className="text-zinc-600 shrink-0" />
                  SHOWROOM_GRID.EXE / 虚拟展厅
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className={cn("overflow-y-auto custom-scrollbar flex-1", isMobile ? "p-3 pb-4" : "p-6")}>
                {modalTab === 'quote' ? (
                  <div className={cn("flex gap-4 md:gap-6", isMobile ? "flex-col" : "flex-row")}>
                    {/* Left Screen Capture Image with Digital Assembly Hologram & Scanner Sweep */}
                    <div className={cn("bg-white border shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] p-1 shrink-0 flex items-center justify-center relative overflow-hidden", isMobile ? "w-full aspect-square" : "w-[240px] h-[240px]")}>
                      <img src={quoteResult.image} alt="Table Config" className="max-w-full max-h-full object-contain" />
                      
                      {/* Interactive Particle Scanner Overlay */}
                      <AnimatePresence>
                        {isExporting && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#f3f3f3]/95 backdrop-blur-[1px] flex flex-col justify-between p-3.5 font-mono select-none overflow-hidden border border-black/20"
                          >
                            {/* Drafting Blueprint millimeter grid pattern overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbdbdb_1px,transparent_1px),linear-gradient(to_bottom,#dbdbdb_1px,transparent_1px)] bg-[size:12px_12px] opacity-75 pointer-events-none" />
                            
                            {/* Technical Red Scanner Sweep Line */}
                            <motion.div
                              initial={{ y: "-10%" }}
                              animate={{ y: "110%" }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 right-0 h-[1.5px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] pointer-events-none z-20"
                            />

                            {/* Floating tactile square shavings / data-blocks */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              {exportParticles.map((pt) => (
                                <motion.div
                                  key={pt.id}
                                  initial={{ x: `${pt.x}%`, y: `${pt.y}%`, scale: 1, opacity: 1, rotate: 0 }}
                                  animate={{
                                    x: `${pt.x + pt.vx * 15}%`,
                                    y: `${pt.y + pt.vy * 15}%`,
                                    scale: 0.25,
                                    opacity: 0,
                                    rotate: pt.vx * 45
                                  }}
                                  transition={{ duration: 1.3, ease: "easeOut" }}
                                  className="absolute rounded-none pointer-events-none border border-black/5"
                                  style={{
                                    width: pt.size,
                                    height: pt.size,
                                    backgroundColor: pt.color,
                                  }}
                                />
                              ))}
                            </div>

                            {/* Corner bracket reticles - Neutral design drafting style */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-14 h-14 pointer-events-none opacity-40 z-10">
                              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black"></div>
                              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black"></div>
                              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black"></div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black"></div>
                              <span className="text-[7px] font-black text-black tracking-widest uppercase scale-90">COMPILING</span>
                            </div>

                            {/* Top info line */}
                            <div className="flex justify-between items-center text-[8px] text-black font-black tracking-widest z-10">
                              <span>WRITE_LNK: COORD_#DB</span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-black animate-pulse" />
                                SAVING
                              </span>
                            </div>

                            {/* Analog Progress Box (Progress steps + Windows 95 segmented progress) */}
                            <div className="space-y-1.5 z-10 bg-[#e6e6e6] p-2 border border-black shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080]">
                              <div className="flex justify-between items-center text-[8px] font-extrabold text-black tracking-wide leading-none font-mono">
                                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]">
                                  {exportStepText}
                                </span>
                                <span>{exportProgress}%</span>
                              </div>
                              
                              {/* Classic Windows 95 style beveled segment progress bar */}
                              <div className="h-4 bg-white p-[2px] border border-gray-400 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.25)] flex gap-[1.5px] items-center">
                                {Array.from({ length: 15 }).map((_, idx) => {
                                  const tickProgress = (idx / 14) * 100;
                                  const isActive = exportProgress >= tickProgress;
                                  return (
                                    <div
                                      key={idx}
                                      className={cn(
                                        "h-full flex-1 transition-colors duration-100",
                                        isActive ? "bg-zinc-950 shadow-[0_0_1px_rgba(0,0,0,0.4)]" : "bg-[#f3f3f3]"
                                      )}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right Specs, Price & Actions */}
                    <div className="flex-1 flex flex-col gap-3 justify-between min-w-0">
                      <div className="space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-gray-400 uppercase block">Config ID</span>
                          <p className="text-[10px] font-mono font-bold">#CHR-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-gray-400 uppercase block">Specs & Physics / 细节参数</span>
                          <div className="grid grid-cols-1 gap-0.5 text-[9px] font-bold uppercase leading-tight font-mono text-black">
                            <span>CHAIR / 型号: {config.chairId || 'CY-A1'}</span>
                            <span>QTY / 数量: {config.chairCount}把</span>
                            <span>MAT / 材质: {config.chairMaterial === 'titanium' ? '钛合金 (TITANIUM)' : config.chairMaterial === 'wood' ? '科技木 (WOOD GRAIN)' : '科技布 (FABRIC)'}</span>
                            <span>ARMREST / 扶手: {config.chairHasArmrest ? 'Added (有扶手)' : 'None (无扶手)'}</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-gray-400 uppercase block">Tuning Data / 调参数据</span>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] font-mono leading-tight text-gray-600 border border-gray-200 bg-gray-50 p-1.5 rounded-sm">
                            <div>BACK_ANGLE: {config.chairBackrestAngle || 98}°</div>
                            <div>ARMREST: {config.chairHasArmrest ? 'YES' : 'NONE'}</div>
                            <div>DECALS: ORIGINAL</div>
                            <div>CHAIR_MAT: {config.chairMaterial?.toUpperCase() || 'TITANIUM'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-dashed border-gray-300">
                        <span className="text-[8px] font-mono text-gray-400 uppercase block">Quotation</span>
                        <p className={cn("font-black tracking-tighter text-black", isMobile ? "text-xl" : "text-3xl")}>
                          ¥{quoteResult.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button 
                          onClick={handleExportPNG}
                          disabled={isExporting || isExportingGLB}
                          className={cn(
                            "flex-1 text-[#ffffff] force-white-text py-1.5 font-bold text-[9px] uppercase tracking-wider shadow-[2px_2px_0px_#808080] flex items-center justify-center gap-1.5 transition-colors border border-black cursor-pointer",
                            (isExporting || isExportingGLB)
                              ? "bg-gray-500 cursor-not-allowed border-gray-500 shadow-none animate-pulse" 
                              : "bg-[#000000] hover:bg-gray-800"
                          )}
                        >
                          {isExporting ? (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-600 animate-pulse rounded-full" />
                              <span>{exportProgress}%</span>
                            </div>
                          ) : (
                            <span>Export PNG</span>
                          )}
                        </button>

                        <button 
                          onClick={handleExportGLB}
                          disabled={isExporting || isExportingGLB}
                          className={cn(
                            "flex-1 text-black py-1.5 font-bold text-[9px] uppercase tracking-wider shadow-[2px_2px_0px_#808080] flex items-center justify-center gap-1.5 transition-colors border border-black cursor-pointer",
                            (isExporting || isExportingGLB)
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none" 
                              : "bg-white hover:bg-gray-100"
                          )}
                        >
                          {isExportingGLB ? (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-600 animate-pulse rounded-full" />
                              <span>{exportProgress}%</span>
                            </div>
                          ) : (
                            <span>Export GLB</span>
                          )}
                        </button>
                      </div>

                      {/* INPUT COMPONENT TO SAVE TO LIBRARY */}
                      <div className="mt-2 p-2 bg-[#e8e8e8] border border-gray-300 shadow-[inset_1px_1px_0px_0px_#ffffff]">
                        <span className="text-[8px] font-mono text-gray-500 uppercase block mb-1 font-bold">
                          Save to Library / 保存搭配到库
                        </span>
                        <div className="flex flex-col gap-1.5">
                          <input 
                            type="text" 
                            value={libraryName}
                            disabled={isExporting || isExportingGLB}
                            onChange={(e) => setLibraryName(e.target.value)}
                            placeholder={`e.g., CUSTOM_CHAIR_${config.chairId || 'CY-A1'}`}
                            className="bg-white border-2 border-gray-400 px-2 py-1 text-[9px] uppercase font-mono tracking-wider focus:outline-none focus:border-black shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <button 
                            type="button"
                            onClick={handleSaveToLibrary}
                            disabled={saveSuccess || isExporting || isExportingGLB}
                            className={cn(
                              "text-[#ffffff] force-white-text py-1 text-[8px] font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#808080] shrink-0 border border-black flex items-center justify-center gap-1.5 w-full",
                              saveSuccess 
                                ? "bg-green-600 border-green-600" 
                                : (isExporting || isExportingGLB) ? "bg-gray-500 border-gray-500 cursor-not-allowed shadow-none" : "bg-black hover:bg-gray-800"
                            )}
                          >
                            {saveSuccess ? (
                              "✓ SAVED SUCCESS"
                            ) : (
                              "SAVE TO LIBRARY (保存当前设计)"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Saved Configs List */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-300 pb-1.5">
                      <span className="text-[9px] font-bold tracking-wider uppercase font-mono text-gray-700">
                        Saved Configurations / 库内储存的参数
                      </span>
                      <span className="text-[8px] text-gray-500 font-mono uppercase">{library.length} DESIGNS</span>
                    </div>

                    {library.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 md:py-16 text-gray-400 gap-2 border-2 border-dashed border-gray-300 bg-white">
                        <Cpu size={24} className="stroke-[1.5]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Your design library is empty</span>
                        <span className="text-[8px] text-gray-500">Go to QUOTE_EXPORT tab and press Save to record your current table parameters.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 select-none custom-scrollbar">
                        {library.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-white border border-gray-300 p-2.5 flex gap-3 shadow-[1px_1px_0px_#b3b3b3] hover:border-black transition-colors"
                          >
                            <div className="w-[64px] h-[64px] bg-gray-50 border border-gray-200 shadow-[inset_1px_1px_0px_0px_#e5e5e5] p-0.5 shrink-0 flex items-center justify-center">
                              <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <h4 className="text-[10px] font-bold truncate uppercase tracking-wider text-black line-clamp-1">{item.name}</h4>
                                <div className="text-[8px] text-gray-500 font-mono leading-relaxed mt-0.5">
                                  MODEL: {item.config.chairId || 'CY-A1'}<br />
                                  MAT: {(item.config.chairMaterial || 'titanium').toUpperCase()}<br />
                                  ARMREST: {item.config.chairHasArmrest ? "YES" : "NONE"}<br />
                                  QTY: {item.config.chairCount || 1} PCS
                                </div>
                              </div>
                              <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-dashed border-gray-100">
                                <span className="text-[10px] font-black text-black">¥{item.price.toLocaleString()}</span>
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => handleLoadFromLibrary(item.config, item.image, item.price)}
                                    className="bg-black hover:bg-gray-800 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider shadow-[1px_1px_0px_#808080]"
                                  >
                                    LOAD
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteFromLibrary(item.id)}
                                    className="bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider shadow-[1px_1px_0px_#808080]"
                                    title="Delete design"
                                  >
                                    DEL
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom system status info */}
              <div className="bg-[#e8e8e8] px-3 py-1 border-t border-gray-300 flex justify-between text-[7px] font-mono text-gray-500 uppercase shrink-0">
                <span>Valid 24H</span>
                <span className="hidden md:inline">System v1.0.4r</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="h-8 md:h-10 border-b-2 border-white shadow-[inset_-1px_-1px_0px_0px_#808080] flex justify-between items-center px-2 z-50 bg-[#f9f9f9] text-[#000000]">
        <div className="flex items-center gap-4">
          <span className={cn("font-black tracking-tighter uppercase text-[#000000] force-black-text", isMobile ? "text-[10px]" : "text-lg")}>TABLE_CONFIG.EXE</span>
          <nav className="hidden md:flex gap-4 ml-6 text-xs font-bold uppercase tracking-tighter items-center">
            <button className="underline hover:bg-black hover:text-white px-2 py-0.5">File</button>
            <button className="text-gray-500 hover:bg-black hover:text-white px-2 py-0.5">Edit</button>
            <button className="text-gray-500 hover:bg-black hover:text-white px-2 py-0.5">View</button>
            <button className="text-gray-500 hover:bg-black hover:text-white px-2 py-0.5">Help</button>
            <div className="h-3 w-[1px] bg-zinc-300 mx-1" />
            <button 
              onClick={() => setAppMode('welcome')} 
              className="text-zinc-955 hover:bg-black hover:force-white-text hover:text-white px-2.5 py-0.5 border border-zinc-400 font-mono font-black tracking-widest bg-[#e8e8e8] shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[1px] active:translate-y-[1px]"
            >
              ← ATELIER_HOME
            </button>
          </nav>
        </div>
        <div className="flex gap-1 items-center mr-1">
          <button 
            onClick={() => setAppMode(prevMode)}
            className="p-1 bg-[#e8e8e8] text-[#111111] hover:bg-zinc-200 border border-zinc-400 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[0.5px] active:translate-y-[0.5px]"
            title="返回上一界面 (Back to Previous Screen)"
          >
            <ChevronLeft size={14} className="shrink-0" />
          </button>
          <button 
            onClick={() => setAppMode('welcome')}
            className="p-1 bg-[#e8e8e8] text-[#111111] hover:bg-zinc-200 border border-zinc-400 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[0.5px] active:translate-y-[0.5px]"
            title="返回主页 (Back to Home)"
          >
            <Home size={14} className="shrink-0" />
          </button>
        </div>
      </header>

      <div className={cn("flex-1 flex relative overflow-hidden", isVertical ? "flex-col" : "flex-row")}>
        {/* Left Toolbar */}
        <aside className={cn(
          "border-white bg-[#f9f9f9] shrink-0 z-40",
          isVertical 
            ? "w-full h-10 border-b-2 shadow-[inset_0px_-1px_0px_0px_#808080] flex flex-row items-center px-4 justify-between" 
            : cn("border-r-2 shadow-[inset_-1px_0px_0px_0px_#808080] flex flex-col items-center py-4 gap-2", isMobile ? "w-10" : "w-16")
        )}>
          <div className={cn(
            "grid gap-1 px-1", 
            isVertical ? "flex flex-row gap-2" : (isMobile ? "grid-cols-1" : "grid-cols-2")
          )}>
            <ToolbarButton active icon={<MousePointer2 size={isMobile ? 12 : 14} />} title="Interact Mode (交互模式)" />
            <ToolbarButton 
              active={showChat} 
              icon={<MessageSquare size={isMobile ? 12 : 14} />} 
              title={showChat ? "Close AI Chat (关闭AI对话)" : "Open AI Chat (打开AI对话)"} 
              onClick={() => setShowChat(prev => !prev)} 
            />
            <ToolbarButton 
              icon={<Library size={isMobile ? 12 : 14} />} 
              title="Design Library (查看设计库)" 
              onClick={handleOpenLibrary} 
            />
            <ToolbarButton 
              active={showPricingLogic}
              icon={<ReceiptText size={isMobile ? 12 : 14} />} 
              title="Pricing Logic Breakdown (报价逻辑说明单)" 
              onClick={() => setShowPricingLogic(prev => !prev)} 
            />
            {!isMobile && (
              <>
                <ToolbarButton icon={<Brush size={14} />} title="Materials (材质)" />
                <ToolbarButton icon={<Wand2 size={14} />} title="AI Configure (AI配置)" />
                <ToolbarButton icon={<Rotate3d size={14} />} title="Rotate View (旋转视图)" />
              </>
            )}
          </div>
          <div className={cn(
            "flex items-center",
            isVertical ? "flex-row gap-3 ml-auto" : "mt-auto mb-4 flex-col gap-2"
          )}>
            <span className="text-[8px] text-gray-400 font-mono">V1.0.4</span>
            <div className="w-6 h-6 bg-black"></div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className={cn("flex-1 relative bg-white min-w-0", isVertical && "min-h-0")}>
          <Scene config={config} ref={sceneRef} isMobile={isMobile} progress={isGeneratingQuote ? generationProgress : undefined} />

          <AnimatePresence>
            {isGeneratingQuote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-white/65 backdrop-blur-[3px] z-[90] flex flex-col items-center justify-between p-6 select-none overflow-hidden border border-black/10 font-mono"
              >
                {/* Millimeter drafting lines grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#dcdcdc_1px,transparent_1px),linear-gradient(to_bottom,#dcdcdc_1px,transparent_1px)] bg-[size:16px_16px] opacity-80 pointer-events-none" />
                
                {/* Floating laser particles / data-coordinates */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {generationParticles.map((pt) => (
                    <motion.div
                      key={pt.id}
                      initial={{ x: `${pt.x}%`, y: `${pt.y}%`, scale: 1, opacity: 1, rotate: 0 }}
                      animate={{
                        x: `${pt.x + pt.vx * 12}%`,
                        y: `${pt.y + pt.vy * 12}%`,
                        scale: 0.3,
                        opacity: 0,
                        rotate: pt.vx * 30
                      }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                      className="absolute rounded-none pointer-events-none border border-black/10"
                      style={{
                        width: pt.size,
                        height: pt.size,
                        backgroundColor: pt.color,
                      }}
                    />
                  ))}
                </div>

                {/* Laser scan lines sweeping down and up */}
                <motion.div 
                  initial={{ y: "0%" }}
                  animate={{ y: "100%" }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-zinc-400 to-transparent shadow-[0_0_8px_rgba(161,161,170,0.5)] z-10 pointer-events-none"
                />

                {/* Top header telemetry logs */}
                <div className="w-full flex justify-between items-center text-[9px] font-black tracking-widest text-zinc-700 z-10 select-none bg-white/45 p-1 px-2 border border-gray-300">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 bg-zinc-600 animate-ping rounded-full" />
                    <span>ENGINE_STATUS: GROWING_GEOMETRY</span>
                  </div>
                  <div>SYS_LNK: CHAIR_#{(config.chairId || 'CY-A1')}_{(config.chairMaterial || 'titanium').toUpperCase()}</div>
                </div>

                {/* Visual Blueprint Reticle Outline */}
                <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none my-4">
                  {/* Subtle vector-crosshair drafting layout */}
                  <div className="absolute w-[200px] h-[200px] md:w-[320px] md:h-[320px] border border-zinc-400/20 rounded-full flex items-center justify-center">
                    <div className="absolute w-[120px] h-[120px] md:w-[200px] md:h-[200px] border border-dashed border-zinc-400/10 rounded-full" />
                    <div className="absolute h-full w-[1px] bg-dashed bg-gradient-to-b from-transparent via-zinc-400/20 to-transparent" />
                    <div className="absolute w-full h-[1px] bg-dashed bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />
                  </div>

                  {/* High Tech Reticles */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-28 h-28 opacity-45">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black" />
                  </div>

                  {/* Dynamic Isometric Structural Table Assembly Animation */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <BlueprintTable config={config} progress={generationProgress} />
                  </div>

                  {/* Overlay live measurements */}
                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-[#e6e6e6]/95 border border-black/40 p-2 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] text-[8px] font-bold text-black z-20 space-y-0.5 pointer-events-none uppercase tracking-wider font-mono min-w-[125px]">
                    <div className="text-gray-500 border-b border-gray-300 pb-0.5 mb-1 flex justify-between">
                      <span>CHAIR SPECS</span>
                      <span>PARM:OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MODEL ID:</span> 
                      <span className="text-[#8c6239]">{config.chairId || 'CY-A1'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MATERIAL:</span> 
                      <span className="text-[#8c6239]">{config.chairMaterial === 'titanium' ? '钛合金 (TITANIUM)' : config.chairMaterial === 'wood' ? '科技木 (WOOD_GRAIN)' : '科技布 (FABRIC)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ARMRESTS:</span> 
                      <span className="text-[#8c6239]">{config.chairHasArmrest ? 'ADDED' : 'NONE'}</span>
                    </div>
                    <div className="flex justify-between pt-0.5 border-t border-dashed border-gray-300">
                      <span>EST. WEIGHT:</span> 
                      <span>{config.chairHasArmrest ? '14.5 kg' : '12.5 kg'}</span>
                    </div>
                  </div>
                </div>

                {/* Classic UI progress controls */}
                <div className="w-full max-w-sm space-y-2 bg-[#e6e6e6] p-3 border-2 border-black shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] z-10 font-mono">
                  <div className="flex justify-between items-center text-[10px] font-black text-black leading-none">
                    <span className="truncate">{generationStepText}</span>
                    <span className="flex-shrink-0 ml-2">{generationProgress}%</span>
                  </div>

                  {/* Segmented retrograde beveled progress bars */}
                  <div className="h-5 bg-white p-[2px] border border-gray-400 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.25)] flex gap-[2px] items-center">
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const segmentProgress = (idx / 19) * 100;
                      const isActive = generationProgress >= segmentProgress;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "h-full flex-1 transition-all duration-75",
                            isActive ? "bg-zinc-850 shadow-[0_0_1px_rgba(24,24,27,0.2)]" : "bg-[#f0f0f0]"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Chat Window (only rendered when not portrait) */}
          {!isPortrait && showChat && (
            <div 
              ref={chatRef}
              style={{ 
                left: isMobile ? 12 : chatPos.x, 
                top: isMobile ? (isMinimized ? 'auto' : 12) : chatPos.y, 
                bottom: isMobile ? (isMinimized ? 8 : 12) : 'auto',
                width: isMinimized ? 'auto' : (isMobile ? '260px' : chatSize.width), 
                height: isMinimized ? 'auto' : (isMobile ? 'calc(100% - 24px)' : chatSize.height) 
              }}
              className={cn(
                isMobile ? "absolute" : "fixed",
                "bg-[#f3f3f3] shadow-[inset_2px_2px_0px_0px_#ffffff,inset_-2px_-2px_0px_0px_#474747] flex flex-col z-[100] overflow-hidden",
                !isMobile && "max-h-[85%]",
                isMinimized && "cursor-default",
                !isDraggingChat && !isResizingChat && "transition-all duration-300"
              )}
            >
              <div 
                onMouseDown={onChatMouseDown}
                className="bg-[#000000] text-[#ffffff] force-white-text px-2 py-1 flex justify-between items-center h-7 cursor-move shrink-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase font-mono force-white-text">AI_SYSTEM.EXE</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="bg-[#c6c6c6] text-black h-4 px-1 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-white"
                    title="Minimize"
                  >
                    {isMinimized ? <Maximize2 size={10} /> : <Minus size={10} />}
                  </button>
                  <button 
                    onClick={() => setShowChat(false)}
                    className="bg-[#c6c6c6] text-black h-4 px-1 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-red-500 hover:text-white"
                    title="Close"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
              {!isMinimized && (
                <>
                  <div className="px-2 pt-2 pb-1 flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] p-3 flex flex-col gap-3 text-[11px]">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                          <span className="font-mono text-[9px] text-gray-400 uppercase">
                            {msg.role === 'ai' ? `SYSTEM_LOG_${msg.time}` : `USER_INPUT_${msg.time}`}
                          </span>
                          <p className={cn(
                            "p-2 max-w-[90%]",
                            msg.role === 'user' ? "bg-[#000000] text-[#ffffff] force-white-text" : "text-[#000000] font-medium force-black-text"
                          )}>
                            {msg.text}
                          </p>
                        </div>
                      ))}
                      {isProcessing && (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono text-[9px] text-gray-400 uppercase animate-pulse">PROCESSING...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                  <form onSubmit={handleChatSubmit} className="px-2 pb-2 pt-1 flex gap-1 shrink-0 w-full relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="TYPE COMMAND..."
                      className="flex-1 min-w-0 bg-white border-none text-[10px] uppercase font-mono px-2 py-1 focus:ring-0 shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080]"
                    />
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="bg-[#000000] text-[#ffffff] force-white-text px-3 py-1 font-bold text-[10px] hover:bg-gray-800 disabled:opacity-50 shrink-0"
                    >
                      EXEC
                    </button>
                  </form>
                  {/* Resize Handle */}
                  {!isMobile && (
                    <div 
                      onMouseDown={onResizeMouseDown}
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
                    >
                      <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-gray-400"></div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Portrait / Vertical Mode Popover Chat Window */}
          {isPortrait && showChat && (
            <div 
              ref={chatRef}
              style={{ 
                top: "12px", 
                left: "12px", 
                right: "12px",
                height: "190px" 
              }}
              className="absolute bg-[#f3f3f3] shadow-[inset_2px_2px_0px_0px_#ffffff,inset_-2px_-2px_0px_0px_#474747] flex flex-col z-[100] overflow-hidden transition-all duration-300 animate-fadeIn"
            >
              {/* Header (with Title and Close Icon) */}
              <div className="bg-[#000000] text-[#ffffff] force-white-text px-2 py-1 flex justify-between items-center h-6 shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono force-white-text">AI_SYSTEM.EXE</span>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="bg-[#c6c6c6] text-black h-3.5 w-3.5 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-white text-[8px]"
                >
                  <X size={8} />
                </button>
              </div>

              {/* Message Log */}
              <div className="px-2 pt-2 pb-1 flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto bg-white/70 backdrop-blur-sm shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] p-2 flex flex-col gap-2.5 text-[10px] custom-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col gap-0.5", msg.role === 'user' ? "items-end" : "items-start")}>
                      <span className="font-mono text-[8px] text-gray-400 uppercase">
                        {msg.role === 'ai' ? `SYSTEM_${msg.time}` : `USER_${msg.time}`}
                      </span>
                      <p className={cn(
                        "p-1.5 max-w-[90%]",
                        msg.role === 'user' ? "bg-[#000000] text-[#ffffff] force-white-text" : "text-[#000000] font-medium force-black-text"
                      )}>
                        {msg.text}
                      </p>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="font-mono text-[8px] text-gray-400 uppercase animate-pulse">PROCESSING...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleChatSubmit} className="px-2 pb-2 pt-1 flex gap-1 shrink-0 w-full bg-[#f3f3f3]">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="TYPE COMMAND..."
                  className="flex-1 min-w-0 bg-white border-none text-[9px] uppercase font-mono px-1.5 py-1 focus:ring-0 shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080]"
                />
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="bg-[#000000] text-[#ffffff] force-white-text px-2.5 py-1 font-bold text-[9px] hover:bg-gray-800 disabled:opacity-50 shrink-0"
                >
                  EXEC
                </button>
              </form>
            </div>
          )}

          {/* Material Bar */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-1 p-1 bg-[#eeeeee] shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] z-40">
            <div className="px-3 border-r border-gray-400 mr-2 shrink-0">
              <span className="font-mono text-[10px] font-bold">
                MATERIAL
              </span>
            </div>
            <div className="flex gap-1">
              {config.chairId && !config.showTable ? (
                <>
                  <MaterialButton 
                    type={isMobile ? "钛合金" : "titanium / 钛合金"} 
                    color="#4b5563" 
                    active={(config.chairMaterial || 'titanium') === 'titanium'} 
                    onClick={() => {
                      pushToHistory(config);
                      updateParam('chairMaterial', 'titanium');
                      const isTitaniumColor = TITANIUM_COLORS.some(tc => tc.color.toLowerCase() === (config.color || '').toLowerCase());
                      if (!isTitaniumColor) {
                        updateParam('color', '#original');
                      }
                    }} 
                    isMobile={isMobile} 
                  />
                  <MaterialButton 
                    type={isMobile ? "科技木" : "wood / 科技木"} 
                    color="#b58a59" 
                    active={config.chairMaterial === 'wood'} 
                    onClick={() => {
                      pushToHistory(config);
                      updateParam('chairMaterial', 'wood');
                    }} 
                    isMobile={isMobile} 
                  />
                  <MaterialButton 
                    type={isMobile ? "科技布" : "fabric / 科技布"} 
                    color="#9e8e81" 
                    active={config.chairMaterial === 'fabric'} 
                    onClick={() => {
                      pushToHistory(config);
                      updateParam('chairMaterial', 'fabric');
                      const isFabricColor = FABRIC_COLORS.some(fc => fc.color.toLowerCase() === (config.color || '').toLowerCase());
                      if (!isFabricColor) {
                        updateParam('color', '#5d5fdf'); // Default to 极光蓝紫
                      }
                    }} 
                    isMobile={isMobile} 
                  />
                </>
              ) : (
                <>
                  <MaterialButton type="oak" color={MATERIAL_COLORS.oak} active={config.material === 'oak'} onClick={() => handleMaterialChange('oak')} isMobile={isMobile} />
                  <MaterialButton type="steel" color={MATERIAL_COLORS.steel} active={config.material === 'steel'} onClick={() => handleMaterialChange('steel')} isMobile={isMobile} />
                  <MaterialButton type="glass" color={MATERIAL_COLORS.glass} active={config.material === 'glass'} onClick={() => handleMaterialChange('glass')} isGlass isMobile={isMobile} />
                  <MaterialButton type="chrome" color={MATERIAL_COLORS.chrome} active={config.material === 'chrome'} onClick={() => handleMaterialChange('chrome')} isMobile={isMobile} />
                  <MaterialButton type="marble" color={MATERIAL_COLORS.marble} active={config.material === 'marble'} onClick={() => handleMaterialChange('marble')} isMobile={isMobile} />
                </>
              )}
            </div>
          </div>

          {/* Pricing Logic Breakdown Window (报价计价说明单) */}
          <AnimatePresence>
            {showPricingLogic && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute bg-[#f3f3f3] shadow-[inset_2px_2px_0px_0px_#ffffff,inset_-2px_-2px_0px_0px_#474747] border border-black/15 flex flex-col z-[105] overflow-hidden rounded-none font-mono text-xs text-black",
                  isMobile 
                    ? "inset-x-3 bottom-1.5 top-auto h-[60vh] max-h-[420px]" 
                    : "right-3 top-3 w-[340px] max-h-[85%]"
                )}
              >
                {(() => {
                  const tableBasePrice = 4500;
                  const volume = config.width * config.depth * config.height;
                  
                  const materialMultipliers: Record<string, number> = {
                    oak: 1.5,
                    steel: 1.2,
                    glass: 1.8,
                    chrome: 1.4,
                    marble: 4.5
                  };
                  const materialMultiplier = materialMultipliers[config.material] || 1.0;
                  const volumeCost = volume * 0.005 * materialMultiplier;
                  
                  const isPentagon = config.legInnerDepth > 0;
                  const craftsmanshipBase = isPentagon ? 1200 : 500;
                  
                  const frameCost = (config.frameThickness * 2) + (config.frameInwardOffset * 0.5);
                  const taperCost = Math.abs(config.legTaper) * 15;
                  const sizeMultiplier = config.width > 200 ? 1.2 : 1.0;
                  
                  let tableTotal = (tableBasePrice + volumeCost + craftsmanshipBase + taperCost + frameCost) * sizeMultiplier;
                  
                  // Chair breakout
                  let singleChairCost = 8200;
                  let hasArmrestAddon = config.chairHasArmrest;
                  if (hasArmrestAddon) singleChairCost += 2000;
                  
                  const chairMat = config.chairMaterial || 'titanium';
                  let chairMatAddon = (chairMat === 'wood' || chairMat === 'fabric');
                  if (chairMatAddon) singleChairCost += 2000;
                  
                  let chairColorAddon = false;
                  if (chairMat === 'titanium') {
                    const isOriginalColor = !config.color || config.color === '#original' || config.color === 'original' || config.color === '#ffffff';
                    if (!isOriginalColor) {
                      chairColorAddon = true;
                      singleChairCost += 1000;
                    }
                  }
                  
                  let chairsCost = 0;
                  const hasChairs = !!(config.chairId && config.chairCount && config.chairCount > 0);
                  if (hasChairs) {
                    chairsCost = singleChairCost * config.chairCount!;
                  }

                  const overallTotal = config.showTable === false && config.chairId
                    ? singleChairCost
                    : Math.round(tableTotal + chairsCost);

                  return (
                    <>
                      {/* Window Header */}
                      <div className="bg-[#000000] text-[#ffffff] force-white-text px-2.5 py-1.5 flex justify-between items-center h-8 shrink-0 select-none">
                        <div className="flex items-center gap-1.5">
                          <ReceiptText size={12} className="text-white shrink-0" />
                          <span className="text-[10px] font-black tracking-widest uppercase font-mono force-white-text">PRICE_LEDGER.EXE</span>
                        </div>
                        <button 
                          onClick={() => setShowPricingLogic(false)}
                          className="bg-[#c6c6c6] text-black h-4 w-4 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-white text-[9px] font-bold"
                        >
                          <X size={10} />
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {/* Title Header */}
                        <div className="border-b border-gray-300 pb-2">
                          <h3 className="text-xs font-black text-black">QUOTATION BREAKDOWN / 报价计价逻辑单</h3>
                          <p className="text-[8px] text-gray-400 mt-0.5 tracking-tight font-mono uppercase">REALTIME PRICING ENGINE v1.2</p>
                        </div>

                        {/* If showing only chair */}
                        {config.showTable === false && config.chairId ? (
                          <div className="space-y-3">
                            <div className="bg-white p-2.5 border border-gray-300 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.05)] space-y-2">
                              <div className="flex justify-between font-black text-[9px] text-[#8b5e3c] uppercase pb-1 border-b border-dashed border-gray-200">
                                <span>CHAIR ONLY MODE / 仅座椅配置</span>
                                <span>{config.chairId}</span>
                              </div>
                              <div className="space-y-1 text-[9px] font-mono leading-relaxed">
                                <div className="flex justify-between text-gray-500">
                                  <span>Base Design Fee / 钛金椅基础定价:</span>
                                  <span className="font-bold text-black">¥8,200</span>
                                </div>
                                {hasArmrestAddon && (
                                  <div className="flex justify-between text-gray-500">
                                    <span>Armrest Addition / 加装悬臂扶手:</span>
                                    <span className="font-bold text-black">+¥2,000</span>
                                  </div>
                                )}
                                {chairMatAddon && (
                                  <div className="flex justify-between text-gray-500">
                                    <span>Premium Shell Material / 改高级木/布表面:</span>
                                    <span className="font-bold text-black">+¥2,000</span>
                                  </div>
                                )}
                                {chairColorAddon && (
                                  <div className="flex justify-between text-gray-500">
                                    <span>Anodized Shimmer Custom Color / 钛金电镀定制色:</span>
                                    <span className="font-bold text-black">+¥1,000</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Showing Table & Chairs
                          <div className="space-y-4">
                            {/* Table section */}
                            <div className="bg-white p-2.5 border border-gray-300 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.05)] space-y-2">
                              <div className="flex justify-between font-black text-[9px] text-black uppercase pb-1 border-b border-dashed border-gray-200">
                                <span>1. DRAFTING TABLE MODULE / 桌体工本</span>
                                <span>¥{Math.round(tableTotal).toLocaleString()}</span>
                              </div>
                              <div className="space-y-1.5 text-[9px] font-mono leading-relaxed">
                                <div className="flex justify-between text-gray-500">
                                  <span>Base Processing Fee / 桌款起计基价:</span>
                                  <span className="font-bold text-black font-sans">¥4,500</span>
                                </div>
                                
                                <div className="text-gray-500 space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Volume Material Weight / 体积材质物理费:</span>
                                    <span className="font-bold text-black font-sans">+¥{Math.round(volumeCost).toLocaleString()}</span>
                                  </div>
                                  <div className="text-[7.5px] text-gray-400 pl-2 leading-tight">
                                    ({config.width}L × {config.depth}W × {config.height}H cm = {(volume/1000).toFixed(1)}L volume) <br />
                                    Material: {config.material.toUpperCase()} (x{materialMultiplier})
                                  </div>
                                </div>

                                <div className="text-gray-500 space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Leg Style Craftsmanship / 腿型折面工艺:</span>
                                    <span className="font-bold text-black font-sans">+¥{craftsmanshipBase}</span>
                                  </div>
                                  <div className="text-[7.5px] text-gray-400 pl-2 leading-tight">
                                    Selected leg: {isPentagon ? 'Pentagon (五边斜腿 / 专属工序)' : 'Quad (直角底方腿 / 标准工序)'}
                                  </div>
                                </div>

                                {taperCost > 0 && (
                                  <div className="flex justify-between text-gray-500">
                                    <span>Leg Taper Precision / 锥化削斜度加工:</span>
                                    <span className="font-bold text-black font-sans">+¥{taperCost}</span>
                                  </div>
                                )}

                                <div className="text-gray-500 space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Frame Steel Weight & Gauge / 桌架强化与回缩:</span>
                                    <span className="font-bold text-black font-sans">+¥{Math.round(frameCost)}</span>
                                  </div>
                                  <div className="text-[7.5px] text-gray-400 pl-2 leading-tight">
                                    Thickness of gauge: {config.frameThickness}mm | Inset: {config.frameInwardOffset}mm
                                  </div>
                                </div>

                                {sizeMultiplier > 1.0 && (
                                  <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1 rounded-sm text-[8px] leading-tight">
                                    <span>Large Size Multiplier / 宽超200cm大件位移率:</span>
                                    <span>x1.2</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Chairs section */}
                            {hasChairs && (
                              <div className="bg-white p-2.5 border border-gray-300 shadow-[inset_1px_1px_0px_rgba(0,0,0,0.05)] space-y-2">
                                <div className="flex justify-between font-black text-[9px] text-[#8b5e3c] uppercase pb-1 border-b border-dashed border-gray-200">
                                  <span>2. DOUBLE DETACHED CHAIRS / 匹配排厢椅 ({config.chairCount}把)</span>
                                  <span>¥{chairsCost.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 text-[9px] font-mono leading-relaxed">
                                  <div className="flex justify-between text-gray-500">
                                    <span>Per-Chair Base 定价:</span>
                                    <span className="font-bold text-black font-sans">¥8,200</span>
                                  </div>
                                  {hasArmrestAddon && (
                                    <div className="flex justify-between text-[8px] text-gray-400 leading-tight pl-2">
                                      <span>- Armrest / 加装悬臂扶手:</span>
                                      <span className="text-black font-sans font-bold">+¥2,000</span>
                                    </div>
                                  )}
                                  {chairMatAddon && (
                                    <div className="flex justify-between text-[8px] text-gray-400 leading-tight pl-2">
                                      <span>- Shell Material (Wood/Fabric):</span>
                                      <span className="text-black font-sans font-bold">+¥2,000</span>
                                    </div>
                                  )}
                                  {chairColorAddon && (
                                    <div className="flex justify-between text-[8px] text-gray-400 leading-tight pl-2">
                                      <span>- Custom Anodized Color Selection:</span>
                                      <span className="text-black font-sans font-bold">+¥1,000</span>
                                    </div>
                                  )}
                                  <div className="border-t border-dotted border-gray-200 pt-1 flex justify-between font-bold text-[8.5px] text-gray-700">
                                    <span>Single Chair Fee / 单椅结算:</span>
                                    <span className="font-sans font-black">¥{singleChairCost.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formula statement info */}
                        <div className="bg-zinc-100 p-2 border border-zinc-200 text-[8px] leading-normal text-zinc-500 font-mono">
                          <span className="font-bold text-zinc-700 block uppercase mb-0.5">FORMULA INDEX / 系统自动核价说明</span>
                          由于家具属于重型定制，价格由「结构基价」+「原料加工费」乘以「超长溢率」构成。
                        </div>
                      </div>

                      {/* Footer Summary block */}
                      <div className="p-3 bg-zinc-200 border-t border-zinc-300 flex flex-col gap-2 shrink-0 select-none">
                        <div className="flex items-center justify-between font-mono">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-gray-500 block leading-none uppercase">SUMMARY EVALUATION</span>
                            <span className="text-[11px] font-black text-black leading-none uppercase">TOTAL / 结算报价</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-black leading-none block font-sans">
                              ¥{overallTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPricingLogic(false)}
                          className="w-full py-1.5 bg-black hover:bg-gray-800 text-white font-bold text-[9px] uppercase tracking-wider text-center border border-black cursor-pointer shadow-[1px_1px_0px_#808080]"
                        >
                          CLOSE / 关闭退出
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Inspector */}
        <aside className={cn(
          "bg-[#f3f3f3] flex flex-col z-40 shrink-0 border-white",
          isVertical 
            ? "w-full h-[32vh] min-h-[220px] max-h-[280px] border-t-2 shadow-[inset_0px_-1px_0px_0px_#808080] p-3 gap-3" 
            : cn("shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080]", isMobile ? "w-48 p-2 gap-3" : "w-72 p-4 gap-6")
        )}>
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className={cn("font-black tracking-tighter uppercase text-[#000000] force-black-text", isMobile ? "text-sm" : "text-lg")}>Inspector</h2>
              {isMobile && (
                <div className="flex items-center gap-1 select-none">
                  <button 
                    onPointerDown={() => startScrolling('up')}
                    onPointerUp={stopScrolling}
                    onPointerLeave={stopScrolling}
                    onPointerCancel={stopScrolling}
                    onClick={(e) => e.preventDefault()}
                    className="bg-[#c6c6c6] text-black h-6 w-8 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[1px] active:translate-y-[1px] hover:bg-white text-xs select-none touch-none"
                    title="SCROLL UP"
                  >
                    <ChevronUp size={13} className="stroke-[3]" />
                  </button>
                  <button 
                    onPointerDown={() => startScrolling('down')}
                    onPointerUp={stopScrolling}
                    onPointerLeave={stopScrolling}
                    onPointerCancel={stopScrolling}
                    onClick={(e) => e.preventDefault()}
                    className="bg-[#c6c6c6] text-black h-6 w-8 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[1px] active:translate-y-[1px] hover:bg-white text-[9px] select-none touch-none"
                    title="SCROLL DOWN"
                  >
                    <ChevronDown size={13} className="stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
            <div className="h-0.5 bg-black w-full"></div>
          </div>

          <div ref={inspectorScrollRef} className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <>
                {/* 1. Material-Specific Options Picker */}
                {(!config.chairMaterial || config.chairMaterial === 'titanium') ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="font-mono text-[10px] font-bold uppercase text-black">改变颜色 / CHAIR COLOR</label>
                      <span className="text-[9px] text-gray-400 font-mono uppercase">TITANIUM ANODIZED</span>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-1 md:gap-1.5">
                      {TITANIUM_COLORS.map((item) => {
                        const isDefaultOrRaw = !config.color || config.color === '#ffffff' || config.color === '#c7c6c6' || config.color === '#9ea3a6' || config.color === '#original' || config.color === 'original';
                        const isActive = item.id === 'raw' ? isDefaultOrRaw : config.color.toLowerCase() === item.color.toLowerCase();
                        const swatchBackground = item.id === 'raw' ? '#abb4b9' : item.color;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              pushToHistory(config);
                              updateParam('color', item.color);
                            }}
                            className={cn(
                              "group p-0.5 md:p-1 flex flex-col gap-1 transition-all active:scale-98 text-left border relative min-w-0 rounded-none",
                              isActive 
                                ? "bg-black text-white border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.25)] scale-[1.01]" 
                                : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.05)]"
                            )}
                          >
                            <div 
                              className="w-full h-6 md:h-8 relative overflow-hidden ring-1 ring-black/10 flex items-center justify-center"
                              style={{ background: item.bgStyle || swatchBackground }}
                            >
                              {/* Realistic physical glossy bevel overlays */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15 pointer-events-none" />
                              <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                              
                              {/* Small checkbox when active */}
                              {isActive && (
                                <div className="absolute top-0.5 right-0.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-white text-black flex items-center justify-center font-black text-[6px] md:text-[7px] border border-black shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.15)]">
                                  ✓
                                </div>
                              )}
                            </div>

                            <div className="px-0.5 min-w-0">
                              <div className="text-[7.5px] md:text-[8.5px] font-black leading-tight tracking-tight uppercase truncate">
                                {item.name}
                              </div>
                              <div className={cn(
                                "text-[5.5px] md:text-[6.5px] font-mono leading-none tracking-tight mt-0.5 truncate uppercase",
                                isActive ? "text-zinc-400" : "text-zinc-500"
                              )}>
                                {item.eng}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                ) : config.chairMaterial === 'fabric' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="font-mono text-[10px] font-bold uppercase text-black">科技布颜色 / FABRIC COLOR</label>
                      <span className="text-[9px] text-gray-400 font-mono uppercase">12 STYLES</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1 md:gap-1.5">
                      {FABRIC_COLORS.map((item) => {
                        const isActive = !config.useCustomGradient && config.color && config.color.toLowerCase() === item.color.toLowerCase();

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              pushToHistory(config);
                              updateParam('color', item.color);
                              if (config.useCustomGradient) {
                                updateParam('useCustomGradient', false);
                              }
                            }}
                            className={cn(
                              "group p-0.5 md:p-1 flex flex-col gap-1 transition-all active:scale-98 text-left border relative min-w-0 rounded-none",
                              isActive 
                                ? "bg-black text-white border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.25)] scale-[1.01]" 
                                : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.05)]"
                            )}
                          >
                            <div 
                              className="w-full h-8 md:h-9 relative overflow-hidden ring-1 ring-black/10 flex items-center justify-center"
                              style={{ background: item.bgStyle || item.color }}
                            >
                              {/* Realistic physical glossy bevel overlays */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15 pointer-events-none" />
                              <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                              
                              {/* Small checkbox when active */}
                              {isActive && (
                                <div className="absolute top-0.5 right-0.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-white text-black flex items-center justify-center font-black text-[6px] md:text-[7px] border border-black shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.15)]">
                                  ✓
                                </div>
                              )}
                            </div>

                            <div className="px-0.5 min-w-0">
                              <div className="text-[8px] md:text-[9.5px] font-black leading-tight tracking-tight uppercase whitespace-nowrap overflow-ellipsis">
                                {item.name}
                              </div>
                              <div className={cn(
                                "text-[6px] md:text-[7px] font-mono leading-none tracking-tight mt-0.5 whitespace-nowrap uppercase text-zinc-500",
                                isActive ? "text-zinc-400" : "text-zinc-500"
                              )}>
                                {item.eng}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* 自定义渐变色功能区块 */}
                    <div className="mt-4 p-2.5 border border-zinc-200 bg-zinc-50 space-y-3.5 rounded-none">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-sans text-[10px] font-black uppercase text-black">自定义渐变 / CUSTOM GRADIENT</span>
                          <span className="text-[7px] text-zinc-400 font-mono uppercase">PATH & COLORS CUSTOMIZATION</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            pushToHistory(config);
                            updateParam('useCustomGradient', !config.useCustomGradient);
                          }}
                          className={cn(
                            "px-2 py-0.5 font-mono text-[9px] font-black tracking-tight rounded-none transition-colors",
                            config.useCustomGradient 
                              ? "bg-black text-white border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" 
                              : "bg-white text-zinc-500 border border-zinc-250 hover:border-black shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.05)]"
                          )}
                        >
                          {config.useCustomGradient ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {config.useCustomGradient && (
                        <div className="space-y-3 pt-0.5">
                          {/* 渐变类型选择 / GRADIENT TYPE */}
                          <div className="space-y-1">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase block">
                              渐变模式 / GRADIENT MODE
                            </span>
                            <div className="grid grid-cols-2 gap-1 bg-white border border-zinc-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  pushToHistory(config);
                                  updateParam('fabricGradientType', 'linear');
                                }}
                                className={cn(
                                  "py-1 font-mono text-[9px] font-black tracking-tight rounded-none transition-colors uppercase text-center",
                                  (config.fabricGradientType ?? 'linear') === 'linear'
                                    ? "bg-black text-white"
                                    : "bg-transparent text-zinc-400 hover:text-black hover:bg-zinc-100"
                                )}
                              >
                                线性 / LINEAR
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  pushToHistory(config);
                                  updateParam('fabricGradientType', 'radial');
                                }}
                                className={cn(
                                  "py-1 font-mono text-[9px] font-black tracking-tight rounded-none transition-colors uppercase text-center",
                                  config.fabricGradientType === 'radial'
                                    ? "bg-black text-white"
                                    : "bg-transparent text-zinc-400 hover:text-black hover:bg-zinc-100"
                                )}
                              >
                                径向 / RADIAL
                              </button>
                            </div>
                          </div>

                          {/* 渐变流线型视觉预览条 */}
                          <div className="space-y-1">
                            <span className="text-[7px] text-zinc-400 font-mono uppercase block">视觉预览 / DYNAMIC PREVIEW</span>
                            <div 
                              className="w-full h-4 ring-1 ring-black/10 relative overflow-hidden"
                              style={{ 
                                background: (config.fabricGradientType ?? 'linear') === 'radial'
                                  ? `radial-gradient(circle, ${config.fabricGradientStart ?? '#5d5fdf'}, ${config.fabricGradientEnd ?? '#fc678a'})`
                                  : `linear-gradient(${config.fabricGradientAngle ?? 135}deg, ${config.fabricGradientStart ?? '#5d5fdf'}, ${config.fabricGradientEnd ?? '#fc678a'})`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                            </div>
                          </div>

                          {/* 双重色彩选择面板 */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 font-bold block uppercase">
                                起始色彩 / START COLOR
                              </label>
                              <div className="flex items-center gap-1.5 bg-white border border-zinc-200 p-1">
                                <input 
                                  type="color" 
                                  value={config.fabricGradientStart ?? '#5d5fdf'}
                                  onChange={(e) => {
                                    pushToHistory(config);
                                    updateParam('fabricGradientStart', e.target.value);
                                  }}
                                  className="w-5 h-5 cursor-pointer border-0 p-0 m-0 bg-transparent"
                                />
                                <span className="font-mono text-[9px] text-zinc-650 uppercase font-bold">
                                  {config.fabricGradientStart ?? '#5d5fdf'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 font-bold block uppercase">
                                终止色彩 / END COLOR
                              </label>
                              <div className="flex items-center gap-1.5 bg-white border border-zinc-200 p-1">
                                <input 
                                  type="color" 
                                  value={config.fabricGradientEnd ?? '#fc678a'}
                                  onChange={(e) => {
                                    pushToHistory(config);
                                    updateParam('fabricGradientEnd', e.target.value);
                                  }}
                                  className="w-5 h-5 cursor-pointer border-0 p-0 m-0 bg-transparent"
                                />
                                <span className="font-mono text-[9px] text-zinc-650 uppercase font-bold">
                                  {config.fabricGradientEnd ?? '#fc678a'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 路径角度调节滑杆 */}
                          {(config.fabricGradientType ?? 'linear') === 'linear' && (
                            <div className="space-y-1.5 pb-0.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[8px] text-zinc-500 font-bold uppercase block">
                                  渐变路径角度 / GRADIENT ANGLE
                                </label>
                                <span className="font-mono text-[9px] text-black font-black">
                                  {config.fabricGradientAngle ?? 135}°
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono">
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="360"
                                  value={config.fabricGradientAngle ?? 135}
                                  onChange={(e) => {
                                    pushToHistory(config);
                                    updateParam('fabricGradientAngle', parseInt(e.target.value, 10));
                                  }}
                                  className="flex-1 accent-black h-1 rounded-none border-stone-200 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          {/* 径向渐变半径调节滑杆 */}
                          {(config.fabricGradientType ?? 'linear') === 'radial' && (
                            <div className="space-y-1.5 pb-0.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[8px] text-zinc-500 font-bold uppercase block">
                                  渐变范围大小 / GRADIENT RADIUS
                                </label>
                                <span className="font-mono text-[9px] text-black font-black">
                                  {config.fabricGradientRadius ?? 300} px
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono">
                                <input 
                                  type="range" 
                                  min="50" 
                                  max="500"
                                  value={config.fabricGradientRadius ?? 300}
                                  onChange={(e) => {
                                    pushToHistory(config);
                                    updateParam('fabricGradientRadius', parseInt(e.target.value, 10));
                                  }}
                                  className="flex-1 accent-black h-1 rounded-none border-stone-200 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="font-mono text-[10px] font-bold uppercase text-black">改变木纹 / WOOD TEXTURE</label>
                      <span className="text-[10px] text-gray-400 uppercase">TEXTURE PATTERNS</span>
                    </div>
                    
                    <div className="grid grid-cols-4 md:grid-cols-2 gap-1 md:gap-2">
                      {[
                        {
                          id: 'walnut',
                          name: '胡桃木',
                          fullName: '科技胡桃木',
                          eng: 'WALNUT',
                          bgGrad: 'linear-gradient(135deg, #78543d 0%, #5a3d2b 50%, #3d251a 100%)',
                          stripeColor: '#28140a'
                        },
                        {
                          id: 'cherry',
                          name: '灰褐木',
                          fullName: '科技灰褐木',
                          eng: 'TAUPE OAK',
                          bgGrad: 'linear-gradient(135deg, #a49182 0%, #8b796a 50%, #6f5f52 100%)',
                          stripeColor: '#473c33'
                        },
                        {
                          id: 'ash',
                          name: '米白木',
                          fullName: '科技米白木',
                          eng: 'CREAM SILK',
                          bgGrad: 'linear-gradient(135deg, #f5efe4 0%, #e7dac2 50%, #d4c2a4 100%)',
                          stripeColor: '#8a7c64'
                        },
                        {
                          id: 'oak',
                          name: '金丝橡',
                          fullName: '金丝大底橡',
                          eng: 'OAK',
                          bgGrad: 'linear-gradient(135deg, #d1a87e 0%, #b58a59 50%, #9f7344 100%)',
                          stripeColor: '#543213'
                        }
                      ].map((grain) => {
                        const isActive = (config.woodGrain || 'walnut') === grain.id;
                        return (
                          <button
                            key={grain.id}
                            type="button"
                            onClick={() => {
                              pushToHistory(config);
                              updateParam('woodGrain', grain.id);
                            }}
                            className={cn(
                              "group p-1 md:p-1.5 flex flex-col gap-1 md:gap-2 transition-all active:scale-98 text-left border relative min-w-0",
                              isActive 
                                ? "bg-black text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)] scale-[1.02]" 
                                : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
                            )}
                          >
                            {/* Visual Texture Swatch block with wood grain style procedural lines */}
                            <div 
                              className="w-full h-8 md:h-11 relative overflow-hidden ring-1 ring-black/10 flex items-center justify-center"
                              style={{ background: grain.bgGrad }}
                            >
                              {/* Realistic wavy procedural wood streaks lines inside preview canvas */}
                              <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay">
                                <div className="w-full h-full" style={{
                                  backgroundImage: `repeating-linear-gradient(90deg, ${grain.stripeColor}, ${grain.stripeColor} 2px, transparent 2px, transparent 8px)`,
                                  transform: 'rotate(12deg) scale(1.5)'
                                }} />
                              </div>
                              
                              {/* Small checkbox when active */}
                              {isActive && (
                                <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-white text-black flex items-center justify-center font-black text-[7px] md:text-[8px] border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.15)]">
                                  ✓
                                </div>
                              )}
                            </div>

                            <div className="px-0.5 min-w-0">
                              <div className="text-[8px] md:text-[10px] font-black leading-tight tracking-tight uppercase truncate">
                                {isMobile ? grain.name : grain.fullName}
                              </div>
                              <div className={cn(
                                "text-[6px] md:text-[7px] font-mono leading-none tracking-widest mt-0.5 truncate uppercase",
                                isActive ? "text-zinc-400" : "text-zinc-500"
                              )}>
                                {grain.eng}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Common Chair Adjustments */}

                {/* 扶手选项 */}
                {config.chairMaterial !== 'wood' && config.chairMaterial !== 'fabric' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="text-[10px] md:text-xs font-black tracking-wider uppercase text-zinc-900 flex items-center gap-1.5">
                        配置扶手 ARMRESTS
                      </span>
                      <span className="text-[8px] md:text-[9px] font-mono text-zinc-400 font-bold uppercase">
                        {config.chairHasArmrest ? "ADDED" : "NONE"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          pushToHistory(config);
                          updateParam('chairHasArmrest', false);
                        }}
                        className={cn(
                          "py-1.5 md:py-2 px-3 text-[10px] md:text-xs font-black transition-all active:scale-98 border relative flex items-center justify-center gap-2",
                          !config.chairHasArmrest
                            ? "bg-black text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)] scale-[1.02] z-10"
                            : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
                        )}
                      >
                        <span>无扶手 (No Armrests)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pushToHistory(config);
                          updateParam('chairHasArmrest', true);
                        }}
                        className={cn(
                          "py-1.5 md:py-2 px-3 text-[10px] md:text-xs font-black transition-all active:scale-98 border relative flex items-center justify-center gap-2",
                          config.chairHasArmrest
                            ? "bg-black text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)] scale-[1.02] z-10"
                            : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
                        )}
                      >
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>增加扶手 (Add Armrests)</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
          </div>
          <div className={cn("mt-auto relative", isMobile ? "space-y-0" : "space-y-2")}>
            <div className={cn("flex gap-2", isMobile ? "flex-row items-stretch" : "flex-col")}>
              {/* Portrait Mode Chat Toggle Button placed to the LEFT of the Price */}
              {isPortrait && (
                <button 
                  onClick={() => setShowChat(!showChat)}
                  title="Toggle AI Chat Window"
                  className={cn(
                    "font-bold text-[9px] uppercase tracking-widest px-2.5 flex items-center justify-center gap-1 transition-all shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] border-2 border-transparent active:translate-x-[1px] active:translate-y-[1px] shrink-0",
                    showChat 
                      ? "bg-[#000000] text-[#ffffff] force-white-text"
                      : "bg-[#e8e8e8] text-black hover:bg-gray-200" 
                  )}
                >
                  <MessageSquare size={12} />
                  <span>AI_CHAT</span>
                  <span className={cn("w-1.5 h-1.5 rounded-full", showChat ? "bg-[#22c55e] animate-pulse" : "bg-[#808080]")} />
                </button>
              )}

              <div className={cn(
                "bg-black/5 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] flex justify-between items-center",
                isMobile ? "flex-1 px-2 py-1" : "w-full mb-2 p-3"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {isMobile ? "Price" : "Estimated Price"}
                </span>
                <span className={cn("font-black tracking-tight", isMobile ? "text-xs" : "text-sm")}>¥{currentPrice.toLocaleString()}</span>
              </div>
              
              <div className={cn("flex gap-2", isMobile ? "flex-row shrink-0" : "flex-col space-y-2")}>
                <button 
                  onClick={handleGenerateAndQuote}
                  disabled={isGeneratingQuote}
                  title="Generate and Quote"
                  className={cn(
                    "font-bold uppercase tracking-widest active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center transition-all",
                    isGeneratingQuote
                      ? "bg-gray-700 text-[#ffffff] opacity-75 cursor-not-allowed"
                      : "bg-[#000000] text-[#ffffff] force-white-text hover:bg-gray-800",
                    isMobile ? "w-7 h-7 grow-0" : "w-full py-3 text-xs gap-2"
                  )}
                >
                  <Download size={14} className={isGeneratingQuote ? "animate-pulse" : ""} />
                  {!isMobile && (isGeneratingQuote ? "GENERATING..." : "GENERATE_AND_QUOTE")}
                </button>
                <button 
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo (返回上一步)"
                  className={cn(
                    "font-bold uppercase tracking-widest flex items-center justify-center transition-all",
                    isMobile ? "w-7 h-7 grow-0" : "w-full py-3 text-xs gap-2",
                    canUndo 
                      ? "bg-[#e8e8e8] text-black hover:bg-gray-200 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[1px] active:translate-y-[1px]" 
                      : "bg-[#e8e8e8]/50 text-gray-400 cursor-not-allowed shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#d0d0d0] pointer-events-none"
                  )}
                >
                  <Undo size={14} />
                  {!isMobile && "UNDO_STEP"}
                </button>
                <button 
                  onClick={() => {
                    pushToHistory(config);
                    if (config.chairId) {
                      setConfig(validateConfig({
                        ...DEFAULT_CONFIG,
                        chairId: config.chairId,
                        chairCount: config.chairCount || 0,
                        chairMaterial: 'titanium',
                        color: config.showTable ? DEFAULT_CONFIG.color : '#original',
                        showTable: config.showTable !== false,
                        chairBackrestAngle: 0,
                        chairHasArmrest: false,
                      }));
                    } else {
                      setConfig(validateConfig({
                        ...DEFAULT_CONFIG,
                        chairId: null,
                        chairCount: 0,
                        showTable: true,
                        color: DEFAULT_CONFIG.color,
                      }));
                    }
                  }}
                  title="Reset Defaults"
                  className={cn(
                    "bg-[#e8e8e8] font-bold uppercase tracking-widest hover:bg-gray-200 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center transition-all",
                    isMobile ? "w-7 h-7 grow-0" : "w-full py-3 text-xs gap-2"
                  )}
                >
                  <RefreshCcw size={14} />
                  {!isMobile && "RESET_DEFAULTS"}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className={cn(
        "h-8 border-t-2 border-white shadow-[inset_0px_1px_0px_0px_#808080] flex items-center px-4 justify-between bg-[#f9f9f9] text-[10px] font-mono tracking-widest uppercase z-50",
        isVertical && "hidden"
      )}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
            SYSTEM_STATUS: READY
          </span>
          <span>|</span>
          <span className="ml-4">OBJECT: CHAIR_{config.chairId || 'CY-A1'}</span>
        </div>
        <div className="flex h-full text-black">
          <div className="px-4 border-l border-gray-400 flex items-center text-zinc-900">ANGLE: {config.chairBackrestAngle || 98}°</div>
          <div className="px-4 border-l border-gray-400 flex items-center text-zinc-900">MAT: {(config.chairMaterial || 'titanium').toUpperCase()}</div>
          <div className="px-4 border-l border-gray-400 bg-[#000000] text-[#ffffff] force-white-text flex items-center">USER_ADMIN</div>
        </div>
      </footer>
      {showChairShowroom && (
        <ChairShowroomModal 
          onClose={() => setShowChairShowroom(false)} 
          onSelectChair={(id) => {
            pushToHistory(config);
            updateParam('chairId', id);
            setShowChairShowroom(false);
          }}
        />
      )}
      </div>
    </div>
  );
}

function ToolbarButton({ 
  icon, 
  active = false, 
  onClick, 
  title 
}: { 
  icon: React.ReactNode; 
  active?: boolean; 
  onClick?: () => void; 
  title?: string;
}) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-6 h-6 flex items-center justify-center transition-all active:translate-x-[1px] active:translate-y-[1px]",
        active 
          ? "bg-white shadow-[inset_1px_1px_0px_0px_#000000,inset_-1px_-1px_0px_0px_#ffffff]" 
          : "bg-[#f9f9f9] shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-gray-200"
      )}
    >
      {icon}
    </button>
  );
}

function MaterialButton({ type, color, active, onClick, isGlass, isMobile }: { type: string; color: string; active: boolean; onClick: () => void; isGlass?: boolean; isMobile?: boolean }) {
  if (isMobile) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "w-11 h-[38px] p-1 flex flex-col items-center justify-between transition-all shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080] bg-[#e8e8e8] active:translate-x-[0.5px] active:translate-y-[0.5px]",
          active ? "ring-2 ring-black bg-[#ffffff]" : "hover:bg-white"
        )}
      >
        <div 
          className={cn("w-full h-4 shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080]", isGlass && "opacity-40")} 
          style={{ backgroundColor: color }} 
        />
        <span className={cn(
          "text-[8px] font-mono leading-none tracking-tight font-black uppercase text-center overflow-hidden text-ellipsis whitespace-nowrap w-full",
          active ? "text-black font-extrabold" : "text-gray-600"
        )}>
          {type}
        </span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-8 h-8 p-1 transition-all group relative shadow-[inset_-1px_-1px_0px_0px_#ffffff,inset_1px_1px_0px_0px_#808080]",
        active && "ring-2 ring-black"
      )}
    >
      <div 
        className={cn("w-full h-full shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080]", isGlass && "opacity-40")} 
        style={{ backgroundColor: color }} 
      />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-mono px-1 hidden group-hover:block uppercase whitespace-nowrap z-50">
        {type}
      </span>
    </button>
  );
}

function InspectorSlider({ label, unit, value, min, max, axis, isMobile, onChange, onDragStart }: { label: string; unit: string; value: number; min: number; max: number; axis: string; isMobile?: boolean; onChange: (v: number) => void; onDragStart?: () => void }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const val = min + (x / rect.width) * (max - min);
    onChange(Math.round(val));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.();
    updateValue(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    onDragStart?.();
    updateValue(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValue(e.clientX);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateValue(e.touches[0].clientX);
      }
    };
    const onMouseUp = () => setIsDragging(false);
    const onTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);
  
  return (
    <div className={cn("space-y-4 touch-none", isMobile && "space-y-2")}>
      <div className="flex justify-between items-end">
        <label className="font-mono text-[10px] font-bold text-black">{label}</label>
        <span className="text-[10px] text-gray-400 uppercase">{axis}</span>
      </div>
      <div 
        ref={sliderRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative h-4 flex items-center group cursor-pointer"
      >
        <div className="absolute w-full h-[1px] bg-gray-300"></div>
        <div 
          className={cn(
            "absolute w-3 h-3 bg-black shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] -translate-x-1/2 transition-transform",
            isDragging && "scale-125"
          )}
          style={{ left: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
