// src/components/studio/PageSetupControls.tsx
import React from 'react';
import type { StudioOptions, MarginPreset } from '../../types/studio';
import type { PageSizeType, OrientationType } from '../../types/layout-ir';
import { Select } from '../common/Select';

export interface PageSetupControlsProps {
  options: StudioOptions;
  onOptionsChange: (updates: Partial<StudioOptions>) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS: { value: PageSizeType; label: string; description: string }[] = [
  { value: 'a4', label: 'A4 (210 × 297 mm)', description: 'Standard international print document size' },
  { value: 'letter', label: 'US Letter (8.5 × 11 in)', description: 'Standard North American document size' },
  { value: 'legal', label: 'US Legal (8.5 × 14 in)', description: 'Extended vertical format for dense schedules' },
  { value: 'a3', label: 'A3 (297 × 420 mm)', description: 'Large format spreadsheet & multi-table overview' },
  { value: 'a5', label: 'A5 (148 × 210 mm)', description: 'Compact handbook & pocket summary' },
];

const ORIENTATION_OPTIONS: { value: OrientationType; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto (Smart Heuristic)', description: 'Automatically flips to landscape if table columns require width' },
  { value: 'portrait', label: 'Portrait', description: 'Standard vertical layout' },
  { value: 'landscape', label: 'Landscape', description: 'Wide horizontal layout for wide tabular data' },
];

const MARGIN_OPTIONS: { value: MarginPreset; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact (10 mm)', description: 'Maximized printable area for high-density tables' },
  { value: 'normal', label: 'Normal (15 mm)', description: 'Balanced publishing margins with optimal readability' },
  { value: 'spacious', label: 'Spacious (20 mm)', description: 'Generous executive margins for formal reports' },
];

export const PageSetupControls: React.FC<PageSetupControlsProps> = ({
  options,
  onOptionsChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <Select
        label="Page Size"
        value={options.pageSize}
        options={PAGE_SIZE_OPTIONS}
        onChange={(val) => onOptionsChange({ pageSize: val as PageSizeType })}
      />

      <Select
        label="Orientation"
        value={options.orientation}
        options={ORIENTATION_OPTIONS}
        onChange={(val) => onOptionsChange({ orientation: val as OrientationType })}
      />

      <Select
        label="Page Margins"
        value={options.marginPreset}
        options={MARGIN_OPTIONS}
        onChange={(val) => onOptionsChange({ marginPreset: val as MarginPreset })}
      />
    </div>
  );
};
