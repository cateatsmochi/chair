import { TableConfig } from '../types';

export interface ChairInfo {
  id: string;
  name: string;
  enName: string;
  desc: string;
  enDesc: string;
  price: number;
  specs: string[];
  // SVG silhouette representation for rendering high-precision customizer preview icons
  svgPath: string;
  // Color presets matching material
  material: 'steel' | 'chrome' | 'carbon';
}

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

export const CHAIR_LIBRARY: ChairInfo[] = [
  {
    id: 'CY-A1',
    name: 'CY A1 角撑折面椅',
    enName: 'CY A1 Angle-Spine Facet',
    desc: '高质感深筒包裹式座舱，结合坚韧的后置三角力道支撑肋。具有雕塑式棱角 and 低宽盘座，气度威重。',
    enDesc: 'Deep wrap cockpit paired with robust rear triangular tension-rib stabilizers. Sculptural high facet seating.',
    price: 8200,
    specs: ['宽52cm', '深54cm', '高78cm', '座高43cm'],
    svgPath: 'M20,65 L15,80 L22,80 L26,65 L54,65 L58,80 L65,80 L60,65 M40,65 L40,43 L22,43 C21,43 20,44 20,45 L20,63 L40,65 M40,65 L40,43 L58,43 C59,43 60,44 60,45 L60,63 L40,65 M34,43 L32,15 L48,15 L46,43 M20,63 L14,48 L22,43 L26,45 M60,63 L66,48 L58,43 L54,45',
    material: 'chrome'
  },
  {
    id: 'CY-A2',
    name: 'CY A2 金刚双脊椅',
    enName: 'CY A2 Double-Wishbone Diamond',
    desc: '纤细收腰钻石切面，背部骨架交错排布。双渐缩翼形后脊，宛如双叉骨般将力量传导至地面，优雅轻盈。',
    enDesc: 'Slender hourglass diamond-faceted back with wishbone structural spine. Superior weight diversion.',
    price: 8200,
    specs: ['宽48cm', '深52cm', '高82cm', '座高44cm'],
    svgPath: 'M24,65 L18,80 L24,80 L29,65 L51,65 L56,80 L62,80 L56,65 M40,65 L27,65 L25,44 L55,44 L53,65 Z M31,44 L30,22 C30,19 35,16 40,20 C45,16 50,19 50,22 L49,44 M35,44 L38,12 L42,12 L45,44 M25,44 L18,34 L31,44 M55,44 L62,34 L49,44',
    material: 'steel'
  },
  {
    id: 'CY-A3',
    name: 'CY A3 横刃宽座椅',
    enName: 'CY A3 Horizontal-Slice Sovereign',
    desc: '极致舒适的低扁大横备。靠背采用水平分段式钢板折叠，在提供腰腹强效释压的同时保持极致工业对称美。',
    enDesc: 'Low-slung wrap-around sovereign style back with horizontally partitioned cold-rolled steel plates.',
    price: 8200,
    specs: ['宽56cm', '深55cm', '高74cm', '座高42cm'],
    svgPath: 'M18,65 L12,80 L19,80 L24,65 L56,65 L61,80 L68,80 L62,65 M40,65 L18,65 L20,44 L60,44 L62,65 Z M20,44 L16,40 L18,24 L62,24 L64,40 L60,44 Z M22,24 L25,16 L55,16 L58,24 Z M32,24 L48,24 L48,16 L32,16 Z',
    material: 'carbon'
  },
  {
    id: 'CY-A4',
    name: 'CY A4 刺冠重锤椅',
    enName: 'CY A4 Crowned Spiked Monolith',
    desc: '哥特式尖耸刺冠双峰，两侧采用向下折叠的面重锤感。线条利落，犹如带甲武士般具有极高辨识度的冷冽气质。',
    enDesc: 'Aggressive twin-peaked crown detailing. Sculpted facets inspired by gothic protective plates.',
    price: 8200,
    specs: ['宽50cm', '深53cm', '高86cm', '座高44cm'],
    svgPath: 'M22,65 L17,80 L23,80 L27,65 L53,65 L57,80 L63,80 L58,65 M40,65 L26,64 L24,44 L56,44 L54,64 Z M24,44 L25,12 L38,20 L40,14 L42,20 L55,12 L56,44 Z M33,20 L47,20 L47,13 L33,13 Z',
    material: 'steel'
  },
  {
    id: 'CY-A5',
    name: 'CY A5 穹网蜂巢椅',
    enName: 'CY A5 Hex-Honeycomb Dome',
    desc: '圆拱形蜂巢蛛网力学剪裁。通过高能激光切割出晶格镂空三角区，折射剔透光影，极致宣泄数码重金属感。',
    enDesc: 'Fascinating dome-profile honeycomb mesh back. Laser-cut triangular facets for high transparency.',
    price: 8200,
    specs: ['宽51cm', '深52cm', '高81cm', '座高43cm'],
    svgPath: 'M23,65 L18,80 L24,80 L28,65 L52,65 L56,80 L62,80 L57,65 M40,65 L26,65 L24,44 L56,44 L54,65 Z M24,44 C24,20 30,12 40,12 C50,12 56,20 56,44 Z M32,32 L48,32 L40,16 Z M28,40 L52,40 L40,24 Z',
    material: 'chrome'
  },
  {
    id: 'CY-A6',
    name: 'CY A6 重装沙漏椅',
    enName: 'CY A6 Hourglass Exoskeleton',
    desc: '沙漏开孔型外骨架后背。肩膀部两侧向外延展形成强力战机机翼，配合下段中空收缩，创造绝妙的安全环拥感。',
    enDesc: 'Hourglass double-trapezoid negative space back with aggressive fighter-wing shoulder support.',
    price: 8200,
    specs: ['宽53cm', '深54cm', '高83cm', '座高43cm'],
    svgPath: 'M22,65 L16,80 L22,80 L27,65 L53,65 L58,80 L64,80 L58,65 M40,65 L26,65 L24,44 L56,44 L54,65 Z M24,44 L16,20 L32,24 L40,14 L48,24 L64,20 L56,44 Z M30,44 L34,31 L46,31 L50,44 Z',
    material: 'carbon'
  },
  {
    id: 'CY-A7',
    name: 'CY A7 猫耳晶格椅',
    enName: 'CY A7 Cat-Ear Lattice Monarch',
    desc: '背部耸立尖翘的猫耳双尖顶（M型对称设计）。胸肩位置作了大范围空气动力学掏空，底口咬合精钢底轴，狂野桀骜。',
    enDesc: 'Striking M-profile ears. Centralized aerodynamic hollow cutout supported on modular steel pins.',
    price: 8200,
    specs: ['宽49cm', '深52cm', '高82cm', '座高44cm'],
    svgPath: 'M23,65 L18,80 L24,80 L28,65 L52,65 L56,80 L62,80 L57,65 M40,65 L27,65 L25,44 L55,44 L53,65 Z M25,44 L21,20 L35,28 L40,16 L45,28 L59,20 L55,44 Z M34,44 L40,32 L46,44 Z',
    material: 'chrome'
  }
];

