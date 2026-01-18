import React from 'react';
import ReactDOM from 'react-dom/client';
import { DataGrid } from './components/DataGrid';
import type { ColumnDef, BaseRow } from './types';
import './styles/main.css';

// Demo data type
interface DemoRow extends BaseRow {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
}

// Generate demo data
function generateDemoData(count: number): DemoRow[] {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    department: departments[i % departments.length] ?? 'Engineering',
    salary: 50000 + Math.floor(Math.random() * 100000),
  }));
}

// Column definitions
const columns: ColumnDef<DemoRow>[] = [
  { id: 'id', header: 'ID', accessorKey: 'id', width: 80, sortable: true },
  { id: 'name', header: 'Name', accessorKey: 'name', width: '2', sortable: true, editable: true },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    width: '3',
    sortable: true,
    editable: true,
  },
  { id: 'department', header: 'Department', accessorKey: 'department', width: '1', sortable: true },
  {
    id: 'salary',
    header: 'Salary',
    accessorKey: 'salary',
    width: 120,
    align: 'right',
    sortable: true,
    renderCell: (value) => `$${(value as number).toLocaleString()}`,
  },
];

// Demo data - 50,000 rows
const data = generateDemoData(50000);

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtualized DataGrid Demo</h1>
        <p className="text-gray-600 mb-6">
          Rendering 50,000 rows with manual virtualization at 60fps. No external virtualization
          libraries used.
        </p>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <DataGrid
            data={data}
            columns={columns}
            height={600}
            config={{
              enableSorting: true,
              enableEditing: true,
              enableKeyboardNav: true,
              enableRowSelection: true,
            }}
            ariaLabel="Demo data grid with 50,000 users"
          />
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            <strong>Controls:</strong> Click headers to sort • Double-click cell to edit • Arrow
            keys to navigate • Enter to edit • Escape to cancel
          </p>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
