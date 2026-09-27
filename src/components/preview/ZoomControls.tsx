// src/components/preview/ZoomControls.tsx
import React from 'react';
import { Button } from '../common/Button';
import { formatZoom } from '../../lib/utils/formatters';

export interface ZoomControlsProps {
  zoom: number; // 25 to 200 (%)
  onZoomChange: (zoom: number) => void;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomChange,
  className = '',
}) => {
  const handleZoomIn = () => {
    onZoomChange(Math.min(200, zoom + 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(25, zoom - 10));
  };

  const handleResetZoom = () => {
    onZoomChange(100);
  };

  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 bg-white/95 border border-slate-200/90 shadow-xs rounded-lg p-0.5 sm:p-1 shrink-0 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Zoom out"
        onClick={handleZoomOut}
        disabled={zoom <= 25}
        className="!px-2 sm:!px-2.5 !py-1 !min-h-[30px] !min-w-[28px] sm:!min-w-[32px] text-slate-700 font-bold hover:bg-slate-100"
      >
        −
      </Button>

      <button
        type="button"
        onClick={handleResetZoom}
        className="text-xs font-semibold px-1.5 sm:px-2 py-1 text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer min-w-[44px] sm:min-w-[50px] text-center"
        title="Reset zoom to 100%"
      >
        {formatZoom(zoom)}
      </button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Zoom in"
        onClick={handleZoomIn}
        disabled={zoom >= 200}
        className="!px-2 sm:!px-2.5 !py-1 !min-h-[30px] !min-w-[28px] sm:!min-w-[32px] text-slate-700 font-bold hover:bg-slate-100"
      >
        +
      </Button>

      <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

      <Button
        variant="ghost"
        size="sm"
        aria-label="Fit width"
        onClick={() => onZoomChange(100)}
        className="!px-2 !py-1 !min-h-[30px] text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 hidden xs:inline-flex"
      >
        Fit
      </Button>
    </div>
  );
};


