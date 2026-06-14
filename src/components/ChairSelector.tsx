import React from 'react';
import { CHAIR_LIBRARY, ChairInfo } from '../data/chairs';
import { clsx } from 'clsx';
import { Check, Armchair, HelpCircle, Grid } from 'lucide-react';

interface ChairSelectorProps {
  selectedChairId: string | null;
  chairCount: number;
  onSelectChair: (id: string | null) => void;
  onChangeCount: (count: number) => void;
  selectedChairMaterial?: 'titanium' | 'wood' | 'fabric';
  onChangeMaterial?: (material: 'titanium' | 'wood' | 'fabric') => void;
  isMobile?: boolean;
  showTable?: boolean;
  onToggleShowTable?: (show: boolean) => void;
  onOpenShowroom?: () => void;
}

export function ChairSelector({
  selectedChairId,
  chairCount,
  onSelectChair,
  onChangeCount,
  selectedChairMaterial = 'titanium',
  onChangeMaterial,
  isMobile,
  showTable = true,
  onToggleShowTable,
  onOpenShowroom
}: ChairSelectorProps) {
  const activeChair = CHAIR_LIBRARY.find(c => c.id === selectedChairId);

  return (
    <div className="space-y-4 pt-4 border-t border-dashed border-gray-300">
      {/* Panel Header */}
      <div className="flex justify-between items-end">
        <div>
          <label className="font-mono text-[10.5px] font-black uppercase text-black block tracking-wider">
            Pairing Studio / 珍选配椅选择库
          </label>
          <span className="text-[7.5px] text-gray-400 font-mono uppercase block mt-0.5 tracking-widest">
            SYS_ROB_PAIR: {activeChair ? `${activeChair.id} ACTIVE` : 'NONE'}
          </span>
        </div>
        {onOpenShowroom ? (
          <button
            type="button"
            onClick={onOpenShowroom}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white hover:bg-purple-700 active:scale-95 text-[8.5px] font-black tracking-wider uppercase shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.2)] border border-purple-800 shrink-0"
          >
            <Grid size={10} />
            全景展库
          </button>
        ) : (
          <Armchair size={13} className="text-zinc-650" />
        )}
      </div>

      {/* Grid of 7 Curated Chairs */}
      <div className="grid grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1 select-none custom-scrollbar pb-1">
        {/* "None" Option to deselect */}
        <div
          onClick={() => {
            onSelectChair(null);
            onChangeCount(0);
          }}
          className={clsx(
            "cursor-pointer border p-2 flex flex-col justify-between group transition-all text-left",
            !selectedChairId
              ? "bg-[#000000] text-[#ffffff] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
              : "bg-white border-zinc-250 text-black hover:border-zinc-900 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
          )}
        >
          <div className="space-y-1">
            <div className="flex justify-between items-start">
              <span className="font-sans font-black text-[9px] tracking-wide uppercase leading-none block">
                不配置桌椅
              </span>
              {!selectedChairId && <Check size={10} className="text-[#ffffff]" />}
            </div>
            <span className="text-[7px] opacity-60 font-mono tracking-widest leading-none block uppercase">
              NO_PAIRING
            </span>
          </div>
          <div className="pt-4 border-t border-dashed border-zinc-150 group-hover:border-zinc-300 mt-2 flex justify-between items-center">
            <span className="text-[7px] font-mono opacity-50 font-bold">QTY: 0</span>
            <span className="text-[10px] font-mono font-black">¥0</span>
          </div>
        </div>

        {/* The 7 Chairs */}
        {CHAIR_LIBRARY.map((item) => {
          const isSelected = selectedChairId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectChair(item.id);
                // Default to 2 chairs if count was 0
                if (chairCount === 0) {
                  onChangeCount(2);
                }
              }}
              className={clsx(
                "cursor-pointer border p-2 flex flex-col justify-between group transition-all text-left relative overflow-hidden",
                isSelected
                  ? "bg-[#000000] text-[#ffffff] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                  : "bg-white border-zinc-250 text-black hover:border-zinc-900 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
              )}
            >
              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className={clsx(
                      "font-sans font-black text-[9px] tracking-wide uppercase leading-tight line-clamp-1 block",
                      isSelected ? "text-white" : "text-black"
                    )}>
                      {item.name.replace('CY ', '')}
                    </span>
                    {isSelected && <Check size={10} className="text-[#ffffff] shrink-0" />}
                  </div>
                  <span className="text-[7px] text-zinc-400 font-mono block uppercase leading-none mt-0.5">
                    {item.id}
                  </span>
                </div>

                {/* Highly Scalable Miniature CAD View */}
                <div className={clsx(
                  "aspect-[4/2.5] my-1 border flex items-center justify-center relative p-1 transition-colors overflow-hidden",
                  isSelected ? "bg-white border-zinc-700" : "bg-zinc-50 border-zinc-100 group-hover:bg-zinc-100"
                )}>
                  {/* Subtle draft coordinate matrix background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#efefef_1px,transparent_1px),linear-gradient(to_bottom,#efefef_1px,transparent_1px)] bg-[size:6px_6px] opacity-40 pointer-events-none" />
                  
                  {/* SVG Blueprint line sketch of the precise chair profile */}
                  <svg
                    viewBox="0 0 80 80"
                    className={clsx(
                      "w-4/5 h-4/5 overflow-visible",
                      isSelected ? "text-black filter drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]" : "text-zinc-650"
                    )}
                  >
                    <path
                      d={item.svgPath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Quick specs lines */}
                <div className="text-[6.5px] opacity-75 font-mono leading-none flex gap-1 items-center overflow-hidden">
                  <span className="rounded-none bg-zinc-100 group-hover:bg-zinc-200 text-zinc-700 px-1 py-0.2 uppercase border border-zinc-200">
                    {item.material.toUpperCase()}
                  </span>
                  <span className="truncate max-w-[50px]">{item.specs[0]}</span>
                </div>
              </div>

              {/* Price and Action Footer */}
              <div className={clsx(
                "pt-1.5 border-t border-dashed mt-2 flex justify-between items-baseline shrink-0",
                isSelected ? "border-zinc-800" : "border-zinc-100"
              )}>
                <span className="text-[6.5px] font-mono opacity-50 font-bold">CNY (单价)</span>
                <span className="text-[10px] font-mono font-extrabold">¥{item.price.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Quantity Controller */}
      {selectedChairId && activeChair && (
        <div className="p-2.5 bg-zinc-50 border border-zinc-200 shadow-[inset_1px_1px_0px_#ffffff] space-y-2">
          {/* Active specifications summary */}
          <div className="text-[8.5px] font-mono leading-relaxed space-y-0.5 pb-2 border-b border-zinc-200/50">
            <span className="font-extrabold text-black uppercase block tracking-wider text-[7.5px]" style={{ color: '#8b5e3c' }}>
              ✦ ACTIVE_PAIRING_DETAILS
            </span>
            <div className="flex justify-between">
              <span className="text-gray-400">工艺材质:</span>
              <span className="text-zinc-900 font-bold uppercase">
                {selectedChairMaterial === 'wood' 
                  ? '高端科技木纹 (参考图1)' 
                  : selectedChairMaterial === 'fabric' 
                  ? '极光彩虹科技布 (参考图2)' 
                  : '原厂钛合金 (初始模型)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">标准规格:</span>
              <span className="text-zinc-900 font-bold">{activeChair.specs.join(' / ')}</span>
            </div>
            <span className="text-zinc-450 block text-[7px] leading-tight font-light mt-1">
              * {activeChair.desc}
            </span>
          </div>

          {/* Bundle count picker */}
          <div className="flex justify-between items-center pt-0.5">
            <span className="font-mono text-[9px] font-bold uppercase text-zinc-900">
              配置椅群数量 / QTY:
            </span>

            {/* Step Selection Button (0, 1, 2, 4, 6, 8) */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 4, 6, 8].map((countVal) => (
                <button
                  key={countVal}
                  type="button"
                  onClick={() => {
                    if (countVal === 0) {
                      onSelectChair(null);
                      onChangeCount(0);
                    } else {
                      onChangeCount(countVal);
                    }
                  }}
                  className={clsx(
                    "w-6 h-6 flex items-center justify-center font-mono text-[9px] font-black border transition-all active:scale-95",
                    chairCount === countVal
                      ? "bg-black text-white border-black shadow-[1px_1px_0px_rgba(0,0,0,0.15)] scale-110"
                      : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
                  )}
                >
                  {countVal === 0 ? "0" : `${countVal}`}
                </button>
              ))}
            </div>
          </div>

          {/* Chair Material Customizer Section */}
          <div className="pt-2 border-t border-dashed border-zinc-200 space-y-1">
            <span className="font-mono text-[8.5px] font-bold uppercase text-zinc-900 block">
              配椅定制材质 / CHAIR MATERIAL:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'titanium', label: '钛合金', desc: '初始模型' },
                { id: 'wood', label: '科技木', desc: '参考图1' },
                { id: 'fabric', label: '科技布', desc: '参考图2' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeMaterial?.(m.id as 'titanium' | 'wood' | 'fabric')}
                  className={clsx(
                    "py-1 px-1 text-center border transition-all active:scale-95 flex flex-col items-center justify-center",
                    selectedChairMaterial === m.id
                      ? "bg-black text-white border-black shadow-[1px_1px_0px_rgba(0,0,0,0.15)] scale-102"
                      : "bg-white text-zinc-900 border-zinc-250 hover:border-black shadow-[1px_1px_0px_rgba(0,0,0,0.05)]"
                  )}
                >
                  <span className="text-[9.5px] font-black leading-tight">{m.label}</span>
                  <span className="text-[6px] opacity-75 leading-none mt-0.5 font-mono uppercase">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table display toggle option */}
          {onToggleShowTable && (
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200">
              <span className="font-mono text-[8.5px] font-bold uppercase text-zinc-900">
                同时显示餐桌 / Show Table:
              </span>
              <button
                type="button"
                onClick={() => onToggleShowTable(!showTable)}
                className={clsx(
                  "px-2 py-0.5 font-mono text-[8px] font-black border transition-all active:scale-95",
                  showTable
                    ? "bg-[#000000] text-white border-black"
                    : "bg-white text-zinc-450 border-zinc-250 hover:border-black"
                )}
              >
                {showTable ? "ACTIVE (显示)" : "HIDDEN (隐藏)"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
