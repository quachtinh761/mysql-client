import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import ConnectionManager from '../components/ConnectionManager';
import DatabaseTree from '../components/DatabaseTree';
import TableViewer from '../components/TableViewer';
import QueryEditor from '../components/QueryEditor';

export default function MainPage() {
  const { user, logout } = useAuth();
  const { activeConnection, selectedDatabase, selectedTable, viewMode, setViewMode } = useConnection();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navbar */}
      <header className="bg-blue-800 text-white px-4 py-2.5 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-blue-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="font-bold text-lg tracking-tight">MySQL Client</span>
          </div>
          {activeConnection && (
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-blue-200 text-sm">
                {activeConnection.savedName || `${activeConnection.info.user}@${activeConnection.info.host}`}
                {selectedDatabase && <span className="text-white"> / {selectedDatabase}</span>}
                {selectedTable && <span className="text-blue-300"> / {selectedTable}</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeConnection && (
            <div className="flex rounded-lg overflow-hidden border border-blue-600">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-blue-800' : 'text-blue-200 hover:bg-blue-700'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('query')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'query' ? 'bg-white text-blue-800' : 'text-blue-200 hover:bg-blue-700'}`}
              >
                Query
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
            <ConnectionManager />
            {activeConnection && (
              <>
                <div className="border-t border-gray-200" />
                <DatabaseTree />
              </>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {!activeConnection ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <p className="text-xl font-medium text-gray-500">No Connection Active</p>
                <p className="text-sm mt-2 text-gray-400">Create a connection in the sidebar and click Connect</p>
              </div>
            </div>
          ) : viewMode === 'query' ? (
            <QueryEditor />
          ) : (
            <TableViewer />
          )}
        </main>
      </div>
    </div>
  );
}
