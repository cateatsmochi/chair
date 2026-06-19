import { useState, useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, RotateCcw, Box, Info, Play, Pause, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CHAIR_LIBRARY } from '../data/chairs';
import { isOriginalVeneerMaterial, desaturateTexture } from './Chair3D';

interface ChairShowroomModalProps {
  onClose: () => void;
}

function getChairModelUrl(num: number): string {
  if (num >= 1 && num <= 7) {
    return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}-.glb`;
  }
  return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}.glb`;
}

// Loading indicator component for Canvas
function ShowroomLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-[#ffffff] text-black border border-zinc-300 p-5 shadow-[5px_5px_0px_#000000] font-mono space-y-3 min-w-[200px] select-none text-center">
        <div className="relative w-12 h-12 flex items-center justify-center mx-auto">
          <div className="absolute inset-0 border-2 border-zinc-250 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
          <Grid className="text-zinc-600 size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">GENERATING GRID MATRIX</p>
          <p className="text-xl font-black text-black leading-none">{Math.round(progress)}%</p>
        </div>
      </div>
    </Html>
  );
}

interface GridChairCellProps {
  chair: { id: string, material: 'steel' | 'chrome' | 'carbon', name: string };
  position: [number, number, number];
  onSelect: () => void;
}

function GridChairCell({ chair, position, onSelect }: GridChairCellProps) {
  const index = CHAIR_LIBRARY.findIndex(c => c.id === chair.id);
  const chairNumber = index + 1;
  const GLTF_URL = getChairModelUrl(chairNumber);
  const { scene } = useGLTF(GLTF_URL);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Apply materials
    clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
             const cloneAndModifyMaterial = (originalMat: any) => {
                if (!originalMat) return originalMat;
                const mat = originalMat.clone() as any;
                const isModelWithBakedTexture = chairNumber === 1 || chairNumber === 2 || chairNumber === 3 || chairNumber === 7;
                if (isModelWithBakedTexture) {
                    if (chairNumber === 1 && mat.map) {
                        mat.map = desaturateTexture(mat.map);
                    }
                    // For baked texture models: keep maps and colors intact, and apply beautiful high-contrast matte properties
                    if (mat.map) {
                        mat.map = desaturateTexture(mat.map);
                    }
                    mat.roughness = 0.82;
                    mat.metalness = 0.08;
                    // Removed forced color reset to '#ffffff' to prevent crushing textures
                } else if (isOriginalVeneerMaterial(mat, mesh)) {
                    // It's a veneer panel! Keep its original beautiful textured look and maps completely untouched.
                    mat.roughness = 0.82;
                    mat.metalness = 0.08;
                } else {
                    // Clear mottled maps to ensure smooth pearl reflections as requested
                    mat.map = null;
                    mat.roughnessMap = null;
                    mat.normalMap = null;
                    mat.aoMap = null;

                    // Turn frame parts to respective selected material with premium matte properties
                    if (chair.material === 'chrome') {
                        mat.color.set('#cccccc');
                        mat.metalness = 1.0;
                        mat.roughness = 0.05;
                    } else if (chair.material === 'carbon') {
                        mat.color.set('#1a1a1a'); // Darker matte black
                        mat.metalness = 0.2;
                        mat.roughness = 0.8;
                    } else { // Steel
                        mat.color.set('#8e9496');
                        mat.metalness = 0.5;
                        mat.roughness = 0.6;
                    }
                }
                mat.needsUpdate = true;
                return mat;
            };

            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(cloneAndModifyMaterial);
                } else {
                    mesh.material = cloneAndModifyMaterial(mesh.material);
                }
            }
        }
    });

    const part11 = clone.getObjectByName('11.002');
    if (part11 && part11.parent) {
      part11.parent.remove(part11);
    }

    const wrapperGroup = new THREE.Group();
    wrapperGroup.name = `chair_grid_item_${chair.id}`;

    const targetNodes = clone.children.filter(child => {
      return !(child instanceof THREE.Camera) && !(child instanceof THREE.Light);
    });

    if (targetNodes.length > 0) {
      targetNodes.forEach((node) => {
        wrapperGroup.add(node);
      });
      clone.add(wrapperGroup);
      clone.updateMatrixWorld(true);

      wrapperGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.visible = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      const bbox = new THREE.Box3().setFromObject(wrapperGroup);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const ratio = 1.0 / (maxDim || 1);

      wrapperGroup.scale.setScalar(ratio);

      const minY = bbox.min.y;
      wrapperGroup.position.set(
        -center.x * ratio,
        -minY * ratio,
        -center.z * ratio
      );
    }

    return clone;
  }, [scene, chair.id]);

  return <primitive object={clonedScene} position={position} onClick={onSelect} />;
}

