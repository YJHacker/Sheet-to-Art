// src/components/common/Toast.tsx
import React, { useEffect } from 'react';

export interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose: () => void;
  duration?: number; // ms, 0 for persistent
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onClose,
  duration = 5000,
  className = '',
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-900/90 text-white border-blue-700',
    success: 'bg-emerald-900/90 text-white border-emerald-700',
    warning: 'bg-amber-900/90 text-white border-amber-700',
    error: 'bg-red-900/90 text-white border-red-700',
  };

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md text-sm font-medium transition-all duration-200 ${typeStyles[type]} ${className}`}
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
};
