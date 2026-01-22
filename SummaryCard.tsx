
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, subtext, trend, color = 'blue' }) => {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 text-blue-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    rose: 'border-rose-500/30 text-rose-400',
    amber: 'border-amber-500/30 text-amber-400',
    zinc: 'border-zinc-700 text-zinc-400',
  };

  return (
    <div className={`bg-zinc-900/50 border rounded-xl p-5 flex flex-col justify-between ${colorMap[color] || colorMap.zinc}`}>
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold mono text-zinc-100">{value}</h3>
      </div>
      {subtext && (
        <div className="mt-3 flex items-center gap-2">
          {trend === 'up' && <span className="text-emerald-500 text-xs">▲</span>}
          {trend === 'down' && <span className="text-rose-500 text-xs">▼</span>}
          <span className="text-xs text-zinc-500 font-medium">{subtext}</span>
        </div>
      )}
    </div>
  );
};
