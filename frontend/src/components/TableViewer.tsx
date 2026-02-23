import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useConnection } from '../context/ConnectionContext';

interface Column {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: any;
  Extra: string;
}

const PAGE_SIZE = 50;

export default function TableViewer() {
  const { activeConnection, selectedDatabase, selectedTable } = useConnection();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getConnPayload = useCallback(() => ({
    ...(activeConnection?.connectionId
      ? { connectionId: activeConnection.connectionId }
      : activeConnection?.info),
    database: selectedDatabase,
    table: selectedTable,
  }), [activeConnection, selectedDatabase, selectedTable]);

  useEffect(() => {
    if (selectedTable && selectedDatabase) {
      setFilters({});
      setOffset(0);
      loadStructure();
    }
  }, [selectedTable, selectedDatabase]);

  useEffect(() => {
    if (columns.length > 0) {
      loadData();
    }
  }, [columns, offset, filters]);

  const loadStructure = async () => {
    try {
      const { data } = await api.post('/mysql/table-structure', getConnPayload());
      setColumns(data.columns);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load structure');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const { data } = await api.post('/mysql/table-data', {
        ...getConnPayload(),
        filters: activeFilters,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(data.rows);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (col: string, value: string) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
    setOffset(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  if (!selectedTable) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18M10 4v16M14 4v16M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
          <p className="text-sm">Select a table from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table header */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{selectedDatabase}</span>
          <span className="text-gray-400">.</span>
          <span className="text-sm font-semibold text-blue-700">{selectedTable}</span>
          {!loading && (
            <span className="text-xs text-gray-400 ml-2">({total.toLocaleString()} rows)</span>
          )}
        </div>
        <button
          onClick={() => loadData()}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-200">
          {error}
        </div>
      )}

      {/* Data table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            {/* Column headers */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="w-10 px-2 py-2 text-gray-400 font-normal text-right border-r border-gray-300">#</th>
              {columns.map((col) => (
                <th key={col.Field} className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  <div>{col.Field}</div>
                  <div className="text-gray-400 font-normal text-xs">{col.Type}</div>
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr className="bg-blue-50 border-b border-gray-200">
              <th className="w-10 border-r border-gray-200" />
              {columns.map((col) => (
                <th key={col.Field} className="px-1 py-1 border-r border-gray-200">
                  <input
                    type="text"
                    value={filters[col.Field] || ''}
                    onChange={(e) => handleFilterChange(col.Field, e.target.value)}
                    placeholder="Filter..."
                    className="w-full border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 font-normal"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">
                  No data found
                </td>
              </tr>
            )}
            {!loading && rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                <td className="px-2 py-1.5 text-gray-400 text-right border-r border-gray-200">
                  {offset + i + 1}
                </td>
                {columns.map((col) => (
                  <td key={col.Field} className="px-3 py-1.5 border-r border-gray-100 max-w-xs">
                    <span className={`block truncate ${row[col.Field] === null ? 'text-gray-300 italic' : 'text-gray-800'}`}>
                      {row[col.Field] === null ? 'NULL' : String(row[col.Field])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages} ({total.toLocaleString()} total rows)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
