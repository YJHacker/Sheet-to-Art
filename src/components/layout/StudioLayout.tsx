// src/components/layout/StudioLayout.tsx
import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Header } from '../studio/Header';
import { Toolbar } from '../studio/Toolbar';
import { Sidebar } from '../studio/Sidebar';
import { FileInfoCard } from '../upload/FileInfoCard';
import { PreviewViewport } from '../preview/PreviewViewport';
import { ExportModal } from '../studio/ExportModal';
import { downloadPDF, printPDF } from '../../lib/utils/download';

export interface StudioLayoutProps {
  fileName?: string;
  fileSize?: number;
  onExportClick?: () => void;
  onReset?: () => void;
  isRecompiling?: boolean;
  className?: string;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  fileName = 'document.csv',
  fileSize = 0,
  onExportClick,
  onReset,
  isRecompiling = false,
  className = '',
}) => {
  const store = useStudioStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportClick = () => {
    if (onExportClick) onExportClick();
    setIsExportModalOpen(true);
  };

  const handleDownload = (customName: string) => {
    if (store.pdfResult?.pdfBuffer) {
      downloadPDF(store.pdfResult.pdfBuffer, customName);
    }
  };

  const handlePrint = () => {
    if (store.pdfBlobUrl) {
      printPDF(store.pdfBlobUrl);
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 ${className}`}>
      {/* Header */}
      <Header
        hasDocument={true}
        fileName={fileName}
        onExportClick={handleExportClick}
        onReset={onReset || store.resetStudio}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
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
            className="w-full h-full"
          />
        </div>

        {/* Center Preview Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Toolbar
            isSidebarOpen={store.view.isSidebarOpen}
            onToggleSidebar={store.toggleSidebar}
          />

          <PreviewViewport
            layoutIR={store.layoutIR}
            pdfBlobUrl={store.pdfBlobUrl}
            previewMode={store.view.previewMode}
            zoom={store.view.zoom}
            currentPage={store.view.currentPage}
            totalPages={store.view.totalPages || store.pdfResult?.pageCount || 1}
            onZoomChange={store.setZoom}
            onPageChange={store.setCurrentPage}
            onPreviewModeChange={store.setPreviewMode}
            isLoading={isRecompiling}
          />
        </div>
      </div>

      {/* Export PDF Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        defaultFileName={fileName}
        pageCount={store.pdfResult?.pageCount || store.layoutIR?.totalPagesEstimate || 1}
        fileSize={store.pdfResult?.pdfBuffer.byteLength || fileSize}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />
    </div>
  );
};
