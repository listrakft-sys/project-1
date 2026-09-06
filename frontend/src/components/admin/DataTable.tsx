'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Inbox,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterElement?: React.ReactNode;
  pagination?: PaginationProps;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filterElement,
  pagination,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'No records found',
  actions,
}: DataTableProps<T>) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls Bar: Search & Filter */}
      {(onSearchChange || filterElement) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="w-full sm:w-72">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          )}
          {filterElement && <div className="flex items-center gap-2 flex-wrap">{filterElement}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-4 py-3.5 font-semibold text-xs uppercase tracking-wider ${getAlignmentClass(
                      col.align
                    )} ${col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-4 py-3.5 text-right font-semibold text-xs uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y border-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    className={`transition-colors hover:bg-muted/40 ${
                      rowIndex % 2 === 1 ? 'bg-muted/20' : 'bg-card'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-foreground ${getAlignmentClass(col.align)}`}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3.5 text-right">{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              Showing{' '}
              <span className="font-medium text-foreground">
                {(pagination.currentPage - 1) * pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-foreground">
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium text-foreground">{pagination.totalItems}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1 || isLoading}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-foreground px-2">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
