// src/lib/utils/sample-data.ts

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  filename: string;
  csvContent: string;
  category: 'finance' | 'sales' | 'operations';
}

const FINANCIAL_STATEMENT_CSV = `Q3 2026 Consolidated Statement of Operations
Metric,Q1 2026 ($M),Q2 2026 ($M),Q3 2026 ($M),YoY Growth (%)
Subscription Revenue,124.50,138.20,154.80,+32.4%
Professional Services,18.30,19.10,21.50,+14.2%
Total Revenue,142.80,157.30,176.30,+29.8%
Cost of Revenue (Subscription),24.90,27.60,30.90,+24.1%
Cost of Revenue (Services),14.60,15.20,16.80,+15.1%
Total Cost of Revenue,39.50,42.80,47.70,+20.8%
Gross Profit,103.30,114.50,128.60,+33.6%
Gross Margin (%),72.3%,72.8%,72.9%,+0.6%
Research & Development,38.20,41.50,45.20,+22.1%
Sales & Marketing,42.10,46.80,51.30,+28.5%
General & Administrative,11.50,12.20,13.40,+16.5%
Total Operating Expenses,91.80,100.50,109.90,+24.2%
Operating Income,11.50,14.00,18.70,+112.5%
Operating Margin (%),8.1%,8.9%,10.6%,+2.5%
Net Income Before Tax,12.10,14.80,19.40,+98.0%
Income Tax Expense,2.40,2.90,3.80,+95.0%
Net Income,9.70,11.90,15.60,+98.7%
EBITDA,16.80,19.70,25.20,+85.3%
`;

const SALES_REPORT_CSV = `Regional Sales & Performance Matrix - September 2026
Region,Lead Representative,Product Line,Units Sold,Avg Price ($),Gross Sales ($),Target ($),Quota Attainment (%)
North America East,Sarah Jenkins,Enterprise Suite,340,1200.00,408000.00,380000.00,107.4%
North America West,Michael Chang,Cloud Analytics,520,850.00,442000.00,400000.00,110.5%
North America Central,David Ross,Starter Tier,890,250.00,222500.00,250000.00,89.0%
EMEA Central (DACH),Helena Becker,Enterprise Suite,210,1450.00,304500.00,290000.00,105.0%
EMEA UK & Nordics,Alastair Ward,Cloud Analytics,310,950.00,294500.00,310000.00,95.0%
APAC - Tokyo,Kenji Sato,Enterprise Suite,185,1500.00,277500.00,260000.00,106.7%
APAC - Singapore,Priya Nair,Cloud Analytics,290,900.00,261000.00,240000.00,108.8%
Latin America,Mateo Gomez,Starter Tier,640,240.00,153600.00,160000.00,96.0%
Total / Global Average,All Representatives,All Products,3385,698.50,2363600.00,2290000.00,103.2%
`;

const EMPLOYEE_ROSTER_CSV = `Global Engineering & Product Directory
Employee ID,Full Name,Role,Department,Level,Office Location,Status,Tenure (Years)
ENG-001,Elena Vance,VP of Engineering,Infrastructure,Executive,San Francisco,Active,5.2
ENG-002,Marcus Brody,Staff Systems Architect,Platform,L6,New York,Active,4.1
ENG-003,Amina Al-Mansoor,Senior Frontend Lead,Design Systems,L5,London,Active,3.5
ENG-004,Liam O'Connor,Distributed Systems Eng,Core Backend,L4,Dublin,Active,2.8
ENG-005,Chloe Dubois,Compiler & WASM Engineer,Performance,L4,Paris,Active,1.9
ENG-006,Siddharth Gupta,Senior ML Infrastructure,AI Systems,L5,Bangalore,Active,3.1
ENG-007,Naomi Tanaka,UI/UX Design Director,Product Design,Executive,Tokyo,Active,4.8
ENG-008,Gabriel Silva,QA Automation Lead,Reliability,L4,Sao Paulo,Active,2.3
ENG-009,Hannah Lindqvist,Security & Compliance,SecOps,L5,Stockholm,Active,3.9
ENG-010,Chen Wei,Database Reliability Eng,Infrastructure,L4,Singapore,Active,2.0
`;

export const SAMPLE_DATASETS: Record<string, SampleDataset> = {
  'financial-statement': {
    id: 'financial-statement',
    name: 'Financial Profit & Loss',
    description: 'Quarterly financial report with revenue breakdown, margins, and EBITDA metrics.',
    filename: 'financial-statement-q3-2026.csv',
    csvContent: FINANCIAL_STATEMENT_CSV,
    category: 'finance',
  },
  'sales-report': {
    id: 'sales-report',
    name: 'Regional Sales Performance',
    description: 'Regional sales performance matrix with quota attainment and revenue volume.',
    filename: 'regional-sales-performance.csv',
    csvContent: SALES_REPORT_CSV,
    category: 'sales',
  },
  'employee-roster': {
    id: 'employee-roster',
    name: 'Engineering Team Directory',
    description: 'Departmental staff directory with roles, levels, and global office locations.',
    filename: 'engineering-team-roster.csv',
    csvContent: EMPLOYEE_ROSTER_CSV,
    category: 'operations',
  },
};

export function listSampleDatasets(): SampleDataset[] {
  return Object.values(SAMPLE_DATASETS);
}

export function getSampleSpreadsheet(sampleId: string): {
  id: string;
  name: string;
  description: string;
  filename: string;
  buffer: ArrayBuffer;
  type: 'csv';
} {
  const sample = SAMPLE_DATASETS[sampleId];
  if (!sample) {
    throw new Error(`Unknown sample dataset ID: ${sampleId}. Available: ${Object.keys(SAMPLE_DATASETS).join(', ')}`);
  }

  const encoder = new TextEncoder();
  const uint8 = encoder.encode(sample.csvContent);
  const arrayBuffer = new ArrayBuffer(uint8.byteLength);
  new Uint8Array(arrayBuffer).set(uint8);

  return {
    id: sample.id,
    name: sample.filename,
    description: sample.description,
    filename: sample.filename,
    buffer: arrayBuffer,
    type: 'csv',
  };
}
