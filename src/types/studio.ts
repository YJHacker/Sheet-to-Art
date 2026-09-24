import type { CellIR } from './cell-ir';
import type { LayoutIR, PageSizeType, OrientationType } from './layout-ir';
import type { ThemeName, PDFRenderResult } from './typst';

export type PipelineStage = 'idle' | 'parsing' | 'layout' | 'compiling' | 'ready' | 'error';

export type LayoutModePreset = 'auto' | 'compact' | 'balanced' | 'presentation' | 'print-saver';

export type MarginPreset = 'compact' | 'normal' | 'spacious';

export type StudioOrientation = 'auto' | OrientationType;

export interface PipelineProgress {
  stage: PipelineStage;
  percent: number; // 0 to 100
  message: string;
  error: string | null;
}

export interface StudioOptions {
  theme: ThemeName;
  pageSize: PageSizeType;
  orientation: StudioOrientation;
  layoutMode: LayoutModePreset;
  marginPreset: MarginPreset;
  fontScale: number; // 7.0 to 12.0 pt
  customTitle: string;
  repeatTableHeaders: boolean;
  showPageNumbers: boolean;
  showSectionSummary: boolean;
}

export interface ViewState {
  zoom: number; // 25 to 200 (%)
  currentPage: number;
  totalPages: number;
  previewMode: 'pdf' | 'dom';
  isSidebarOpen: boolean;
  activeSidebarTab: 'theme' | 'layout' | 'outline';
}

export interface UploadedFileState {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  sheetNames: string[];
  activeSheetIndex: number;
}

export interface StudioState {
  // Uploaded file
  file: UploadedFileState | null;

  // Pipeline Status
  pipeline: PipelineProgress;

  // Core Data Artifacts
  cellIR: CellIR | null;
  layoutIR: LayoutIR | null;
  pdfResult: PDFRenderResult | null;
  pdfBlobUrl: string | null;

  // Document Customization Options
  options: StudioOptions;

  // Viewport & Navigation State
  view: ViewState;

  // Actions
  setFile: (file: UploadedFileState | null) => void;
  setActiveSheetIndex: (index: number) => void;
  setPipelineProgress: (progress: Partial<PipelineProgress>) => void;
  setDocumentData: (data: {
    cellIR?: CellIR | null;
    layoutIR?: LayoutIR | null;
    pdfResult?: PDFRenderResult | null;
    pdfBlobUrl?: string | null;
  }) => void;
  setOptions: (options: Partial<StudioOptions>) => void;
  setViewState: (view: Partial<ViewState>) => void;
  setZoom: (zoom: number) => void;
  setCurrentPage: (page: number) => void;
  setPreviewMode: (mode: 'pdf' | 'dom') => void;
  toggleSidebar: () => void;
  setActiveSidebarTab: (tab: 'theme' | 'layout' | 'outline') => void;
  resetStudio: () => void;
}
