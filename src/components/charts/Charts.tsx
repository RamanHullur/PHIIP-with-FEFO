import React, { useState } from 'react';

// 1. Donut / Ring Chart
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}> = ({ data, size = 180, strokeWidth = 26, centerLabel, centerSub }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {data.map((seg, idx) => {
            const percent = seg.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            {hoveredIdx !== null ? data[hoveredIdx].value.toLocaleString() : centerLabel || total.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerSub || 'Total'}
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
        {data.map((seg, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 rounded transition ${hoveredIdx === idx ? 'bg-slate-100 font-semibold' : 'text-slate-600'}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}</span>
            <span className="text-slate-400 font-mono">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Horizontal Bar Chart for Top Risks & Comparisons
export interface BarItem {
  label: string;
  subLabel?: string;
  value: number;
  secondaryValue?: number;
  maxValue?: number;
  color?: string;
  valueFormat?: (v: number) => string;
}

export const HorizontalBarList: React.FC<{
  items: BarItem[];
  maxVal?: number;
}> = ({ items, maxVal }) => {
  const highest = maxVal || Math.max(...items.map(i => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const percent = Math.min(100, Math.max(4, Math.round((item.value / highest) * 100)));
        const color = item.color || '#3b82f6';
        const formatted = item.valueFormat ? item.valueFormat(item.value) : item.value.toLocaleString();

        return (
          <div key={idx} className="group">
            <div className="flex justify-between items-baseline text-xs mb-1">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className="font-medium text-slate-700 truncate">{item.label}</span>
                {item.subLabel && <span className="text-slate-400 text-[10px]">({item.subLabel})</span>}
              </div>
              <span className="font-semibold text-slate-800 font-mono">{formatted}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Multi-point Trend / Area Chart for 60-day consumption history
export const SparklineAreaChart: React.FC<{
  data: { date: string; value: number }[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}> = ({ data, height = 80, strokeColor = '#0284c7', fillColor = '#e0f2fe' }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-4 text-center">No trend data</div>;
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const range = max - min || 1;

  const width = 300;
  const paddingY = 8;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - paddingY - ((d.value - min) / range) * (height - 2 * paddingY);
    return `${x},${y}`;
  });

  const pathD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  const lineD = `M ${points.join(' L ')}`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={pathD} fill="url(#trendGradient)" />
        <path d={lineD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
        <span>{data[0]?.date}</span>
        <span>Avg: {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}/day</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};
