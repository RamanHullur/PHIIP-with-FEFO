import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  Layers,
  CircleDot,
  LayoutGrid,
  Gauge,
  Sparkles,
  Info,
} from 'lucide-react';

// Common Chart Types
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export type ChartRepresentationStyle =
  | 'donut'
  | 'columns'
  | 'meter'
  | 'concentric'
  | 'treemap'
  | 'gauge';

// 1. Enhanced Donut / Ring Chart
export const DonutChart: React.FC<{
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
  valuePrefix?: string;
}> = ({ data, size = 185, strokeWidth = 24, centerLabel, centerSub, valuePrefix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 overflow-visible transition-all duration-300"
        >
          {/* Subtle Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            className="transition-colors"
          />

          {/* Slices */}
          {data.map((seg, idx) => {
            const percent = seg.value / total;
            const strokeDasharray = `${Math.max(1, percent * circumference - 2)} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;
            const opacity = isAnyHovered ? (isHovered ? 1 : 0.45) : 0.95;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity,
                  filter: isHovered
                    ? `drop-shadow(0 4px 10px ${seg.color}66)`
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))',
                  transformOrigin: '50% 50%',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Central Summary Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-xl font-black text-slate-900 tracking-tight font-mono transition-all duration-200">
            {hoveredIdx !== null
              ? `${valuePrefix}${data[hoveredIdx].value.toLocaleString()}`
              : centerLabel || `${valuePrefix}${total.toLocaleString()}`}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1 mt-0.5">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerSub || 'Total'}
          </span>
          {hoveredIdx !== null && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full text-white mt-1 shadow-2xs"
              style={{ backgroundColor: data[hoveredIdx].color }}
            >
              {Math.round((data[hoveredIdx].value / total) * 100)}% share
            </span>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-xs max-h-[90px] overflow-y-auto px-1 w-full">
        {data.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          const pct = Math.round((seg.value / total) * 100);
          return (
            <button
              key={idx}
              type="button"
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg transition text-left border ${
                isHovered
                  ? 'bg-slate-100/90 border-slate-300 font-bold shadow-2xs'
                  : 'bg-white/70 border-transparent hover:bg-slate-50 text-slate-600'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                style={{
                  backgroundColor: seg.color,
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              <span className="text-[11px] truncate max-w-[110px] text-slate-800">{seg.label}</span>
              <span className="text-slate-400 font-mono text-[10px] font-semibold">({pct}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 2. Concentric Radial Rings Chart (Multi-Ring Target / Apple Health style)
export const ConcentricRadialChart: React.FC<{
  data: DonutSegment[];
  size?: number;
  valuePrefix?: string;
}> = ({ data, size = 200, valuePrefix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  const ringCount = Math.min(data.length, 6);
  const strokeWidth = 10;
  const gap = 5;
  const center = size / 2;
  const startRadius = center - strokeWidth - 6;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.slice(0, ringCount).map((seg, idx) => {
            const ringRadius = startRadius - idx * (strokeWidth + gap);
            if (ringRadius <= 10) return null;
            const ringCircumference = 2 * Math.PI * ringRadius;
            const ratio = seg.value / maxVal;
            const dashLength = Math.max(3, ratio * ringCircumference);
            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx}>
                {/* Background Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={ringRadius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />
                {/* Active Sweeping Arc */}
                <circle
                  cx={center}
                  cy={center}
                  r={ringRadius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${dashLength} ${ringCircumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 2px 6px ${seg.color}88)` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredIdx !== null ? (
            <>
              <span className="text-base font-black text-slate-900 font-mono">
                {valuePrefix}{data[hoveredIdx].value.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[110px]">
                {data[hoveredIdx].label}
              </span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded text-white mt-0.5"
                style={{ backgroundColor: data[hoveredIdx].color }}
              >
                {Math.round((data[hoveredIdx].value / total) * 100)}% of total
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Radial Bands</span>
              <span className="text-sm font-black text-slate-800 font-mono">
                {data.length} Classes
              </span>
              <span className="text-[10px] text-slate-400">Hover ring to inspect</span>
            </>
          )}
        </div>
      </div>

      {/* Ring Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-xs max-h-[90px] overflow-y-auto px-1 w-full">
        {data.slice(0, ringCount).map((seg, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition ${
              hoveredIdx === idx ? 'bg-slate-100 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] truncate max-w-[100px]">{seg.label}</span>
            <span className="text-slate-400 font-mono text-[10px]">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Semi-Circle Clinical Gauge Meter (Speedometer style for Risk Scores & Capacities)
export const SemiCircleGaugeChart: React.FC<{
  data: DonutSegment[];
  currentScore?: number;
  size?: number;
  valuePrefix?: string;
}> = ({ data, currentScore, size = 210, valuePrefix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  // Derive score if not provided: weighted index
  const calculatedScore = React.useMemo(() => {
    if (typeof currentScore === 'number') return currentScore;
    // Assume 4 tiers: Low=15, Med=45, High=70, Crit=90
    const weightMap: Record<string, number> = {
      Low: 15,
      Medium: 45,
      High: 70,
      Critical: 90,
    };
    let weightedSum = 0;
    data.forEach(d => {
      const matchKey = Object.keys(weightMap).find(k => d.label.toLowerCase().includes(k.toLowerCase()));
      const weight = matchKey ? weightMap[matchKey] : 50;
      weightedSum += d.value * weight;
    });
    return Math.round(weightedSum / total);
  }, [currentScore, data, total]);

  // Semi-circle math: 180 degrees arc
  const strokeWidth = 20;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const arcLength = Math.PI * radius; // Half circumference

  let accumulatedPercent = 0;

  // Needle angle: from -180 deg (left) to 0 deg (right)
  const scorePercent = Math.min(100, Math.max(0, calculatedScore)) / 100;
  const needleAngle = -180 + scorePercent * 180;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.65 }}>
        <svg width={size} height={size * 0.65} className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Segmented Color Arcs */}
          {data.map((seg, idx) => {
            const percent = seg.value / total;
            const segLength = percent * arcLength;
            const strokeDasharray = `${Math.max(1, segLength - 2)} ${arcLength * 2}`;
            const strokeDashoffset = -accumulatedPercent * arcLength;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <path
                key={idx}
                d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                style={{
                  filter: isHovered ? `drop-shadow(0 2px 6px ${seg.color}aa)` : 'none',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* Needle / Pointer */}
          <g
            transform={`translate(${center}, ${center}) rotate(${needleAngle})`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="0"
              y1="0"
              x2={radius - 6}
              y2="0"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="6" fill="#0f172a" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          </g>
        </svg>

        {/* Center Gauge Reading */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
            <span>{calculatedScore}</span>
            <span className="text-xs font-bold text-slate-400">/100</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {calculatedScore >= 80
              ? 'Critical Exposure'
              : calculatedScore >= 60
              ? 'High Caution'
              : calculatedScore >= 30
              ? 'Moderate Risk'
              : 'Controlled Baseline'}
          </div>
        </div>
      </div>

      {/* Zone Pills & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full mt-4">
        {data.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                isHovered
                  ? 'bg-slate-50 border-slate-400 shadow-2xs'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-[10px] font-bold text-slate-700 truncate">{seg.label.split(' ')[0]}</span>
              </div>
              <div className="font-mono font-bold text-xs text-slate-900">
                {valuePrefix}{seg.value.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. Horizontal Segmented Meter / Continuous Progress Bar
export const SegmentedMeterChart: React.FC<{
  data: DonutSegment[];
  valuePrefix?: string;
}> = ({ data, valuePrefix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="space-y-4 w-full">
      {/* Continuous Segmented Bar */}
      <div>
        <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200/60 p-0.5">
          {data.map((seg, idx) => {
            const percent = (seg.value / total) * 100;
            if (percent < 0.5) return null;
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  width: `${percent}%`,
                  backgroundColor: seg.color,
                }}
                className={`h-full transition-all duration-300 cursor-pointer first:rounded-l-lg last:rounded-r-lg ${
                  isHovered ? 'brightness-110 scale-y-110 shadow-sm' : 'hover:opacity-90'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                title={`${seg.label}: ${valuePrefix}${seg.value.toLocaleString()} (${Math.round(percent)}%)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 px-1">
          <span>0%</span>
          <span>Proportional Share</span>
          <span>100%</span>
        </div>
      </div>

      {/* Proportional breakdown list */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {data.map((seg, idx) => {
          const percent = Math.round((seg.value / total) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-between text-xs border ${
                isHovered ? 'bg-slate-50 border-slate-300 shadow-2xs' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="font-semibold text-slate-800 text-[11px] truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {valuePrefix}{seg.value.toLocaleString()}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: seg.color }}
                >
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. Vertical Column Bar Chart
export const VerticalColumnChart: React.FC<{
  data: DonutSegment[];
  valuePrefix?: string;
}> = ({ data, valuePrefix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="space-y-3 w-full">
      {/* Bars Canvas */}
      <div className="h-44 flex items-end justify-between gap-1.5 pt-6 px-1 border-b border-slate-200">
        {data.map((seg, idx) => {
          const heightPercent = Math.max(12, Math.round((seg.value / maxVal) * 100));
          const sharePercent = Math.round((seg.value / total) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Value label on top of bar */}
              <span
                className={`text-[9px] font-mono font-bold transition mb-1 text-slate-600 truncate max-w-full ${
                  isHovered ? 'text-indigo-600 scale-110 font-black' : ''
                }`}
              >
                {sharePercent}%
              </span>

              {/* Bar */}
              <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                <div
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: seg.color,
                  }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isHovered ? 'brightness-110 shadow-md' : 'opacity-90'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between gap-1 text-[10px] text-slate-500 font-medium px-1">
        {data.map((seg, idx) => (
          <div
            key={idx}
            className={`flex-1 text-center truncate cursor-pointer transition ${
              hoveredIdx === idx ? 'text-slate-900 font-bold' : ''
            }`}
            title={`${seg.label}: ${valuePrefix}${seg.value.toLocaleString()}`}
          >
            {seg.label.split(' ')[0]}
          </div>
        ))}
      </div>

      {/* Hover preview pill */}
      <div className="h-8 bg-slate-50 rounded-xl border border-slate-200/80 px-3 flex items-center justify-between text-[11px]">
        {hoveredIdx !== null ? (
          <>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data[hoveredIdx].color }} />
              {data[hoveredIdx].label}
            </span>
            <span className="font-mono font-bold text-slate-900 shrink-0">
              {valuePrefix}{data[hoveredIdx].value.toLocaleString()} ({Math.round((data[hoveredIdx].value / total) * 100)}%)
            </span>
          </>
        ) : (
          <span className="text-slate-400 italic text-[10px]">Hover any column to inspect detailed magnitude</span>
        )}
      </div>
    </div>
  );
};

// 6. Treemap / Proportional Card Grid
export const TreemapCardGrid: React.FC<{
  data: DonutSegment[];
  valuePrefix?: string;
}> = ({ data, valuePrefix = '' }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 w-full">
      {data.map((seg, idx) => {
        const percent = Math.round((seg.value / total) * 100);
        return (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition space-y-1 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 bottom-0 w-1.5"
              style={{ backgroundColor: seg.color }}
            />
            <div className="flex items-center justify-between text-[11px] pl-1">
              <span className="font-semibold text-slate-800 truncate pr-1">{seg.label}</span>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-white shrink-0"
                style={{ backgroundColor: seg.color }}
              >
                {percent}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 pl-1">
              {valuePrefix}{seg.value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 7. Horizontal Bar Chart for Top Risks & Comparisons
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
    <div className="space-y-3 w-full">
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

// 8. Multi-point Trend / Area Chart
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

// 9. Interactive Universal Multi-Style Chart Container
export const VersatileChartCard: React.FC<{
  title: string;
  subtitle: string;
  data: DonutSegment[];
  valuePrefix?: string;
  centerSub?: string;
  defaultStyle?: ChartRepresentationStyle;
  availableStyles?: ChartRepresentationStyle[];
  gaugeScore?: number;
}> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  centerSub = 'Total',
  defaultStyle = 'donut',
  availableStyles = ['donut', 'columns', 'meter', 'concentric', 'treemap'],
  gaugeScore,
}) => {
  const [currentStyle, setCurrentStyle] = useState<ChartRepresentationStyle>(defaultStyle);
  const [showGuide, setShowGuide] = useState(false);

  const styleIcons: Record<ChartRepresentationStyle, { label: string; icon: React.ReactNode; desc: string }> = {
    donut: {
      label: 'Donut Ring',
      icon: <PieChart className="w-3.5 h-3.5" />,
      desc: 'Radial part-to-whole view with central total metric and interactive slices.',
    },
    columns: {
      label: 'Column Bars',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      desc: 'Vertical side-by-side comparison bars for precise category magnitude inspection.',
    },
    meter: {
      label: 'Segmented Meter',
      icon: <Layers className="w-3.5 h-3.5" />,
      desc: 'Linear 100% stacked bar with detailed percentage chips and value badges.',
    },
    concentric: {
      label: 'Concentric Rings',
      icon: <CircleDot className="w-3.5 h-3.5" />,
      desc: 'Multi-ring target chart showing independent sweep arcs for modern BI telemetry.',
    },
    treemap: {
      label: 'Matrix Tiles',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      desc: 'Proportional card grid with color borders, ideal for rapid scanning of exact numbers.',
    },
    gauge: {
      label: 'Clinical Gauge',
      icon: <Gauge className="w-3.5 h-3.5" />,
      desc: 'Semi-circular speedometer dial highlighting severity spectrum (Low to Critical).',
    },
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between transition-all">
      {/* Header with Title and Style Selector */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          {/* Style Selector Toolbar */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl shrink-0">
            {availableStyles.map(styleKey => {
              const info = styleIcons[styleKey];
              const isActive = currentStyle === styleKey;
              return (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => setCurrentStyle(styleKey)}
                  title={`${info.label}: ${info.desc}`}
                  className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  }`}
                >
                  {info.icon}
                  <span className="hidden sm:inline text-[10px]">{info.label.split(' ')[0]}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              title="Graph representation style suggestions"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                showGuide ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Suggestion Guide Drawer */}
        {showGuide && (
          <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-blue-50/60 border border-indigo-100 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Available Graph Representation Styles:
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-700 text-[10px] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-600">
              <div
                onClick={() => setCurrentStyle('donut')}
                className="p-1.5 rounded-lg bg-white/80 border border-indigo-100/60 cursor-pointer hover:border-indigo-400"
              >
                <strong className="text-slate-800">🍩 Donut Ring:</strong> Intuitive part-to-whole view with central total.
              </div>
              <div
                onClick={() => setCurrentStyle('columns')}
                className="p-1.5 rounded-lg bg-white/80 border border-indigo-100/60 cursor-pointer hover:border-indigo-400"
              >
                <strong className="text-slate-800">📊 Column Bars:</strong> Best for direct magnitude comparisons.
              </div>
              <div
                onClick={() => setCurrentStyle('meter')}
                className="p-1.5 rounded-lg bg-white/80 border border-indigo-100/60 cursor-pointer hover:border-indigo-400"
              >
                <strong className="text-slate-800">📏 Segmented Meter:</strong> Compact linear strip with percentage badges.
              </div>
              <div
                onClick={() => setCurrentStyle('concentric')}
                className="p-1.5 rounded-lg bg-white/80 border border-indigo-100/60 cursor-pointer hover:border-indigo-400"
              >
                <strong className="text-slate-800">🎯 Concentric Rings:</strong> High-tech nested radial sweeps.
              </div>
              {availableStyles.includes('gauge') && (
                <div
                  onClick={() => setCurrentStyle('gauge')}
                  className="p-1.5 rounded-lg bg-white/80 border border-indigo-100/60 cursor-pointer hover:border-indigo-400 sm:col-span-2"
                >
                  <strong className="text-slate-800">⏱️ Clinical Gauge:</strong> Speedometer dial for instant risk & safety triage.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render Selected Representation */}
      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {currentStyle === 'donut' && (
          <DonutChart
            data={data}
            size={190}
            strokeWidth={24}
            centerSub={centerSub}
            valuePrefix={valuePrefix}
          />
        )}
        {currentStyle === 'columns' && (
          <VerticalColumnChart data={data} valuePrefix={valuePrefix} />
        )}
        {currentStyle === 'meter' && (
          <SegmentedMeterChart data={data} valuePrefix={valuePrefix} />
        )}
        {currentStyle === 'concentric' && (
          <ConcentricRadialChart data={data} size={195} valuePrefix={valuePrefix} />
        )}
        {currentStyle === 'treemap' && (
          <TreemapCardGrid data={data} valuePrefix={valuePrefix} />
        )}
        {currentStyle === 'gauge' && (
          <SemiCircleGaugeChart
            data={data}
            currentScore={gaugeScore}
            size={210}
            valuePrefix={valuePrefix}
          />
        )}
      </div>

      {/* Footer Style Status */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active: {styleIcons[currentStyle]?.label}
        </span>
        <button
          type="button"
          onClick={() => {
            const nextIdx = (availableStyles.indexOf(currentStyle) + 1) % availableStyles.length;
            setCurrentStyle(availableStyles[nextIdx]);
          }}
          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer text-[10px] hover:underline"
        >
          Cycle Style →
        </button>
      </div>
    </div>
  );
};

