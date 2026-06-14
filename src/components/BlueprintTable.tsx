import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TableConfig } from '../types';
import { CHAIR_LIBRARY } from '../data/chairs';

interface BlueprintTableProps {
  config: TableConfig;
  progress: number; // 0 to 100
}

// Map material types to solid-glass and schematic color schemes for premium CAD feel
const CORE_MATERIAL_PALETTE: Record<string, { fill: string; stroke: string; glow: string }> = {
  oak: { fill: 'rgba(210, 166, 115, 0.22)', stroke: '#b3824d', glow: 'rgba(210, 166, 115, 0.4)' },
  steel: { fill: 'rgba(90, 107, 124, 0.20)', stroke: '#4a5568', glow: 'rgba(90, 107, 124, 0.35)' },
  glass: { fill: 'rgba(173, 216, 230, 0.28)', stroke: '#3182ce', glow: 'rgba(66, 153, 225, 0.5)' },
  chrome: { fill: 'rgba(215, 220, 225, 0.25)', stroke: '#718096', glow: 'rgba(160, 174, 192, 0.4)' },
  marble: { fill: 'rgba(240, 240, 240, 0.25)', stroke: '#2d3748', glow: 'rgba(226, 232, 240, 0.5)' }
};

export function BlueprintTable({ config, progress }: BlueprintTableProps) {
  const isChairOnlyMode = config.showTable === false && !!config.chairId;

  // Let's get selected chair info
  const selectedChair = useMemo(() => {
    if (!config.chairId) return null;
    return CHAIR_LIBRARY.find(c => c.id === config.chairId) || CHAIR_LIBRARY[0];
  }, [config.chairId]);

  // -------------------------------------------------------------
  // DUAL BRANCH: 1. CHAIR FOCUS BLUEPRINT MODE
  // -------------------------------------------------------------
  if (isChairOnlyMode) {
    const cx = 200;
    const cy = 200; // Extra room above for spikes/crowns
    const cos30 = 0.866;
    const sin30 = 0.5;

    const proj = (X: number, Y: number, Z: number) => {
      return {
        x: cx + X * cos30 - Y * cos30,
        y: cy + X * sin30 + Y * sin30 - Z
      };
    };

    // Isometric dimensions tailored for chair visualization
    const sw = 64; // seat width
    const sd = 64; // seat depth
    const sh = 70; // seat height (base legs length)

    // A. Floor footprint point coordinates
    const fA = proj(-sw / 2, -sd / 2, 0); // Back Left
    const fB = proj(sw / 2, -sd / 2, 0);  // Back Right
    const fC = proj(sw / 2, sd / 2, 0);   // Front Right
    const fD = proj(-sw / 2, sd / 2, 0);  // Front Left

    // B. Legs vertical progression (0% - 45%)
    const legProgress = Math.max(0, Math.min(1, (progress - 10) / 35));
    const currentLegH = legProgress * sh;

    const lA = proj(-sw / 2, -sd / 2, currentLegH);
    const lB = proj(sw / 2, -sd / 2, currentLegH);
    const lC = proj(sw / 2, sd / 2, currentLegH);
    const lD = proj(-sw / 2, sd / 2, currentLegH);

    // C. Seat Cushion descent (45% - 75%)
    const seatProgress = Math.max(0, Math.min(1, (progress - 45) / 25));
    const seatSlideY = (1 - seatProgress) * 45;
    const seatOpacity = seatProgress;

    const projSeat = (X: number, Y: number, Z: number) => {
      const raw = proj(X, Y, Z);
      return {
        x: raw.x,
        y: raw.y + seatSlideY
      };
    };

    // Seat corners dynamically sliding
    const sA = projSeat(-sw / 2, -sd / 2, sh);
    const sB = projSeat(sw / 2, -sd / 2, sh);
    const sC = projSeat(sw / 2, sd / 2, sh);
    const sD = projSeat(-sw / 2, sd / 2, sh);

    // D. Backrest angle rotation and descension progression (70% - 95%)
    const backProgress = Math.max(0, Math.min(1, (progress - 70) / 25));
    const backSlideY = (1 - backProgress) * 35;
    const backOpacity = backProgress;

    const angleRad = ((config.chairBackrestAngle || 0) * Math.PI) / 180;
    const backHeight = 65; // Backrest panel height

    const projBack = (X: number, ly: number, relativeZ: number) => {
      // Rotate backrest relative to the seat backrest bar (on Y = -sd/2)
      const yTilt = -relativeZ * Math.sin(angleRad);
      const zTilt = relativeZ * Math.cos(angleRad);

      const targetY = -sd / 2 + ly + yTilt;
      const targetZ = sh + zTilt;

      const raw = proj(X, targetY, targetZ);
      return {
        x: raw.x,
        y: raw.y + backSlideY
      };
    };

    // Points calculation of the backrest shape
    // Build specific designs reflecting the model selected by user
    const backrestOutline = (() => {
      const id = config.chairId || 'CY-A1';

      if (id === 'CY-A4') {
        // Crowned Spiked Monolith (Twin spiky points)
        const bL = projBack(-sw / 2.2, 0, 0);
        const bR = projBack(sw / 2.2, 0, 0);
        const spikeL = projBack(-sw / 2.5, -2, backHeight);
        const spikeR = projBack(sw / 2.5, -2, backHeight);
        const centerDip = projBack(0, -1, backHeight - 15);
        const waistL = projBack(-sw / 2.4, 0, backHeight * 0.4);
        const waistR = projBack(sw / 2.4, 0, backHeight * 0.4);

        return `${bL.x},${bL.y} ${waistL.x},${waistL.y} ${spikeL.x},${spikeL.y} ${centerDip.x},${centerDip.y} ${spikeR.x},${spikeR.y} ${waistR.x},${waistR.y} ${bR.x},${bR.y}`;
      } else if (id === 'CY-A7') {
        // Cat-Ear Lattice Monarch
        const bL = projBack(-sw / 2, 0, 0);
        const bR = projBack(sw / 2, 0, 0);
        const earL = projBack(-sw / 2.8, -4, backHeight - 2);
        const earR = projBack(sw / 2.8, -4, backHeight - 2);
        const centerDitch = projBack(0, -0.5, backHeight - 20);
        const outerL = projBack(-sw / 2, 0.5, backHeight * 0.5);
        const outerR = projBack(sw / 2, 0.5, backHeight * 0.5);

        return `${bL.x},${bL.y} ${outerL.x},${outerL.y} ${earL.x},${earL.y} ${centerDitch.x},${centerDitch.y} ${earR.x},${earR.y} ${outerR.x},${outerR.y} ${bR.x},${bR.y}`;
      } else if (id === 'CY-A2') {
        // Double-Wishbone Diamond (Hourglass with diamond facets)
        const bL = projBack(-sw / 2.4, 0, 0);
        const bR = projBack(sw / 2.4, 0, 0);
        const waistL = projBack(-sw / 4, 1, backHeight * 0.45);
        const waistR = projBack(sw / 4, 1, backHeight * 0.45);
        const bTopL = projBack(-sw / 2.8, -1, backHeight - 5);
        const bTopR = projBack(sw / 2.8, -1, backHeight - 5);
        const centerTop = projBack(0, -2, backHeight - 2);

        return `${bL.x},${bL.y} ${waistL.x},${waistL.y} ${bTopL.x},${bTopL.y} ${centerTop.x},${centerTop.y} ${bTopR.x},${bTopR.y} ${waistR.x},${waistR.y} ${bR.x},${bR.y}`;
      } else {
        // Default classic trapezoidal or other styles (CY-A1, CY-A3, CY-A5, CY-A6)
        const bL = projBack(-sw / 2.1, 0, 0);
        const bR = projBack(sw / 2.1, 0, 0);
        const shoulderL = projBack(-sw / 2.1, -1, backHeight - 12);
        const shoulderR = projBack(sw / 2.1, -1, backHeight - 12);
        const topL = projBack(-sw / 3.4, -2, backHeight);
        const topR = projBack(sw / 3.4, -2, backHeight);

        return `${bL.x},${bL.y} ${shoulderL.x},${shoulderL.y} ${topL.x},${topL.y} ${topR.x},${topR.y} ${shoulderR.x},${shoulderR.y} ${bR.x},${bR.y}`;
      }
    })();

    // E. Seat cover texture (decorations matching selected materials / panel overlays)
    const hasTexture = config.enableChairTexture;
    const txDensity = config.chairTextureComplex ?? 5; // 1 to 10 scale

    // Custom CAD color schematic based on material
    const isTitanium = (config.chairMaterial || 'titanium') === 'titanium';
    const fillCol = isTitanium ? 'rgba(0,0,0,0.03)' : (config.chairMaterial === 'wood' ? 'rgba(180, 137, 95, 0.12)' : 'rgba(57, 114, 184, 0.08)');
    const strokeCol = isTitanium ? '#1a1a1a' : (config.chairMaterial === 'wood' ? '#b3824d' : '#3182ce');

    return (
      <div id="blueprint-chair-container" className="w-full relative flex items-center justify-center p-1">
        <svg
          viewBox="0 0 400 320"
          className="w-full max-w-[340px] md:max-w-[420px] aspect-[4/3.2] overflow-visible"
        >
          {/* 1. Ground calibration & concentric layout patterns */}
          <g opacity={0.65}>
            <polygon
              points={`${fA.x},${fA.y} ${fB.x},${fB.y} ${fC.x},${fC.y} ${fD.x},${fD.y}`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.08)"
              strokeWidth="0.8"
              strokeDasharray="4,4"
            />
            {/* Target target circles on floor centered */}
            <circle cx={cx} cy={cy} r={35} fill="none" stroke="rgba(0,0,0,0.04)" strokeDasharray="3,3" />
            <circle cx={cx} cy={cy} r={55} fill="none" stroke="rgba(0,0,0,0.02)" strokeDasharray="5,5" />
          </g>

          {/* 2. Floor anchor nodes */}
          <g>
            {[fA, fB, fC, fD].map((pt, i) => {
              const active = progress > 5;
              return (
                <g key={i}>
                  {active && (
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill="none"
                      stroke={strokeCol}
                      strokeWidth="0.5"
                      initial={{ scale: 0.5, opacity: 0.9 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <circle cx={pt.x} cy={pt.y} r={2} fill={strokeCol} opacity={0.8} />
                </g>
              );
            })}
          </g>

          {/* 3. Base Legs (Vertical lines scaling up) */}
          {progress >= 10 && (
            <g>
              <line x1={fA.x} y1={fA.y} x2={lA.x} y2={lA.y} stroke={strokeCol} strokeWidth="2.2" strokeLinecap="round" />
              <line x1={fB.x} y1={fB.y} x2={lB.x} y2={lB.y} stroke={strokeCol} strokeWidth="2.2" strokeLinecap="round" />
              <line x1={fC.x} y1={fC.y} x2={lC.x} y2={lC.y} stroke={strokeCol} strokeWidth="2.2" strokeLinecap="round" />
              <line x1={fD.x} y1={fD.y} x2={lD.x} y2={lD.y} stroke={strokeCol} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {/* 4. Sliding seat plate (Descent & mount) */}
          {progress >= 45 && seatOpacity > 0 && (
            <g opacity={seatOpacity}>
              {/* Main Seat Plate */}
              <polygon
                points={`${sA.x},${sA.y} ${sB.x},${sB.y} ${sC.x},${sC.y} ${sD.x},${sD.y}`}
                fill={fillCol}
                stroke={strokeCol}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Inset Plate (Simulated structural pan padding) */}
              <polygon
                points={`${projSeat(-sw/2.5, -sd/2.5, sh).x},${projSeat(-sw/2.5, -sd/2.5, sh).y} ${projSeat(sw/2.5, -sd/2.5, sh).x},${projSeat(sw/2.5, -sd/2.5, sh).y} ${projSeat(sw/2.5, sd/2.5, sh).x},${projSeat(sw/2.5, sd/2.5, sh).y} ${projSeat(-sw/2.5, sd/2.5, sh).x},${projSeat(-sw/2.5, sd/2.5, sh).y}`}
                fill="none"
                stroke={strokeCol}
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />

              {/* Decal Overlays / Solid Panels (if enabled) */}
              {hasTexture && (
                <g>
                  {/* Outer Decal Border */}
                  <polygon
                    points={`${projSeat(-sw/2.8, -sd/2.8, sh).x},${projSeat(-sw/2.8, -sd/2.8, sh).y} ${projSeat(sw/2.8, -sd/2.8, sh).x},${projSeat(sw/2.8, -sd/2.8, sh).y} ${projSeat(sw/2.8, sd/2.8, sh).x},${projSeat(sw/2.8, sd/2.8, sh).y} ${projSeat(-sw/2.8, sd/2.8, sh).x},${projSeat(-sw/2.8, sd/2.8, sh).y}`}
                    fill="none"
                    stroke="#111"
                    strokeWidth="0.85"
                  />
                  {/* Decal internal detailing representing density slider */}
                  {Array.from({ length: Math.min(6, Math.max(1, Math.floor(txDensity / 2.1))) }).map((_, i) => {
                    const offset = 4 + i * 4;
                    const dsA = projSeat(-sw/2.8 + offset, -sd/2.8 + offset, sh);
                    const dsB = projSeat(sw/2.8 - offset, -sd/2.8 + offset, sh);
                    const dsC = projSeat(sw/2.8 - offset, sd/2.8 - offset, sh);
                    const dsD = projSeat(-sw/2.8 + offset, sd/2.8 - offset, sh);
                    return (
                      <polygon
                        key={i}
                        points={`${dsA.x},${dsA.y} ${dsB.x},${dsB.y} ${dsC.x},${dsC.y} ${dsD.x},${dsD.y}`}
                        fill="rgba(0,0,0,0.06)"
                        stroke="#111"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}

          {/* 5. Backrest Shell (Tilted & mounted from above) */}
          {progress >= 70 && backOpacity > 0 && (
            <g opacity={backOpacity}>
              {/* Backrest mesh plate */}
              <polygon
                points={backrestOutline}
                fill={fillCol}
                stroke={strokeCol}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Dynamic Spine Ribs (representing the structural triangulation in CY group) */}
              <g opacity={0.6}>
                <line
                  x1={projBack(0, 0, 5).x}
                  y1={projBack(0, 0, 5).y}
                  x2={projBack(0, -1.5, backHeight - 8).x}
                  y2={projBack(0, -1.5, backHeight - 8).y}
                  stroke={strokeCol}
                  strokeWidth="1.5"
                />
                <line
                  x1={projBack(-sw/5, 0, 5).x}
                  y1={projBack(-sw/5, 0, 5).y}
                  x2={projBack(0, -1.5, backHeight - 15).x}
                  y2={projBack(0, -1.5, backHeight - 15).y}
                  stroke={strokeCol}
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
                <line
                  x1={projBack(sw/5, 0, 5).x}
                  y1={projBack(sw/5, 0, 5).y}
                  x2={projBack(0, -1.5, backHeight - 15).x}
                  y2={projBack(0, -1.5, backHeight - 15).y}
                  stroke={strokeCol}
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
              </g>

              {/* Matte black decals on the backrest if enabled */}
              {hasTexture && (
                <polygon
                  points={`${projBack(-sw/4, 0.2, 10).x},${projBack(-sw/4, 0.2, 10).y} ${projBack(sw/4, 0.2, 10).x},${projBack(sw/4, 0.2, 10).y} ${projBack(sw/5, 0.1, backHeight - 12).x},${projBack(sw/5, 0.1, backHeight - 12).y} ${projBack(-sw/5, 0.1, backHeight - 12).x},${projBack(-sw/5, 0.1, backHeight - 12).y}`}
                  fill="rgba(17,17,17,0.18)"
                  stroke="#111"
                  strokeWidth="0.75"
                />
              )}
            </g>
          )}

          {/* 6. Armrests (if active) */}
          {progress >= 72 && config.chairHasArmrest && (
            <g opacity={Math.min(1, (progress - 72) / 20)}>
              {/* Left Armrest */}
              <path
                d={`M ${projSeat(-sw/2, -sd/6, sh).x} ${projSeat(-sw/2, -sd/6, sh).y} 
                    L ${projSeat(-sw/2, -sd/6, sh + 18).x} ${projSeat(-sw/2, -sd/6, sh + 18).y} 
                    L ${projSeat(-sw/2, sd/3, sh + 16).x} ${projSeat(-sw/2, sd/3, sh + 16).y} 
                    L ${projSeat(-sw/2, sd/3, sh).x} ${projSeat(-sw/2, sd/3, sh).y}`}
                fill="none"
                stroke={strokeCol}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1={projSeat(-sw/2, -sd/6, sh + 18).x}
                y1={projSeat(-sw/2, -sd/6, sh + 18).y}
                x2={projSeat(-sw/2, sd/3, sh + 16).x}
                y2={projSeat(-sw/2, sd/3, sh + 16).y}
                stroke="#111"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Right Armrest */}
              <path
                d={`M ${projSeat(sw/2, -sd/6, sh).x} ${projSeat(sw/2, -sd/6, sh).y} 
                    L ${projSeat(sw/2, -sd/6, sh + 18).x} ${projSeat(sw/2, -sd/6, sh + 18).y} 
                    L ${projSeat(sw/2, sd/3, sh + 16).x} ${projSeat(sw/2, sd/3, sh + 16).y} 
                    L ${projSeat(sw/2, sd/3, sh).x} ${projSeat(sw/2, sd/3, sh).y}`}
                fill="none"
                stroke={strokeCol}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1={projSeat(sw/2, -sd/6, sh + 18).x}
                y1={projSeat(sw/2, -sd/6, sh + 18).y}
                x2={projSeat(sw/2, sd/3, sh + 16).x}
                y2={projSeat(sw/2, sd/3, sh + 16).y}
                stroke="#111"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* 7. Beautiful high-end isometric dimensions indicators */}
          {progress >= 85 && (
            <g>
              {/* Seat Width label (X) */}
              <g opacity={Math.min(1, (progress - 85) / 10)}>
                <path
                  d={`M ${fD.x - 10} ${fD.y + 6} L ${fC.x - 10} ${fC.y + 6}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                  strokeDasharray="2,2"
                />
                <path
                  d={`M ${fD.x - 11} ${fD.y + 3} L ${fD.x - 9} ${fD.y + 9} M ${fC.x - 11} ${fC.y + 3} L ${fC.x - 9} ${fC.y + 9}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                />
                <text
                  x={(fD.x + fC.x) / 2 - 12}
                  y={(fD.y + fC.y) / 2 + 14}
                  className="fill-[#5c3e21] font-sans font-black text-[7.5px] tracking-wide"
                  textAnchor="middle"
                >
                  宽: {selectedChair?.specs[0]?.replace('宽', '') || '52cm'}
                </text>
              </g>

              {/* Seat Depth label (Y) */}
              <g opacity={Math.min(1, (progress - 87) / 10)}>
                <path
                  d={`M ${fC.x + 8} ${fC.y + 4} L ${fB.x + 8} ${fB.y + 4}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                  strokeDasharray="2,2"
                />
                <path
                  d={`M ${fC.x + 6} ${fC.y + 1} L ${fC.x + 10} ${fC.y + 7} M ${fB.x + 6} ${fB.y + 1} L ${fB.x + 10} ${fB.y + 7}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                />
                <text
                  x={(fC.x + fB.x) / 2 + 16}
                  y={(fC.y + fB.y) / 2 + 12}
                  className="fill-[#5c3e21] font-sans font-black text-[7.5px] tracking-wide"
                  textAnchor="middle"
                >
                  深: {selectedChair?.specs[1]?.replace('深', '') || '54cm'}
                </text>
              </g>

              {/* Seat Height label (Z1) */}
              <g opacity={Math.min(1, (progress - 89) / 10)}>
                <path
                  d={`M ${fB.x + 10} ${fB.y} L ${fB.x + 10} ${fB.y - sh}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                  strokeDasharray="2,2"
                />
                <path
                  d={`M ${fB.x + 7} ${fB.y} L ${fB.x + 13} ${fB.y} M ${fB.x + 7} ${fB.y - sh} L ${fB.x + 13} ${fB.y - sh}`}
                  fill="none"
                  stroke="#8c6239"
                  strokeWidth="0.75"
                />
                <text
                  x={fB.x + 18}
                  y={fB.y - sh / 2 + 3}
                  className="fill-[#5c3e21] font-sans font-black text-[7.5px] tracking-wide"
                  textAnchor="start"
                >
                  座高: {selectedChair?.specs[3]?.replace('座高', '') || '43cm'}
                </text>
              </g>

              {/* Angle scale display overlay */}
              <g opacity={Math.min(1, (progress - 91) / 10)}>
                <text
                  x={cx - 100}
                  y={40}
                  className="fill-[#1a1a1a] font-mono text-[8.5px] uppercase tracking-wider font-extrabold"
                  textAnchor="start"
                >
                  MODEL ID: {config.chairId}
                </text>
                <text
                  x={cx - 100}
                  y={50}
                  className="fill-[#666666] font-mono text-[8px] uppercase tracking-widest"
                  textAnchor="start"
                >
                  BACK ANGLE: {config.chairBackrestAngle}°
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DUAL BRANCH: 2. DESK FOCUS BLUEPRINT MODE (ORIGINAL SYSTEM)
  // -------------------------------------------------------------
  const { w, d, h, palette } = useMemo(() => {
    // Width range: 120 - 220. Let's map to screen width 110 - 190 px
    const wScaled = 110 + ((config.width - 120) / 100) * 80;
    // Depth range: 60 - 110. Let's map to screen width 55 - 95 px
    const dScaled = 55 + ((config.depth - 60) / 50) * 40;
    // Height range: 50 - 95. Let's map to screen height 55 - 95 px
    const hScaled = 55 + ((config.height - 50) / 45) * 40;

    const mPalette = CORE_MATERIAL_PALETTE[config.material] || CORE_MATERIAL_PALETTE.oak;

    return {
      w: wScaled,
      d: dScaled,
      h: hScaled,
      palette: mPalette
    };
  }, [config.width, config.depth, config.height, config.material]);

  // Viewport/viewBox dimensions & isometric origin
  const cx = 200;
  const cy = 205; // Slightly offset down to leave space for tabletop descent
  const cos30 = 0.866;
  const sin30 = 0.5;

  // Projection helper for 3D Z-up coordinates to 2D screen coordinates
  const proj = (X: number, Y: number, Z: number) => {
    return {
      x: cx + X * cos30 - Y * cos30,
      y: cy + X * sin30 + Y * sin30 - Z
    };
  };

  // 1. Core floor point coords (Z=0)
  const pFootA = proj(-w / 2, -d / 2, 0); // Back Left
  const pFootB = proj(w / 2, -d / 2, 0);  // Back Right
  const pFootC = proj(w / 2, d / 2, 0);   // Front Right
  const pFootD = proj(-w / 2, d / 2, 0);  // Front Left

  // 2. Extrusions heights based on progress state
  const legProgress = Math.max(0, Math.min(1, (progress - 15) / 35));
  const currentLegH = legProgress * h;

  const pLegTopA = proj(-w / 2, -d / 2, currentLegH);
  const pLegTopB = proj(w / 2, -d / 2, currentLegH);
  const pLegTopC = proj(w / 2, d / 2, currentLegH);
  const pLegTopD = proj(-w / 2, d / 2, currentLegH);

  // Core fully-extended targets for structural frames
  const pFrameA = proj(-w / 2, -d / 2, h);
  const pFrameB = proj(w / 2, -d / 2, h);
  const pFrameC = proj(w / 2, d / 2, h);
  const pFrameD = proj(-w / 2, d / 2, h);

  // Phase 3: Apron frames link the legs (50% - 70% progress)
  const frameProgress = Math.max(0, Math.min(1, (progress - 50) / 20));

  // Phase 4: Slab Tabletop enters, slides, and expands from above (70% - 95%)
  const tabletopProgress = Math.max(0, Math.min(1, (progress - 70) / 25));
  const tabletopSlideY = (1 - tabletopProgress) * 45; // Slides down from 45px above
  const tabletopOpacity = tabletopProgress;
  const boardThickness = 7; // Thickness of the visual slab

  // Tabletop points at Z = h and Z = h + thickness offset by descent
  const projCap = (X: number, Y: number, ZOffset: number) => {
    const raw = proj(X, Y, h + ZOffset);
    return {
      x: raw.x,
      y: raw.y + tabletopSlideY // offset downward during assembly descend
    };
  };

  // Top deck corners of the tabletop slab
  const tA_top = projCap(-w / 2, -d / 2, boardThickness);
  const tB_top = projCap(w / 2, -d / 2, boardThickness);
  const tC_top = projCap(w / 2, d / 2, boardThickness);
  const tD_top = projCap(-w / 2, d / 2, boardThickness);

  // Bottom deck corners of the tabletop slab
  const tA_bot = projCap(-w / 2, -d / 2, 0);
  const tB_bot = projCap(w / 2, -d / 2, 0);
  const tC_bot = projCap(w / 2, d / 2, 0);
  const tD_bot = projCap(-w / 2, d / 2, 0);

  // Point strings for SVG Polygons
  const topFacePoints = `${tA_top.x},${tA_top.y} ${tB_top.x},${tB_top.y} ${tC_top.x},${tC_top.y} ${tD_top.x},${tD_top.y}`;
  const frontLeftPoints = `${tD_bot.x},${tD_bot.y} ${tD_top.x},${tD_top.y} ${tC_top.x},${tC_top.y} ${tC_bot.x},${tC_bot.y}`;
  const frontRightPoints = `${tC_bot.x},${tC_bot.y} ${tC_top.x},${tC_top.y} ${tB_top.x},${tB_top.y} ${tB_bot.x},${tB_bot.y}`;

  return (
    <div id="blueprint-table-container" className="w-full relative flex items-center justify-center p-1">
      <svg
        viewBox="0 0 400 320"
        className="w-full max-w-[340px] md:max-w-[420px] aspect-[4/3.2] overflow-visible"
      >
        {/* 1. Floor grid layout coordinate guides */}
        <g opacity={0.65}>
          {/* Subtle bounding grid box on floor */}
          <polygon
            points={`${pFootA.x},${pFootA.y} ${pFootB.x},${pFootB.y} ${pFootC.x},${pFootC.y} ${pFootD.x},${pFootD.y}`}
            fill="none"
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          {/* Diagnostic cross-lines on the floor */}
          <line
            x1={pFootA.x}
            y1={pFootA.y}
            x2={pFootC.x}
            y2={pFootC.y}
            stroke="rgba(0, 0, 0, 0.05)"
            strokeWidth="0.75"
            strokeDasharray="3,3"
          />
          <line
            x1={pFootB.x}
            y1={pFootB.y}
            x2={pFootD.x}
            y2={pFootD.y}
            stroke="rgba(0, 0, 0, 0.05)"
            strokeWidth="0.75"
            strokeDasharray="3,3"
          />
        </g>

        {/* 2. Calibration dots at the base of the legs */}
        <g>
          {[pFootA, pFootB, pFootC, pFootD].map((pt, i) => {
            const glowActive = progress > 5;
            return (
              <g key={i}>
                {glowActive && (
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    r={6}
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="0.5"
                    initial={{ scale: 0.5, opacity: 0.9 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2}
                  className="fill-[#ab7a4e]"
                  opacity={0.8}
                />
              </g>
            );
          })}
        </g>

        {/* 3. Extruding Vertical Legs (0 to currentLegH) */}
        {progress >= 10 && (
          <g>
            {/* Leg A: Back Left */}
            <line
              x1={pFootA.x}
              y1={pFootA.y}
              x2={pLegTopA.x}
              y2={pLegTopA.y}
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Leg B: Back Right */}
            <line
              x1={pFootB.x}
              y1={pFootB.y}
              x2={pLegTopB.x}
              y2={pLegTopB.y}
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Leg C: Front Right */}
            <line
              x1={pFootC.x}
              y1={pFootC.y}
              x2={pLegTopC.x}
              y2={pLegTopC.y}
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Leg D: Front Left */}
            <line
              x1={pFootD.x}
              y1={pFootD.y}
              x2={pLegTopD.x}
              y2={pLegTopD.y}
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 4. Horizontal connecting aprons / frames */}
        {progress >= 50 && frameProgress > 0 && (
          <g>
            {/* A to B Frame (Back) */}
            <line
              x1={pFrameA.x}
              y1={pFrameA.y}
              x2={pFrameA.x + (pFrameB.x - pFrameA.x) * frameProgress}
              y2={pFrameA.y + (pFrameB.y - pFrameA.y) * frameProgress}
              stroke="#4a5568"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* B to C Frame (Right) */}
            <line
              x1={pFrameB.x}
              y1={pFrameB.y}
              x2={pFrameB.x + (pFrameC.x - pFrameB.x) * frameProgress}
              y2={pFrameB.y + (pFrameC.y - pFrameB.y) * frameProgress}
              stroke="#4a5568"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* C to D Frame (Front) */}
            <line
              x1={pFrameC.x}
              y1={pFrameC.y}
              x2={pFrameC.x + (pFrameD.x - pFrameC.x) * frameProgress}
              y2={pFrameC.y + (pFrameD.y - pFrameC.y) * frameProgress}
              stroke="#4a5568"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* D to A Frame (Left) */}
            <line
              x1={pFrameD.x}
              y1={pFrameD.y}
              x2={pFrameD.x + (pFrameA.x - pFrameD.x) * frameProgress}
              y2={pFrameD.y + (pFrameA.y - pFrameD.y) * frameProgress}
              stroke="#4a5568"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 5. Isometric descension alignment guidelines */}
        {progress >= 65 && tabletopProgress < 1 && (
          <g opacity={1 - tabletopProgress}>
            <line
              x1={pFrameA.x}
              y1={pFrameA.y}
              x2={tA_bot.x}
              y2={tA_bot.y}
              stroke="rgba(171, 122, 78, 0.4)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
            <line
              x1={pFrameB.x}
              y1={pFrameB.y}
              x2={tB_bot.x}
              y2={tB_bot.y}
              stroke="rgba(171, 122, 78, 0.4)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
            <line
              x1={pFrameC.x}
              y1={pFrameC.y}
              x2={tC_bot.x}
              y2={tC_bot.y}
              stroke="rgba(171, 122, 78, 0.4)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
            <line
              x1={pFrameD.x}
              y1={pFrameD.y}
              x2={tD_bot.x}
              y2={tD_bot.y}
              stroke="rgba(171, 122, 78, 0.4)"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
          </g>
        )}

        {/* 6. Solid-volume Tabletop Slab (Descends & locks) */}
        {progress >= 70 && tabletopOpacity > 0 && (
          <g opacity={tabletopOpacity}>
            {/* Bottom Face (under-belly of the deck) */}
            <polygon
              points={`${tA_bot.x},${tA_bot.y} ${tB_bot.x},${tB_bot.y} ${tC_bot.x},${tC_bot.y} ${tD_bot.x},${tD_bot.y}`}
              fill="rgba(0, 0, 0, 0.05)"
              stroke={palette.stroke}
              strokeWidth="0.5"
            />
            
            {/* Front Left Thickness Panel */}
            <polygon
              points={frontLeftPoints}
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            
            {/* Front Right Thickness Panel */}
            <polygon
              points={frontRightPoints}
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            
            {/* Main Top Deck Facet */}
            <polygon
              points={topFacePoints}
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Schematic design grid lines on the table surface for hi-tech CAD vibe */}
            <line
              x1={(tA_top.x + tD_top.x) / 2}
              y1={(tA_top.y + tD_top.y) / 2}
              x2={(tB_top.x + tC_top.x) / 2}
              y2={(tB_top.y + tC_top.y) / 2}
              stroke={palette.stroke}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity={0.6}
            />
            <line
              x1={(tA_top.x + tB_top.x) / 2}
              y1={(tA_top.y + tB_top.y) / 2}
              x2={(tD_top.x + tC_top.x) / 2}
              y2={(tD_top.y + tC_top.y) / 2}
              stroke={palette.stroke}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity={0.6}
            />
          </g>
        )}

        {/* 7. Paired Chairs in Isometric Blueprint */}
        {progress >= 60 && config.chairId && config.chairCount && config.chairCount > 0 && (
          <g>
            {(() => {
              const list: { x: number; y: number; rotY: number }[] = [];
              const count = config.chairCount;

              const tz = d / 2 + 18;
              const tx = w / 2 + 20;

              if (count === 1) {
                list.push({ x: 0, y: tz, rotY: 0 });
              } else if (count === 2) {
                list.push({ x: 0, y: tz, rotY: 0 });
                list.push({ x: 0, y: -tz, rotY: Math.PI });
              } else if (count === 4) {
                const spacing = Math.min(w * 0.25, 30);
                list.push({ x: -spacing, y: tz, rotY: 0 });
                list.push({ x: spacing, y: tz, rotY: 0 });
                list.push({ x: -spacing, y: -tz, rotY: Math.PI });
                list.push({ x: spacing, y: -tz, rotY: Math.PI });
              } else if (count === 6 || count === 8) {
                const spacing = Math.min(w * 0.32, 45);
                list.push({ x: -spacing, y: tz, rotY: 0 });
                list.push({ x: 0, y: tz, rotY: 0 });
                list.push({ x: spacing, y: tz, rotY: 0 });
                list.push({ x: -spacing, y: -tz, rotY: Math.PI });
                list.push({ x: 0, y: -tz, rotY: Math.PI });
                list.push({ x: spacing, y: -tz, rotY: Math.PI });
                if (count === 8) {
                  list.push({ x: -tx, y: 0, rotY: -Math.PI / 2 });
                  list.push({ x: tx, y: 0, rotY: Math.PI / 2 });
                }
              }

              return list.map((ch, idx) => {
                const sh = h * 0.52; // seat height
                const sw = 10;
                const sd = 10;
                
                // Seat corners in local space of chair
                const localCorners = [
                  [-sw/2, -sd/2],
                  [sw/2, -sd/2],
                  [sw/2, sd/2],
                  [-sw/2, sd/2]
                ];
                
                // Rotate and translate to table space
                const cosR = Math.cos(ch.rotY);
                const sinR = Math.sin(ch.rotY);
                
                const worldCorners = localCorners.map(([lx, ly]) => {
                  const rx = lx * cosR - ly * sinR;
                  const ry = lx * sinR + ly * cosR;
                  return { x: rx + ch.x, y: ry + ch.y };
                });

                // Project seat corners to 2D screen
                const sA = proj(worldCorners[0].x, worldCorners[0].y, sh);
                const sB = proj(worldCorners[1].x, worldCorners[1].y, sh);
                const sC = proj(worldCorners[2].x, worldCorners[2].y, sh);
                const sD = proj(worldCorners[3].x, worldCorners[3].y, sh);

                // Floor leg points (touch floor underneath seat corners, slightly flared)
                const worldFloor = localCorners.map(([lx, ly]) => {
                  const rx = (lx * 1.25) * cosR - (ly * 1.25) * sinR;
                  const ry = (lx * 1.25) * sinR + (ly * 1.25) * cosR;
                  return { x: rx + ch.x, y: ry + ch.y };
                });
                const fA = proj(worldFloor[0].x, worldFloor[0].y, 0);
                const fB = proj(worldFloor[1].x, worldFloor[1].y, 0);
                const fC = proj(worldFloor[2].x, worldFloor[2].y, 0);
                const fD = proj(worldFloor[3].x, worldFloor[3].y, 0);

                // Backrest peaks
                let backHeightEdge = 12;
                let peakOffsetLeft = -sw/2;
                let peakOffsetRight = sw/2;

                if (config.chairId === 'CY-A4') {
                  backHeightEdge = 16; 
                } else if (config.chairId === 'CY-A2') {
                  backHeightEdge = 15; 
                }

                const localBackTop = [
                  [peakOffsetLeft, -sd/2, backHeightEdge],
                  [peakOffsetRight, -sd/2, backHeightEdge]
                ];

                const worldBackTop = localBackTop.map(([lx, ly, lz]) => {
                  const rx = lx * cosR - ly * sinR;
                  const ry = lx * sinR + ly * cosR;
                  return { x: rx + ch.x, y: ry + ch.y, z: sh + lz };
                });

                const bLeft = proj(worldBackTop[0].x, worldBackTop[0].y, worldBackTop[0].z);
                const bRight = proj(worldBackTop[1].x, worldBackTop[1].y, worldBackTop[1].z);

                const isMArch = config.chairId === 'CY-A7' || config.chairId === 'CY-A4';
                const bCenter = isMArch ? proj(ch.x, -sd/2 * cosR + ch.y, sh + backHeightEdge * 0.7) : null;

                return (
                  <g key={idx} opacity={Math.min(1, (progress - 60) / 25)}>
                    {/* Floor Legs */}
                    <line x1={fA.x} y1={fA.y} x2={sA.x} y2={sA.y} stroke="#000000" strokeWidth="0.65" />
                    <line x1={fB.x} y1={fB.y} x2={sB.x} y2={sB.y} stroke="#000000" strokeWidth="0.65" />
                    <line x1={fC.x} y1={fC.y} x2={sC.x} y2={sC.y} stroke="#000000" strokeWidth="0.65" />
                    <line x1={fD.x} y1={fD.y} x2={sD.x} y2={sD.y} stroke="#000000" strokeWidth="0.65" />

                    {/* Seat flat plate */}
                    <polygon
                      points={`${sA.x},${sA.y} ${sB.x},${sB.y} ${sC.x},${sC.y} ${sD.x},${sD.y}`}
                      fill="rgba(0,0,0,0.04)"
                      stroke="#000000"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />

                    {/* Backrest */}
                    {isMArch && bCenter ? (
                      <polygon
                        points={`${sA.x},${sA.y} ${bLeft.x},${bLeft.y} ${bCenter.x},${bCenter.y} ${bRight.x},${bRight.y} ${sB.x},${sB.y}`}
                        fill="none"
                        stroke="#000"
                        strokeWidth="0.8"
                        strokeLinejoin="round"
                        strokeDasharray="2,2"
                      />
                    ) : (
                      <polygon
                        points={`${sA.x},${sA.y} ${bLeft.x},${bLeft.y} ${bRight.x},${bRight.y} ${sB.x},${sB.y}`}
                        fill="none"
                        stroke="#000"
                        strokeWidth="0.8"
                        strokeLinejoin="round"
                        strokeDasharray="2,2"
                      />
                    )}
                  </g>
                );
              });
            })()}
          </g>
        )}

        {/* 8. High-end dynamic dimension labels */}
        {progress >= 85 && (
          <g>
            {/* Width Dimension Indicator Line */}
            <g opacity={Math.min(1, (progress - 85) / 10)}>
              <path
                d={`M ${pFootD.x - 10} ${pFootD.y + 5} L ${pFootC.x - 10} ${pFootC.y + 5}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <path
                d={`M ${pFootD.x - 10} ${pFootD.y + 2} L ${pFootD.x - 10} ${pFootD.y + 8} M ${pFootC.x - 10} ${pFootC.y + 2} L ${pFootC.x - 10} ${pFootC.y + 8}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
              />
              <text
                x={(pFootD.x + pFootC.x) / 2 - 10}
                y={(pFootD.y + pFootC.y) / 2 + 15}
                className="fill-[#5c3e21] font-sans font-bold text-[8px] tracking-wide"
                textAnchor="middle"
              >
                X: {config.width}cm
              </text>
            </g>

            {/* Depth Dimension Indicator Line */}
            <g opacity={Math.min(1, (progress - 87) / 10)}>
              <path
                d={`M ${pFootC.x + 10} ${pFootC.y + 5} L ${pFootB.x + 10} ${pFootB.y + 5}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <path
                d={`M ${pFootC.x + 10} ${pFootC.y + 2} L ${pFootC.x + 10} ${pFootC.y + 8} M ${pFootB.x + 10} ${pFootB.y + 2} L ${pFootB.x + 10} ${pFootB.y + 8}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
              />
              <text
                x={(pFootC.x + pFootB.x) / 2 + 20}
                y={(pFootC.y + pFootB.y) / 2 + 13}
                className="fill-[#5c3e21] font-sans font-bold text-[8px] tracking-wide"
                textAnchor="middle"
              >
                Y: {config.depth}cm
              </text>
            </g>

            {/* Height Vertical Dimension Line */}
            <g opacity={Math.min(1, (progress - 89) / 10)}>
              <path
                d={`M ${pFootB.x + 12} ${pFootB.y} L ${pFootB.x + 12} ${pFootB.y - h}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <path
                d={`M ${pFootB.x + 9} ${pFootB.y} L ${pFootB.x + 15} ${pFootB.y} M ${pFootB.x + 9} ${pFootB.y - h} L ${pFootB.x + 15} ${pFootB.y - h}`}
                fill="none"
                stroke="#8c6239"
                strokeWidth="0.75"
              />
              <text
                x={pFootB.x + 28}
                y={pFootB.y - h / 2 + 3}
                className="fill-[#5c3e21] font-sans font-bold text-[8px] tracking-wide"
                textAnchor="start"
              >
                Z: {config.height}cm
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
