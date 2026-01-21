import type { Meta, StoryObj } from '@storybook/react';
import { DataGrid, Column } from './index';
import React, { useState } from 'react';
import '../../index.css';

// Generate sample data
const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Person ${i + 1}`,
    email: `person${i + 1}@example.com`,
    age: 20 + (i % 50),
    department: ["Engineering", "Sales", "Marketing", "HR"][i % 4],
    salary: 50000 + ((i * 1000) % 100000),
    status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Inactive" : "Pending",
    joinDate: new Date(2020 + (i % 5), i % 12, (i % 28) + 1)
      .toISOString()
      .split("T")[0],
    performance: (70 + (i % 30)).toString(),
  }));
};

const sampleColumns: Column[] = [
  {
    id: "id",
    header: "ID",
    width: 80,
    minWidth: 50,
    maxWidth: 150,
    accessor: (row) => row.id,
    sortable: true,
    resizable: true,
    pinned: "left",
    visible: true,
  },
  {
    id: "name",
    header: "Name",
    width: 200,
    minWidth: 100,
    maxWidth: 300,
    accessor: (row) => row.name,
    sortable: true,
    resizable: true,
    editable: true,
    visible: true,
  },
  {
    id: "email",
    header: "Email",
    width: 250,
    minWidth: 150,
    accessor: (row) => row.email,
    sortable: true,
    resizable: true,
    editable: true,
    visible: true,
  },
  {
    id: "age",
    header: "Age",
    width: 100,
    minWidth: 60,
    accessor: (row) => row.age,
    sortable: true,
    resizable: true,
    editable: true,
    visible: true,
  },
  {
    id: "department",
    header: "Department",
    width: 150,
    accessor: (row) => row.department,
    sortable: true,
    resizable: true,
    visible: true,
    editable: true,
  },
  {
    id: "salary",
    header: "Salary",
    width: 150,
    accessor: (row) => row.salary,
    sortable: true,
    resizable: true,
    visible: true,
    editable: true,
    renderer: (value) => `$${value.toLocaleString()}`,
  },
  {
    id: "status",
    header: "Status",
    width: 120,
    accessor: (row) => row.status,
    sortable: true,
    resizable: true,
    visible: true,
    editable: true,
    renderer: (value) => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          value === "Active"
            ? "bg-green-100 text-green-800"
            : value === "Inactive"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    id: "joinDate",
    header: "Join Date",
    width: 130,
    accessor: (row) => row.joinDate,
    sortable: true,
    resizable: true,
    visible: true,
    editable: true,
  },
  {
    id: "performance",
    header: "Performance",
    width: 130,
    accessor: (row) => row.performance,
    sortable: true,
    resizable: true,
    visible: true,
    editable: true,
    renderer: (value) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 rounded">
          <div
            className="h-full bg-blue-500 rounded"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs">{value}%</span>
      </div>
    ),
  },
];

const meta = {
  title: 'Components/DataGrid',
  component: DataGrid,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for stateful stories
const DataGridWithState = ({ rowCount = 50000 }: { rowCount?: number }) => {
  const [data, setData] = useState(() => generateLargeDataset(rowCount));

  const handleCellEdit = (rowId: any, columnId: string, newValue: any) => {
    setData((prev) => {
      const rowIndex = prev.findIndex((row) => row.id === rowId);
      if (rowIndex >= 0) {
        const newData = [...prev];
        const updatedRow = { ...newData[rowIndex], [columnId]: newValue };
        newData[rowIndex] = updatedRow;
        return newData;
      }
      return prev;
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Production-Grade DataGrid</h1>
        <p className="text-gray-600 mb-6">
          {rowCount.toLocaleString()} rows • Virtualization • Sorting • Resizing • Editing • Undo/Redo • Keyboard Navigation
        </p>
        <DataGrid
          data={data}
          columns={sampleColumns}
          onCellEdit={handleCellEdit}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <DataGridWithState rowCount={50000} />,
};

export const SmallDataset: Story = {
  render: () => <DataGridWithState rowCount={100} />,
};

export const MediumDataset: Story = {
  render: () => <DataGridWithState rowCount={1000} />,
};

export const LargeDataset: Story = {
  render: () => <DataGridWithState rowCount={100000} />,
};
