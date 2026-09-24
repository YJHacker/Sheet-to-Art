// src/components/preview/PageNav.tsx
import React from 'react';
import { Button } from '../common/Button';
import { formatPageCount } from '../../lib/utils/formatters';

export interface PageNavProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PageNav: React.FC<PageNavProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className={`flex items-center gap-1.5 bg-white/90 border border-slate-200 shadow-xs rounded-lg p-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Previous page"
        disabled={isFirst}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="!px-2 !py-1 !min-h-[28px] text-slate-600"
      >
        ‹
      </Button>

      <span className="text-xs font-semibold px-2 text-slate-700 select-none min-w-[80px] text-center">
        {formatPageCount(currentPage, totalPages)}
      </span>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Next page"
        disabled={isLast}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="!px-2 !py-1 !min-h-[28px] text-slate-600"
      >
        ›
      </Button>
    </div>
  );
};
