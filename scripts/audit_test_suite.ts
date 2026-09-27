import fs from 'fs';
import path from 'path';

function auditTestFiles() {
  const testDirs = ['tests/unit', 'tests/integration'];
  const results: any[] = [];

  testDirs.forEach(dir => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    files.forEach(f => {
      const fullPath = path.join(dir, f);
      const content = fs.readFileSync(fullPath, 'utf-8');

      const usesGate = content.includes('GATE2027') || content.includes('GATE 2027');
      const usesSimpleTable = content.includes('simple-table.xlsx');
      const usesStyles = content.includes('styles.xlsx');
      const usesMergedCells = content.includes('merged-cells.xlsx');
      const usesCsv = content.includes('simple.csv') || content.includes('semicolon.csv');
      const usesSampleDataUtil = content.includes('sample-data') || content.includes('SAMPLE_WORKBOOK');
      const usesInlineMocks = content.includes('mockCellIR') || content.includes('mockLayoutIR') || content.includes('createMock') || (content.includes('rows: [') && !usesGate);

      const fixturesUsed: string[] = [];
      if (usesGate) fixturesUsed.push('Real GATE 2027 Fixture');
      if (usesSimpleTable) fixturesUsed.push('simple-table.xlsx');
      if (usesStyles) fixturesUsed.push('styles.xlsx');
      if (usesMergedCells) fixturesUsed.push('merged-cells.xlsx');
      if (usesCsv) fixturesUsed.push('csv fixtures');
      if (usesSampleDataUtil) fixturesUsed.push('sample-data generator');
      if (usesInlineMocks) fixturesUsed.push('inline mock IRs');

      results.push({
        file: fullPath,
        category: usesGate ? (fixturesUsed.length > 1 ? 'Hybrid (Real + Synthetic)' : 'Real GATE Fixture') : 'Synthetic / Mock Data',
        fixtures: fixturesUsed.length > 0 ? fixturesUsed : ['Unit Mocks / Primitives']
      });
    });
  });

  console.log('=== TEST SUITE FIXTURE AUDIT ===\n');
  console.log(`Total test files audited: ${results.length}\n`);

  const syntheticOnly = results.filter(r => r.category === 'Synthetic / Mock Data');
  const realOrHybrid = results.filter(r => r.category !== 'Synthetic / Mock Data');

  console.log(`--- [1] REAL GATE FIXTURE TESTS (${realOrHybrid.length} files) ---`);
  realOrHybrid.forEach(r => {
    console.log(`  ${r.file} [${r.category}] -> ${r.fixtures.join(', ')}`);
  });

  console.log(`\n--- [2] SYNTHETIC / MOCK TESTS (${syntheticOnly.length} files) ---`);
  syntheticOnly.forEach(r => {
    console.log(`  ${r.file} -> ${r.fixtures.join(', ')}`);
  });
}

auditTestFiles();
