// src/components/preview/PDFViewer.tsx
import React, { useState } from 'react';

export interface PDFViewerProps {
  pdfBlobUrl: string | null;
  svg?: string;
  currentPage?: number;
  zoom?: number;
  onDownload?: () => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfBlobUrl,
  svg,
  currentPage = 1,
  zoom = 100,
  onDownload,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  if (!pdfBlobUrl && !svg) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-canvas border border-slate-200 text-slate-400 text-sm max-w-lg mx-auto ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-500 shadow-xs">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-bold text-slate-800 text-base">No PDF compiled yet</p>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">Upload a spreadsheet to typeset and compile the publication-grade vector PDF.</p>
      </div>
    );
  }

  // 1. If vector SVG is available and iframe fallback is not explicitly toggled, render SVG natively
  if (svg && !useIframeFallback) {
    return (
      <div className={`w-full max-w-[1000px] mx-auto flex flex-col gap-2.5 ${className}`}>
        {/* PDF Top Meta Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs shadow-md border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Vector PDF Preview</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              WASM Typeset
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition font-medium text-xs flex items-center gap-1 shadow-xs cursor-pointer border border-blue-500"
                title="Download PDF"
              >
                <span>Download</span>
              </button>
            )}
            {pdfBlobUrl && (
              <a
                href={pdfBlobUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-medium text-xs flex items-center gap-1 border border-slate-700"
                title="Open compiled PDF in a separate browser tab"
              >
                <span>Open in Tab</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Scalable Vector SVG Page Container */}
        <div
          className="w-full bg-white rounded-2xl shadow-canvas overflow-hidden border border-slate-200/90 p-2 sm:p-6 flex justify-center items-center typst-svg-container [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:shadow-sm [&_svg]:rounded-md"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  }

  // 2. Iframe Fallback for desktop browser PDF plugin
  const iframeSrc = pdfBlobUrl
    ? `${pdfBlobUrl}#page=${currentPage}&zoom=${zoom}&toolbar=1&navpanes=0&scrollbar=1`
    : '';

  return (
    <div className={`relative w-full max-w-[950px] mx-auto min-h-[650px] h-[85vh] rounded-2xl shadow-canvas overflow-hidden border border-slate-300 bg-white flex flex-col ${className}`}>
      {/* Fallback Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-700">
        <span className="font-semibold text-slate-800">Native Browser PDF Viewer</span>
        <div className="flex items-center gap-2">
          {svg && (
            <button
              type="button"
              onClick={() => setUseIframeFallback(false)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium text-xs transition"
            >
              Switch to Vector View
            </button>
          )}
          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Open in new tab ↗
            </a>
          )}
        </div>
      </div>

      <div className="relative flex-1 w-full h-full">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 z-10">
            <div className="flex flex-col items-center gap-2.5">
              <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-600 font-semibold">Loading PDF document...</span>
            </div>
          </div>
        )}

        <iframe
          title="PDF Preview"
          src={iframeSrc}
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

