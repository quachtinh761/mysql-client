import React, { useState, useEffect } from 'react';
import api from '../api';
import { useConnection } from '../context/ConnectionContext';

export default function DatabaseTree() {
  const { activeConnection, selectedDatabase, selectedTable, setSelectedDatabase, setSelectedTable, setViewMode } = useConnection();
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeConnection) loadDatabases();
  }, [activeConnection]);

  const getConnPayload = () => ({
    ...(activeConnection?.connectionId
      ? { connectionId: activeConnection.connectionId }
      : activeConnection?.info),
  });

  const loadDatabases = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/mysql/databases', getConnPayload());
      setDatabases(data.databases);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load databases');
    } finally {
      setLoading(false);
    }
  };

  const toggleDatabase = async (db: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(db)) {
      newExpanded.delete(db);
      setExpanded(newExpanded);
      return;
    }
    newExpanded.add(db);
    setExpanded(newExpanded);
    setSelectedDatabase(db);

    if (!tables[db]) {
      setLoadingTables(db);
      try {
        const { data } = await api.post('/mysql/tables', { ...getConnPayload(), database: db });
        setTables((prev) => ({ ...prev, [db]: data.tables }));
      } catch {
        setTables((prev) => ({ ...prev, [db]: [] }));
      } finally {
        setLoadingTables(null);
      }
    }
  };

  const handleTableClick = (db: string, table: string) => {
    setSelectedDatabase(db);
    setSelectedTable(table);
    setViewMode('table');
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Databases</h2>
        <button onClick={loadDatabases} className="text-gray-400 hover:text-gray-600 text-xs" title="Refresh">
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-gray-400 text-center py-2">Loading...</p>}
      {error && <p className="text-xs text-red-500 py-2">{error}</p>}

      <div className="space-y-0.5">
        {databases.map((db) => (
          <div key={db}>
            <button
              onClick={() => toggleDatabase(db)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                selectedDatabase === db ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-gray-400 w-3 flex-shrink-0">{expanded.has(db) ? '▾' : '▸'}</span>
              <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2C5.58 2 2 3.79 2 6s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4z" />
                <path d="M2 9v2c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4S2 11.21 2 9z" />
                <path d="M2 14v2c0 2.21 3.58 4 8 4s8-1.79 8-4v-2c0 2.21-3.58 4-8 4s-8-1.79-8-4z" />
              </svg>
              <span className="truncate font-medium">{db}</span>
            </button>

            {expanded.has(db) && (
              <div className="ml-5 mt-0.5 space-y-0.5">
                {loadingTables === db && (
                  <p className="text-xs text-gray-400 px-2 py-1">Loading tables...</p>
                )}
                {(tables[db] || []).map((table) => (
                  <button
                    key={table}
                    onClick={() => handleTableClick(db, table)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left transition-colors ${
                      selectedTable === table && selectedDatabase === db
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    <span className="truncate">{table}</span>
                  </button>
                ))}
                {tables[db]?.length === 0 && loadingTables !== db && (
                  <p className="text-xs text-gray-400 px-2 py-1 italic">No tables</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
