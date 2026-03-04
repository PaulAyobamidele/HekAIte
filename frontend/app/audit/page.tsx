'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

interface AuditLogItem {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_type: string;
  evaluation_id: string | null;
  prompt: string | null;
  model_output: string | null;
  evaluator_scores: Record<string, number> | null;
  risk_decision: { risk_level: string; action: string } | null;
  latency_ms: number | null;
  created_at: string;
}

const EVENT_BADGE: Record<string, string> = {
  evaluation_start: 'bg-[#7C5CFC]/15 text-[#7C5CFC]',
  evaluation_complete: 'bg-[#30A46C]/15 text-[#30A46C]',
  policy_check: 'bg-[#7C5CFC]/10 text-purple-400',
  policy_violation: 'bg-[#E5484D]/12 text-[#E5484D]',
};

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'evaluation_start', label: 'Evaluation Start' },
  { value: 'evaluation_complete', label: 'Evaluation Complete' },
  { value: 'policy_check', label: 'Policy Check' },
  { value: 'policy_violation', label: 'Policy Violation' },
];

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const limit = 50;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchPage(0);
  }, [user, authLoading, router]);

  async function fetchPage(p: number, eventType?: string) {
    setLoading(true);
    try {
      const filter = eventType ?? eventFilter;
      let url = `/audit/logs?limit=${limit}&offset=${p * limit}`;
      if (filter) url += `&event_type=${filter}`;
      const res = await api.get(url);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(value: string) {
    setEventFilter(value);
    fetchPage(0, value);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-[#56545E] mt-1 text-sm">{total} audit events logged</p>
        </div>
        <select
          value={eventFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl input-dark text-sm cursor-pointer"
        >
          {EVENT_TYPES.map((et) => (
            <option key={et.value} value={et.value} className="bg-dark-800">{et.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <p className="text-[#56545E] text-lg">No audit events yet</p>
          <p className="text-[#56545E] text-sm mt-2">Run an evaluation to generate audit logs</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Event</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Trace</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Evaluation</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Scores</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Latency</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`badge ${EVENT_BADGE[log.event_type] || 'bg-white/5 text-[#878593]'}`}>
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/audit/${log.trace_id}`}
                        className="text-sm font-mono text-[#7C5CFC] hover:text-[#6E4AE8] transition-colors"
                      >
                        {log.trace_id.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#56545E] font-mono">
                      {log.evaluation_id ? log.evaluation_id.slice(0, 16) + '...' : '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {log.evaluator_scores ? (
                        <>
                          <span className="text-[#FF8B3E]">{((log.evaluator_scores.hallucination ?? 0) * 100).toFixed(0)}</span>
                          {' / '}
                          <span className="text-[#30A46C]">{((log.evaluator_scores.safety ?? 0) * 100).toFixed(0)}</span>
                          {' / '}
                          <span className="text-[#36B5CA]">{((log.evaluator_scores.confidence ?? 0) * 100).toFixed(0)}</span>
                        </>
                      ) : <span className="text-[#56545E]">\u2014</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#56545E]">
                      {log.latency_ms ? `${log.latency_ms.toFixed(0)}ms` : '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#56545E] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-[#56545E]">
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchPage(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm btn-ghost rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm btn-ghost rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
