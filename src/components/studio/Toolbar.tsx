// src/components/studio/Toolbar.tsx
import React from 'react';
import { Button } from '../common/Button';

export interface ToolbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between p-2 studio-glass-panel border-b border-slate-200 bg-white/70 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
        className="!px-2.5 !py-1 text-xs text-slate-700"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
      </Button>
    </div>
  );
};
