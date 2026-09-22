import { describe, it, expect } from 'vitest';
import type {
  ColumnDescriptor,
  TableCell,
  TableRow,
  TableSection,
  DocumentSection,
  GlobalStyles,
  LayoutIR,
  LayoutWorkerAPI,
} from '../../src/types/layout-ir';

describe('Layout IR Type Definitions', () => {
  it('should instantiate a valid ColumnDescriptor structure', () => {
    const col: ColumnDescriptor = {
      index: 0,
      header: 'Revenue',
      dataType: 'number',
      alignment: 'right',
      minWidth: 40,
      maxWidth: 120,
      suggestedWidth: 80,
      numberFormat: 'currency',
      stats: {
        nullCount: 0,
        uniqueValues: 10,
        maxLength: 8,
      },
    };

    expect(col.header).toBe('Revenue');
    expect(col.dataType).toBe('number');
    expect(col.alignment).toBe('right');
    expect(col.numberFormat).toBe('currency');
  });

  it('should construct a complete LayoutIR object', () => {
    const tableCell: TableCell = {
      value: 125000,
      formattedValue: '$125,000.00',
      alignment: 'right',
      style: { bold: true },
    };

    const tableRow: TableRow = {
      cells: [tableCell],
    };

    const tableSection: TableSection = {
      columns: [
        {
          index: 0,
          header: 'Amount',
          dataType: 'number',
          alignment: 'right',
          minWidth: 50,
          maxWidth: 150,
          suggestedWidth: 100,
          numberFormat: 'currency',
          stats: { nullCount: 0, uniqueValues: 1, maxLength: 11 },
        },
      ],
      rows: [tableRow],
      headerStyle: {
        bold: true,
        bgColor: '#1E293B',
        textColor: '#FFFFFF',
      },
      alternatingRows: true,
    };

    const docSection: DocumentSection = {
      type: 'table',
      title: 'Q3 Financials',
      content: tableSection,
    };

    const globalStyles: GlobalStyles = {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      fontFamily: 'Inter',
      baseFontSize: 9,
      theme: 'modern-clean',
    };

    const layoutIR: LayoutIR = {
      documentType: 'report',
      title: 'Quarterly Summary',
      sections: [docSection],
      globalStyles,
    };

    expect(layoutIR.documentType).toBe('report');
    expect(layoutIR.sections).toHaveLength(1);
    expect(layoutIR.sections[0]?.type).toBe('table');
    expect(layoutIR.globalStyles.pageSize).toBe('a4');

    // Verify LayoutWorkerAPI type is valid
    const workerAPI: Partial<LayoutWorkerAPI> = {};
    expect(workerAPI).toBeDefined();
  });
});