// Master component listing all 40 elements in perspective
function GridMatrixShowcase({ onSelectChair }: { onSelectChair: (chairId: string) => void }) {
  const cols = 5;
  const colSpacing = 2.4;
  const rowSpacing = 2.4;

  const chairs = useMemo(() => {
    const chairList = [...CHAIR_LIBRARY];
    // Fill to 40 if needed
    while (chairList.length < 40) {
      const randomChair = CHAIR_LIBRARY[Math.floor(Math.random() * CHAIR_LIBRARY.length)];
      chairList.push(randomChair);
    }
    
    return chairList.map((chair, index) => {
      const r = Math.floor(index / cols);
      const c = index % cols;
      const x = (c - (cols - 1) / 2) * colSpacing;
      const z = (r - (Math.ceil(chairList.length / cols) - 1) / 2) * rowSpacing;
      
      return {
        id: `${chair.id}_${index}`,
        chair: chair,
        position: [x, 0, z] as [number, number, number]
      };
    });
  }, []);

  return (
    <group>
      {chairs.map(ch => (
        <GridChairCell 
          key={ch.id} 
          chair={ch.chair} 
          position={ch.position} 
          onSelect={() => onSelectChair(ch.chair.id)}
        />
      ))}
    </group>
  );
}

export function ChairShowroomModal({ onClose, onSelectChair }: ChairShowroomModalProps & { onSelectChair: (chairId: string) => void }) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-6xl h-[92vh] md:h-[85vh] bg-[#ffffff] shadow-[10px_10px_0px_#f0f0f0] border border-zinc-200 flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-[#fcfcfc] text-black border-b border-zinc-200 px-4 py-2 flex justify-between items-center h-10 shrink-0 select-none font-mono">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-zinc-600" />
              <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
                SHOWROOM_GRID_VIEW
              </span>
            </div>
            
            <button 
              onClick={onClose}
              className="bg-[#f3f3f3] text-black h-6 w-6 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Core Interactive Workspace */}
          <div className="flex-1 relative overflow-hidden bg-[#ffffff] flex flex-col">
            {/* Top Toolbar Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
              <div className="flex flex-col gap-1 select-none pointer-events-auto">
                <div className="bg-white/80 border border-zinc-200 px-3 py-1.5 font-mono text-[9px] md:text-[10px] tracking-wide flex items-center gap-2 shadow-sm">
                  <Info size={12} className="text-zinc-500 shrink-0" />
                  <span>Interactive Grid Matrix</span>
                </div>
              </div>
            </div>

            {/* Core WebGL Render Stream */}
            <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
              <Suspense fallback={null}>
                <Canvas
                  key={resetKey}
                  shadows
                  dpr={[1, 2]}
                  gl={{ antialias: true, alpha: true }}
                >
                  <PerspectiveCamera makeDefault position={[5.5, 5.0, 7.5]} fov={45} />

                  <Suspense fallback={<ShowroomLoader />}>
                    <GridMatrixShowcase onSelectChair={(id) => {
                      onSelectChair(id);
                      onClose();
                    }} />
                  </Suspense>

                  <OrbitControls
                    makeDefault
                    enablePan={true}
                    enableZoom={true}
                    minDistance={3}
                    maxDistance={15}
                    minPolarAngle={0.1}
                    maxPolarAngle={Math.PI / 2.1}
                    autoRotate={autoRotate}
                    autoRotateSpeed={0.8}
                    target={[0, 0, 0]}
                  />

                  <Environment preset="studio" environmentIntensity={0.25} />
                  
                  <ambientLight intensity={0.25} />
                  <hemisphereLight intensity={0.3} color="#ffffff" groundColor="#dcdcdc" />
                  
                  <directionalLight
                    position={[8, 12, 8]}
                    intensity={1.1}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.0001}
                  />

                  <directionalLight
                    position={[-8, 6, -8]}
                    intensity={0.4}
                    color="#f8fafc"
                  />

                  {/* Pristine high-end physical floor casting soft shadows */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.05} />
                  </mesh>
                </Canvas>
              </Suspense>
            </div>

            {/* Bottom metadata tags */}
            <div className="p-3 bg-[#fcfcfc] border-t border-zinc-200 flex justify-between items-center text-[8px] md:text-[9.5px] font-mono text-zinc-500 tracking-wider select-none shrink-0">
              <div className="flex items-center gap-1.5 md:gap-3 leading-none truncate">
                <span>● READY</span>
                <span className="text-zinc-300">|</span>
                <span>GRID: 40_UNIT_CELLS</span>
              </div>
              <span className="font-bold shrink-0">CY INDUSTRIAL CORP</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
