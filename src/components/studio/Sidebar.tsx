// src/components/studio/Sidebar.tsx
import React from 'react';
import type { StudioOptions } from '../../types/studio';
import type { LayoutIR } from '../../types/layout-ir';
import type { ThemeName } from '../../types/typst';
import { ThemeSelector } from './ThemeSelector';
import { PageSetupControls } from './PageSetupControls';
import { LayoutModeControls } from './LayoutModeControls';
import { DocumentOutline } from './DocumentOutline';

export interface SidebarProps {
  activeTab: 'theme' | 'layout' | 'outline';
  onTabChange: (tab: 'theme' | 'layout' | 'outline') => void;
  options: StudioOptions;
  onOptionsChange: (updates: Partial<StudioOptions>) => void;
  layoutIR: LayoutIR | null;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  options,
  onOptionsChange,
  layoutIR,
  className = '',
}) => {
  const tabs: { id: 'theme' | 'layout' | 'outline'; label: string }[] = [
    { id: 'theme', label: 'Themes' },
    { id: 'layout', label: 'Layout & Setup' },
    { id: 'outline', label: 'Outline' },
  ];

  return (
    <aside className={`flex flex-col h-full studio-glass-panel border-r border-slate-200 bg-white/90 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex items-center p-2 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="grid grid-cols-3 w-full bg-slate-200/70 p-1 rounded-lg gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`text-xs font-semibold py-1.5 px-2 rounded-md transition-all duration-150 text-center truncate cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-xs'
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
            <div className="h-px bg-slate-200" />
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
