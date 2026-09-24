import { create } from 'zustand';
import type {
  StudioState,
  StudioOptions,
  ViewState,
  PipelineProgress,
  UploadedFileState,
} from '../types/studio';

export const DEFAULT_STUDIO_OPTIONS: StudioOptions = {
  theme: 'modern-clean',
  pageSize: 'a4',
  orientation: 'portrait',
  layoutMode: 'auto',
  marginPreset: 'normal',
  fontScale: 8.5,
  customTitle: '',
  repeatTableHeaders: true,
  showPageNumbers: true,
  showSectionSummary: true,
};

export const DEFAULT_VIEW_STATE: ViewState = {
  zoom: 100,
  currentPage: 1,
  totalPages: 1,
  previewMode: 'pdf',
  isSidebarOpen: true,
  activeSidebarTab: 'theme',
};

export const DEFAULT_PIPELINE_PROGRESS: PipelineProgress = {
  stage: 'idle',
  percent: 0,
  message: '',
  error: null,
};

export const useStudioStore = create<StudioState>((set) => ({
  file: null,
  pipeline: DEFAULT_PIPELINE_PROGRESS,
  cellIR: null,
  layoutIR: null,
  pdfResult: null,
  pdfBlobUrl: null,
  options: DEFAULT_STUDIO_OPTIONS,
  view: DEFAULT_VIEW_STATE,

  setFile: (file: UploadedFileState | null) =>
    set((state) => ({
      file,
      pipeline: file
        ? { stage: 'parsing', percent: 10, message: 'File uploaded, initializing pipeline...', error: null }
        : DEFAULT_PIPELINE_PROGRESS,
    })),

  setActiveSheetIndex: (activeSheetIndex: number) =>
    set((state) => (state.file ? { file: { ...state.file, activeSheetIndex } } : {})),

  setPipelineProgress: (progress: Partial<PipelineProgress>) =>
    set((state) => ({
      pipeline: {
        ...state.pipeline,
        ...progress,
      },
    })),

  setDocumentData: (data) =>
    set((state) => {
      const pageCount = data.pdfResult?.pageCount ?? state.view.totalPages;
      return {
        cellIR: data.cellIR !== undefined ? data.cellIR : state.cellIR,
        layoutIR: data.layoutIR !== undefined ? data.layoutIR : state.layoutIR,
        pdfResult: data.pdfResult !== undefined ? data.pdfResult : state.pdfResult,
        pdfBlobUrl: data.pdfBlobUrl !== undefined ? data.pdfBlobUrl : state.pdfBlobUrl,
        view: {
          ...state.view,
          totalPages: pageCount > 0 ? pageCount : 1,
          currentPage: Math.min(state.view.currentPage, pageCount > 0 ? pageCount : 1),
        },
        pipeline: {
          stage: 'ready',
          percent: 100,
          message: 'Document ready',
          error: null,
        },
      };
    }),

  setOptions: (newOptions: Partial<StudioOptions>) =>
    set((state) => ({
      options: {
        ...state.options,
        ...newOptions,
      },
    })),

  setViewState: (newView: Partial<ViewState>) =>
    set((state) => ({
      view: {
        ...state.view,
        ...newView,
      },
    })),

  setZoom: (zoom: number) =>
    set((state) => ({
      view: {
        ...state.view,
        zoom: Math.min(200, Math.max(25, Math.round(zoom))),
      },
    })),

  setCurrentPage: (page: number) =>
    set((state) => ({
      view: {
        ...state.view,
        currentPage: Math.min(state.view.totalPages, Math.max(1, page)),
      },
    })),

  setPreviewMode: (previewMode: 'pdf' | 'dom') =>
    set((state) => ({
      view: {
        ...state.view,
        previewMode,
      },
    })),

  toggleSidebar: () =>
    set((state) => ({
      view: {
        ...state.view,
        isSidebarOpen: !state.view.isSidebarOpen,
      },
    })),

  setActiveSidebarTab: (activeSidebarTab: 'theme' | 'layout' | 'outline') =>
    set((state) => ({
      view: {
        ...state.view,
        activeSidebarTab,
      },
    })),

  resetStudio: () =>
    set((state) => {
      if (state.pdfBlobUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(state.pdfBlobUrl);
        } catch {
          // ignore cleanup errors in test environment
        }
      }
      return {
        file: null,
        pipeline: DEFAULT_PIPELINE_PROGRESS,
        cellIR: null,
        layoutIR: null,
        pdfResult: null,
        pdfBlobUrl: null,
        options: DEFAULT_STUDIO_OPTIONS,
        view: DEFAULT_VIEW_STATE,
      };
    }),
}));
