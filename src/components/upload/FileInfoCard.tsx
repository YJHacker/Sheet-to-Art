// src/components/upload/FileInfoCard.tsx
import React from 'react';
import { formatFileSize } from '../../lib/utils/formatters';
import { Button } from '../common/Button';
import { Select } from '../common/Select';

export interface FileInfoCardProps {
  fileName: string;
  fileSize: number;
  sheetNames?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
  onReset: () => void;
  className?: string;
}

export const FileInfoCard: React.FC<FileInfoCardProps> = ({
  fileName,
  fileSize,
  sheetNames = [],
  activeSheetIndex = 0,
  onSheetChange,
  onReset,
  className = '',
}) => {
  const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  const hasMultipleSheets = sheetNames.length > 1;

  const sheetOptions = sheetNames.map((name, idx) => ({
    value: idx.toString(),
    label: name || `Sheet ${idx + 1}`,
  }));

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl studio-glass-panel border border-slate-200 shadow-sm ${className}`}>
      {/* File Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-bold text-xs">
          {extension}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-xs text-slate-500">{formatFileSize(fileSize)}</span>
        </div>
      </div>

      {/* Sheet Switcher & Reset Button */}
      <div className="flex items-center gap-2 shrink-0">
        {hasMultipleSheets && onSheetChange && (
          <div className="w-40">
            <Select
              label="Sheet"
              value={activeSheetIndex.toString()}
              options={sheetOptions}
              onChange={(val) => onSheetChange(parseInt(val, 10))}
            />
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={onReset}>
          Change File
        </Button>
      </div>
    </div>
  );
};