export const CURATED_MASTERPIECES: Masterpiece[] = [
  {
    id: 'CY-A1',
    name: 'CY A1',
    enName: 'CY A1 Detail-Shed Project',
    desc: '「折翼之诗」—— 极简重力与悬浮美学的微缩建构。冷冽的抛光精钢骨架勾勒出后现代折面座舱，与清透玻璃案几如冰川交融，于静止中张显刚性几何的雕塑力量。',
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
    name: 'CY A2',
    enName: 'CY A2 Organic Contrast',
    desc: '「风骨野奢」—— 双脊羽翼在松烟与炭黑中挺立。温润的天然橡木经烈火微炙，沉淀出大地的脉络，与精细冷轧重锤折面完美咬合，凝练出侘寂而又傲然的野奢张力。',
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
    name: 'CY A3',
    enName: 'CY A3 Imperial Balance',
    desc: '「静穆主权」—— 宽奢的低趴横刃背托，赋予空间帝王般的静穆。历经时光淘洗的卡拉拉白大理石，流淌着永恒的水墨诗意，于高傲的黑碳磨砂骨架之上，筑起尊皇的起居秩序。',
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
    name: 'CY A4',
    enName: 'CY A4 Gothic Heavy Core',
    desc: '「尖锋意志」—— 哥特刺冠双峰与重装武士胸甲的冷峻对白。粗削厚切的大地烟熏原木，保留了原始生长的粗重呼吸，在锋利的工业硬汉线条中，散发出近乎信仰般的沉重张力。',
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
    name: 'CY A5',
    enName: 'CY A5 Crystalline Structure',
    desc: '「光影晨曦」—— 激光微雕出的穹顶蜂巢，似清晨覆着薄霜。高光反射的镜面铬层随光影游移，将斑驳的几何光斑洒在超白悬浮玻璃上，灵动轻盈，空灵如诗。',
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
    name: 'CY A6',
    enName: 'CY A6 Hourglass Wing',
    desc: '「羽翼方舟」—— 延展的沙漏机翼外骨骼，构筑出安全的精神堡垒。超长尺度的深黑色烟熏实木几案宛如远航的巨轮首尾，自如掌控着宏大的商业意象与领袖格局。',
    enDesc: 'Hourglass double-trapezoid negative space back with aggressive fighter-wing shoulder support.',
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
    name: 'CY A7',
    enName: 'CY A7 Feline Symmetry',
    desc: '「狂野图腾」—— 仿生机械猫耳与中空空气动力学掏空。高反光微晶镜面钢与雪花白哑光大理石傲然交相辉映，打破陈规，释放桀骜不驯的未来先锋张力。',
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

