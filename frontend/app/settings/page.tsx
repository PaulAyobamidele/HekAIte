'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

interface ApiKeyInfo {
  id: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchKeys();
  }, [user, authLoading, router]);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await api.get('/keys');
      setKeys(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/keys', { name: newKeyName.trim() });
      setCreatedKey(res.data.key);
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.post(`/keys/${id}/revoke`);
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  }

  function copyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      localStorage.setItem('apiKey', createdKey);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-[#56545E] mt-1 text-sm">Manage your API keys for programmatic access</p>
      </div>

      {/* Created key banner */}
      {createdKey && (
        <div className="bg-[#30A46C]/10 border border-[#30A46C]/15 rounded-xl p-5 mb-6 animate-slide-up">
          <p className="text-sm font-medium text-[#30A46C] mb-3">API key created! Copy it now — it won&apos;t be shown again.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white/[0.03] px-4 py-2.5 rounded-xl border border-white/5 text-sm font-mono text-[#878593] select-all">
              {createdKey}
            </code>
            <button
              onClick={copyKey}
              className={`px-5 py-2.5 text-sm rounded-xl font-semibold transition-all ${copied ? 'bg-[#30A46C]/20 text-[#30A46C]' : 'btn-primary'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create key form */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Key</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, Development)"
            className="flex-1 px-4 py-3 rounded-xl input-dark text-sm"
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold"
          >
            {creating ? 'Creating...' : 'Create Key'}
          </button>
        </form>
      </div>

      {/* Keys list */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[#56545E]">No API keys yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Name</th>
                <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Last Used</th>
                <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Created</th>
                <th className="text-right px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{k.name}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${k.is_active ? 'badge-allow' : 'bg-white/5 text-[#56545E]'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#56545E]">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#56545E]">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {k.is_active && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-sm text-[#E5484D]/70 hover:text-[#E5484D] font-medium transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
