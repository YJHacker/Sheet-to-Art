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
  };

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col gap-6 ${className}`}>
      {/* Drag and Drop Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer text-center group ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 scale-[1.01] shadow-lg'
            : 'border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-white/90 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          data-testid="file-input"
          accept=".xlsx,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 group-hover:bg-blue-100/70 transition duration-200 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        {/* Heading & Subtitle */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5">
          Upload your spreadsheet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-5">
          Drag & drop your Excel or CSV file here, or click to browse. Let intelligent heuristics transform it into a publication-ready document.
        </p>

        {/* Format Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            .XLSX
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
            .CSV
          </span>
          <span className="text-xs text-slate-400 font-medium">Up to 50MB</span>
        </div>

        {/* Privacy Assurance Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>100% In-Browser Private — No data uploaded to any server</span>
        </div>
      </div>

      {/* Sample Spreadsheets Loader */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Or try with sample datasets
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSampleSelected(sample.id)}
              disabled={isLoading}
              className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-white/80 hover:bg-blue-50/50 hover:border-blue-300 transition shadow-sm group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  {sample.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-500">
                  {sample.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
