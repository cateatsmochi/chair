import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useGLTF, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, RotateCcw, Box, AlertCircle, Info, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TableConfig } from '../types';
import { isOriginalVeneerMaterial, desaturateTexture } from './Chair3D';

interface ModelPreviewModalProps {
  chairId: string;
  chairName: string;
  specs: string[];
  desc: string;
  onClose: () => void;
  onApplyConfig: () => void;
}

function getChairModelUrl(num: number): string {
  if (num >= 1 && num <= 7) {
    return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}-.glb`;
  }
  return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}.glb`;
}

// Preload all 7 split model files to make them available instantly in background
for (let i = 1; i <= 7; i++) {
  try {
    useGLTF.preload(getChairModelUrl(i));
  } catch (e) {
    console.warn(`Failed to preload chair ${i}:`, e);
  }
}

// Loading indicator component for Canvas
function ModelLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-[#f3f3f3] border-2 border-zinc-400 p-4 shadow-[1px_1px_0px_#ffffff,inset_1px_1px_0px_#ffffff,2px_2px_0px_rgba(0,0,0,0.15)] text-zinc-900 font-mono space-y-3 min-w-[12rem] select-none text-center">
        <div className="relative w-12 h-12 flex items-center justify-center mx-auto">
          <div className="absolute inset-0 border-2 border-zinc-300 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
          <Box className="text-zinc-700 size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold tracking-widest text-zinc-500">LOADING 3D SCENE</p>
          <p className="text-lg font-mono font-black text-black leading-none">{Math.round(progress)}%</p>
        </div>
      </div>
    </Html>
  );
}

// This nested component isolates, centers, and scales the requested chair from the multi-chair GLTF
function IsolatedChair({ chairId }: { chairId: string }) {
  // Identify index/number of the chair from its ID (e.g. "CY-A1" -> 1, "CY-A7" -> 7)
  const chairNumber = useMemo(() => {
    const num = parseInt(chairId.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 1 : num;
  }, [chairId]);

  const GLTF_URL = getChairModelUrl(chairNumber);
  const { scene } = useGLTF(GLTF_URL);
  const containerRef = useRef<THREE.Group>(null);

  // Deep clone of structural geometries, materials, and positions
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Completely remove the duplicate extra chair node "11.002" to leave only the one true chair "test02.001"
    const part11 = clone.getObjectByName('11.002');
    if (part11 && part11.parent) {
      part11.parent.remove(part11);
    }

    const wrapperGroup = new THREE.Group();
    wrapperGroup.name = "chair_wrapper";

    const targetNodes = clone.children.filter(child => {
      return !(child instanceof THREE.Camera) && !(child instanceof THREE.Light);
    });

    if (targetNodes.length > 0) {
      // Move target nodes into wrapperGroup
      targetNodes.forEach((node) => {
        wrapperGroup.add(node);
      });
      // Add wrapper to clone
      clone.add(wrapperGroup);

      // Ensure all world matrices/bounding boxes are correct
      clone.updateMatrixWorld(true);

      wrapperGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.visible = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Apply beautiful smooth sandblasted matte titanium finish to the model preview
          const cloneAndModifyMaterial = (originalMat: any) => {
            if (!originalMat) return originalMat;
            const mat = originalMat.clone() as any;
            const isModelWithBakedTexture = chairNumber === 1 || chairNumber === 2 || chairNumber === 3 || chairNumber === 7;
            if (isModelWithBakedTexture) {
              if (chairNumber === 1 && mat.map) {
                mat.map = desaturateTexture(mat.map);
              }
              if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.75);
              if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.15);
              if (mat.color && typeof mat.color.set === 'function') {
                mat.color.set('#ffffff'); // Keep original crisp texture colors untouched! (No grey tinting of the black cushions!)
              }
            } else if (isOriginalVeneerMaterial(mat, mesh)) {
              if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.75);
              if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.15);
            } else {
              if (mat.roughness !== undefined) mat.roughness = 0.60;
              if (mat.metalness !== undefined) mat.metalness = 0.88;
              mat.map = null;
              mat.roughnessMap = null;
              mat.normalMap = null;
              mat.aoMap = null;
              if (mat.color) {
                const c = mat.color;
                if (c.r > 0.9 && c.g > 0.9 && c.b > 0.9) {
                  mat.color.set('#acb3b6');
                }
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

      // Compute consolidated bounding box of the wrapper group
      const bbox = new THREE.Box3().setFromObject(wrapperGroup);

      const center = new THREE.Vector3();
      bbox.getCenter(center);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // Auto-scale to standard view frame size (comfort height around 1.1)
      const maxDim = Math.max(size.x, size.y, size.z);
      const ratio = 1.1 / (maxDim || 1);

      // Apply scale to wrapperGroup
      wrapperGroup.scale.setScalar(ratio);

      // Center the custom chair components horizontally at coordinates (0, 0, 0)
      // and flush the lowermost facet of the geometry accurately parallel with the ground (Y = 0)
      const minY = bbox.min.y;
      wrapperGroup.position.set(
        -center.x * ratio,
        -minY * ratio,
        -center.z * ratio
      );
    }

    return clone;
  }, [scene]);

  return <primitive ref={containerRef} object={clonedScene} />;
}

