// src/components/preview/DOMPreviewFallback.tsx
import React from 'react';
import type { LayoutIR, TableSection, KPIGridSection } from '../../types/layout-ir';

export interface DOMPreviewFallbackProps {
  layoutIR: LayoutIR | null;
  className?: string;
}

export const DOMPreviewFallback: React.FC<DOMPreviewFallbackProps> = ({
  layoutIR,
  className = '',
}) => {
  if (!layoutIR) {
    return (
      <div className={`p-8 text-center text-slate-400 ${className}`}>
        No document data loaded.
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[800px] mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-canvas border border-slate-200/80 font-sans text-slate-800 ${className}`}>
      {/* Title */}
      {layoutIR.documentTitle && (
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {layoutIR.documentTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publication Layout Structure • {layoutIR.pageSize.toUpperCase()} {layoutIR.orientation}
          </p>
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-8">
        {layoutIR.sections.map((section, sIdx) => {
          if (section.type === 'kpi-grid') {
            const kpi = section as KPIGridSection;
            return (
              <div key={section.id || sIdx} className="flex flex-col gap-3">
                {section.title && (
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    {section.title}
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {kpi.data.map((row, rIdx) =>
                    row.map((cell, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col"
                      >
                        <span className="text-xs font-medium text-slate-500 truncate">
                          Metric {cIdx + 1}
                        </span>
                        <span className="text-lg font-bold text-blue-600 mt-1">
                          {cell.formattedValue || cell.rawValue}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }

          if (section.type === 'table') {
            const tbl = section as TableSection;
            return (
              <div key={section.id || sIdx} className="flex flex-col gap-3 overflow-x-auto">
                {section.title && (
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    {section.title}
                  </h2>
                )}
                <table className="w-full border-collapse text-xs border border-slate-200 rounded-lg overflow-hidden">
                  {tbl.headers && tbl.headers.length > 0 && (
                    <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                      {tbl.headers.map((headerRow, hIdx) => (
                        <tr key={hIdx}>
                          {headerRow.cells.map((hCell, hcIdx) => (
                            <th key={hcIdx} className="px-3 py-2 text-left border-r border-slate-200 last:border-r-0">
                              {hCell.formattedValue || hCell.rawValue}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                  )}
                  <tbody>
                    {tbl.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={`border-b border-slate-200/70 last:border-b-0 ${
                          rIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        {row.cells.map((cell, cIdx) => {
                          const isNum = cell.dataType === 'number' || cell.dataType === 'currency' || cell.dataType === 'percentage';
                          return (
                            <td
                              key={cIdx}
                              className={`px-3 py-2 border-r border-slate-200/70 last:border-r-0 ${
                                isNum ? 'text-right font-mono' : 'text-left'
                              }`}
                            >
                              {cell.formattedValue || cell.rawValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <div key={section.id || sIdx} className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
              <strong className="block mb-1 font-semibold">{section.title || 'Note'}</strong>
              <p>{section.data?.map(row => row.map(c => c.formattedValue).join(' ')).join('\n') || ''}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
