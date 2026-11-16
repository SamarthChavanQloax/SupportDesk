import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      id: customId,
      required,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

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
            htmlFor={selectId}
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

        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-required={required ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#334155] transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
            error
              ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
          } ${className}`}
          {...rest}
        >
          {children}
        </select>

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

Select.displayName = 'Select';
