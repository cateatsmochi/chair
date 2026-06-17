
import { TableConfig } from '../types';
import { CHAIR_LIBRARY } from '../data/chairs';

export const calculateSingleChairPrice = (config: TableConfig) => {
  // 初始椅子8200
  let price = 8200;

  // 加扶手+2000
  if (config.chairHasArmrest) {
    price += 2000;
  }

  const mat = config.chairMaterial || 'titanium';

  // 换表面材质+2000（木/布）
  if (mat === 'wood' || mat === 'fabric') {
    price += 2000;
  }

  // 换颜色（仅钛合金）+1000
  if (mat === 'titanium') {
    const isOriginalColor = !config.color || config.color === '#original' || config.color === 'original' || config.color === '#ffffff';
    if (!isOriginalColor) {
      price += 1000;
    }
  }

  return price;
};

export const calculatePrice = (config: TableConfig) => {
  // If we are showing only the chair (table is hidden/removed)
  if (config.chairId && !config.showTable) {
    return calculateSingleChairPrice(config);
  }

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
  
  let chairsCost = 0;
  if (config.chairId && config.chairCount && config.chairCount > 0) {
    chairsCost = calculateSingleChairPrice(config) * config.chairCount;
  }
  
  return Math.round(tableTotal + chairsCost);
};
