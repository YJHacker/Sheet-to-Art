// src/components/preview/DocumentPreview.tsx
import React from 'react';
import type { LayoutIR, TableSection, KpiGridContent, TextSectionContent } from '../../types/layout-ir';
import { getTheme } from '../../lib/typst/themes';

export interface DocumentPreviewProps {
  layoutIR: LayoutIR | null;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  layoutIR,
  className = '',
}) => {
  if (!layoutIR) {
    return (
      <div className={`p-12 text-center text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="font-medium text-slate-600">No document data loaded</p>
        <p className="text-xs text-slate-400 mt-1">Upload an Excel or CSV file to see the formatted document preview.</p>
      </div>
    );
  }

  const theme = getTheme(layoutIR.globalStyles.theme);
  const isLandscape = layoutIR.globalStyles.orientation === 'landscape';
  const containerMaxWidth = isLandscape ? 'max-w-[1000px]' : 'max-w-[800px]';

  return (
    <div
      className={`w-full ${containerMaxWidth} mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-canvas border border-slate-200/90 font-sans transition-all duration-150 ${className}`}
      style={{
        color: theme.textColor,
        fontFamily: theme.fontFamily.includes('Serif')
          ? '"Libertinus Serif", "Georgia", "Times New Roman", serif'
          : '"Inter", "Liberation Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Document Header & Title Banner */}
      {layoutIR.title && (
        <div
          className="mb-8 pb-4"
          style={{
            borderBottom: `2px solid ${theme.primaryColor}`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1
              className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug"
              style={{ color: theme.primaryColor }}
            >
              {layoutIR.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-medium" style={{ color: theme.secondaryColor }}>
            <span className="px-2 py-0.5 rounded-sm bg-slate-100 uppercase tracking-wider font-bold text-[10px]">
              {layoutIR.globalStyles.pageSize.toUpperCase()} • {layoutIR.globalStyles.orientation.toUpperCase()}
            </span>
            <span>•</span>
            <span>{layoutIR.sections.length} Document Sections</span>
            <span>•</span>
            <span>Theme: {theme.displayName}</span>
          </div>
        </div>
      )}

      {/* Document Body Sections */}
      <div className="flex flex-col gap-8">
        {layoutIR.sections.map((section, sIdx) => {
          // 1. KPI Grid / Checkpoint Milestone Cards
          if (section.type === 'kpi-grid') {
            const kpi = section.content as KpiGridContent;
            const cols = kpi.columns || Math.min(kpi.items.length, 4) || 2;
            const gridColsClass =
              cols === 1
                ? 'grid-cols-1'
                : cols === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : cols === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4';

            return (
              <div key={sIdx} className="flex flex-col gap-3">
                {section.title && (
                  <h2
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    style={{ color: theme.primaryColor }}
                  >
                    <span className="w-1.5 h-3 rounded-full inline-block" style={{ backgroundColor: theme.primaryColor }} />
                    {section.title}
                  </h2>
                )}
                <div className={`grid ${gridColsClass} gap-3`}>
                  {kpi.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg flex flex-col justify-between shadow-2xs transition hover:shadow-xs"
                      style={{
                        backgroundColor: theme.kpiBackground,
                        border: `1px solid ${theme.kpiBorderColor}`,
                      }}
                    >
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider truncate mb-1"
                        style={{ color: theme.secondaryColor }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-base font-extrabold leading-tight break-words"
                        style={{ color: theme.kpiAccentColor }}
                      >
                        {item.value}
                      </span>
                      {item.change && (
                        <span
                          className="text-[11px] font-semibold mt-1"
                          style={{ color: theme.secondaryColor }}
                        >
                          {item.change}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // 2. Table Section
          if (section.type === 'table') {
            const tbl = section.content as TableSection;
            return (
              <div key={sIdx} className="flex flex-col gap-3 overflow-x-auto">
                {section.title && (
                  <h2
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    style={{ color: theme.primaryColor }}
                  >
                    <span className="w-1.5 h-3 rounded-full inline-block" style={{ backgroundColor: theme.primaryColor }} />
                    {section.title}
                  </h2>
                )}
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: theme.borderColor }}>
                  <table className="w-full border-collapse text-xs">
                    {tbl.columns && tbl.columns.length > 0 && (
                      <thead
                        style={{
                          backgroundColor: theme.headerBackground,
                          color: theme.headerTextColor,
                          borderBottom: `1.5px solid ${theme.borderColor}`,
                        }}
                      >
                        <tr>
                          {tbl.columns.map((col, cIdx) => (
                            <th
                              key={cIdx}
                              className={`px-3 py-2.5 font-bold tracking-tight border-r last:border-r-0 ${
                                col.alignment === 'right'
                                  ? 'text-right'
                                  : col.alignment === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                              style={{
                                borderColor: theme.borderColor,
                                width: col.suggestedWidth ? `${col.suggestedWidth}px` : undefined,
                              }}
                            >
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {tbl.rows.map((row, rIdx) => {
                        const isEven = rIdx % 2 === 1;
                        const rowBg = isEven && tbl.alternatingRows ? theme.zebraBackground : '#FFFFFF';
                        return (
                          <tr
                            key={rIdx}
                            className="border-b last:border-b-0 transition-colors"
                            style={{
                              backgroundColor: rowBg,
                              borderColor: theme.borderColor,
                            }}
                          >
                            {row.cells.map((cell, cIdx) => {
                              const col = tbl.columns[cIdx];
                              const align = cell.alignment || col?.alignment || 'left';
                              const alignClass =
                                align === 'right'
                                  ? 'text-right font-mono'
                                  : align === 'center'
                                  ? 'text-center'
                                  : 'text-left';

                              const cellStyle: React.CSSProperties = {
                                borderColor: theme.borderColor,
                              };

                              if (cell.style?.bgColor) {
                                cellStyle.backgroundColor = cell.style.bgColor;
                              }
                              if (cell.style?.textColor) {
                                cellStyle.color = cell.style.textColor;
                              }
                              if (cell.style?.bold) {
                                cellStyle.fontWeight = 'bold';
                              }
                              if (cell.style?.italic) {
                                cellStyle.fontStyle = 'italic';
                              }

                              return (
                                <td
                                  key={cIdx}
                                  className={`px-3 py-2 border-r last:border-r-0 ${alignClass} leading-relaxed`}
                                  style={cellStyle}
                                >
                                  {cell.formattedValue || String(cell.value ?? '')}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          // 3. Text / Callout / Narrative Section
          const textContent = section.content as TextSectionContent;
          return (
            <div
              key={sIdx}
              className="p-4 rounded-lg shadow-2xs text-xs leading-relaxed"
              style={{
                backgroundColor: theme.noteBackground,
                borderLeft: `4px solid ${theme.noteBorderColor}`,
                color: theme.textColor,
              }}
            >
              {section.title && (
                <h3
                  className="font-bold text-xs mb-1.5 flex items-center gap-1.5"
                  style={{ color: theme.primaryColor }}
                >
                  {section.title}
                </h3>
              )}
              {textContent.paragraphs?.map((p, pIdx) => (
                <p key={pIdx} className="mb-1.5 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentPreview;
