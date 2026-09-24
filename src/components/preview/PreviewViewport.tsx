// src/components/preview/PreviewViewport.tsx
import React from 'react';
import type { LayoutIR } from '../../types/layout-ir';
import { ZoomControls } from './ZoomControls';
import { PageNav } from './PageNav';
import { PDFViewer } from './PDFViewer';
import { DOMPreviewFallback } from './DOMPreviewFallback';

export interface PreviewViewportProps {
  layoutIR: LayoutIR | null;
  pdfBlobUrl: string | null;
  previewMode: 'pdf' | 'dom';
  zoom: number;
  currentPage: number;
  totalPages: number;
  onZoomChange: (zoom: number) => void;
  onPageChange: (page: number) => void;
  onPreviewModeChange: (mode: 'pdf' | 'dom') => void;
  isLoading?: boolean;
  className?: string;
}

export const PreviewViewport: React.FC<PreviewViewportProps> = ({
  layoutIR,
  pdfBlobUrl,
  previewMode,
  zoom,
  currentPage,
  totalPages,
  onZoomChange,
  onPageChange,
  onPreviewModeChange,
  isLoading = false,
  className = '',
}) => {
  const scale = zoom / 100;

  return (
    <div className={`relative flex-1 h-full flex flex-col overflow-hidden studio-canvas-grid ${className}`}>
      {/* Floating Canvas Action Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-xl studio-glass-panel shadow-md border border-slate-200/90 max-w-[95%] overflow-x-auto">
        <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <PageNav
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onPreviewModeChange('pdf')}
            className={`text-xs font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
              previewMode === 'pdf'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange('dom')}
            className={`text-xs font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
              previewMode === 'dom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Structure
          </button>
        </div>
      </div>

      {/* Viewport Canvas Area */}
      <div className="flex-1 overflow-auto p-8 pt-20 flex justify-center items-start studio-scrollbar">
        <div
          className="transition-transform duration-150 origin-top flex justify-center w-full"
          style={{ transform: `scale(${scale})` }}
        >
          {previewMode === 'pdf' ? (
            <PDFViewer pdfBlobUrl={pdfBlobUrl} currentPage={currentPage} zoom={zoom} />
          ) : (
            <DOMPreviewFallback layoutIR={layoutIR} />
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs backdrop-blur-md shadow-lg">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <span>Re-compiling...</span>
        </div>
      )}
    </div>
  );
};
