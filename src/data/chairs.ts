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
