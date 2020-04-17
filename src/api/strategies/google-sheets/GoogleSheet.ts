export interface GoogleSheet {
  headerValues: string[];
  title: number;
  lastColumnLetter: number;
  rowCount: number;
  columnCount: number;
  loadHeaderRow: () => Promise<void>;
  loadCells: (a1Range: string[]) => Promise<void>;
  getCell: (
    rowIndex: number,
    columnIndex: number
  ) => Promise<{
    value: string;
    formattedValue: string;
  }>;
  getRows: () => Promise<[]>;
}
