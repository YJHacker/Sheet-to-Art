// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { useStudioStore } from './store/useStudioStore';
import { executeDocumentPipeline, recompilePDF, revokePDFBlobUrl } from './lib/pipeline/document-pipeline';
import { getSampleSpreadsheet } from './lib/utils/sample-data';
import { Dropzone } from './components/upload/Dropzone';
import { ProgressBar } from './components/common/ProgressBar';
import { Toast } from './components/common/Toast';
import { StudioLayout } from './components/layout/StudioLayout';
import './styles/studio.css';

export default function App() {
  const store = useStudioStore();
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isRecompiling, setIsRecompiling] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBlobUrlRef = useRef<string | null>(null);

  // Keep track of previous blob URL to clean up on unmount or URL replacement
  useEffect(() => {
    if (store.pdfBlobUrl && store.pdfBlobUrl !== previousBlobUrlRef.current) {
      if (previousBlobUrlRef.current) {
        revokePDFBlobUrl(previousBlobUrlRef.current);
      }
      previousBlobUrlRef.current = store.pdfBlobUrl;
    }
  }, [store.pdfBlobUrl]);

  // Clean up blob URL on component unmount
  useEffect(() => {
    return () => {
      if (previousBlobUrlRef.current) {
        revokePDFBlobUrl(previousBlobUrlRef.current);
      }
    };
  }, []);

  const handleProcessBuffer = async (buffer: ArrayBuffer, fileName: string, sheetIndex: number = 0) => {
    setErrorToast(null);

    try {
      const result = await executeDocumentPipeline(
        buffer,
        fileName,
        sheetIndex,
        store.options,
        (progress) => {
          store.setPipelineProgress(progress);
        }
      );

      const sheetNames = result.cellIR.metadata.sheetNames || [result.cellIR.metadata.sheetName || 'Sheet1'];

      store.setFile({
        name: fileName,
        size: buffer.byteLength,
        buffer,
        sheetNames,
        activeSheetIndex: sheetIndex,
      });

      store.setDocumentData({
        cellIR: result.cellIR,
        layoutIR: result.layoutIR,
        pdfResult: result.pdfResult,
        pdfBlobUrl: result.pdfBlobUrl,
      });

      store.setViewState({
        totalPages: result.pdfResult.pageCount,
        currentPage: 1,
      });
    } catch (err: any) {
      console.error('Document processing error:', err);
      const msg = err?.message || 'Failed to process spreadsheet.';
      setErrorToast(msg);
      store.setPipelineProgress({
        stage: 'error',
        error: msg,
      });
    }
  };

  const handleSheetChange = async (sheetIndex: number) => {
    if (!store.file || !store.file.buffer) return;
    await handleProcessBuffer(store.file.buffer, store.file.name, sheetIndex);
  };

  const handleFileSelected = async (file: File) => {
    try {
      let buffer: ArrayBuffer;
      if (typeof file.arrayBuffer === 'function') {
        buffer = await file.arrayBuffer();
      } else {
        buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(new Error('Failed to read file via FileReader'));
          reader.readAsArrayBuffer(file);
        });
      }
      await handleProcessBuffer(buffer, file.name, 0);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to read file buffer.');
    }
  };

  const handleSampleSelected = async (sampleId: string) => {
    try {
      const sample = getSampleSpreadsheet(sampleId);
      await handleProcessBuffer(sample.buffer, sample.filename, 0);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to load sample dataset.');
    }
  };

  // Debounced PDF re-compilation when StudioOptions change
  const optionsKey = JSON.stringify(store.options);
  const initialMountRef = useRef(true);

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    if (!store.layoutIR || store.pipeline.stage === 'idle' || store.pipeline.stage === 'error') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsRecompiling(true);
      try {
        const recompiled = await recompilePDF(store.layoutIR!, store.options, store.cellIR);
        store.setDocumentData({
          layoutIR: recompiled.layoutIR,
          pdfResult: recompiled.pdfResult,
          pdfBlobUrl: recompiled.pdfBlobUrl,
        });
        store.setViewState({
          totalPages: recompiled.pdfResult.pageCount,
        });
      } catch (err) {
        console.error('Failed to recompile PDF:', err);
      } finally {
        setIsRecompiling(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [optionsKey]);

  const hasLoadedDocument = Boolean(store.cellIR && (store.pdfResult || store.layoutIR));
  const isProcessing =
    store.pipeline.stage === 'parsing' ||
    store.pipeline.stage === 'layout' ||
    store.pipeline.stage === 'compiling';

  if (hasLoadedDocument && !isProcessing) {
    return (
      <StudioLayout
        fileName={store.file?.name}
        fileSize={store.file?.size}
        sheetNames={store.file?.sheetNames || []}
        activeSheetIndex={store.file?.activeSheetIndex || 0}
        onSheetChange={handleSheetChange}
        isRecompiling={isRecompiling}
        onReset={store.resetStudio}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      {/* Toast Notification Container */}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-down">
          <Toast
            type="error"
            message={errorToast}
            onClose={() => setErrorToast(null)}
          />
        </div>
      )}

      {/* Main Landing & Upload Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-4xl mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Sprint 4 • Interactive Studio UI Ready</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Sheet to <span className="text-blue-600">Art</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Upload messy spreadsheets. Let automated layout heuristics and Typst WASM typeset them into publication-grade, beautiful PDFs.
          </p>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing ? (
          <div className="w-full max-w-xl my-8">
            <ProgressBar
              stage={store.pipeline.stage}
              percent={store.pipeline.percent}
              message={store.pipeline.message}
              error={store.pipeline.error}
            />
          </div>
        ) : (
          <Dropzone
            onFileSelected={handleFileSelected}
            onSampleSelected={handleSampleSelected}
            onError={(msg) => setErrorToast(msg)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <p>100% Client-Side Web Worker & Typst WASM Execution • Zero Server Telemetry</p>
      </footer>
    </div>
  );
}
