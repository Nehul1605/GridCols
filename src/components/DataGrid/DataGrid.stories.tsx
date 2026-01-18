/**
 * DataGrid Stories
 *
 * Demonstrates all features, edge cases, and performance
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DataGrid } from './DataGrid';
import type { ColumnDef, BaseRow, CellValue } from '../../types';
import { useState, useCallback } from 'react';

// ===========================================
// MOCK DATA TYPES
// ===========================================

interface User extends BaseRow {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number;
  startDate: string;
  isActive: boolean;
}

// ===========================================
// DATA GENERATORS
// ===========================================

const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];

function generateUser(index: number): User {
  return {
    id: index,
    name: `User ${index}`,
    email: `user${index}@company.com`,
    age: 22 + (index % 40),
    department: departments[index % departments.length] ?? 'Engineering',
    salary: 50000 + (index % 100) * 1000,
    startDate: `202${index % 5}-0${(index % 12) + 1}-${(index % 28) + 1}`.padStart(10, '0'),
    isActive: index % 3 !== 0,
  };
}

function generateData(count: number): User[] {
  return Array.from({ length: count }, (_, i) => generateUser(i));
}

// ===========================================
// COLUMN DEFINITIONS
// ===========================================

const baseColumns: ColumnDef<User>[] = [
  {
    id: 'id',
    header: 'ID',
    accessorKey: 'id',
    width: 80,
    dataType: 'number',
    sortable: true,
    editable: false,
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    width: '2',
    dataType: 'string',
    sortable: true,
    editable: true,
    editorType: 'text',
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    width: '3',
    dataType: 'string',
    sortable: true,
    editable: true,
  },
  {
    id: 'age',
    header: 'Age',
    accessorKey: 'age',
    width: 80,
    dataType: 'number',
    sortable: true,
    editable: true,
    editorType: 'number',
    align: 'right',
  },
  {
    id: 'department',
    header: 'Department',
    accessorKey: 'department',
    width: '1',
    dataType: 'string',
    sortable: true,
    editable: true,
    editorType: 'select',
    selectOptions: departments.map((d) => ({ value: d, label: d })),
  },
  {
    id: 'salary',
    header: 'Salary',
    accessorKey: 'salary',
    width: 120,
    dataType: 'number',
    sortable: true,
    editable: true,
    align: 'right',
    renderCell: (value) => {
      const num = typeof value === 'number' ? value : 0;
      return `$${num.toLocaleString()}`;
    },
  },
  {
    id: 'isActive',
    header: 'Active',
    accessorKey: 'isActive',
    width: 80,
    dataType: 'boolean',
    sortable: true,
    align: 'center',
  },
];

// ===========================================
// STORY SETUP
// ===========================================

const meta: Meta<typeof DataGrid<User>> = {
  title: 'Components/DataGrid',
  component: DataGrid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'High-performance virtualized data grid supporting 50k+ rows at 60fps.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    height: { control: { type: 'number', min: 200, max: 800 } },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DataGrid<User>>;

// ===========================================
// STORIES
// ===========================================

/**
 * Default story with 100 rows
 */
export const Default: Story = {
  args: {
    data: generateData(100),
    columns: baseColumns,
    height: 500,
  },
};

/**
 * Large dataset - 50,000 rows
 * Tests virtualization performance
 */
export const Scale50k: Story = {
  name: '50,000 Rows (Performance Test)',
  args: {
    data: generateData(50000),
    columns: baseColumns,
    height: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests virtualization with 50,000 rows. Should maintain 60fps scrolling.',
      },
    },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    data: [],
    columns: baseColumns,
    height: 400,
    isLoading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    data: [],
    columns: baseColumns,
    height: 400,
    emptyMessage: 'No users found. Try adjusting your filters.',
  },
};

/**
 * With sorting enabled
 */
export const WithSorting: Story = {
  args: {
    data: generateData(100),
    columns: baseColumns,
    height: 500,
    initialSort: { columnId: 'name', direction: 'asc' },
  },
};

/**
 * With initial selection
 */
export const WithSelection: Story = {
  args: {
    data: generateData(100),
    columns: baseColumns,
    height: 500,
    initialSelection: new Set([0, 1, 2, 3, 4]),
  },
};

/**
 * Interactive demo with all features
 */
