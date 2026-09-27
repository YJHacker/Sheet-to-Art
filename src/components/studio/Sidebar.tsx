// src/components/studio/Sidebar.tsx
import React from 'react';
import type { StudioOptions } from '../../types/studio';
import type { LayoutIR } from '../../types/layout-ir';
import type { ThemeName } from '../../types/typst';
import { ThemeSelector } from './ThemeSelector';
import { PageSetupControls } from './PageSetupControls';
import { LayoutModeControls } from './LayoutModeControls';
import { DocumentOutline } from './DocumentOutline';
import { FileInfoCard } from '../upload/FileInfoCard';

export interface SidebarProps {
  activeTab: 'theme' | 'layout' | 'outline';
  onTabChange: (tab: 'theme' | 'layout' | 'outline') => void;
  options: StudioOptions;
  onOptionsChange: (updates: Partial<StudioOptions>) => void;
  layoutIR: LayoutIR | null;
  fileName?: string;
  fileSize?: number;
  sheetNames?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
  onOpenFile?: (file: File) => void;
  onReset?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  options,
  onOptionsChange,
  layoutIR,
  fileName = 'document.csv',
  fileSize = 0,
  sheetNames = [],
  activeSheetIndex = 0,
  onSheetChange,
  onOpenFile,
  onReset,
  className = '',
}) => {
  const tabs: { id: 'theme' | 'layout' | 'outline'; label: string }[] = [
    { id: 'theme', label: 'Themes' },
    { id: 'layout', label: 'Layout & Setup' },
    { id: 'outline', label: 'Outline' },
  ];

  return (
    <aside className={`flex flex-col h-full studio-glass-panel border-r border-slate-200/90 bg-white/95 ${className}`}>
      {/* File Metadata Card */}
      {fileName && onReset && (
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <FileInfoCard
            fileName={fileName}
            fileSize={fileSize}
            sheetNames={sheetNames}
            activeSheetIndex={activeSheetIndex}
            onSheetChange={onSheetChange}
            onOpenFile={onOpenFile}
            onReset={onReset}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center p-2.5 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="grid grid-cols-3 w-full bg-slate-200/80 p-1 rounded-xl gap-1" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`text-xs font-bold py-2 px-2 rounded-lg transition-all duration-150 text-center truncate cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 studio-scrollbar">
        {activeTab === 'theme' && (
          <ThemeSelector
            activeTheme={options.theme}
            onThemeChange={(theme: ThemeName) => onOptionsChange({ theme })}
          />
        )}

        {activeTab === 'layout' && (
          <div className="flex flex-col gap-6">
            <PageSetupControls
              options={options}
              onOptionsChange={onOptionsChange}
            />
            <div className="h-px bg-slate-200/80" />
            <LayoutModeControls
              options={options}
              onOptionsChange={onOptionsChange}
            />
          </div>
        )}

        {activeTab === 'outline' && (
          <DocumentOutline layoutIR={layoutIR} />
        )}
      </div>
    </aside>
  );
};


