import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, ChevronRight, ArrowLeft, Package, Eye, Box } from 'lucide-react';
import { TableConfig } from '../types';
import { ModelPreviewModal } from './ModelPreviewModal';
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

const chairImageMap: Record<string, string> = {
  'CY-A1': chairCyA1,
  'CY-A2': chairCyA2,
  'CY-A3': chairCyA3,
  'CY-A4': chairCyA4,
  'CY-A5': chairCyA5,
  'CY-A6': chairCyA6,
  'CY-A7': chairCyA7,
};

interface ChairCropperProps {
  chairId: string;
  className?: string;
}

export function ChairCropper({ chairId, className = '' }: ChairCropperProps) {
  const imgSrc = chairImageMap[chairId];

  return (
    <div className={`relative overflow-hidden w-full h-full bg-white select-none flex items-center justify-center p-2 sm:p-3 ${className}`}>
      <img
        src={imgSrc}
        alt={chairId}
        referrerPolicy="no-referrer"
        className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.05]"
      />
    </div>
  );
}

interface WelcomeScreenProps {
  onEnterCustomizer: () => void;
  onEnterReadyMade: () => void;
}

export function WelcomeScreen({ onEnterCustomizer, onEnterReadyMade }: WelcomeScreenProps) {
  return (
    <div className="absolute inset-0 bg-[#f9f9f9] text-[#111111] select-none flex flex-col justify-between font-mono overflow-hidden">
      {/* Precision millimeter design grid lines matching customizer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ececec_1px,transparent_1px),linear-gradient(to_bottom,#ececec_1px,transparent_1px)] bg-[size:20px_20px] opacity-75 pointer-events-none" />
      
      {/* Drafting aesthetic header */}
      <header className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 md:pt-10 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-none border-2 border-[#111111] flex items-center justify-center bg-transparent">
            <span className="font-sans font-black text-[10px] sm:text-xs tracking-tighter">M</span>
          </div>
          <div>
            <span className="font-sans font-black text-[10px] sm:text-xs md:text-sm tracking-widest block uppercase text-zinc-900 leading-none">MODULAR STUDIO</span>
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
            className="font-sans font-extrabold text-xl sm:text-2xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-zinc-900 animate-fade-in"
          >
            Bespoke Geometry.<br className="hidden sm:inline" /> Engineered for Life.
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
// CURATED MASTERPIECES VIEW (选择现样款界面 - 艺术展厅设计)
// -------------------------------------------------------------
export interface Masterpiece {
  id: string;
  name: string;
  enName: string;
  desc: string;
  enDesc: string;
  image: string;
  config: TableConfig;
  specs: string[];
  priceRange: string;
}

export const CURATED_MASTERPIECES: Masterpiece[] = [
  {
    id: 'CY-A1',
    name: 'CY A1 角撑折面椅搭配组合',
    enName: 'CY A1 Angle-Spine Facet Suite',
    desc: '高质感深筒包裹式座舱配椅，结合后置三角力道支撑翼肋。搭配倾角棱面悬浮玻璃底座，是雕塑感与后现代重工业刚性几何美学的极致碰撞。',
    enDesc: 'Deep wrap cockpit seating with post-modern mirrored floating elements. A sculpture of structural deflection.',
    image: 'CY-A1',
    priceRange: '¥13,200 起',
    specs: ['配椅型号: CY-A1 (折面角撑)', '主椅材质: 精空镀铬镜面钢', '搭配桌型: 意式晶荧悬浮玻璃桌', '默认组合: 180x85x75cm | 4椅群'],
    config: {
      width: 180,
      depth: 85,
      height: 75,
      legTaper: 8,
      topThickness: 15,
      frameDepth: 50,
      frameInwardOffset: 100,
      frameThickness: 80,
      legTopSize: 70,
      legBottomSize: 35,
      legInnerDepth: 25,
      material: 'glass',
      color: '#ffffff',
      chairId: 'CY-A1',
      chairCount: 4
    }
  },
  {
    id: 'CY-A2',
    name: 'CY A2 金刚双脊椅搭配组合',
    enName: 'CY A2 Wishbone Diamond Suite',
    desc: '纤细收腰钻石切面大靠背与双渐缩翼形后脊，宛如双叉骨般将力量传导。搭配熏黑天然实木橡木瓦板桌，刚健挺拔，极致雅致。',
    enDesc: 'Slender hourglass wishbone framework balanced with heavily roasted natural organic oak slab table overlays.',
    image: 'CY-A2',
    priceRange: '¥10,000 起',
    specs: ['配椅型号: CY-A2 (双脊金刚)', '主椅材质: 磨砂冷轧钛素钢', '搭配桌型: 极北熏黑实木长瓦桌', '默认组合: 160x80x74cm | 2椅群'],
    config: {
      width: 160,
      depth: 80,
      height: 74,
      legTaper: 0,
      topThickness: 30,
      frameDepth: 60,
      frameInwardOffset: 120,
      frameThickness: 90,
      legTopSize: 80,
      legBottomSize: 80,
      legInnerDepth: 0,
      material: 'oak',
      color: '#8B5E3C',
      chairId: 'CY-A2',
      chairCount: 2
    }
  },
  {
    id: 'CY-A3',
    name: 'CY A3 横刃宽座尊皇搭配组合',
    enName: 'CY A3 Horizontal-Slice Sovereign Suite',
    desc: '极致宽奢的低趴大横背，水平分段分节冷轧折刀钢板设计。在提供绝佳腰部释压的同时，搭配卡拉拉白理石，尽显永恒静穆与高傲姿态。',
    enDesc: 'Low-slung sliced steel plate detailing sitting robustly alongside premium low-leak Carrara white slabs.',
    image: 'CY-A3',
    priceRange: '¥26,380 起',
    specs: ['配椅型号: CY-A3 (横刃重装)', '主椅材质: 高标黑碳素磨砂钢', '搭配桌型: 卡拉拉重晶哑光理石桌', '默认组合: 200x90x76cm | 6椅群'],
    config: {
      width: 200,
      depth: 90,
      height: 76,
      legTaper: 0,
      topThickness: 45,
      frameDepth: 80,
      frameInwardOffset: 150,
      frameThickness: 120,
      legTopSize: 100,
      legBottomSize: 100,
      legInnerDepth: 0,
      material: 'marble',
      color: '#ffffff',
      chairId: 'CY-A3',
      chairCount: 6
    }
  },
  {
    id: 'CY-A4',
    name: 'CY A4 刺冠重锤王座搭配组合',
    enName: 'CY A4 Gothic Spiked Throne Suite',
    desc: '哥特式尖耸刺冠双峰，带甲重锤护板，犹如冷冽硬核武士尊荣王座。搭配重工业原木橡木大厚板，流露强悍的抗疲劳美学肌理。',
    enDesc: 'Gothic protective plate peaks paired with textured wide brutalist oak platforms for heavy-gravity spaces.',
    image: 'CY-A4',
    priceRange: '¥15,600 起',
    specs: ['配椅型号: CY-A4 (尖锋刺冠)', '主椅材质: 硬核磨砂黑轧钢', '搭配桌型: 极重工厚切粗削烟熏桌', '默认组合: 180x85x75cm | 4椅群'],
    config: {
      width: 180,
      depth: 85,
      height: 75,
      legTaper: 0,
      topThickness: 25,
      frameDepth: 55,
      frameInwardOffset: 110,
      frameThickness: 85,
      legTopSize: 80,
      legBottomSize: 80,
      legInnerDepth: 0,
      material: 'oak',
      color: '#31302d',
      chairId: 'CY-A4',
      chairCount: 4
    }
  },
  {
    id: 'CY-A5',
    name: 'CY A5 穹网蜂巢轻奢搭配组合',
    enName: 'CY A5 Hex-Honeycomb Dome Suite',
    desc: '圆拱形激光剔透镂空三角与蜂巢晶格。全反射高光镀铬，折射玲珑斑驳，搭配超薄超清晰透光超白防爆玻璃桌，奢华而不失轻灵。',
    enDesc: 'Laser-cut triangular mesh web reflecting dynamic ambient beams. Paired with ultra-thin glass configurations.',
    image: 'CY-A5',
    priceRange: '¥22,180 起',
    specs: ['配椅型号: CY-A5 (穹顶蜂巢)', '主椅材质: 精空抛光亮银铬镜', '搭配桌型: 威尼斯超白防爆玻璃桌', '默认组合: 220x95x74cm | 6椅群'],
    config: {
      width: 220,
      depth: 95,
      height: 74,
      legTaper: 10,
      topThickness: 15,
      frameDepth: 45,
      frameInwardOffset: 85,
      frameThickness: 65,
      legTopSize: 55,
      legBottomSize: 25,
      legInnerDepth: 30,
      material: 'glass',
      color: '#e2e8f0',
      chairId: 'CY-A5',
      chairCount: 6
    }
  },
  {
    id: 'CY-A6',
    name: 'CY A6 重装沙漏翼展搭配组合',
    enName: 'CY A6 Hourglass Aero Suite',
    desc: '沙漏开孔型外骨骼靠背。肩膀部两侧延展出强力羽翼，安全怀抱，搭配超长行政级熏黑实木桌面，彰显非凡商业与私人领袖气度。',
    enDesc: 'Hourglass double-trapezoid aero skeleton matched with heavy-overhang expansive conference oak designs.',
    image: 'CY-A6',
    priceRange: '¥22,100 起',
    specs: ['配椅型号: CY-A6 (机翼外骨)', '主椅材质: 原生深灰碳素钛钢', '搭配桌型: 翼展超长行政烟熏大板', '默认组合: 240x100x76cm | 8椅群'],
    config: {
      width: 240,
      depth: 100,
      height: 76,
      legTaper: 5,
      topThickness: 35,
      frameDepth: 70,
      frameInwardOffset: 160,
      frameThickness: 110,
      legTopSize: 90,
      legBottomSize: 60,
      legInnerDepth: 15,
      material: 'oak',
      color: '#1a202c',
      chairId: 'CY-A6',
      chairCount: 8
    }
  },
  {
    id: 'CY-A7',
    name: 'CY A7 猫耳晶格帝王搭配组合',
    enName: 'CY A7 Cat-Ear Lattice Suite',
    desc: '高耸的对称猫耳尖，肩胸空气动力学大幅度掏空，底口咬合精钢底轴。狂野桀骜，搭配意大利高白大理石板配至臻钢架，王者格调。',
    enDesc: 'Striking modular feline ears with hollow air-dam vents paired with pristine marble surfaces.',
    image: 'CY-A7',
    priceRange: '¥23,700 起',
    specs: ['配椅型号: CY-A7 (猫耳晶格)', '主椅材质: 航空微晶镀铬镜钢', '搭配桌型: 雪花白哑光大理石重桌', '默认组合: 160x85x75cm | 4椅群'],
    config: {
      width: 160,
      depth: 85,
      height: 75,
      legTaper: 0,
      topThickness: 40,
      frameDepth: 65,
      frameInwardOffset: 130,
      frameThickness: 100,
      legTopSize: 90,
      legBottomSize: 90,
      legInnerDepth: 0,
      material: 'marble',
      color: '#ffffff',
      chairId: 'CY-A7',
      chairCount: 4
    }
  }
];

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
          <div className="bg-white border border-zinc-300 p-2 sm:p-3 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
            <img 
              src={regeneratedGalleryImage} 
              alt="Chairs Overview" 
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain"
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
                className="bg-white border-2 border-zinc-900/10 p-5 md:p-6 flex flex-col justify-between hover:border-zinc-900 shadow-[3px_3px_0px_rgba(0,0,0,0.03)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all relative group"
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
                    
                    {/* Exquisite hover mask indicating 3D view availability */}
                    <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white space-y-1 z-10 p-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xs mb-1">
                        <Box size={18} className="text-white animate-pulse" />
                      </div>
                      <span className="text-[10px] font-sans font-black tracking-widest uppercase">3D 交互预览</span>
                      <span className="text-[7px] font-mono tracking-wider opacity-60">CLICK TO PREVIEW</span>
                    </div>

                    <div className="absolute top-2 left-2 text-[6.5px] text-zinc-650 bg-white/95 px-1.5 py-0.5 border border-zinc-250 font-mono uppercase tracking-widest leading-none z-10">
                      EXHIBIT_SCHEME_#{master.id.toUpperCase()}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-black text-base md:text-lg tracking-tight text-zinc-900 group-hover:text-zinc-950 transition-colors">
                      {master.name}
                    </h3>
                    <h4 className="text-[10px] text-zinc-400 uppercase font-black tracking-wider leading-none">
                      {master.enName}
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans font-light pt-1 border-t border-zinc-150">
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
    </div>
  );
}