export const Interactive: Story = {
  render: () => {
    const [data, setData] = useState(() => generateData(1000));
    const [selection, setSelection] = useState<Set<string | number>>(new Set());

    const handleCellChange = useCallback(
      (rowId: string | number, columnId: string, newValue: CellValue, oldValue: CellValue) => {
        console.log(`Cell changed: Row ${rowId}, Column ${columnId}`, { oldValue, newValue });

        setData((prevData) =>
          prevData.map((row) => {
            if (row.id === rowId) {
              return { ...row, [columnId]: newValue };
            }
            return row;
          })
        );
      },
      []
    );

    const handleSelectionChange = useCallback((selectedIds: Set<string | number>) => {
      console.log('Selection changed:', Array.from(selectedIds));
      setSelection(selectedIds);
    }, []);

    return (
      <div className="w-[900px]">
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            Selected: {selection.size} rows | Click cell to select | Double-click to edit | Arrow
            keys to navigate | Enter to edit/confirm | Escape to cancel
          </p>
        </div>
        <DataGrid
          data={data}
          columns={baseColumns}
          height={500}
          onCellChange={handleCellChange}
          onSelectionChange={handleSelectionChange}
          initialSelection={selection}
          config={{
            enableEditing: true,
            enableSorting: true,
            enableRowSelection: true,
            enableKeyboardNav: true,
            enableResizing: true,
          }}
        />
      </div>
    );
  },
};

/**
 * Keyboard-only navigation test
 * For accessibility testing
 */
export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation (A11y)',
  args: {
    data: generateData(50),
    columns: baseColumns,
    height: 400,
    ariaLabel: 'User data grid - Use arrow keys to navigate, Enter to edit',
  },
  parameters: {
    docs: {
      description: {
        story: `
Test keyboard navigation:
- Tab into grid
- Arrow keys to move between cells
- Enter/F2 to start editing
- Escape to cancel edit
- Tab to move to next cell
- Home/End for first/last column
- Ctrl+Home/End for first/last cell
- Page Up/Down to scroll
        `,
      },
    },
  },
};

/**
 * High contrast mode simulation
 */
export const HighContrast: Story = {
  args: {
    data: generateData(50),
    columns: baseColumns,
    height: 400,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--grid-border-color': '#000000',
            '--grid-row-hover': '#ffff00',
            '--grid-row-selected': '#0000ff',
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * Stress test - 100,000 rows
 */
export const Scale100k: Story = {
  name: '100,000 Rows (Stress Test)',
  args: {
    data: generateData(100000),
    columns: baseColumns,
    height: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'Extreme stress test with 100,000 rows.',
      },
    },
  },
};

/**
 * Minimal columns
 */
export const MinimalColumns: Story = {
  args: {
    data: generateData(100),
    columns: baseColumns.slice(0, 3),
    height: 400,
  },
};

/**
 * Custom cell rendering
 */
export const CustomRendering: Story = {
  args: {
    data: generateData(50),
    columns: [
      ...baseColumns.slice(0, 2),
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'isActive',
        width: 120,
        renderCell: (value) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {value ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        id: 'salary',
        header: 'Salary',
        accessorKey: 'salary',
        width: 150,
        align: 'right',
        renderCell: (value) => {
          const num = typeof value === 'number' ? value : 0;
          const color =
            num >= 100000 ? 'text-green-600' : num >= 70000 ? 'text-blue-600' : 'text-gray-600';
          return <span className={`font-mono ${color}`}>${num.toLocaleString()}</span>;
        },
      },
    ],
    height: 400,
  },
};

/**
 * Pinned columns demo
 * Shows left and right pinned columns that stay fixed during horizontal scroll
 */
