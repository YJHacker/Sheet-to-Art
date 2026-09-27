// src/components/preview/PreviewViewport.tsx
import React from 'react';
import type { LayoutIR } from '../../types/layout-ir';
import { ZoomControls } from './ZoomControls';
import { PageNav } from './PageNav';
import { PDFViewer } from './PDFViewer';
import { DocumentPreview } from './DocumentPreview';

export interface PreviewViewportProps {
  layoutIR: LayoutIR | null;
  pdfBlobUrl: string | null;
  svg?: string;
  previewMode: 'pdf' | 'dom';
  zoom: number;
  currentPage: number;
  totalPages: number;
  onZoomChange: (zoom: number) => void;
  onPageChange: (page: number) => void;
  onPreviewModeChange: (mode: 'pdf' | 'dom') => void;
  onDownload?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const PreviewViewport: React.FC<PreviewViewportProps> = ({
  layoutIR,
  pdfBlobUrl,
  svg,
  previewMode,
  zoom,
  currentPage,
  totalPages,
  onZoomChange,
  onPageChange,
  onPreviewModeChange,
  onDownload,
  isLoading = false,
  className = '',
}) => {
  const scale = zoom / 100;

  return (
    <div className={`relative flex-1 h-full min-h-[350px] flex flex-col overflow-hidden studio-canvas-grid ${className}`}>
      {/* Floating Canvas Action Bar - Fully Responsive & Centered without Overflow Clipping */}
      <div className="sticky top-2 sm:top-3 z-20 mx-auto px-2 py-1 sm:py-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-xl studio-glass-panel shadow-md border border-slate-200/90 max-w-[98%] w-auto">
        {/* Preview Mode Segmented Selector */}
        <div className="flex items-center gap-0.5 bg-slate-100/90 border border-slate-200/80 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onPreviewModeChange('dom')}
            className={`flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md transition cursor-pointer ${
              previewMode === 'dom'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to Document View (Semantic HTML)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Document</span>
            <span className="sm:hidden">Doc</span>
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange('pdf')}
            className={`flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md transition cursor-pointer ${
              previewMode === 'pdf'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to Vector PDF (Typst WASM)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>PDF</span>
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />

        {previewMode === 'pdf' && totalPages > 1 && (
          <>
            <div className="w-px h-5 bg-slate-200 shrink-0" />
            <PageNav
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}

        {/* Live Recompiling Status Indicator inside Toolbar */}
        {isLoading && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold animate-pulse shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span className="hidden xs:inline">Updating...</span>
          </div>
        )}
      </div>

      {/* Viewport Canvas Area */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 pt-3 sm:pt-4 flex justify-center items-start studio-scrollbar">
        <div
          className="transition-transform duration-150 origin-top flex justify-center w-full max-w-full"
          style={{ transform: `scale(${scale})` }}
        >
          {previewMode === 'pdf' ? (
            <PDFViewer
              pdfBlobUrl={pdfBlobUrl}
              svg={svg}
              currentPage={currentPage}
              zoom={zoom}
              onDownload={onDownload}
            />
          ) : (
            <DocumentPreview layoutIR={layoutIR} />
          )}
        </div>
      </div>

      {/* Floating Recompilation Toast (Positioned safely above bottom bars) */}
      {isLoading && (
        <div className="fixed sm:absolute bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 text-white text-xs backdrop-blur-md shadow-xl border border-slate-700/60 animate-fade-in">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <span className="font-medium">Typesetting document in Web Worker...</span>
        </div>
      )}
    </div>
  );
};


