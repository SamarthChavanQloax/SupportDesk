import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

describe('Table Component', () => {
  it('renders semantic table structure with accessible container', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Subject</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow isInteractive>
            <TableCell>TCK-001</TableCell>
            <TableCell>Cannot Login</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const region = screen.getByRole('region', { name: /data table container/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveClass('overflow-x-auto');

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveAttribute('scope', 'col');
    expect(headers[0]).toHaveTextContent('Reference');

    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent('TCK-001');
  });

  it('applies interactive hover styles on interactive rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow isInteractive data-testid="interactive-row">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const row = screen.getByTestId('interactive-row');
    expect(row).toHaveClass('cursor-pointer');
    expect(row).toHaveClass('hover:bg-slate-50/80');
  });
});
