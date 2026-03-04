'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import api, { setApiKey } from '../../lib/api';

interface EvalItem {
  id: string;
  prompt: string;
  model_output: string;
  overall_risk: string;
  recommended_action: string;
  hallucination_score: number;
  safety_score: number;
  confidence_score: number;
  processing_time_ms: number;
  summary: string;
  created_at: string;
}

interface EvalDetail extends EvalItem {
  context: string[] | null;
  metadata: Record<string, any> | null;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<EvalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EvalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchPage(0);
  }, [user, authLoading, router]);

  async function fetchPage(p: number) {
    setLoading(true);
    try {
      const key = localStorage.getItem('apiKey');
      if (key) setApiKey(key);
      const res = await api.get(`/evaluations?limit=${limit}&offset=${p * limit}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const key = localStorage.getItem('apiKey');
      if (key) setApiKey(key);
      const res = await api.get(`/evaluations/${id}`);
      setSelected(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Evaluation History</h1>
        <p className="text-[#56545E] mt-1 text-sm">{total} total evaluations</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <p className="text-[#56545E] text-lg">No evaluations yet</p>
          <p className="text-[#56545E] text-sm mt-2">Run your first evaluation to see results here</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Prompt</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Risk</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Action</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Scores</th>
                  <th className="text-left px-6 py-3.5 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => openDetail(e.id)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm max-w-xs truncate text-[#878593]">{e.prompt}</td>
                    <td className="px-6 py-4">
                      <span className={`badge badge-${e.overall_risk}`}>{e.overall_risk}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge badge-${e.recommended_action}`}>{e.recommended_action}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#56545E] font-mono">
                      <span className="text-[#FF8B3E]">{(e.hallucination_score * 100).toFixed(0)}</span>
                      {' / '}
                      <span className="text-[#30A46C]">{(e.safety_score * 100).toFixed(0)}</span>
                      {' / '}
                      <span className="text-[#36B5CA]">{(e.confidence_score * 100).toFixed(0)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#56545E] whitespace-nowrap">
                      {new Date(e.created_at).toLocaleDateString()}
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

      {/* Detail Modal */}
      {(selected || detailLoading) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div
            className="glass-strong rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-8 text-center text-[#56545E]">
                <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </div>
            ) : selected && (
              <>
                <div className="sticky top-0 glass-strong border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <div>
                    <h2 className="text-lg font-semibold">Evaluation Detail</h2>
                    <p className="text-xs text-[#56545E] font-mono">{selected.id}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#56545E] hover:text-white text-2xl leading-none transition-colors">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex gap-3">
                    <span className={`badge badge-${selected.overall_risk}`}>{selected.overall_risk} risk</span>
                    <span className={`badge badge-${selected.recommended_action}`}>{selected.recommended_action}</span>
                    <span className="badge bg-white/5 text-[#878593]">{selected.processing_time_ms.toFixed(0)}ms</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-[#FF8B3E]/10 border border-[#FF8B3E]/15">
                      <p className="text-2xl font-bold text-[#FF8B3E]">{(selected.hallucination_score * 100).toFixed(0)}%</p>
                      <p className="text-xs text-[#56545E] mt-1">Hallucination</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-[#30A46C]/10 border border-[#30A46C]/15">
                      <p className="text-2xl font-bold text-[#30A46C]">{(selected.safety_score * 100).toFixed(0)}%</p>
                      <p className="text-xs text-[#56545E] mt-1">Safety</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-2xl font-bold text-[#36B5CA]">{(selected.confidence_score * 100).toFixed(0)}%</p>
                      <p className="text-xs text-[#56545E] mt-1">Confidence</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-[#56545E] mb-1.5 uppercase tracking-wider">Summary</h3>
                    <p className="text-[#878593]">{selected.summary}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-[#56545E] mb-1.5 uppercase tracking-wider">Prompt</h3>
                    <p className="text-[#878593] bg-white/[0.02] p-4 rounded-xl text-sm whitespace-pre-wrap border border-white/5">{selected.prompt}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-[#56545E] mb-1.5 uppercase tracking-wider">Model Output</h3>
                    <p className="text-[#878593] bg-white/[0.02] p-4 rounded-xl text-sm whitespace-pre-wrap border border-white/5">{selected.model_output}</p>
                  </div>

                  {selected.context && selected.context.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-[#56545E] mb-1.5 uppercase tracking-wider">Context</h3>
                      <div className="space-y-2">
                        {selected.context.map((c, i) => (
                          <p key={i} className="text-[#878593] bg-white/[0.02] p-4 rounded-xl text-sm border border-white/5">{c}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-[#56545E] pt-4 border-t border-white/5">
                    Created: {new Date(selected.created_at).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
