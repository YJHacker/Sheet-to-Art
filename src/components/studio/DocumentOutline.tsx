// src/components/studio/DocumentOutline.tsx
import React from 'react';
import type { LayoutIR, LayoutSection } from '../../types/layout-ir';

export interface DocumentOutlineProps {
  layoutIR: LayoutIR | null;
  className?: string;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  layoutIR,
  className = '',
}) => {
  if (!layoutIR || !layoutIR.sections || layoutIR.sections.length === 0) {
    return (
      <div className={`p-6 text-center text-slate-400 text-sm ${className}`}>
        No document structure detected yet.
      </div>
    );
  }

  const getSectionBadge = (type: LayoutSection['type']) => {
    switch (type) {
      case 'table':
        return { label: 'Table', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'kpi-grid':
        return { label: 'KPI Grid', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'key-value':
        return { label: 'Metadata', style: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'text':
      default:
        return { label: 'Text Note', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header Summary */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Semantic Structure
        </span>
        <span className="text-xs font-medium text-slate-500">
          {layoutIR.sections.length} Sections Detected
        </span>
      </div>

      {/* Section Items */}
      <div className="flex flex-col gap-2">
        {layoutIR.sections.map((section, idx) => {
          const badge = getSectionBadge(section.type);
          const title = section.title || `Section ${idx + 1}`;

          return (
            <div
              key={section.id || idx}
              className="flex items-start justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-white/70 shadow-xs"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate" title={title}>
                  {title}
                </span>
                <span className="text-xs text-slate-400">
                  Rows {section.startRow + 1}–{section.endRow + 1} ({section.rowCount} rows, {section.colCount} cols)
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase shrink-0 ${badge.style}`}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Document Stats Footer */}
      {layoutIR.stats && (
        <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Tables: <strong className="text-slate-700">{layoutIR.stats.totalTables}</strong></span>
          <span>KPI Grids: <strong className="text-slate-700">{layoutIR.stats.totalKpiGrids}</strong></span>
          <span>Cells: <strong className="text-slate-700">{layoutIR.stats.totalCells}</strong></span>
        </div>
      )}
    </div>
  );
};
