import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

interface Chair3DProps {
  chairId: string;
  color?: string; // Optional custom color fallback
  chairMaterial?: 'titanium' | 'wood' | 'fabric';
  woodGrain?: 'walnut' | 'cherry' | 'ash' | 'oak';
  chairBackrestAngle?: number;
  chairHasArmrest?: boolean;
  progress?: number;
}

const ARMREST_MODEL_URL = 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/%E6%89%B6%E6%89%8B%E6%A4%85.glb';
const LANZI_MODEL_URL = 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/lanzi1.glb';

function getChairModelUrl(num: number): string {
  if (num >= 1 && num <= 7) {
    return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}-.glb`;
  }
  return `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}.glb`;
}

export function desaturateTexture(texture: THREE.Texture): THREE.Texture {
  if (!texture || !texture.image) return texture;
  if (texture.userData.isDesaturated) return texture;

  try {
    const img = texture.image as any;
    const canvas = document.createElement('canvas');
    canvas.width = img.width || img.videoWidth || 1024;
    canvas.height = img.height || img.videoHeight || 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to grayscale using luminance
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
      
      const desated = new THREE.CanvasTexture(canvas);
      desated.wrapS = texture.wrapS;
      desated.wrapT = texture.wrapT;
      desated.magFilter = texture.magFilter;
      desated.minFilter = texture.minFilter;
      desated.repeat.copy(texture.repeat);
      desated.offset.copy(texture.offset);
      desated.center.copy(texture.center);
      desated.rotation = texture.rotation;
      desated.flipY = texture.flipY;
      desated.userData.isDesaturated = true;
      
      return desated;
    }
  } catch (err) {
    console.warn("Failed to desaturate texture:", err);
  }
  return texture;
}

// Preload all 7 split model files, the armrests model, and the new model to make them available instantly in background
for (let i = 1; i <= 7; i++) {
  try {
    useGLTF.preload(getChairModelUrl(i));
  } catch (e) {
    console.warn(`Failed to preload chair ${i}:`, e);
  }
}
try {
  useGLTF.preload(ARMREST_MODEL_URL);
} catch (e) {
  console.warn('Failed to preload armrest model:', e);
}
try {
  useGLTF.preload(LANZI_MODEL_URL);
} catch (e) {
  console.warn('Failed to preload lanzi model:', e);
}

// Custom offset translation / scaling adjust parameters to align the armrests perfectly and beautifully with each of the 7 designs
const ARMREST_ADJUSTMENTS: Record<number, { pos: [number, number, number]; scale: [number, number, number] }> = {
  1: { pos: [0, -0.012, -0.01], scale: [1.02, 0.98, 1.02] },
  2: { pos: [0, -0.015, -0.024], scale: [1.02, 0.95, 0.98] },
  3: { pos: [0, -0.014, -0.5052], scale: [0.96, 0.95, 1.0] },
  4: { pos: [0, 0.006, 0.012], scale: [1.12, 1.0, 1.03] }, // Slightly wider fit for Chair 4
  5: { pos: [0, -0.024, 0.018], scale: [0.95, 0.92, 1.0] }, // Slightly narrower fit for Chair 5
  6: { pos: [0, 0.02, 0.016], scale: [1.05, 0.98, 1.02] },
  7: { pos: [0, 0.008, 0.018], scale: [1.08, 1.0, 1.03] }
};

// Custom procedural technical wood texture to match Figure 1
const createWoodMaterial = (grain: 'walnut' | 'cherry' | 'ash' | 'oak' = 'walnut') => {
  let color1 = '#d1a87e';
  let color2 = '#b58a59';
  let color3 = '#9f7344';
  let veinColor = 'rgba(84, 50, 19, 0.18)';

  if (grain === 'walnut') { // Walnut: tech dark brown
    color1 = '#78543d';
    color2 = '#5a3d2b';
    color3 = '#3d251a';
    veinColor = 'rgba(40, 20, 10, 0.25)';
  } else if (grain === 'cherry') { // Cherry: warm reddish brown
    color1 = '#aa5c3c';
    color2 = '#8c4323';
    color3 = '#6e2b10';
    veinColor = 'rgba(60, 20, 5, 0.22)';
  } else if (grain === 'ash') { // Ash: light gray/yellow Scandinavian ash
    color1 = '#eedbc8';
    color2 = '#d3bda9';
    color3 = '#bfa58f';
    veinColor = 'rgba(100, 80, 60, 0.15)';
  }

  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 512;
  woodCanvas.height = 512;
  const ctx = woodCanvas.getContext('2d');
  if (ctx) {
    // Beautiful technical wood background shade with custom grain colors
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, color1);
    grad.addColorStop(0.5, color2);
    grad.addColorStop(1, color3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Warm wood veins cross layers
    ctx.strokeStyle = veinColor;
    for (let i = 0; i < 45; i++) {
      ctx.lineWidth = 1.0 + Math.random() * 2.5;
      ctx.beginPath();
      const xBase = Math.random() * 512;
      ctx.moveTo(xBase, 0);
      ctx.bezierCurveTo(
        xBase + Math.sin(0 * 0.05) * 25, 120,
        xBase + Math.sin(120 * 0.02) * 20, 320,
        xBase + Math.sin(512 * 0.05) * 30, 512
      );
      ctx.stroke();
    }
  }
  const woodTex = new THREE.CanvasTexture(woodCanvas);
  woodTex.wrapS = THREE.RepeatWrapping;
  woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(1.5, 1.5);

  return new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.5,
    metalness: 0.05,
    bumpMap: woodTex,
    bumpScale: 0.005
  });
};

// Helper to convert hex to HSL for color harmony generation
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

// Custom procedural fabric material with iridescent color shifting gradient that varies with selected color
const createFabricMaterialForColor = (baseColor: string) => {
  const fabricCanvas = document.createElement('canvas');
  fabricCanvas.width = 512;
  fabricCanvas.height = 512;
  const ctx = fabricCanvas.getContext('2d');
  if (ctx) {
    let activeHex = baseColor;
    if (activeHex === 'original' || activeHex === '#original') {
      activeHex = '#b197fc'; // Elegant default purple
    }
    const hsl = hexToHsl(activeHex);
    
    // Create harmonious color-shifting aurora gradient stops
    const color1 = hslToHex(hsl.h, Math.max(hsl.s * 0.9, 50), Math.max(hsl.l * 0.5, 15)); // Base mid
    const color2 = hslToHex((hsl.h + 25) % 360, Math.max(hsl.s, 70), Math.min(hsl.l * 1.1, 75)); // Shimmer warm
    const color3 = hslToHex((hsl.h - 45 + 360) % 360, Math.min(hsl.s * 1.2, 100), Math.min(hsl.l * 0.85, 55)); // Counter tone
    const color4 = hslToHex((hsl.h + 75) % 360, Math.min(hsl.s * 1.3, 100), Math.min(hsl.l * 1.2, 80)); // Vivid top peak

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0.0, color1);
    grad.addColorStop(0.3, color2);
    grad.addColorStop(0.65, color3);
    grad.addColorStop(1.0, color4);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Create high-density tactile micro-weaving for premium matte tech fabric depth.
    // 1. White highlights threads (enhanced to be more distinct)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 512; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // 2. Black shadow threads (enhanced to create deeper contrast and stereoscopic depth)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 512; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }
  const fabricTex = new THREE.CanvasTexture(fabricCanvas);
  fabricTex.wrapS = THREE.RepeatWrapping;
  fabricTex.wrapT = THREE.RepeatWrapping;
  fabricTex.repeat.set(4, 4);

  return new THREE.MeshStandardMaterial({
    map: fabricTex,
    roughness: 0.72, // Soft, non-shiny scattering matte finish
    metalness: 0.08, // Eliminates hyper-glossy glare so it ceases looking metallic
    bumpMap: fabricTex, // Apply micro-weaves as structured physically based bumps
    bumpScale: 0.0075, // Double the bump intensity for a more pronounced fabric bite
    envMapIntensity: 1.1 // Beautiful soft ambient lighting
  });
};

function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSymmetricFaceSeed(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, meshName: string): number {
  const centroid = new THREE.Vector3()
    .add(v0)
    .add(v1)
    .add(v2)
    .multiplyScalar(1.0 / 3.0);

  // We discretize coordinates using a 5mm resolution step.
  // This groups mirrored triangles together perfectly on the left and right halves of the chair.
  const step = 0.005; 
  const x = Math.round(Math.abs(centroid.x) / step);
  const y = Math.round(centroid.y / step);
  const z = Math.round(centroid.z / step);

  let nameHash = 0;
  const cleanName = meshName || 'mesh';
  for (let i = 0; i < cleanName.length; i++) {
    nameHash = (nameHash << 5) - nameHash + cleanName.charCodeAt(i);
    nameHash |= 0;
  }

  return Math.abs(x * 1597 + y * 5119 + z * 8467 + nameHash);
}

function getFacetMaterialIndex(symSeed: number, complexity: number): number {
  const r = seedRandom(symSeed);

  // Starting at 5 as standard center (matching the original balanced design of Image 3).
  // Left slider (1 to 5): seamlessly decreases the number of plates down to 0% (pure polished metal) matching Image 2.
  // Right slider (5 to 10): seamlessly increases plates up to almost full coverage (~95%).
  let threshold = 0.55; // Original standard midpoint (55% coverage)
  if (complexity < 5) {
    // Scales smoothly from 0.0 (at complexity 1) up to 0.55 (at complexity 5)
    const factor = (complexity - 1) / 4;
    threshold = factor * 0.55;
  } else if (complexity > 5) {
    // Scales smoothly from 0.55 (at complexity 5) up to 0.95 (at complexity 10)
    const factor = (complexity - 5) / 5;
    threshold = 0.55 + factor * 0.40;
  }

  if (r < threshold) {
    const r2 = seedRandom(symSeed + 88888);
    // Matte absolute black and dark zinc grey matching the actual original manufactured carbon/metal contrast look!
    if (r2 < 0.85) return 1; // Matte Charcoal/Black
    return 2; // Matte Dark Grey
  }
  return 0; // Base titanium
}

function createInsetPanelsGeometry(originalGeometry: THREE.BufferGeometry, meshName: string, complexity: number) {
  if (!originalGeometry.boundingBox) {
    originalGeometry.computeBoundingBox();
  }
  const bbox = originalGeometry.boundingBox;
  if (!bbox) return null;
  
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const height = maxY - minY;
  // Apply panel overlays only to upper surfaces (seat pan and backrest level, above lower leg frame structure)
  const legCutoff = minY + height * 0.35;

  const nonIndexed = originalGeometry.clone().toNonIndexed();
  const positionAttr = nonIndexed.getAttribute('position') as THREE.BufferAttribute;
  const normalAttr = nonIndexed.getAttribute('normal') as THREE.BufferAttribute;
  
  if (!positionAttr) return null;
  
  const vertexCount = positionAttr.count;
  const panelPositions: number[] = [];
  const panelNormals: number[] = [];
  const panelMatIndices: number[] = [];
  
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  
  for (let i = 0; i < vertexCount; i += 3) {
    const triangleIdx = i / 3;
    
    // Retrieve face coordinates to compute precise center and size bounds
    v0.fromBufferAttribute(positionAttr, i);
    v1.fromBufferAttribute(positionAttr, i + 1);
    v2.fromBufferAttribute(positionAttr, i + 2);
    
    const centroid = new THREE.Vector3()
      .add(v0)
      .add(v1)
      .add(v2)
      .multiplyScalar(1.0 / 3.0);
      
    // Filter legs dynamically
    if (centroid.y < legCutoff) {
      continue;
    }
    
    const symSeed = getSymmetricFaceSeed(v0, v1, v2, meshName);
    const matIdx = getFacetMaterialIndex(symSeed, complexity);
    if (matIdx === 0) {
      continue;
    }
    
    // Calculate precise flat face normal to avoid smoothing artifacts on separate sharp panels
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Inset Scale of 0.86 creates a neat 14% frame margin around each facet,
    // exposing the underlying, high-specular titanium boundaries perfectly matching Image 3!
    const insetScale = 0.86;
    
    // Push panel outwards along the face normal by 0.8 mm (thin stickers / custom skin overlays).
    // Concurrently paired with GPU-level polygonOffset, this provides beautiful relief without any possible z-fighting!
    const outOffset = 0.0008;
    
    const u0 = new THREE.Vector3().subVectors(v0, centroid).multiplyScalar(insetScale).add(centroid).addScaledVector(faceNormal, outOffset);
    const u1 = new THREE.Vector3().subVectors(v1, centroid).multiplyScalar(insetScale).add(centroid).addScaledVector(faceNormal, outOffset);
    const u2 = new THREE.Vector3().subVectors(v2, centroid).multiplyScalar(insetScale).add(centroid).addScaledVector(faceNormal, outOffset);
    
    panelPositions.push(u0.x, u0.y, u0.z);
    panelPositions.push(u1.x, u1.y, u1.z);
    panelPositions.push(u2.x, u2.y, u2.z);
    
    panelNormals.push(faceNormal.x, faceNormal.y, faceNormal.z);
    panelNormals.push(faceNormal.x, faceNormal.y, faceNormal.z);
    panelNormals.push(faceNormal.x, faceNormal.y, faceNormal.z);
    
    panelMatIndices.push(matIdx, matIdx, matIdx);
  }
  
  nonIndexed.dispose();
  
  if (panelPositions.length === 0) {
    return null;
  }
  
  const panelGeom = new THREE.BufferGeometry();
  panelGeom.setAttribute('position', new THREE.Float32BufferAttribute(panelPositions, 3));
  panelGeom.setAttribute('normal', new THREE.Float32BufferAttribute(panelNormals, 3));
  
  panelGeom.clearGroups();
  let currentIdx = -1;
  let groupStart = 0;
  for (let j = 0; j < panelMatIndices.length; j += 3) {
    const matIdx = panelMatIndices[j];
    if (currentIdx === -1) {
      currentIdx = matIdx;
      groupStart = j;
    } else if (matIdx !== currentIdx) {
      panelGeom.addGroup(groupStart, j - groupStart, currentIdx);
      currentIdx = matIdx;
      groupStart = j;
    }
  }
  if (currentIdx !== -1) {
    panelGeom.addGroup(groupStart, panelMatIndices.length - groupStart, currentIdx);
  }
  
  return panelGeom;
}

const woodMatInstances: Record<string, THREE.MeshStandardMaterial> = {};
const fabricMatInstances: Record<string, THREE.MeshStandardMaterial> = {};

// Cache static materials for solid color face overlays, emulating matte finishes
const matteCharcoalMat = new THREE.MeshStandardMaterial({
  color: '#1a1a1a', // Deep charcoal black
  roughness: 0.82,
  metalness: 0.08,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
});

const matteDarkGreyMat = new THREE.MeshStandardMaterial({
  color: '#3f3f46', // Cool grey matte
  roughness: 0.80,
  metalness: 0.10,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
});

const matteOffWhiteMat = new THREE.MeshStandardMaterial({
  color: '#e4e4e7', // Clean neutral off-white
  roughness: 0.72,
  metalness: 0.08,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
});

const warningOrangeMat = new THREE.MeshStandardMaterial({
  color: '#ea580c', // High-visibility tech orange
  roughness: 0.55,
  metalness: 0.10,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
});

const warningYellowMat = new THREE.MeshStandardMaterial({
  color: '#ca8a04', // Warning yellow
  roughness: 0.55,
  metalness: 0.10,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
});

export const isExplicitMetalFrame = (mat: any, mesh?: any): boolean => {
  if (!mat) return false;
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (!m) return false;

  const matName = (m.name || '').toLowerCase();

  // Model 1, 2, 3 base meshes are always treated as metal frames so their pipes/stems remain raw/colored titanium!
  if (
    matName === '材质.031' || // Model 1
    matName === '材质.033' || // Model 2 frame
    matName.includes('3.04288') // Model 3 frame
  ) {
    return true;
  }

  // Model 4, 5, 6, 7 frames
  if (
    matName.includes('material_40') || 
    matName === '材质.027' // Model 7 frame
  ) {
    return true;
  }

  // Model 4, 5, 6, 7 veneer/panels
  if (
    matName === '材质.039' || 
    matName === '材质.041' || 
    matName === '材质.043' || 
    matName === '材质.026' || // Model 7 backrest/veneer
    matName.includes('塑胶')
  ) {
    return false;
  }

  return false;
};

export const isOriginalVeneerMaterial = (mat: any, mesh?: any): boolean => {
  if (!mat) return false;
  
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (!m) return false;

  const matName = (m.name || '').toLowerCase();

  // Model 1, 2, 3 base structures are treated as frames (not veneers) so we only texture their dynamic overlays!
  if (
    matName === '材质.031' || // Model 1
    matName === '材质.033' || // Model 2 frame
    matName.includes('3.04288') // Model 3 frame
  ) {
    return false; // Not a veneer, represents the base frame
  }

  // Model 2, 3 native separate panels are indeed veneers!
  if (
    matName === '材质.034' || // Model 2 panel
    matName === '材质.036' // Model 3 panel
  ) {
    return true;
  }

  // Model 4, 5, 6, 7 frames
  if (
    matName.includes('material_40') || 
    matName === '材质.027' // Model 7 frame
  ) {
    return false;
  }

  // Model 4, 5, 6, 7 pre-separated veneer panels
  if (
    matName === '材质.039' || 
    matName === '材质.041' || 
    matName === '材质.043' || 
    matName === '材质.026' || // Model 7 backrest/veneer
    matName.includes('塑胶')
  ) {
    return true;
  }

  // Fallbacks:
  const meshName = mesh ? (mesh.name || '').toLowerCase() : '';
  if (
    meshName.includes('屁股') || 
    meshName.includes('pigu') || 
    meshName.includes('butt') || 
    meshName.includes('高颅顶') || 
    meshName.includes('luding') || 
    meshName.includes('塑胶') || 
    meshName.includes('fushou') || 
    meshName.includes('扶手')
  ) {
    return true;
  }

  if (m.color) {
    const c = new THREE.Color(m.color);
    const luminance = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    if (luminance < 0.25) {
      return true;
    }
  }

  const hasVeneerKeyword = 
    matName.includes('veneer') || matName.includes('panel') || matName.includes('decal') ||
    matName.includes('plate') || matName.includes('face') || matName.includes('inset') ||
    matName.includes('tile') || matName.includes('facet') || matName.includes('pad') ||
    matName.includes('leather') || matName.includes('plastic') || matName.includes('mian') ||
    matName.includes('carbon') || matName.includes('black') || matName.includes('dark') ||
    matName.includes('charcoal') || matName.includes('seat') || matName.includes('backrest') ||
    matName.includes('cushion') || matName.includes('fabric') || matName.includes('cloth') ||
    matName.includes('wood') || matName.includes('grain') || matName.includes('texture') ||
    meshName.includes('veneer') || meshName.includes('panel') || meshName.includes('decal') ||
    meshName.includes('plate') || meshName.includes('face') || meshName.includes('inset') ||
    meshName.includes('tile') || meshName.includes('facet') || meshName.includes('pad') ||
    meshName.includes('leather') || meshName.includes('plastic') || meshName.includes('mian') ||
    meshName.includes('carbon') || meshName.includes('black') || meshName.includes('dark') ||
    meshName.includes('charcoal') || meshName.includes('seat') || meshName.includes('backrest') ||
    meshName.includes('cushion') || meshName.includes('fabric') || meshName.includes('cloth') ||
    meshName.includes('wood') || meshName.includes('grain') || meshName.includes('texture');

  if (hasVeneerKeyword) return true;

  if (isExplicitMetalFrame(m, mesh)) {
    return false;
  }

  return true;
};

export const isColorfulMaterial = (mat: any, mesh?: any): boolean => {
  return isOriginalVeneerMaterial(mat, mesh);
};

export function Chair3D({ 
  chairId, 
  color, 
  chairMaterial = 'titanium', 
  woodGrain = 'walnut', 
  chairBackrestAngle = 0, 
  chairHasArmrest = false,
  progress
}: Chair3DProps) {
  const chairTextureComplex = 5; // Fixed fallback for dynamic panels if ever generated
  // Identify index/number of the chair from its ID (e.g. "CY-A1" -> 1, "CY-A7" -> 7)
  const chairNumber = useMemo(() => {
    const num = parseInt(chairId.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 1 : num;
  }, [chairId]);

  const GLTF_URL = useMemo(() => {
    if (chairNumber === 1 && chairMaterial === 'fabric' && color?.toLowerCase() === '#ff6b6b') {
      return LANZI_MODEL_URL;
    }
    return getChairModelUrl(chairNumber);
  }, [chairNumber, chairMaterial, color]);

  const { scene } = useGLTF(GLTF_URL);
  const { scene: armrestScene } = useGLTF(ARMREST_MODEL_URL);

  // Deep clone of structural geometries, materials, and positions to prevent cross-contamination
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

      // Compute consolidated bounding box of the wrapper group
      const bbox = new THREE.Box3().setFromObject(wrapperGroup);

      const center = new THREE.Vector3();
      bbox.getCenter(center);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // Auto-scale so that the physical height perfectly pairs with standard table dimensions (~0.82 meters)
      const maxDim = size.y || 1;
      const scaleFactor = 0.82 / maxDim;

      // Inject the armrests if the custom option is toggled.
      // Since they are placed as sibling meshes under the main wrapperGroup,
      // they seamlessly inherit the uniform auto-scaling (0.82m) and horizontal/bottom-flush coordinates!
      if (chairHasArmrest && armrestScene) {
        const armrestClone = armrestScene.clone(true);
        const fushouNode = armrestClone.getObjectByName('fushou');
        if (fushouNode) {
          fushouNode.name = "chair_armrest"; // Named so we can identify and handle in traversed effects
          
          // 1. Isolate the armrests (the "石膏" plaster material representing the arches) and delete duplicate chair parts
          const toRemove: THREE.Object3D[] = [];
          fushouNode.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const matName = (mesh.material && !Array.isArray(mesh.material)) ? (mesh.material.name || '') : '';
              if (!matName.toLowerCase().includes('石膏')) {
                toRemove.push(mesh);
              }
            }
          });
          toRemove.forEach((mesh) => {
            if (mesh.parent) {
              mesh.parent.remove(mesh);
            }
          });

          const adj = ARMREST_ADJUSTMENTS[chairNumber] || { pos: [0, 0, 0], scale: [1, 1, 1] };
          
          // 2. Set the correct original 0.004 scale, multiplied by our manual scale adjust
          fushouNode.scale.set(
            0.004 * adj.scale[0],
            0.004 * adj.scale[1],
            0.004 * adj.scale[2]
          );

          // 3. Set the armrest's local node position based on its original absolute Blender coordinate of [-1.0, 0.0, 0.0].
          // By utilizing this absolute pivot reference rather than relative mesh-dependent local positions,
          // they align exactly as they were originally designed and modeled together in the Blender workspace!
          fushouNode.position.set(
            -1.0 + adj.pos[0],
            0.0 + adj.pos[1],
            0.0 + adj.pos[2]
          );

          wrapperGroup.add(fushouNode);
        }
      }

      // Apply scale to wrapperGroup
      wrapperGroup.scale.setScalar(scaleFactor);

      // Center the custom chair components horizontally at coordinates (0, 0, 0)
      // and flush the bottom of the geometry exactly with the ground (bottom-most level Y = 0)
      const minY = bbox.min.y;
      wrapperGroup.position.set(
        -center.x * scaleFactor,
        -minY * scaleFactor,
        -center.z * scaleFactor
      );
    }

    return clone;
  }, [scene, armrestScene, chairHasArmrest, chairNumber]);

  // Update materials and physically tilt backrest when customizer settings change!
  useEffect(() => {
    // Generate or fetch targeted wood grain material dynamically
    if (!woodMatInstances[woodGrain]) {
      woodMatInstances[woodGrain] = createWoodMaterial(woodGrain);
    }

    let activeFabricColor = color;
    if (!activeFabricColor || activeFabricColor === 'original' || activeFabricColor === '#original' || activeFabricColor === '#ffffff') {
      activeFabricColor = '#b197fc'; // Default lilac purple if none selected
    }
    if (!fabricMatInstances[activeFabricColor]) {
      fabricMatInstances[activeFabricColor] = createFabricMaterialForColor(activeFabricColor);
    }
    const currentFabricMat = fabricMatInstances[activeFabricColor];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name === 'mesh_panel_overlay') {
          return;
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Save original material reference on first pass (completely pristine and untouched from GLTF)
        if (!mesh.userData.originalMaterial) {
          const cloneMat = (m: any) => {
            if (!m) return m;
            const cl = m.clone();
            if (chairNumber === 1 && GLTF_URL !== LANZI_MODEL_URL && cl.map) {
              cl.map = desaturateTexture(cl.map);
            }
            cl.needsUpdate = true;
            return cl;
          };

          if (Array.isArray(mesh.material)) {
            mesh.userData.originalMaterial = mesh.material.map(cloneMat);
          } else if (mesh.material && typeof mesh.material.clone === 'function') {
            mesh.userData.originalMaterial = cloneMat(mesh.material);
          } else {
            mesh.userData.originalMaterial = mesh.material;
          }
        }

        // If this is the user's custom model (lanzi1.glb), keep its visual materials completely pristine and unaltered
        const isArmrestMesh = mesh.name === 'chair_armrest' || mesh.name.includes('fushou') || (mesh.parent && (mesh.parent.name === 'chair_armrest' || mesh.parent.name.includes('fushou')));
        if (GLTF_URL === LANZI_MODEL_URL && !isArmrestMesh) {
          if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial;
          }
          mesh.visible = true;
          return;
        }

        const getMatName = (mat: any): string => {
          if (!mat) return '';
          if (Array.isArray(mat)) {
            return mat.map(m => m?.name || '').join(' ');
          }
          return mat.name || '';
        };

        const originalMatName = getMatName(mesh.userData.originalMaterial);

        const isPlasticDecor = 
          (mesh.name && mesh.name.toLowerCase().includes('塑胶')) ||
          originalMatName.includes('塑胶');

        // Automatically hide detailed black joints/decor loops for wood and fabric styles
        if (isPlasticDecor && (chairMaterial === 'wood' || chairMaterial === 'fabric')) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
        }

        // Save original geometry reference on first pass
        if (!mesh.userData.originalGeometry) {
          mesh.userData.originalGeometry = mesh.geometry;
        }

        // Restore original geometry by default so material switches (e.g. wood, fabric) or updates don't cause leaks
        if (mesh.geometry !== mesh.userData.originalGeometry) {
          mesh.geometry = mesh.userData.originalGeometry;
        }

        // Retrieve any existing panel overlay mesh
        const existingPanel = mesh.getObjectByName('mesh_panel_overlay') as THREE.Mesh | undefined;

        // 1. Resolve dynamic overlay panel requirements for Combined Models (1, 2, 3)
        const isCombined = chairNumber === 1;
        const shouldHaveTexture = isCombined && (
          chairMaterial === 'wood' || 
          chairMaterial === 'fabric'
        );

        // Clean up or remove dynamic panel if it's no longer matching
        const panelMaterialType = chairMaterial + '_' + (chairMaterial === 'wood' ? woodGrain : (chairMaterial === 'fabric' ? color : ''));
        const needsRecreatePanel = existingPanel && (
          !shouldHaveTexture || 
          existingPanel.userData.complexity !== chairTextureComplex ||
          existingPanel.userData.materialType !== panelMaterialType
        );
        if (existingPanel && needsRecreatePanel) {
          mesh.remove(existingPanel);
          if (existingPanel.geometry) {
            existingPanel.geometry.dispose();
          }
        }

        // 2. Restore pristine base material reference (from GLB) for styling
        const clonePristine = (m: any) => {
          if (!m) return m;
          const cl = m.clone();
          cl.needsUpdate = true;
          return cl;
        };

        if (mesh.userData.originalMaterial) {
          if (Array.isArray(mesh.userData.originalMaterial)) {
            mesh.material = mesh.userData.originalMaterial.map(clonePristine);
          } else {
            mesh.material = clonePristine(mesh.userData.originalMaterial);
          }
        }

        const isRawColor = !color || color === '#original' || color === 'original' || color === '#ffffff';
        let baseHex = color;
        if (!baseHex || baseHex === '#original' || baseHex === 'original' || baseHex === '#ffffff') {
          baseHex = '#abb4b9'; // Default lovely silver-gray titanium steel
        }

        // 3. Apply appropriate materials / styling to the base mesh
        const isModelWithBakedTexture = chairNumber === 1 || chairNumber === 2 || chairNumber === 3 || chairNumber === 7;

        if (isModelWithBakedTexture) {
          // Model 2, 3, 7 have baked texture maps containing both the frame (silver) and cushions/veneers (black/dark).
          // We must NOT strip their maps, and we must keep BOTH materials (backrest and base meshes) styled consistently!
          const applyBakedModelStyles = (mat: any) => {
            if (mat) {
              // Ensure we do NOT clear maps! Keep original beautiful baked textures intact.
              if (chairMaterial === 'titanium') {
                if (isRawColor) {
                  // Beautiful raw/natural white/silver titanium frame outline
                  if (mat.color && typeof mat.color.set === 'function') {
                    mat.color.set('#ffffff'); // Keep original crisp texture colors untouched! (No grey tinting of the black cushions!)
                  }
                } else {
                  // Anodized colors: we can blend the color elegantly with the texture
                  if (mat.color && typeof mat.color.set === 'function') {
                    mat.color.set(baseHex);
                  }
                }
              } else {
                // In wood/fabric modes, we also keep the gorgeous original baked silver frame + matte black pad contrast
                // (Otherwise, applying solid wood/fabric to a combined mesh makes the legs or frame turn into wood/fabric!)
                if (mat.color && typeof mat.color.set === 'function') {
                  mat.color.set('#ffffff');
                }
              }
              
              // Apply beautiful physical matte properties to make the black cushions pop
              if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.75);
              if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.15);
              
              mat.needsUpdate = true;
            }
          };

          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(applyBakedModelStyles);
          } else {
            applyBakedModelStyles(mesh.material);
          }
        } else {
          // Standard customization flow for Models 1, 4, 5, 6
          const isVeneer = isOriginalVeneerMaterial(mesh.material, mesh);

          if (isVeneer) {
            // Model 1, 4-6 native veneer/panel elements
            if (chairMaterial === 'wood') {
              mesh.material = woodMatInstances[woodGrain];
            } else if (chairMaterial === 'fabric') {
              mesh.material = currentFabricMat;
            } else {
              // Titanium mode -> keep original beautiful high-quality dark matte / black textured cushion/panel from GLB!
              const applyVeneerMatteStyles = (mat: any) => {
                if (mat) {
                  // Ensure a nice matte look, but KEEP all original maps/textures/color intact!
                  if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.75);
                  if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.15);
                  // Do NOT set solid colors or clear maps because the GLB textures are perfect.
                  mat.needsUpdate = true;
                }
              };
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(applyVeneerMatteStyles);
              } else {
                applyVeneerMatteStyles(mesh.material);
              }
            }
          } else {
            // Base metal frame element
            const applyFrameStyles = (mat: any) => {
              if (mat) {
                const matName = mat.name || '';
                
                if (chairMaterial === 'wood' || chairMaterial === 'fabric') {
                  // Under Wood/Fabric mode, frame parts remain beautiful silver-gray titanium steel
                  if (mat.color && typeof mat.color.set === 'function') {
                    mat.color.set('#abb4b9');
                  }
                  mat.roughness = 0.60;
                  mat.metalness = 0.88;
                  mat.map = null;
                  mat.roughnessMap = null;
                  mat.normalMap = null;
                  mat.aoMap = null;
                } else {
                  // Titanium customizable mode (raw color or anodized custom colors)
                  if (isRawColor) {
                    // Beautiful sandblasted titanium silver frame
                    if (mat.color) {
                      mat.color.set('#acb3b6');
                    }
                    mat.roughness = 0.60;
                    mat.metalness = 0.88;
                    mat.map = null;
                    mat.roughnessMap = null;
                    mat.normalMap = null;
                    mat.aoMap = null;
                  } else {
                    // Anodized color frame
                    if (mat.color && typeof mat.color.set === 'function') {
                      mat.color.set(baseHex);
                    }
                    mat.roughness = 0.60;
                    mat.metalness = 0.88;
                    mat.map = null;
                    mat.roughnessMap = null;
                    mat.normalMap = null;
                    mat.aoMap = null;
                  }
                }
                mat.needsUpdate = true;
              }
            };

            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(applyFrameStyles);
            } else {
              applyFrameStyles(mesh.material);
            }
          }
        }

        // 4. For Combined Models (1, 2, 3), dynamically generate/texture the overlay panels if required
        if (shouldHaveTexture) {
          let currentPanel = mesh.getObjectByName('mesh_panel_overlay') as THREE.Mesh | undefined;
          if (!currentPanel) {
            const panelGeom = createInsetPanelsGeometry(mesh.userData.originalGeometry, mesh.name, chairTextureComplex);
            if (panelGeom) {
              let finalPanelMat: THREE.Material | THREE.Material[];
              
              if (chairMaterial === 'wood') {
                finalPanelMat = woodMatInstances[woodGrain];
              } else if (chairMaterial === 'fabric') {
                finalPanelMat = currentFabricMat;
              } else {
                // Titanium plates matching the multitone charcoal black look
                finalPanelMat = [
                  matteCharcoalMat,    // Index 0 (fallback)
                  matteCharcoalMat,    // Index 1 (Most common Charcoal black plate)
                  matteDarkGreyMat,    // Index 2 (Secondary dark grey)
                  matteCharcoalMat,    // Index 3 (Consistently Charcoal black plate to match original)
                  matteDarkGreyMat,    // Index 4 (Consistently zinc grey plate)
                  matteCharcoalMat     // Index 5 (Consistently Charcoal black plate)
                ];
              }
              
              currentPanel = new THREE.Mesh(panelGeom, finalPanelMat);
              currentPanel.name = 'mesh_panel_overlay';
              currentPanel.userData = { 
                complexity: chairTextureComplex,
                materialType: panelMaterialType
              };
              currentPanel.castShadow = false;
              currentPanel.receiveShadow = false;
              mesh.add(currentPanel);
            }
          }
        }

        if (mesh.userData.originalScaleX === undefined) {
          mesh.userData.originalScaleX = mesh.scale.x;
          mesh.userData.originalScaleY = mesh.scale.y;
          mesh.userData.originalScaleZ = mesh.scale.z;
        }
        if (mesh.userData.originalPositionX === undefined) {
          mesh.userData.originalPositionX = mesh.position.x;
          mesh.userData.originalPositionY = mesh.position.y;
          mesh.userData.originalPositionZ = mesh.position.z;
        }

        // Inform Three.js to recompile/render if needed
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (m) m.needsUpdate = true;
            });
          } else {
            mesh.material.needsUpdate = true;
          }
        }

        const legProgress = progress !== undefined ? Math.max(0, Math.min(1, (progress - 10) / 35)) : 1;
        const seatProgress = progress !== undefined ? Math.max(0, Math.min(1, (progress - 45) / 25)) : 1;
        const backProgress = progress !== undefined ? Math.max(0, Math.min(1, (progress - 70) / 25)) : 1;
        const armProgress = progress !== undefined ? Math.max(0, Math.min(1, (progress - 72) / 23)) : 1;

        // Apply physical / visual backrest tilting and sub-assembly animations
        const isLegOrBase = 
          mesh.name.toLowerCase().includes('leg') || 
          mesh.name.toLowerCase().includes('base') || 
          mesh.name.toLowerCase().includes('foot') || 
          mesh.name.toLowerCase().includes('floor') || 
          mesh.name.toLowerCase().includes('bottom');
        const isArmrest = 
          mesh.name.toLowerCase().includes('armrest') ||
          mesh.name.toLowerCase().includes('fushou') ||
          (mesh.parent && (mesh.parent.name.toLowerCase().includes('armrest') || mesh.parent.name.toLowerCase().includes('fushou')));

        const isBackrest = !isLegOrBase && !isArmrest && (
          mesh.name.toLowerCase().includes('back') || 
          mesh.name.toLowerCase().includes('rest') || 
          mesh.name.toLowerCase().includes('seatback') ||
          (mesh.position.y > 0.25 && mesh.position.z > -0.1)
        );

        // Adjust visibility
        if (progress !== undefined) {
          if (isLegOrBase) {
            mesh.visible = progress >= 10;
          } else if (isArmrest) {
            mesh.visible = progress >= 72;
          } else if (isBackrest) {
            mesh.visible = progress >= 70;
          } else {
            mesh.visible = progress >= 45; // Seat
          }
        } else {
          mesh.visible = true;
        }

        // Apply scale & position displacement
        if (isLegOrBase) {
          // Restore rotation
          if (mesh.userData.originalRotationX !== undefined) {
            mesh.rotation.x = mesh.userData.originalRotationX;
          }
          // Scale leg up vertically
          mesh.scale.set(
            mesh.userData.originalScaleX,
            mesh.userData.originalScaleY * legProgress,
            mesh.userData.originalScaleZ
          );
          mesh.position.set(
            mesh.userData.originalPositionX,
            mesh.userData.originalPositionY,
            mesh.userData.originalPositionZ
          );
        } else if (isBackrest) {
          if (mesh.userData.originalRotationX === undefined) {
            mesh.userData.originalRotationX = mesh.rotation.x;
          }
          const rad = (chairBackrestAngle || 0) * Math.PI / 180;
          mesh.rotation.x = mesh.userData.originalRotationX + rad;

          // Backrest slides down from above
          const backrestSlideY = progress !== undefined ? (1 - backProgress) * 0.3 : 0;
          mesh.position.x = mesh.userData.originalPositionX;
          mesh.position.z = mesh.userData.originalPositionZ - Math.sin(rad) * 0.25;
          mesh.position.y = (mesh.userData.originalPositionY + (Math.cos(rad) - 1) * 0.25) - backrestSlideY;
          mesh.scale.set(mesh.userData.originalScaleX, mesh.userData.originalScaleY, mesh.userData.originalScaleZ);
        } else if (isArmrest) {
          if (mesh.userData.originalRotationX !== undefined) {
            mesh.rotation.x = mesh.userData.originalRotationX;
          }
          // Armrest slides down from above
          const armrestSlideY = progress !== undefined ? (1 - armProgress) * 0.2 : 0;
          mesh.position.set(
            mesh.userData.originalPositionX,
            mesh.userData.originalPositionY - armrestSlideY,
            mesh.userData.originalPositionZ
          );
          mesh.scale.set(mesh.userData.originalScaleX, mesh.userData.originalScaleY, mesh.userData.originalScaleZ);
        } else {
          // Seat / other parts
          if (mesh.userData.originalRotationX !== undefined) {
            mesh.rotation.x = mesh.userData.originalRotationX;
          }
          // Seat slides down 30cm
          const seatSlideY = progress !== undefined ? (1 - seatProgress) * 0.3 : 0;
          mesh.position.set(
            mesh.userData.originalPositionX,
            mesh.userData.originalPositionY - seatSlideY,
            mesh.userData.originalPositionZ
          );
          mesh.scale.set(mesh.userData.originalScaleX, mesh.userData.originalScaleY, mesh.userData.originalScaleZ);
        }
      }
    });
  }, [clonedScene, chairMaterial, woodGrain, chairBackrestAngle, color, progress]);

  return <primitive object={clonedScene} />;
}
