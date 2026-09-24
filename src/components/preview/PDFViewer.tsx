// src/components/preview/PDFViewer.tsx
import React, { useState } from 'react';

export interface PDFViewerProps {
  pdfBlobUrl: string | null;
  currentPage?: number;
  zoom?: number;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfBlobUrl,
  currentPage = 1,
  zoom = 100,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!pdfBlobUrl) {
    return (
      <div className={`flex items-center justify-center h-[500px] text-slate-400 text-sm ${className}`}>
        No PDF compiled yet.
      </div>
    );
  }

  const iframeSrc = `${pdfBlobUrl}#page=${currentPage}&zoom=${zoom}&toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <div className={`relative w-full max-w-[850px] mx-auto min-h-[700px] h-[85vh] rounded-xl shadow-canvas overflow-hidden border border-slate-300 bg-white ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading PDF document...</span>
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
  );
};
