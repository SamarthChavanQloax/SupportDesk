import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      id: customId,
      required,
      disabled,
      className = '',
      type = 'text',
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[#334155] mb-1.5"
          >
            {label}
            {required ? (
              <span className="text-rose-500 ml-1" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-required={required ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
            error
              ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
          } ${className}`}
          {...rest}
        />

        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
