'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import TimelineChart from '../../../components/charts/TimelineChart';

interface TraceEvent {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_type: string;
  evaluation_id: string | null;
  prompt: string | null;
  model_output: string | null;
  model_params: Record<string, any> | null;
  evaluator_scores: Record<string, number> | null;
  risk_decision: { risk_level: string; action: string } | null;
  latency_ms: number | null;
  extra_data: Record<string, any> | null;
  created_at: string;
}

export default function TraceDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const traceId = params.traceId as string;

  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TraceEvent | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && traceId) fetchTrace();
  }, [user, authLoading, traceId]);

  async function fetchTrace() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/audit/traces/${traceId}`);
      setEvents(res.data.events);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load trace');
    } finally {
      setLoading(false);
    }
  }

  const totalLatency = events.reduce((sum, e) => sum + (e.latency_ms || 0), 0);
  const evalEvent = events.find((e) => e.event_type === 'evaluation_complete');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link href="/audit" className="text-sm text-[#7C5CFC] hover:text-[#6E4AE8] transition-colors mb-3 inline-block">
          &larr; Back to Audit Trail
        </Link>
        <h1 className="text-2xl font-bold">Trace Detail</h1>
        <p className="text-[#56545E] mt-1 font-mono text-sm">{traceId}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#E5484D]/10 border border-[#E5484D]/15 rounded-xl p-6 text-[#E5484D]">
          {error}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
            <div className="glass-card rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">{events.length}</p>
              <p className="text-xs text-[#56545E] mt-1">Total Spans</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">{totalLatency.toFixed(0)}<span className="text-lg text-[#56545E]">ms</span></p>
              <p className="text-xs text-[#56545E] mt-1">Total Latency</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              {evalEvent?.risk_decision ? (
                <>
                  <p className={`text-3xl font-bold ${
                    evalEvent.risk_decision.risk_level === 'critical' ? 'text-[#E5484D]' :
                    evalEvent.risk_decision.risk_level === 'high' ? 'text-[#FF8B3E]' :
                    evalEvent.risk_decision.risk_level === 'medium' ? 'text-[#FFB224]' :
                    'text-[#30A46C]'
                  }`}>
                    {evalEvent.risk_decision.risk_level.toUpperCase()}
                  </p>
                  <p className="text-xs text-[#56545E] mt-1">Risk Decision</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-[#56545E]">&mdash;</p>
                  <p className="text-xs text-[#56545E] mt-1">Risk Decision</p>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-6">Event Timeline</h2>
            <TimelineChart events={events} />
          </div>

          {/* Raw events table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold">All Events</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Event</th>
                  <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Span</th>
                  <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Latency</th>
                  <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Time</th>
                  <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-3 text-sm font-medium">{ev.event_type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3 text-xs font-mono text-[#56545E]">{ev.span_id.slice(0, 12)}</td>
                    <td className="px-6 py-3 text-sm text-[#56545E]">
                      {ev.latency_ms ? `${ev.latency_ms.toFixed(0)}ms` : '\u2014'}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#56545E] whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                        className="text-xs text-[#7C5CFC] hover:text-[#6E4AE8] transition-colors"
                      >
                        {selectedEvent?.id === ev.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected event detail */}
          {selectedEvent && (
            <div className="mt-6 glass-card rounded-xl p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedEvent.event_type.replace(/_/g, ' ')}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-[#56545E] hover:text-white text-xl transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#56545E] text-xs uppercase tracking-wider mb-1">Span ID</p>
                  <p className="font-mono">{selectedEvent.span_id}</p>
                </div>
                {selectedEvent.parent_span_id && (
                  <div>
                    <p className="text-[#56545E] text-xs uppercase tracking-wider mb-1">Parent Span</p>
                    <p className="font-mono">{selectedEvent.parent_span_id}</p>
                  </div>
                )}
                {selectedEvent.evaluation_id && (
                  <div>
                    <p className="text-[#56545E] text-xs uppercase tracking-wider mb-1">Evaluation ID</p>
                    <p className="font-mono">{selectedEvent.evaluation_id}</p>
                  </div>
                )}
              </div>

              {selectedEvent.prompt && (
                <div className="mt-4">
                  <p className="text-xs text-[#56545E] uppercase tracking-wider mb-1.5">Prompt</p>
                  <p className="text-sm bg-white/[0.02] p-4 rounded-xl whitespace-pre-wrap text-[#878593] border border-white/5">{selectedEvent.prompt}</p>
                </div>
              )}

              {selectedEvent.model_output && (
                <div className="mt-4">
                  <p className="text-xs text-[#56545E] uppercase tracking-wider mb-1.5">Model Output</p>
                  <p className="text-sm bg-white/[0.02] p-4 rounded-xl whitespace-pre-wrap text-[#878593] border border-white/5">{selectedEvent.model_output}</p>
                </div>
              )}

              {selectedEvent.evaluator_scores && (
                <div className="mt-4">
                  <p className="text-xs text-[#56545E] uppercase tracking-wider mb-2">Evaluator Scores</p>
                  <div className="flex gap-4">
                    {Object.entries(selectedEvent.evaluator_scores).map(([k, v]) => (
                      <div key={k} className="bg-white/[0.02] px-4 py-3 rounded-xl text-center border border-white/5">
                        <p className="text-lg font-bold">{(v * 100).toFixed(0)}%</p>
                        <p className="text-xs text-[#56545E] capitalize">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.extra_data && Object.keys(selectedEvent.extra_data).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-[#56545E] uppercase tracking-wider mb-1.5">Extra Data</p>
                  <pre className="text-xs bg-white/[0.02] p-4 rounded-xl overflow-x-auto text-[#878593] border border-white/5">
                    {JSON.stringify(selectedEvent.extra_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
