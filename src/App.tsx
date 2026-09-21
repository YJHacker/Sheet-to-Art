import React, { useState } from 'react';
import { parserWorker } from './lib/workers';
import type { CellIR } from './types/cell-ir';

export default function App() {
  const [result, setResult] = useState<CellIR | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const cellIR = await parserWorker.parseFile(buffer, file.name, 0);
      setResult(cellIR);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#1e293b' }}>Sheet to Art</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
          Sprint 1 Core Parser Verification Studio (XLSX & CSV → Cell IR)
        </p>
      </header>

      <div style={{
        border: '2px dashed #cbd5e1',
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        background: '#f8fafc',
        marginBottom: '1.5rem',
      }}>
        <input
          type="file"
          id="file-upload"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          disabled={loading}
          style={{ display: 'none' }}
        />
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? 'Parsing...' : 'Select .xlsx or .csv File'}
        </label>
        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
          Supports .xlsx (OpenXML) and .csv formats
        </p>
      </div>

      {error && (
        <div style={{
          color: '#b91c1c',
          backgroundColor: '#fef2f2',
          padding: '1rem',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '1.5rem',
        }}>
          <strong>Parsing Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Parsed Sheet Metadata</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>File Name</span>
              <strong style={{ color: '#1e293b' }}>{result.metadata.fileName}</strong>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Sheet Name</span>
              <strong style={{ color: '#1e293b' }}>{result.metadata.sheetName}</strong>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Rows</span>
              <strong style={{ color: '#1e293b' }}>{result.metadata.totalRows}</strong>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Columns</span>
              <strong style={{ color: '#1e293b' }}>{result.metadata.totalCols}</strong>
            </div>
          </div>

          <details open>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Cell IR JSON Structure
            </summary>
            <pre style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '0.8125rem',
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
