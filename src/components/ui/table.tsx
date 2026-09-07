import * as React from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectedRows?: T[];
  onRowSelect?: (row: T) => void;
  className?: string;
  striped?: boolean;
  compact?: boolean;
}

function TableInner<T extends Record<string, unknown>>(
  {
    data,
    columns,
    loading = false,
    emptyMessage = "No data available",
    onRowClick,
    sortBy,
    sortOrder,
    onSort,
    selectedRows = [],
    onRowSelect,
    className,
    striped = false,
    compact = false,
  }: TableProps<T>,
  ref: React.ForwardedRef<HTMLTableElement>
) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-gray-200", className)}>
      <table ref={ref} className="w-full caption-bottom text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {onRowSelect && (
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Select</span>
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-semibold text-gray-600",
                  col.sortable && "cursor-pointer select-none hover:text-gray-900",
                  col.className
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="text-green-600">
                      {sortOrder === "asc" ? " ↑" : " ↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onRowSelect ? 1 : 0)}
                className="px-4 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const isSelected = selectedRows.includes(row);
              return (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-gray-100 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-gray-50",
                    striped && rowIndex % 2 === 1 && "bg-gray-50/50",
                    isSelected && "bg-green-50"
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {onRowSelect && (
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onRowSelect(row)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-gray-900",
                        compact && "px-3 py-2 text-xs",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row, rowIndex)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const Table = React.forwardRef(TableInner) as <
  T extends Record<string, unknown>
>(
  props: TableProps<T> & { ref?: React.Ref<HTMLTableElement> }
) => React.ReactElement;

export { Table, type Column, type TableProps };
