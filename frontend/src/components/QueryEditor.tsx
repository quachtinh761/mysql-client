import React, { useState } from 'react';
import api from '../api';
import { useConnection } from '../context/ConnectionContext';

interface QueryResult {
  rows?: any[];
  fields?: any[];
  rowCount?: number;
  affectedRows?: number;
  insertId?: number;
  executionTime: number;
  message?: string;
}

export default function QueryEditor() {
  const { activeConnection, selectedDatabase } = useConnection();
  const [sql, setSql] = useState('SELECT 1;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getConnPayload = () => ({
    ...(activeConnection?.connectionId
      ? { connectionId: activeConnection.connectionId }
      : activeConnection?.info),
    database: selectedDatabase,
  });

  const runQuery = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/mysql/query', { ...getConnPayload(), sql });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      runQuery();
    }
  };

  const columns = result?.fields?.map((f: any) => f.name) || (result?.rows?.[0] ? Object.keys(result.rows[0]) : []);

  return (
    <div className="flex flex-col h-full">
      {/* Editor area */}
      <div className="flex flex-col border-b border-gray-200" style={{ height: '45%' }}>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">SQL Editor</span>
            {selectedDatabase && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {selectedDatabase}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">Ctrl+Enter to run</span>
            <button
              onClick={runQuery}
              disabled={loading}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loading ? 'Running...' : 'Run Query'}
            </button>
          </div>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 w-full p-4 font-mono text-sm text-gray-800 resize-none focus:outline-none"
          placeholder="Enter SQL query..."
          spellCheck={false}
        />
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Results header */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-gray-700">Results</span>
          {result && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {result.rowCount !== undefined && (
                <span>{result.rowCount.toLocaleString()} row{result.rowCount !== 1 ? 's' : ''}</span>
              )}
              {result.affectedRows !== undefined && (
                <span>{result.affectedRows} affected</span>
              )}
              <span className="text-green-600">{result.executionTime}ms</span>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex-shrink-0">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700 font-mono">{error}</span>
            </div>
          </div>
        )}

        {/* Non-SELECT result message */}
        {result?.message && !result.rows && (
          <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700">{result.message}</span>
              {result.insertId !== undefined && result.insertId > 0 && (
                <span className="text-sm text-green-600 ml-2">Insert ID: {result.insertId}</span>
              )}
            </div>
          </div>
        )}

        {/* Results table */}
        {result?.rows && (
          <div className="flex-1 overflow-auto">
            {result.rows.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Query returned no rows
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="w-10 px-2 py-2 text-gray-400 font-normal text-right border-r border-gray-200">#</th>
                    {columns.map((col: string) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="px-2 py-1.5 text-gray-400 text-right border-r border-gray-200">{i + 1}</td>
                      {columns.map((col: string) => (
                        <td key={col} className="px-3 py-1.5 border-r border-gray-100 max-w-xs">
                          <span className={`block truncate ${row[col] === null ? 'text-gray-300 italic' : 'text-gray-800'}`}>
                            {row[col] === null ? 'NULL' : String(row[col])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Run a query to see results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
