// src/components/common/ProgressBar.tsx
import React from 'react';
import type { PipelineStage } from '../../types/studio';

export interface ProgressBarProps {
  stage: PipelineStage;
  percent: number;
  message?: string;
  error?: string | null;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  stage,
  percent,
  message,
  error,
  className = '',
}) => {
  const stageLabels: Record<PipelineStage, string> = {
    idle: 'Idle',
    parsing: 'Parsing Spreadsheet',
    layout: 'Analyzing Layout & Semantics',
    compiling: 'Compiling Typst WASM to PDF',
    ready: 'Complete',
    error: 'Processing Error',
  };

  const isError = stage === 'error' || Boolean(error);
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={`w-full flex flex-col gap-2 p-4 rounded-xl studio-glass-panel border ${isError ? 'border-red-200 bg-red-50/50' : 'border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className={`uppercase tracking-wider px-2 py-0.5 rounded ${
          isError
            ? 'bg-red-100 text-red-700'
            : stage === 'ready'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {stageLabels[stage] || stage}
        </span>
        <span className="text-slate-600 font-mono">{clampedPercent}%</span>
      </div>

      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${
            isError
              ? 'bg-red-500'
              : stage === 'ready'
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {message && <p className="text-xs text-slate-600 truncate">{message}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
