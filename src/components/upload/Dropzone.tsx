// src/components/upload/Dropzone.tsx
import { useState, useRef } from 'react';
import { listSampleDatasets } from '../../lib/utils/sample-data';

export interface DropzoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sampleId: string) => void;
  onError?: (errorMessage: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelected,
  onSampleSelected,
  onError,
  isLoading = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const samples = listSampleDatasets();

  const validateAndHandleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      const msg = `Unsupported file format (.${ext || 'unknown'}). Please upload an Excel (.xlsx) or CSV (.csv) file.`;
      if (onError) onError(msg);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      const msg = 'File size exceeds 50MB limit.';
      if (onError) onError(msg);
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) validateAndHandleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) validateAndHandleFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col gap-6 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        data-testid="file-input"
        accept=".xlsx,.csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag and Drop Container */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload spreadsheet dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-md'
            : 'border-slate-300 hover:border-blue-400 bg-white/90 hover:bg-white shadow-xs'
        }`}
      >
        {/* Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 group-hover:bg-blue-100/60 transition-all duration-200 shadow-xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        {/* Heading & Subtitle */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
          Upload your spreadsheet
        </h3>
        <p className="text-sm text-slate-600 max-w-md mb-5 leading-relaxed">
          Drag & drop your Excel (.xlsx) or CSV (.csv) file here, or click to browse. Let automated heuristics typeset it into a publication-ready document.
        </p>

        {/* Format Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            .XLSX
          </span>
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-sky-50 text-sky-800 border border-sky-200">
            .CSV
          </span>
          <span className="text-xs text-slate-500 font-semibold">Up to 50MB</span>
        </div>

        {/* Privacy Assurance Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>100% In-Browser Private — Zero server telemetry</span>
        </div>
      </div>

      {/* Sample Spreadsheets Loader */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Or try with sample datasets
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSampleSelected(sample.id);
              }}
              disabled={isLoading}
              className="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 transition-all shadow-xs group cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  {sample.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-blue-600">
                  {sample.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

