"use client";

import React from "react";

export interface FunnelStageData {
  name: string;
  count: number;
  conversion: string;
}

export function FunnelChart({ data }: { data: FunnelStageData[] }) {
  const SvgWidth = 1000;
  const SvgHeight = 180;
  
  if (!data || data.length === 0) return null;

  const segmentWidth = SvgWidth / data.length;
  
  const maxCount = data[0].count || 1;
  const rawHeights = data.map(s => {
    const ratio = s.count / maxCount;
    return Math.max(20, ratio * SvgHeight);
  });

  let topPath = `M 0,0`;
  for (let i = 0; i < data.length - 1; i++) {
    const startX = segmentWidth * i + segmentWidth / 2;
    const endX = segmentWidth * (i + 1) + segmentWidth / 2;
    const startH = rawHeights[i];
    const endH = rawHeights[i + 1];
    
    const cp1x = startX + (endX - startX) * 0.5;
    const cp2x = startX + (endX - startX) * 0.5;

    topPath += ` C ${cp1x},${(SvgHeight - startH)/2} ${cp2x},${(SvgHeight - endH)/2} ${endX},${(SvgHeight - endH)/2}`;
  }
  topPath += ` L ${SvgWidth},${(SvgHeight - rawHeights[data.length - 1]) / 2}`;

  let bottomPath = ` L ${SvgWidth},${(SvgHeight + rawHeights[data.length - 1]) / 2}`;
  for (let i = data.length - 2; i >= 0; i--) {
     const startX = segmentWidth * (i + 1) + segmentWidth / 2;
     const endX = segmentWidth * i + segmentWidth / 2;
     const startH = rawHeights[i + 1];
     const endH = rawHeights[i];
     
     const cp1x = startX - (startX - endX) * 0.5;
     const cp2x = startX - (startX - endX) * 0.5;

     bottomPath += ` C ${cp1x},${(SvgHeight + startH)/2} ${cp2x},${(SvgHeight + endH)/2} ${endX},${(SvgHeight + endH)/2}`;
  }
  bottomPath += ` L 0,${SvgHeight} Z`;

  const fullPath = topPath + bottomPath;

  return (
    <div className="w-full relative py-0">
      <div className="bg-secondary/30 rounded-xl overflow-hidden pt-4 pb-4 border border-border/30">
      
        {/* Header */}
        <div className="flex w-full px-[5%] mb-4 text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
          {data.map((s, i) => (
             <div key={i} className={`flex-1 ${i===0? 'text-left pl-4' : 'text-center'} ${i===data.length-1? 'text-right pr-4' : ''}`}>
               {s.name}
             </div>
          ))}
        </div>
        
        {/* Funnel Graph */}
        <div className="relative w-full overflow-hidden px-[5%] h-[120px]">
          <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} className="absolute inset-0 w-full h-full px-[5%]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff7a59" />
                <stop offset="50%" stopColor="#f5a623" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d={fullPath} fill="url(#funnelGrad)" />
            
            {/* Overlay texts */}
            {data.map((s, i) => {
               const x = i === 0 ? segmentWidth/4 : (segmentWidth * i + segmentWidth/2);
               const textX = i === 0 ? 50 : (i === data.length - 1 ? SvgWidth - 40 : x);
               return (
                  <text key={`text-${i}`} x={textX} y={SvgHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontWeight="bold" fontSize="18px">
                    {s.conversion}
                  </text>
               )
            })}
          </svg>
          
          {/* Vertical dividers passing through exact slices */}
          <div className="absolute inset-0 flex px-[5%] pointer-events-none">
             {data.map((_, i) => {
                if (i === data.length - 1) return null;
                return (
                   <div key={`d-${i}`} className="flex-1 border-r border-border/30 h-full opacity-60"></div>
                )
             })}
          </div>
        </div>

        {/* Footer Numbers */}
        <div className="flex w-full px-[5%] mt-4 text-foreground font-bold text-sm">
           {data.map((s, i) => (
              <div key={`count-${i}`} className={`flex-1 ${i===0? 'text-left pl-8' : 'text-center'} ${i===data.length-1? 'text-right pr-6' : ''}`}>
                {s.count}
              </div>
           ))}
        </div>
        
      </div>
    </div>
  )
}
