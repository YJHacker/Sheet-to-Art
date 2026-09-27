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
  onOpenFile?: (file: File) => void;
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
    <div className={`flex flex-col gap-3 p-3.5 rounded-xl studio-glass-panel border border-slate-200 shadow-2xs ${className}`}>
      {/* File Details */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-extrabold text-[11px]">
            {extension}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]" title={fileName}>
              {fileName}
            </span>
            <span className="text-[11px] font-medium text-slate-500">{formatFileSize(fileSize)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="!px-2.5 !py-1 text-xs text-slate-700 hover:text-slate-900"
            title="Start over with a different file"
          >
            Change File
          </Button>
        </div>
      </div>

      {/* Sheet Switcher Dropdown if multi-sheet */}
      {hasMultipleSheets && onSheetChange && (
        <div className="pt-2 border-t border-slate-100">
          <Select
            label="Active Sheet"
            value={activeSheetIndex.toString()}
            options={sheetOptions}
            onChange={(val) => onSheetChange(parseInt(val, 10))}
          />
        </div>
      )}
    </div>
  );
};


