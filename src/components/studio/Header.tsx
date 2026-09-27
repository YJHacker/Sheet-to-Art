// src/components/studio/Header.tsx
import React, { useRef } from 'react';
import { Button } from '../common/Button';

export interface HeaderProps {
  hasDocument: boolean;
  fileName?: string;
  sheetNames?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
  onOpenFile?: (file: File) => void;
  onExportClick?: () => void;
  onDirectDownload?: () => void;
  onReset?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hasDocument,
  fileName,
  sheetNames = [],
  activeSheetIndex = 0,
  onSheetChange,
  onOpenFile,
  onExportClick,
  onDirectDownload,
  onReset,
  isSidebarOpen,
  onToggleSidebar,
  isProcessing = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMultipleSheets = sheetNames.length > 1;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onOpenFile) {
      const file = e.target.files[0];
      if (file) {
        onOpenFile(file);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <header
      className={`w-full flex flex-col md:flex-row items-stretch md:items-center justify-between px-3.5 sm:px-5 py-2.5 studio-glass-panel border-b border-slate-200/90 bg-white/95 shrink-0 z-30 gap-2.5 ${className}`}
    >
      {/* Hidden File Input for Open Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="studio-open-file-input"
      />

      {/* Left: Brand, Sidebar Toggle & File Info */}
      <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="hidden md:flex p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Sheet to Art</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                Studio
              </span>
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 animate-pulse ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  Updating...
                </span>
              )}
            </div>
            <span
              className="text-xs text-slate-500 truncate max-w-[170px] sm:max-w-xs font-medium"
              title={fileName || 'Publication Document'}
            >
              {fileName || 'Publication Document'}
            </span>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex md:hidden items-center gap-1.5">
          {onOpenFile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="!px-2.5 !py-1 text-xs"
              title="Open spreadsheet"
            >
              Open
            </Button>
          )}
          {onExportClick && (
            <Button
              variant="primary"
              size="sm"
              onClick={onExportClick}
              className="!px-3 !py-1 text-xs font-semibold shadow-xs"
              title="Export PDF"
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Center: Multi-Sheet Horizontal Tabs Bar */}
      {hasMultipleSheets && onSheetChange ? (
        <nav
          aria-label="Worksheets"
          className="flex items-center gap-1 overflow-x-auto py-1 px-1.5 rounded-xl bg-slate-100/90 border border-slate-200/90 max-w-full md:max-w-md lg:max-w-lg studio-scrollbar shrink min-w-0"
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1.5 shrink-0">
            Sheets:
          </span>
          {sheetNames.map((name, idx) => {
            const isActive = idx === activeSheetIndex;
            return (
              <button
                key={idx}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSheetChange(idx)}
                disabled={isProcessing}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'worksheet-tab-active shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                {name || `Sheet ${idx + 1}`}
              </button>
            );
          })}
        </nav>
      ) : (
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/80">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>100% In-Browser Private</span>
        </div>
      )}

      {/* Right Actions for Desktop */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {onOpenFile && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-slate-700 hover:text-blue-700 shadow-xs"
            title="Open a different spreadsheet file"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Open File
          </Button>
        )}

        {hasDocument && (
          <>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-xs text-slate-600 hover:text-slate-900"
                title="Start with a fresh spreadsheet"
              >
                New
              </Button>
            )}
            {onDirectDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDirectDownload}
                className="text-xs font-semibold shadow-xs"
                title="Direct Download"
                aria-label="Direct Download"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Direct Download
              </Button>
            )}
            {onExportClick && (
              <Button
                variant="primary"
                size="sm"
                onClick={onExportClick}
                className="shadow-xs font-semibold text-xs"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};

