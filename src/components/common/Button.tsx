// src/components/common/Button.tsx
import React, { type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[32px] gap-1.5',
    md: 'text-sm px-3.5 py-2 min-h-[40px] gap-2',
    lg: 'text-base px-5 py-2.5 min-h-[48px] gap-2.5',
    icon: 'p-2 min-h-[40px] min-w-[40px] gap-0',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus:ring-blue-500 border border-transparent',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 focus:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300 border border-transparent',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 border border-transparent',
    outline:
      'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-400',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin mr-1.5">⏳</span>
      ) : null}
      {children}
    </button>
  );
};
