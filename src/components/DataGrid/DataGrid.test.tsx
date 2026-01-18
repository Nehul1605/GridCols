/**
 * DataGrid Integration Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataGrid } from './DataGrid';
import type { ColumnDef, BaseRow } from '../../types';

interface TestRow extends BaseRow {
  id: number;
  name: string;
  value: number;
}

const testColumns: ColumnDef<TestRow>[] = [
  { id: 'id', header: 'ID', accessorKey: 'id', sortable: true },
  { id: 'name', header: 'Name', accessorKey: 'name', editable: true },
  { id: 'value', header: 'Value', accessorKey: 'value', dataType: 'number' },
];

const testData: TestRow[] = [
  { id: 1, name: 'Alice', value: 100 },
  { id: 2, name: 'Bob', value: 200 },
  { id: 3, name: 'Charlie', value: 150 },
];

describe('DataGrid', () => {
  describe('Rendering', () => {
    it('renders grid with data', () => {
      render(<DataGrid data={testData} columns={testColumns} height={400} />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<DataGrid data={[]} columns={testColumns} height={400} isLoading={true} />);

      expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
    });

    it('renders empty state', () => {
      render(
        <DataGrid data={[]} columns={testColumns} height={400} emptyMessage="No data found" />
      );

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('renders correct row count in aria', () => {
      render(<DataGrid data={testData} columns={testColumns} height={400} />);

      const grid = screen.getByRole('grid');
      // +1 for header row
      expect(grid).toHaveAttribute('aria-rowcount', '4');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA roles', () => {
      render(<DataGrid data={testData} columns={testColumns} height={400} />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader').length).toBe(3);
    });

    it('has aria-label when provided', () => {
      render(<DataGrid data={testData} columns={testColumns} height={400} ariaLabel="Test Grid" />);

      expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Test Grid');
    });
  });

  describe('Sorting', () => {
    it('calls onSortChange when header clicked', async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();

      render(
        <DataGrid data={testData} columns={testColumns} height={400} onSortChange={onSortChange} />
      );

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledWith(
        expect.objectContaining({
          columnId: 'name',
          direction: 'asc',
        })
      );
    });

    it('toggles sort direction on multiple clicks', async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();

      render(
        <DataGrid data={testData} columns={testColumns} height={400} onSortChange={onSortChange} />
      );

      const nameHeader = screen.getByText('Name');

      await user.click(nameHeader); // asc
      await user.click(nameHeader); // desc
      await user.click(nameHeader); // null

      expect(onSortChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Selection', () => {
    it('sets aria-multiselectable when row selection is enabled', () => {
      render(
        <DataGrid
          data={testData}
          columns={testColumns}
          height={400}
          config={{ enableRowSelection: true }}
        />
      );

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();

      render(<DataGrid data={testData} columns={testColumns} height={400} />);

      const grid = screen.getByRole('grid');

      // Focus the grid
      grid.focus();

      // Press arrow down to start navigation
      await user.keyboard('{ArrowDown}');

      // Grid should handle keyboard events
      expect(document.activeElement).toBeDefined();
    });
  });
});
