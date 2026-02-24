import React, { createContext, useContext, useState } from 'react';

interface ConnectionInfo {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

interface ActiveConnection {
  connectionId?: string;
  savedName?: string;
  info: ConnectionInfo;
}

interface ConnectionContextType {
  activeConnection: ActiveConnection | null;
  selectedDatabase: string | null;
  selectedTable: string | null;
  viewMode: 'table' | 'query';
  setActiveConnection: (c: ActiveConnection | null) => void;
  setSelectedDatabase: (db: string | null) => void;
  setSelectedTable: (t: string | null) => void;
  setViewMode: (m: 'table' | 'query') => void;
}

const ConnectionContext = createContext<ConnectionContextType>({} as ConnectionContextType);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'query'>('table');

  const handleSetActiveConnection = (c: ActiveConnection | null) => {
    setActiveConnection(c);
    setSelectedDatabase(null);
    setSelectedTable(null);
    setViewMode('table');
  };

  return (
    <ConnectionContext.Provider
      value={{
        activeConnection,
        selectedDatabase,
        selectedTable,
        viewMode,
        setActiveConnection: handleSetActiveConnection,
        setSelectedDatabase,
        setSelectedTable,
        setViewMode,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => useContext(ConnectionContext);
