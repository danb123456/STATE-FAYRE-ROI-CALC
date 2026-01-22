
import React from 'react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  type?: 'currency' | 'percent' | 'number';
  step?: number;
  min?: number;
  tooltip?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = 'number', step = 1, min = 0, tooltip }) => {
  const prefix = type === 'currency' ? '£' : '';
  const suffix = type === 'percent' ? '%' : '';

  const displayValue = value === 0 ? '' : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(0);
    } else {
      const parsed = parseFloat(val);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-zinc-400">{label}</label>
        {tooltip && (
          <div className="group relative">
            <span className="cursor-help text-zinc-600 text-[10px] border border-zinc-700 rounded-full w-4 h-4 flex items-center justify-center">?</span>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-zinc-800 text-[11px] text-zinc-300 rounded shadow-xl border border-zinc-700 z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative group">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{prefix}</span>
        )}
        <input
          type="number"
          value={displayValue}
          step={step}
          min={min}
          onChange={handleChange}
          className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-zinc-100 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
};
