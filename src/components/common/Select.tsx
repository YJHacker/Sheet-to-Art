// src/components/common/Select.tsx
import React, { type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/90 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition cursor-pointer appearance-none pr-8"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};
