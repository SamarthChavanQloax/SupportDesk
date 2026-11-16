import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2563EB] text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-[#2563EB] shadow-xs',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:outline-slate-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:outline-rose-600 shadow-xs',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-[#2563EB] shadow-2xs',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-slate-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading ? 'true' : undefined}
        className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
            {children}
            {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