export const PinnedColumns: Story = {
  name: 'Pinned Columns',
  args: {
    data: generateData(100),
    columns: (() => {
      // Build pinned columns safely with type assertions
      const col0 = baseColumns[0];
      const col1 = baseColumns[1];
      const col2 = baseColumns[2];
      const col3 = baseColumns[3];
      const col4 = baseColumns[4];
      const col5 = baseColumns[5];
      const col6 = baseColumns[6];
      
      const cols: ColumnDef<User>[] = [];
      if (col0) cols.push({ ...col0, pinned: 'left' });
      if (col1) cols.push({ ...col1, pinned: 'left' });
      if (col2) cols.push(col2);
      if (col3) cols.push(col3);
      if (col4) cols.push(col4);
      if (col5) cols.push(col5);
      if (col6) cols.push({ ...col6, pinned: 'right' });
      return cols;
    })(),
    height: 500,
    width: 800,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates pinned columns:
- ID and Name columns are pinned to the left
- Active column is pinned to the right
- Middle columns scroll horizontally
- Right-click on header to pin/unpin columns
        `,
      },
    },
  },
};

/**
 * Multi-column sorting demo
 * Hold Shift and click multiple columns to sort by multiple criteria
 */
export const MultiSort: Story = {
  name: 'Multi-Column Sorting',
  render: () => {
    const data = generateData(100);
    
    return (
      <div className="w-[900px]">
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">Multi-Sort Instructions:</p>
          <ul className="text-sm text-blue-700 mt-2 list-disc ml-5">
            <li>Click a column header to sort by that column</li>
            <li>The sort indicator shows the direction (↑ asc, ↓ desc)</li>
            <li>Multi-sort priority is shown as numbered badges</li>
            <li>Click again to cycle: asc → desc → clear</li>
          </ul>
        </div>
        <DataGrid
          data={data}
          columns={baseColumns}
          height={500}
          config={{
            enableSorting: true,
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multi-column sorting with deterministic ordering.',
      },
    },
  },
};

/**
 * Column visibility toggles
 * Use the Columns dropdown to show/hide columns
 */
export const ColumnVisibility: Story = {
  name: 'Column Visibility Toggles',
  args: {
    data: generateData(100),
    columns: baseColumns,
    height: 500,
  },
  parameters: {
    docs: {
      description: {
        story: `
Use the "Columns" dropdown in the toolbar to:
- Toggle individual column visibility
- Click "Show All" to restore all columns
        `,
      },
    },
  },
};

/**
 * Column reordering via drag and drop
 */
export const ColumnReorder: Story = {
  name: 'Column Reordering (Drag & Drop)',
  args: {
    data: generateData(50),
    columns: baseColumns,
    height: 400,
  },
  parameters: {
    docs: {
      description: {
        story: `
Drag column headers to reorder columns:
- Click and hold a column header
- Drag to the desired position
- Drop to reorder
- Note: Pinned columns cannot be reordered
        `,
      },
    },
  },
};

/**
 * Undo/Redo support
 */
export const UndoRedo: Story = {
  name: 'Undo/Redo Support',
  render: () => {
    const [data, setData] = useState(() => generateData(50));

    const handleCellChange = useCallback(
      (rowId: string | number, columnId: string, newValue: CellValue) => {
        setData((prevData) =>
          prevData.map((row) => {
            if (row.id === rowId) {
              return { ...row, [columnId]: newValue };
            }
            return row;
          })
        );
      },
      []
    );

    return (
      <div className="w-[900px]">
        <div className="mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">Undo/Redo Instructions:</p>
          <ul className="text-sm text-yellow-700 mt-2 list-disc ml-5">
            <li>Double-click a cell to edit</li>
            <li>Press <kbd className="px-1 bg-white rounded border">Ctrl</kbd>+<kbd className="px-1 bg-white rounded border">Z</kbd> to undo</li>
            <li>Press <kbd className="px-1 bg-white rounded border">Ctrl</kbd>+<kbd className="px-1 bg-white rounded border">Shift</kbd>+<kbd className="px-1 bg-white rounded border">Z</kbd> or <kbd className="px-1 bg-white rounded border">Ctrl</kbd>+<kbd className="px-1 bg-white rounded border">Y</kbd> to redo</li>
            <li>Use the Undo/Redo buttons in the toolbar</li>
          </ul>
        </div>
        <DataGrid
          data={data}
          columns={baseColumns}
          height={500}
          onCellChange={handleCellChange}
          config={{
            enableEditing: true,
            enableResizing: true,
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates undo/redo support for cell edits and column resizing.',
      },
    },
  },
};

/**
 * FPS Performance Monitor
 * Press Ctrl+Shift+P to toggle FPS overlay
 */
export const PerformanceMonitor: Story = {
  name: 'FPS Performance Monitor',
  render: () => {
    const data = generateData(50000);

    return (
      <div className="w-[900px]">
        <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-800 font-medium">Performance Monitor:</p>
          <ul className="text-sm text-green-700 mt-2 list-disc ml-5">
            <li>Press <kbd className="px-1 bg-white rounded border">Ctrl</kbd>+<kbd className="px-1 bg-white rounded border">Shift</kbd>+<kbd className="px-1 bg-white rounded border">P</kbd> to toggle FPS overlay</li>
            <li>Scroll the grid to see real-time FPS measurements</li>
            <li>Green = 55+ FPS (good), Yellow = 30-55 FPS (okay), Red = &lt;30 FPS (poor)</li>
            <li>Target: 60 FPS sustained on 50k rows</li>
          </ul>
        </div>
        <DataGrid
          data={data}
          columns={baseColumns}
          height={600}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates real-time FPS monitoring for performance validation. 50,000 rows with FPS overlay.',
      },
    },
  },
};

/**
 * Simulated async validation with failure rollback
 */
export const AsyncValidation: Story = {
  name: 'Async Validation (With Failure)',
  render: () => {
    const [data, setData] = useState(() => generateData(50));
    const [validationStatus, setValidationStatus] = useState<string>('');

    const handleCellChange = useCallback(
      async (rowId: string | number, columnId: string, newValue: CellValue, oldValue: CellValue) => {
        // Simulate async validation
        setValidationStatus(`Validating ${columnId}...`);
        
        // Optimistically update
        setData((prevData) =>
          prevData.map((row) => {
            if (row.id === rowId) {
              return { ...row, [columnId]: newValue };
            }
            return row;
          })
        );

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Randomly fail 30% of the time for demo
        const shouldFail = Math.random() < 0.3;

        if (shouldFail) {
          setValidationStatus(`❌ Validation failed for ${columnId}. Rolling back...`);
          
          // Rollback to old value
          setData((prevData) =>
            prevData.map((row) => {
              if (row.id === rowId) {
                return { ...row, [columnId]: oldValue };
              }
              return row;
            })
          );
          
          setTimeout(() => setValidationStatus(''), 3000);
        } else {
          setValidationStatus(`✅ ${columnId} updated successfully`);
          setTimeout(() => setValidationStatus(''), 2000);
        }
      },
      []
    );

    return (
      <div className="w-[900px]">
        <div className="mb-4 p-4 bg-purple-50 rounded border border-purple-200">
          <p className="text-sm text-purple-800 font-medium">Async Validation Demo:</p>
          <p className="text-sm text-purple-700 mt-1">
            Edit any cell - 30% of edits will fail and automatically rollback (optimistic UI with failure handling)
          </p>
          {validationStatus && (
            <p className="mt-2 text-sm font-medium">{validationStatus}</p>
          )}
        </div>
        <DataGrid
          data={data}
          columns={baseColumns}
          height={400}
          onCellChange={handleCellChange}
          config={{ enableEditing: true }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates in-cell editing with async validation and automatic rollback on failure.',
      },
    },
  },
};

/**
 * Accessibility mode with screen reader announcements
 */
export const AccessibilityMode: Story = {
  name: 'Accessibility (Screen Reader)',
  args: {
    data: generateData(50),
    columns: baseColumns,
    height: 400,
    ariaLabel: 'Users data grid with 50 rows and 7 columns',
    ariaDescribedBy: 'grid-instructions',
  },
  decorators: [
    (Story) => (
      <div>
        <div id="grid-instructions" className="sr-only">
          Use arrow keys to navigate cells. Press Enter or F2 to edit a cell. 
          Press Escape to cancel editing. Press Space to select a row.
          Sort columns by pressing Enter on column headers.
        </div>
        <div className="mb-4 p-4 bg-indigo-50 rounded border border-indigo-200">
          <p className="text-sm text-indigo-800 font-medium">Accessibility Features:</p>
          <ul className="text-sm text-indigo-700 mt-2 list-disc ml-5">
            <li>Full ARIA grid semantics (grid, row, gridcell, columnheader)</li>
            <li>aria-sort on sortable columns</li>
            <li>aria-selected on selected rows and cells</li>
            <li>aria-rowindex and aria-colindex for position</li>
            <li>Live region announcements for sort changes</li>
            <li>Roving tabindex for keyboard navigation</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates full accessibility support with ARIA semantics and screen reader announcements.',
      },
    },
  },
};