function getGLTFUrl(chairId: string): string {
  const num = parseInt(chairId.replace(/[^\d]/g, ''), 10);
  const chairNumber = isNaN(num) ? 1 : num;
  return getChairModelUrl(chairNumber);
}

// Error state backup component
function ErrorFallback({ message, chairId }: { message: string; chairId: string }) {
  const streamUrl = getGLTFUrl(chairId);
  return (
    <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-6 text-center select-none text-[#9b1c1c] border-2 border-red-200">
      <div className="w-16 h-16 bg-red-100 border-2 border-red-400 rounded-full flex items-center justify-center text-red-700 mb-4 animate-bounce">
        <AlertCircle size={32} />
      </div>
      <h3 className="font-sans font-black text-lg uppercase tracking-wider mb-2">3D Scene Loading Fault</h3>
      <p className="max-w-md text-xs text-red-800 font-sans leading-relaxed mb-6">
        {message || "We encountered an issue connecting to your external 3D server asset stream. This is usually caused by temporary network latency or CORS access limits on Raw GitHub."}
      </p>
      <div className="p-3 bg-red-50 border border-red-250 rounded text-[9px] font-mono text-red-700 text-left max-w-sm mb-6 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]">
        SOURCE_STREAM: <span className="text-red-900 font-bold select-all overflow-hidden text-ellipsis block">{streamUrl}</span>
      </div>
    </div>
  );
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

export function ModelPreviewModal({
  chairId,
  chairName,
  specs,
  desc,
  onClose,
  onApplyConfig
}: ModelPreviewModalProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualRotate, setManualRotate] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);

  // Error boundary logic for three loaders
  useEffect(() => {
    const handleThreeError = (e: ErrorEvent) => {
      if (e.message?.includes('WebGL') || e.message?.includes('Context')) {
        setHasError(true);
        setErrorMessage("WebGL context creation limits reached. Please close other active canvases or refresh your tab.");
      }
    };
    window.addEventListener('error', handleThreeError);
    return () => window.removeEventListener('error', handleThreeError);
  }, []);

  const resetCamera = () => {
    setRotationKey(prev => prev + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm select-none p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className="relative w-full max-w-5xl h-[88vh] md:h-[80vh] bg-[#f3f3f3] shadow-[inset_2px_2px_0px_0px_#ffffff,inset_-2px_-2px_0px_0px_#474747] border border-zinc-400 flex flex-col overflow-hidden"
        >
          {/* Title Bar Section (Retro Desktop Style) */}
          <div className="bg-black text-white px-4 py-1.5 md:py-2.5 flex justify-between items-center h-8 md:h-10 shrink-0 select-none z-20">
            <span className="text-[9px] md:text-xs font-bold tracking-[0.2em] font-mono uppercase">EXHIBITION_PREVIEW_v1.0</span>
            <button 
              onClick={onClose}
              className="bg-[#c6c6c6] text-[#000000] h-5 w-5 md:h-6 md:w-6 flex items-center justify-center shadow-[inset_1px_1px_0px_0px_#ffffff,inset_-1px_-1px_0px_0px_#808080] hover:bg-red-500 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden min-h-0">
            {/* Subtle diagnostic technical grids overlaying background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none" />

            {/* Left panel or header area for metadata information (Retro styling) */}
            <div className="order-2 md:order-1 w-full md:w-[22rem] bg-[#f3f3f3] border-t md:border-t-0 md:border-r border-zinc-300 p-4 md:p-6 flex flex-col gap-4 z-10 relative flex-1 md:flex-shrink-0 text-zinc-900 overflow-y-auto">
              {/* Top Action Button */}
              <div className="shrink-0 flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold tracking-wide">
                  可定制项：加扶手 / 变材质 / 变色 / 变纹理 / 变椅背
                </span>
                <button
                  onClick={onApplyConfig}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#111111] text-white text-xs font-black uppercase tracking-wider hover:bg-zinc-800 border border-black shadow-[3px_3px_0px_rgba(0,0,0,0.15)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  <Maximize2 size={13} />
                  载入参数并定制
                </button>
              </div>

              {/* Top Info section */}
              <div className="space-y-4 md:space-y-5 flex-1">
                {/* Back to Gallery badge */}
                <div className="flex justify-between items-center">
                  <span className="text-[7.5px] font-mono font-black text-white bg-black border border-black px-2 py-0.5 uppercase tracking-widest rounded-none">
                    LIVE MODEL VIEWER
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 tracking-wider">
                    #{chairId.toUpperCase()}
                  </span>
                </div>

                {/* Title descriptions */}
                <div className="space-y-1.5">
                  <h2 className="text-lg md:text-xl font-black text-zinc-900 font-sans tracking-tight uppercase leading-tight">
                    {chairName}
                  </h2>
                  <div className="w-12 h-[3px] bg-black" />
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-650 font-sans font-light">
                  {desc}
                </p>

                {/* Specifications block */}
                <div className="space-y-2 pt-1">
                  <span className="text-[7.5px] font-black text-zinc-400 tracking-widest uppercase font-mono block">SPECIFICATION OVERVIEW</span>
                  <div className="bg-white border-2 border-zinc-300 shadow-[inset_1.5px_1.5px_0px_rgba(0,0,0,0.06)] p-3.5 space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-500 font-medium">椅子尺寸 / Size:</span>
                      <span className="text-zinc-950 font-black text-right">
                        {CHAIR_DIMS_SPECS[chairId]?.size || '56 x 52 x 78 cm'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-500 font-medium">椅子重量 / Weight:</span>
                      <span className="text-zinc-950 font-black text-right">
                        {CHAIR_DIMS_SPECS[chairId]?.weight || '12.5 KG'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right canvas area loaded internally with Canvas viewport */}
            <div className="order-1 md:order-2 h-[58vh] md:h-auto md:flex-1 relative bg-white flex flex-col justify-between overflow-hidden shrink-0 md:shrink border-b md:border-b-0 border-zinc-300">
              {/* Millimeter blueprint visual grid line backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-80 pointer-events-none" />

              {/* Top Toolbar overlay on Canvas */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
                <div className="flex items-center gap-2 bg-[#f9f9f9]/95 border-2 border-zinc-300 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] px-3 py-1.5 text-[9.5px] text-zinc-700 font-mono tracking-wide pointer-events-auto">
                  <Info size={11} className="text-zinc-800" />
                  <span>Drag to rotate, pinch to zoom</span>
                </div>

                {/* View control buttons */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={resetCamera}
                    title="Reset View"
                    className="p-1.5 bg-[#e8e8e8] border border-zinc-400 text-zinc-800 shadow-[inset_1px_1px_0px_#ffffff,inset_-1px_-1px_0px_#808080] hover:bg-zinc-100 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {hasError ? (
                <ErrorFallback message={errorMessage} chairId={chairId} />
              ) : (
                <div className="w-full h-full">
                  <Suspense fallback={null}>
                    <Canvas
                      key={rotationKey}
                      shadows
                      dpr={[1, 2]}
                      gl={{ antialias: true }}
                    >
                      <PerspectiveCamera makeDefault position={[1.8, 1.1, 2.2]} fov={40} />
                      
                      <Suspense fallback={<ModelLoader />}>
                        <IsolatedChair chairId={chairId} />
                      </Suspense>

                      <OrbitControls
                        makeDefault
                        enablePan={true}
                        enableZoom={true}
                        minDistance={1.2}
                        maxDistance={4.5}
                        minPolarAngle={0.1}
                        maxPolarAngle={Math.PI / 1.7}
                        autoRotate={manualRotate}
                        autoRotateSpeed={1.2}
                        target={[0, 0.45, 0]}
                        onChange={() => {
                          // Keep auto rotate on unless interacted
                        }}
                      />

                      {/* Highly curated studio light parameters to showcase exact materials from gltf files */}
                      <Environment preset="studio" environmentIntensity={0.4} />
                      
                      <ambientLight intensity={0.45} />
                      <hemisphereLight intensity={0.3} color="#ffffff" groundColor="#dcdcdc" />
                      <directionalLight
                        position={[4, 8, 5]}
                        intensity={1.1}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-bias={-0.0001}
                      />
                      <directionalLight
                        position={[-5, 6, -4]}
                        intensity={0.4}
                        castShadow
                        shadow-bias={-0.0001}
                      />

                      <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.45}
                        scale={4}
                        blur={1.8}
                        far={1.2}
                      />
                    </Canvas>
                  </Suspense>
                </div>
              )}

              {/* Bottom watermark indicators for raw style */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[7.5px] font-mono whitespace-nowrap text-zinc-400 tracking-wider pointer-events-none select-none">
                <span>SYSTEM: ONLINE</span>
                <span>RENDER_ENGINE: WEBGL_2.0</span>
                <span>GEOMETRY_OPTIMIZED_TRIANGLES</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
