// src/components/studio/DocumentOutline.tsx
import type { LayoutIR, DocumentSection, TableSection, KpiGridContent, TextSectionContent } from '../../types/layout-ir';

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

  const getSectionInfo = (section: DocumentSection, idx: number) => {
    const title = section.title || `Section ${idx + 1}`;
    switch (section.type) {
      case 'table': {
        const tbl = section.content as TableSection;
        const colCount = tbl.columns?.length || 0;
        const rowCount = tbl.rows?.length || 0;
        return {
          title,
          badge: { label: 'Table', style: 'bg-blue-50 text-blue-700 border-blue-200' },
          detail: `${rowCount} rows, ${colCount} columns`,
        };
      }
      case 'kpi-grid': {
        const kpi = section.content as KpiGridContent;
        const itemCount = kpi.items?.length || 0;
        return {
          title,
          badge: { label: 'KPI Grid', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          detail: `${itemCount} key metrics`,
        };
      }
      case 'text':
      default: {
        const text = section.content as TextSectionContent;
        const pCount = text.paragraphs?.length || 0;
        return {
          title,
          badge: { label: 'Text Note', style: 'bg-amber-50 text-amber-700 border-amber-200' },
          detail: `${pCount} paragraphs`,
        };
      }
    }
  };

  const tableCount = layoutIR.sections.filter((s) => s.type === 'table').length;
  const kpiCount = layoutIR.sections.filter((s) => s.type === 'kpi-grid').length;
  const textCount = layoutIR.sections.filter((s) => s.type === 'text').length;

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
          const info = getSectionInfo(section, idx);

          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-white/70 shadow-xs"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate" title={info.title}>
                  {info.title}
                </span>
                <span className="text-xs text-slate-400">{info.detail}</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase shrink-0 ${info.badge.style}`}>
                {info.badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Document Stats Footer */}
      <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Tables: <strong className="text-slate-700">{tableCount}</strong></span>
        <span>KPI Grids: <strong className="text-slate-700">{kpiCount}</strong></span>
        <span>Notes: <strong className="text-slate-700">{textCount}</strong></span>
      </div>
    </div>
  );
};
