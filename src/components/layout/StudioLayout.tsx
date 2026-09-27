// src/components/layout/StudioLayout.tsx
import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Header } from '../studio/Header';
import { Sidebar } from '../studio/Sidebar';
import { PreviewViewport } from '../preview/PreviewViewport';
import { ExportModal } from '../studio/ExportModal';
import { ThemeSelector } from '../studio/ThemeSelector';
import { PageSetupControls } from '../studio/PageSetupControls';
import { LayoutModeControls } from '../studio/LayoutModeControls';
import { DocumentOutline } from '../studio/DocumentOutline';
import { FileInfoCard } from '../upload/FileInfoCard';
import { downloadPDF, printPDF } from '../../lib/utils/download';

export interface StudioLayoutProps {
  fileName?: string;
  fileSize?: number;
  sheetNames?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
  onOpenFile?: (file: File) => void;
  onExportClick?: () => void;
  onReset?: () => void;
  isRecompiling?: boolean;
  isProcessing?: boolean;
  className?: string;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  fileName = 'document.csv',
  fileSize = 0,
  sheetNames = [],
  activeSheetIndex = 0,
  onSheetChange,
  onOpenFile,
  onExportClick,
  onReset,
  isRecompiling = false,
  isProcessing = false,
  className = '',
}) => {
  const store = useStudioStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [mobileActiveAccordion, setMobileActiveAccordion] = useState<'layout' | 'outline' | 'file' | null>(null);

  const activeSheetName = sheetNames[activeSheetIndex] || '';
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const suggestedPdfName =
    activeSheetName && sheetNames.length > 1
      ? `${baseName}_${activeSheetName.replace(/\s+/g, '_')}.pdf`
      : `${baseName}.pdf`;

  const handleExportClick = () => {
    if (onExportClick) onExportClick();
    setIsExportModalOpen(true);
  };

  const handleDownload = (customName: string) => {
    if (store.pdfResult?.pdfBuffer) {
      downloadPDF(store.pdfResult.pdfBuffer, customName || suggestedPdfName);
    }
  };

  const handleDirectDownload = () => {
    handleDownload(suggestedPdfName);
  };

  const handlePrint = () => {
    if (store.pdfBlobUrl) {
      printPDF(store.pdfBlobUrl);
    }
  };

  const effectiveSheetNames = sheetNames.length > 0 ? sheetNames : store.file?.sheetNames || [];

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 ${className}`}>
      {/* Header (Shared across Mobile & Desktop) */}
      <Header
        hasDocument={true}
        fileName={fileName}
        sheetNames={effectiveSheetNames}
        activeSheetIndex={activeSheetIndex}
        onSheetChange={onSheetChange}
        onOpenFile={onOpenFile}
        onExportClick={handleExportClick}
        onDirectDownload={handleDirectDownload}
        onReset={onReset || store.resetStudio}
        isSidebarOpen={store.view.isSidebarOpen}
        onToggleSidebar={store.toggleSidebar}
        isProcessing={isRecompiling || isProcessing}
      />

      {/* 1. DESKTOP WORKSPACE (>= md screens): Clean Split-Pane Studio */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        {/* Left Control Sidebar */}
        <div
          className={`${
            store.view.isSidebarOpen ? 'w-80 lg:w-96 flex' : 'hidden'
          } shrink-0 h-full transition-all duration-200 z-20`}
        >
          <Sidebar
            activeTab={store.view.activeSidebarTab}
            onTabChange={store.setActiveSidebarTab}
            options={store.options}
            onOptionsChange={store.setOptions}
            layoutIR={store.layoutIR}
            fileName={fileName}
            fileSize={fileSize}
            sheetNames={effectiveSheetNames}
            activeSheetIndex={activeSheetIndex}
            onSheetChange={onSheetChange}
            onOpenFile={onOpenFile}
            onReset={onReset || store.resetStudio}
            className="w-full h-full"
          />
        </div>

        {/* Center Preview Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <PreviewViewport
            layoutIR={store.layoutIR}
            pdfBlobUrl={store.pdfBlobUrl}
            svg={store.pdfResult?.svg}
            previewMode={store.view.previewMode}
            zoom={store.view.zoom}
            currentPage={store.view.currentPage}
            totalPages={store.view.totalPages || store.pdfResult?.pageCount || 1}
            onZoomChange={store.setZoom}
            onPageChange={store.setCurrentPage}
            onPreviewModeChange={store.setPreviewMode}
            onDownload={handleDirectDownload}
            isLoading={isRecompiling || isProcessing}
          />
        </div>
      </div>

      {/* 2. MOBILE WORKSPACE (< md screens): Natural Vertical Scrolling View */}
      <div className="md:hidden flex-1 overflow-y-auto studio-scrollbar bg-slate-50 relative">
        <div className="flex flex-col gap-4 p-3.5 pb-24 max-w-xl mx-auto w-full">
          {/* Top Horizontal Theme Selector Strip */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <ThemeSelector
              variant="horizontal"
              activeTheme={store.options.theme}
              onThemeChange={(theme) => store.setOptions({ theme })}
            />
          </div>

          {/* Mobile Live Preview Viewport */}
          <div className="flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-2 sm:p-4 min-h-[450px] flex justify-center items-start studio-canvas-grid overflow-x-auto">
              <PreviewViewport
                layoutIR={store.layoutIR}
                pdfBlobUrl={store.pdfBlobUrl}
                svg={store.pdfResult?.svg}
                previewMode={store.view.previewMode}
                zoom={store.view.zoom}
                currentPage={store.view.currentPage}
                totalPages={store.view.totalPages || store.pdfResult?.pageCount || 1}
                onZoomChange={store.setZoom}
                onPageChange={store.setCurrentPage}
                onPreviewModeChange={store.setPreviewMode}
                onDownload={handleDirectDownload}
                isLoading={isRecompiling || isProcessing}
                className="!h-auto !min-h-[400px] w-full"
              />
            </div>
          </div>

          {/* Collapsible Mobile Control Drawers (Layout, Outline, File Info) */}
          <div className="flex flex-col gap-2.5">
            {/* Page & Layout Setup Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                aria-expanded={mobileActiveAccordion === 'layout'}
                onClick={() =>
                  setMobileActiveAccordion(mobileActiveAccordion === 'layout' ? null : 'layout')
                }
                className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">⚙️</span>
                  <span>Page Setup & Layout Options</span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    mobileActiveAccordion === 'layout' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileActiveAccordion === 'layout' && (
                <div className="p-4 border-t border-slate-100 flex flex-col gap-5 bg-slate-50/40 animate-fade-in">
                  <PageSetupControls
                    options={store.options}
                    onOptionsChange={store.setOptions}
                  />
                  <div className="h-px bg-slate-200" />
                  <LayoutModeControls
                    options={store.options}
                    onOptionsChange={store.setOptions}
                  />
                </div>
              )}
            </div>

            {/* Document Outline Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                aria-expanded={mobileActiveAccordion === 'outline'}
                onClick={() =>
                  setMobileActiveAccordion(mobileActiveAccordion === 'outline' ? null : 'outline')
                }
                className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">📑</span>
                  <span>Document Outline & Sections</span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    mobileActiveAccordion === 'outline' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileActiveAccordion === 'outline' && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
                  <DocumentOutline layoutIR={store.layoutIR} />
                </div>
              )}
            </div>

            {/* File Info Accordion */}
            {fileName && onReset && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  aria-expanded={mobileActiveAccordion === 'file'}
                  onClick={() =>
                    setMobileActiveAccordion(mobileActiveAccordion === 'file' ? null : 'file')
                  }
                  className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">📁</span>
                    <span>File Metadata & Worksheet</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      mobileActiveAccordion === 'file' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mobileActiveAccordion === 'file' && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
                    <FileInfoCard
                      fileName={fileName}
                      fileSize={fileSize}
                      sheetNames={effectiveSheetNames}
                      activeSheetIndex={activeSheetIndex}
                      onSheetChange={onSheetChange}
                      onOpenFile={onOpenFile}
                      onReset={onReset || store.resetStudio}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sticky Quick Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg z-30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Theme</span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {store.options.theme.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Direct Download Document"
              onClick={handleDirectDownload}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-300 shadow-xs"
              title="Quick download PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Export Document"
              onClick={handleExportClick}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export PDF Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        defaultFileName={suggestedPdfName}
        pageCount={store.pdfResult?.pageCount || 1}
        fileSize={store.pdfResult?.pdfBuffer.byteLength || fileSize}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />
    </div>
  );
};

