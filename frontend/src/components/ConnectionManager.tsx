import React, { useState, useEffect } from 'react';
import api from '../api';
import { useConnection } from '../context/ConnectionContext';

interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  database?: string;
}

interface FormData {
  name: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

const defaultForm: FormData = { name: '', host: 'localhost', port: '3306', user: 'root', password: '', database: '' };

export default function ConnectionManager() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [testMsg, setTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const { setActiveConnection } = useConnection();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const { data } = await api.get('/connections');
      setConnections(data.connections);
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/connections', {
        ...form,
        port: Number(form.port),
        database: form.database || undefined,
      });
      setShowForm(false);
      setForm(defaultForm);
      setTestMsg(null);
      await loadConnections();
    } catch (err: any) {
      setTestMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      await api.post('/mysql/test', {
        host: form.host,
        port: Number(form.port),
        user: form.user,
        password: form.password,
        database: form.database || undefined,
      });
      setTestMsg({ type: 'success', text: '✓ Connection successful' });
    } catch (err: any) {
      setTestMsg({ type: 'error', text: err.response?.data?.error || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async (conn: SavedConnection) => {
    setConnecting(conn.id);
    try {
      setActiveConnection({
        connectionId: conn.id,
        savedName: conn.name,
        info: { host: conn.host, port: conn.port, user: conn.user, password: '' },
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connection?')) return;
    try {
      await api.delete(`/connections/${id}`);
      await loadConnections();
    } catch {}
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Connections</h2>
        <button
          onClick={() => { setShowForm(!showForm); setTestMsg(null); }}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {/* New Connection Form */}
      {showForm && (
        <form onSubmit={handleSave} className="mb-4 bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">New Connection</h3>
          {[
            { label: 'Name', key: 'name', type: 'text', placeholder: 'My Server', required: true },
            { label: 'Host', key: 'host', type: 'text', placeholder: 'localhost', required: true },
            { label: 'Port', key: 'port', type: 'number', placeholder: '3306', required: true },
            { label: 'User', key: 'user', type: 'text', placeholder: 'root', required: true },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••', required: true },
            { label: 'Database (optional)', key: 'database', type: 'text', placeholder: 'mydb', required: false },
          ].map(({ label, key, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-0.5">{label}</label>
              <input
                type={type}
                value={form[key as keyof FormData]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
          {testMsg && (
            <p className={`text-xs ${testMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {testMsg.text}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex-1 text-xs border border-gray-300 rounded py-1.5 hover:bg-gray-100 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-xs bg-blue-600 text-white rounded py-1.5 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Saved connections list */}
      <div className="space-y-1.5">
        {connections.length === 0 && !showForm && (
          <p className="text-xs text-gray-400 text-center py-4">No saved connections</p>
        )}
        {connections.map((conn) => (
          <div key={conn.id} className="group flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{conn.name}</p>
              <p className="text-xs text-gray-400 truncate">{conn.user}@{conn.host}:{conn.port}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleConnect(conn)}
                disabled={connecting === conn.id}
                className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {connecting === conn.id ? '...' : 'Connect'}
              </button>
              <button
                onClick={() => handleDelete(conn.id)}
                className="text-xs text-red-500 hover:text-red-700 px-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
