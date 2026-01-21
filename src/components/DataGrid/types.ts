export interface Column {
  field: string;
  headerName: string;
  width?: number;
}

export interface Row {
  id: string | number;
  [key: string]: any;
}

export interface DataGridProps {
  columns: Column[];
  rows: Row[];
}
