// src/components/studio/ExportModal.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { formatFileSize, sanitizeFileName } from '../../lib/utils/formatters';

export interface ExportModalProps {
  isOpen: boolean;
  defaultFileName: string;
  pageCount: number;
  fileSize: number;
  onClose: () => void;
  onDownload: (fileName: string) => void;
  onPrint?: () => void;
  className?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  defaultFileName,
  pageCount,
  fileSize,
  onClose,
  onDownload,
  onPrint,
  className = '',
}) => {
  const [fileName, setFileName] = useState(sanitizeFileName(defaultFileName, '.pdf'));

  useEffect(() => {
    setFileName(sanitizeFileName(defaultFileName, '.pdf'));
  }, [defaultFileName]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const finalName = sanitizeFileName(fileName, '.pdf');
    onDownload(finalName);
    onClose();
  };

  const handlePrint = () => {
    if (onPrint) onPrint();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${className}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-xs">
              PDF
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base font-bold text-slate-900">
                Export Publication PDF
              </h3>
              <p className="text-xs text-slate-500 font-medium">100% Vector Quality • Typst WASM</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close export modal"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Filename Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-filename" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Output Filename
            </label>
            <input
              id="export-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs font-medium"
            />
          </div>

          {/* Document Summary Badges */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">Pages</span>
              <span className="font-bold text-slate-900">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">Approx Size</span>
              <span className="font-bold text-slate-900">{formatFileSize(fileSize)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">Privacy</span>
              <span className="font-bold text-emerald-700">Client-Side Only</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60 gap-2">
          {onPrint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-slate-700 hover:text-slate-900"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Document
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleDownload} className="font-semibold shadow-sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

