// src/components/studio/ThemeSelector.tsx
import React from 'react';
import { THEMES } from '../../lib/typst/themes';
import type { ThemeName } from '../../types/typst';

export interface ThemeSelectorProps {
  activeTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  variant?: 'grid' | 'horizontal' | 'compact';
  className?: string;
}

interface ThemeMeta {
  id: ThemeName;
  name: string;
  category: string;
  description: string;
  fontType: 'Sans-Serif' | 'Serif' | 'Compact';
}

const THEME_METAS: ThemeMeta[] = [
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    category: 'Default',
    description: 'Corporate blue accent, clean sans typography & subtle grid borders.',
    fontType: 'Sans-Serif',
  },
  {
    id: 'executive-serif',
    name: 'Executive Serif',
    category: 'Formal',
    description: 'Dark slate headers with elegant serif typography for board presentations.',
    fontType: 'Serif',
  },
  {
    id: 'compact-ledger',
    name: 'Compact Ledger',
    category: 'High Density',
    description: 'Tight padding and dense tabular layout optimized for data sheets.',
    fontType: 'Compact',
  },
  {
    id: 'emerald-report',
    name: 'Emerald Report',
    category: 'Modern Green',
    description: 'Emerald green accents with fresh zebra striping for growth metrics.',
    fontType: 'Sans-Serif',
  },
  {
    id: 'monochrome-pure',
    name: 'Monochrome Pure',
    category: 'Laser Print',
    description: 'High contrast black & white laser printing with razor sharp lines.',
    fontType: 'Sans-Serif',
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  activeTheme,
  onThemeChange,
  variant = 'grid',
  className = '',
}) => {
  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Document Themes
          </label>
          <span className="text-[11px] font-medium text-slate-500">Tap to Switch</span>
        </div>

        {/* Horizontally scrollable theme strip */}
        <div
          role="region"
          aria-label="Theme selection carousel"
          className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 studio-scrollbar snap-x snap-mandatory"
        >
          {THEME_METAS.map((meta) => {
            const themeDef = THEMES[meta.id];
            const isActive = activeTheme === meta.id;

            return (
              <button
                key={meta.id}
                type="button"
                role="button"
                aria-pressed={isActive}
                aria-label={`${meta.name} theme - ${meta.category}`}
                onClick={() => onThemeChange(meta.id)}
                className={`flex-shrink-0 w-40 sm:w-44 snap-start flex flex-col text-left p-2.5 rounded-xl border transition-all duration-150 relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {/* Active Checkmark */}
                {isActive && (
                  <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] shadow-xs">
                    ✓
                  </span>
                )}

                {/* Theme Name & Font Badge */}
                <div className="flex items-center gap-1.5 mb-1.5 pr-4">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                    {meta.name}
                  </span>
                  <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                    {meta.fontType}
                  </span>
                </div>

                {/* Color Swatches */}
                <div data-testid="color-swatch" className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: themeDef.primaryColor }}
                    title={`Primary: ${themeDef.primaryColor}`}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: themeDef.headerBackground }}
                    title={`Header: ${themeDef.headerBackground}`}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: themeDef.accentColor }}
                    title={`Accent: ${themeDef.accentColor}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Grid Layout for Desktop Sidebar
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Document Theme (5 Launch Themes)
        </label>
        <span className="text-xs font-medium text-slate-500">Instant WASM Preview</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {THEME_METAS.map((meta) => {
          const themeDef = THEMES[meta.id];
          const isActive = activeTheme === meta.id;

          return (
            <button
              key={meta.id}
              type="button"
              role="button"
              aria-pressed={isActive}
              aria-label={`${meta.name} theme - ${meta.category}`}
              onClick={() => onThemeChange(meta.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-150 relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              {/* Active Checkmark Pill */}
              {isActive && (
                <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs shadow-xs font-bold">
                  ✓
                </span>
              )}

              {/* Theme Name & Font Badge */}
              <div className="flex items-center gap-2 mb-1.5 pr-6">
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 truncate">
                  {meta.name}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                  {meta.fontType}
                </span>
              </div>

              {/* Color Swatches */}
              <div data-testid="color-swatch" className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: themeDef.primaryColor }}
                  title={`Primary: ${themeDef.primaryColor}`}
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: themeDef.headerBackground }}
                  title={`Header: ${themeDef.headerBackground}`}
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: themeDef.accentColor }}
                  title={`Accent: ${themeDef.accentColor}`}
                />
              </div>

              {/* Theme Description */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

