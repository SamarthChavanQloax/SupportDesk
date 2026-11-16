import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', wrapperClassName = '', children, ...rest }, ref) => {
    return (
      <div
        className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#2563EB] ${wrapperClassName}`}
        tabIndex={0}
        role="region"
        aria-label="Data table container"
      >
        <table
          ref={ref}
          className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`}
          {...rest}
        >
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...rest }, ref) => {
  return (
    <thead
      ref={ref}
      className={`bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}
      {...rest}
    >
      {children}
    </thead>
  );
});
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...rest }, ref) => {
  return (
    <tbody
      ref={ref}
      className={`divide-y divide-slate-100 bg-white ${className}`}
      {...rest}
    >
      {children}
    </tbody>
  );
});
TableBody.displayName = 'TableBody';

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  isInteractive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', isInteractive = false, children, ...rest }, ref) => {
    return (
      <tr
        ref={ref}
        className={`transition-colors ${
          isInteractive
            ? 'cursor-pointer hover:bg-slate-50/80 focus-within:bg-slate-50'
            : 'hover:bg-slate-50/50'
        } ${className}`}
        {...rest}
      >
        {children}
      </tr>
    );
  },
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className = '', scope = 'col', children, ...rest }, ref) => {
  return (
    <th
      ref={ref}
      scope={scope}
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
});
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...rest }, ref) => {
  return (
    <td
      ref={ref}
      className={`px-5 py-4 text-sm text-[#334155] ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
});
TableCell.displayName = 'TableCell';
