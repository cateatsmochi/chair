
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, ContactShadows } from '@react-three/drei';
import { Chair3D } from './Chair3D';
import { TableConfig } from '../types';
import { Suspense, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

interface SceneProps {
  config: TableConfig;
  isMobile?: boolean;
  progress?: number;
}

export interface SceneHandle {
  capture: () => string;
  exportGLB: (onSuccess: (buffer: ArrayBuffer) => void, onError: (err: any) => void) => void;
}

interface ChairInstance {
  pos: [number, number, number];
  rotY: number;
}

function getChairInstances(count: number, w: number, d: number): ChairInstance[] {
  const list: ChairInstance[] = [];
  if (count <= 0) return list;

  // Chair offsets relative to table edge
  const tz = d / 2 + 0.32;
  const tx = w / 2 + 0.34;

  if (count === 1) {
    list.push({ pos: [0, 0, tz], rotY: 0 });
  } else if (count === 2) {
    list.push({ pos: [0, 0, tz], rotY: 0 });
    list.push({ pos: [0, 0, -tz], rotY: Math.PI });
  } else if (count === 4) {
    const spacing = Math.min(w * 0.25, 0.45);
    list.push({ pos: [-spacing, 0, tz], rotY: 0 });
    list.push({ pos: [spacing, 0, tz], rotY: 0 });
    list.push({ pos: [-spacing, 0, -tz], rotY: Math.PI });
    list.push({ pos: [spacing, 0, -tz], rotY: Math.PI });
  } else if (count === 6) {
    const spacing = Math.min(w * 0.32, 0.65);
    list.push({ pos: [-spacing, 0, tz], rotY: 0 });
    list.push({ pos: [0, 0, tz], rotY: 0 });
    list.push({ pos: [spacing, 0, tz], rotY: 0 });
    list.push({ pos: [-spacing, 0, -tz], rotY: Math.PI });
    list.push({ pos: [0, 0, -tz], rotY: Math.PI });
    list.push({ pos: [spacing, 0, -tz], rotY: Math.PI });
  } else {
    // 8 chairs
    const spacing = Math.min(w * 0.32, 0.65);
    list.push({ pos: [-spacing, 0, tz], rotY: 0 });
    list.push({ pos: [0, 0, tz], rotY: 0 });
    list.push({ pos: [spacing, 0, tz], rotY: 0 });
    list.push({ pos: [-spacing, 0, -tz], rotY: Math.PI });
    list.push({ pos: [0, 0, -tz], rotY: Math.PI });
    list.push({ pos: [spacing, 0, -tz], rotY: Math.PI });
    list.push({ pos: [-tx, 0, 0], rotY: -Math.PI / 2 });
    list.push({ pos: [tx, 0, 0], rotY: Math.PI / 2 });
  }
  return list;
}

export const Scene = forwardRef<SceneHandle, SceneProps>(({ config, isMobile, progress }, ref) => {
  const contextRef = useRef<{ gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null>(null);
  const exportGroupRef = useRef<THREE.Group>(null);

  const chairInstances = useMemo(() => {
    return getChairInstances(config.chairCount || 0, config.width / 100, config.depth / 100);
  }, [config.chairCount, config.width, config.depth]);

  useImperativeHandle(ref, () => ({
    exportGLB: (onSuccess: (buffer: ArrayBuffer) => void, onError: (err: any) => void) => {
      if (exportGroupRef.current) {
        try {
          const exporter = new GLTFExporter();
          exporter.parse(
            exportGroupRef.current,
            (gltf) => {
              if (gltf instanceof ArrayBuffer) {
                onSuccess(gltf);
              } else {
                console.error('Expected ArrayBuffer from GLTFExporter, got:', typeof gltf);
                onError(new Error('Failed to export as binary GLB'));
              }
            },
            (error) => {
              console.error('Error during GLB extraction:', error);
              onError(error);
            },
            { binary: true }
          );
        } catch (err) {
          console.error('GLTFExporter execution failure:', err);
          onError(err);
        }
      } else {
        onError(new Error('Design model structure not found or not loaded yet.'));
      }
    },
    capture: () => {
      if (contextRef.current) {
        const { gl, scene, camera } = contextRef.current;
        
        // 1. Zoom in: move camera to a professional distance
        const originalPos = camera.position.clone();
        const pCam = camera as THREE.PerspectiveCamera;
        const originalFov = pCam.fov;
        
        // Use a narrower FOV (telephoto) to avoid wide-angle distortion
        pCam.fov = 28;
        pCam.updateProjectionMatrix();
        
        const isChairOnly = true;
        if (isChairOnly) {
          // Front-facing perspective for chair alone ("正视角")
          camera.position.set(0, 0.52, 2.4); 
          camera.lookAt(0, 0.48, 0);
        }

        // 2. Hide GridLine (Grid helper)
        const grid = scene.getObjectByName('main-grid');
        const originalGridVisible = grid ? grid.visible : true;
        if (grid) grid.visible = false;

        // Force a render
        gl.render(scene, camera);
        const data = gl.domElement.toDataURL('image/png');

        // 3. Restore
        pCam.fov = originalFov;
        pCam.updateProjectionMatrix();
        camera.position.copy(originalPos);
        camera.lookAt(0, 0.5, 0);
        if (grid) grid.visible = originalGridVisible;
        gl.render(scene, camera);

        return data;
      }
      return '';
    }
  }));

  return (
    <Canvas 
      shadows 
      dpr={[1, 2]} 
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={(state) => {
        contextRef.current = {
          gl: state.gl,
          scene: state.scene,
          camera: state.camera
        };
      }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera 
          makeDefault 
          position={isMobile ? [1.6, 1.3, 2.4] : [1.5, 1.25, 2.35]} 
          fov={isMobile ? 37 : 35} 
        />
        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 1.75} 
          target={[0, 0.45, 0]}
        />
        
        <group ref={exportGroupRef}>
          {config.chairId && (
            <group 
              position={[0, 0, 0]} 
              rotation={[0, 0, 0]}
            >
              <Chair3D 
                chairId={config.chairId!} 
                chairMaterial={config.chairMaterial} 
                woodGrain={config.woodGrain}
                chairBackrestAngle={config.chairBackrestAngle}
                chairHasArmrest={config.chairHasArmrest}
                color={config.color}
                progress={progress}
                fabricGradientStart={config.fabricGradientStart}
                fabricGradientEnd={config.fabricGradientEnd}
                fabricGradientAngle={config.fabricGradientAngle}
                useCustomGradient={config.useCustomGradient}
                fabricGradientType={config.fabricGradientType}
                fabricGradientRadius={config.fabricGradientRadius}
              />
            </group>
          )}
        </group>

        <Environment preset="studio" environmentIntensity={0.4} />

        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.5} 
          scale={15} 
          blur={1.8} 
          far={0.8} 
        />
        
        <ambientLight intensity={0.45} />
        <hemisphereLight intensity={0.3} color="#ffffff" groundColor="#dcdcdc" />
        <directionalLight 
          position={[4, 8, 6]} 
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
        <directionalLight 
          position={[0, 4, 6]} 
          intensity={0.3} 
        />
      </Suspense>
    </Canvas>
  );
});
