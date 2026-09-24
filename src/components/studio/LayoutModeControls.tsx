// src/components/studio/LayoutModeControls.tsx
import React from 'react';
import type { StudioOptions, LayoutModePreset } from '../../types/studio';
import { Slider } from '../common/Slider';
import { Switch } from '../common/Switch';
import { Select } from '../common/Select';

export interface LayoutModeControlsProps {
  options: StudioOptions;
  onOptionsChange: (updates: Partial<StudioOptions>) => void;
  className?: string;
}

const LAYOUT_PRESETS: { value: LayoutModePreset; label: string }[] = [
  { value: 'auto', label: 'Auto (Intelligent Flow)' },
  { value: 'compact', label: 'High Density Ledger' },
  { value: 'balanced', label: 'Balanced Publication' },
  { value: 'presentation', label: 'Executive Presentation' },
  { value: 'print-saver', label: 'Print Ink-Saver' },
];

export const LayoutModeControls: React.FC<LayoutModeControlsProps> = ({
  options,
  onOptionsChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Document Custom Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-title-input" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Document Title
        </label>
        <input
          id="custom-title-input"
          type="text"
          value={options.customTitle}
          placeholder="Leave blank for automatic sheet title"
          onChange={(e) => onOptionsChange({ customTitle: e.target.value })}
          className="w-full bg-white/90 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Layout Preset */}
      <Select
        label="Layout Strategy Preset"
        value={options.layoutMode}
        options={LAYOUT_PRESETS}
        onChange={(val) => onOptionsChange({ layoutMode: val as LayoutModePreset })}
      />

      {/* Font Scale Slider */}
      <Slider
        label="Base Font Scale"
        value={options.fontScale}
        min={7.0}
        max={12.0}
        step={0.5}
        unit="pt"
        onChange={(val) => onOptionsChange({ fontScale: val })}
        helperText="Adjusts micro-typography and line height across all sections."
      />

      {/* Toggles */}
      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        <Switch
          label="Repeat Table Headers"
          description="Keep headers visible at the top of every page during multi-page table splits."
          checked={options.repeatTableHeaders}
          onChange={(checked) => onOptionsChange({ repeatTableHeaders: checked })}
        />

        <Switch
          label="Show Page Numbers"
          description="Display clean footer page numbering (e.g. Page 1 of 3)."
          checked={options.showPageNumbers}
          onChange={(checked) => onOptionsChange({ showPageNumbers: checked })}
        />

        <Switch
          label="Section Summary Callouts"
          description="Highlight detected KPI summary metrics at the top of the report."
          checked={options.showSectionSummary}
          onChange={(checked) => onOptionsChange({ showSectionSummary: checked })}
        />
      </div>
    </div>
  );
};
