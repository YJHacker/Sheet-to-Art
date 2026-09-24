// src/components/studio/Header.tsx
import React from 'react';
import { Button } from '../common/Button';

export interface HeaderProps {
  hasDocument: boolean;
  fileName?: string;
  onExportClick?: () => void;
  onReset?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hasDocument,
  fileName,
  onExportClick,
  onReset,
  className = '',
}) => {
  return (
    <header className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 studio-glass-panel border-b border-slate-200 bg-white/80 shrink-0 z-30 ${className}`}>
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 tracking-tight">Sheet to Art</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Studio
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Intelligent Document & PDF Typesetting Engine
          </span>
        </div>
      </div>

      {/* Center Privacy Badge */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/80">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>100% In-Browser Private</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {hasDocument && (
          <>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="hidden sm:inline-flex">
                New File
              </Button>
            )}
            {onExportClick && (
              <Button variant="primary" size="md" onClick={onExportClick} className="shadow-sm font-semibold">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
