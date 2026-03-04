'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import EURiskBadge from '../../../components/policies/EURiskBadge';

interface Violation {
  id: string;
  evaluation_id: string;
  severity: string;
  details: any;
  created_at: string;
}

interface PolicyDetail {
  id: string;
  name: string;
  description: string | null;
  version: number;
  eu_risk_category: string | null;
  rules: any;
  is_active: boolean;
  violation_count: number;
  violations: Violation[];
  created_at: string;
  updated_at: string | null;
}

export default function PolicyDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Test panel
  const [testHallucination, setTestHallucination] = useState('0.5');
  const [testSafety, setTestSafety] = useState('0.9');
  const [testConfidence, setTestConfidence] = useState('0.8');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && policyId) fetchPolicy();
  }, [user, authLoading, policyId]);

  async function fetchPolicy() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/policies/${policyId}`);
      setPolicy(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    if (!policy) return;
    setToggling(true);
    try {
      await api.put(`/policies/${policyId}`, { is_active: !policy.is_active });
      setPolicy({ ...policy, is_active: !policy.is_active });
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this policy? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/policies/${policyId}`);
      router.push('/policies');
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  }

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/policies/${policyId}/test`, {
        test_data: {
          hallucination_score: parseFloat(testHallucination),
          safety_score: parseFloat(testSafety),
          confidence_score: parseFloat(testConfidence),
        },
      });
      setTestResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <Link href="/policies" className="text-sm text-[#7C5CFC] hover:text-[#6E4AE8] transition-colors mb-3 inline-block">
          &larr; Back to Policies
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#E5484D]/10 border border-[#E5484D]/15 rounded-xl p-6 text-[#E5484D]">{error}</div>
      ) : policy ? (
        <>
          {/* Header */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{policy.name}</h1>
                  {!policy.is_active && (
                    <span className="px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider rounded bg-white/5 text-[#56545E]">
                      Disabled
                    </span>
                  )}
                </div>
                {policy.description && (
                  <p className="text-[#878593] text-sm">{policy.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleActive}
                  disabled={toggling}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    policy.is_active
                      ? 'bg-[#FFB224]/10 text-[#FFB224] hover:bg-[#FFB224]/15'
                      : 'bg-[#30A46C]/10 text-[#30A46C] hover:bg-[#30A46C]/20'
                  }`}
                >
                  {toggling ? '...' : policy.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm rounded-lg font-medium bg-[#E5484D]/10 text-[#E5484D] hover:bg-[#E5484D]/15 transition-colors"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#56545E]">
              <EURiskBadge category={policy.eu_risk_category} />
              <span>Version {policy.version}</span>
              <span className={`badge badge-${policy.rules.severity}`}>{policy.rules.severity}</span>
              <span className={`badge badge-${policy.rules.action}`}>{policy.rules.action}</span>
              <span>Created {new Date(policy.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Rules display */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Rules</h2>
            <p className="text-sm text-[#56545E] mb-4">
              Match <span className="text-[#878593] font-medium">{policy.rules.logic === 'all' ? 'ALL' : 'ANY'}</span> of the following conditions:
            </p>
            <div className="space-y-2">
              {(policy.rules.conditions || []).map((cond: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-sm">
                  <span className="text-[#878593] font-medium">{cond.field.replace(/_/g, ' ')}</span>
                  <span className="text-[#7C5CFC] font-mono">{cond.operator}</span>
                  <span className="text-white font-semibold">{String(cond.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test panel */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Test Policy</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Hallucination</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={testHallucination}
                  onChange={(e) => setTestHallucination(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-dark text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Safety</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={testSafety}
                  onChange={(e) => setTestSafety(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-dark text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Confidence</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={testConfidence}
                  onChange={(e) => setTestConfidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-dark text-sm"
                />
              </div>
            </div>
            <button
              onClick={runTest}
              disabled={testing}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              {testing ? 'Testing...' : 'Run Test'}
            </button>
            {testResult && (
              <div className={`mt-4 p-4 rounded-xl border ${
                testResult.violated
                  ? 'bg-[#E5484D]/10 border-[#E5484D]/15'
                  : 'bg-[#30A46C]/10 border-[#30A46C]/15'
              }`}>
                <p className={`text-sm font-semibold ${testResult.violated ? 'text-[#E5484D]' : 'text-[#30A46C]'}`}>
                  {testResult.violated ? 'VIOLATED' : 'PASSED'}
                </p>
                {testResult.details?.triggered_conditions?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {testResult.details.triggered_conditions.map((tc: any, i: number) => (
                      <p key={i} className="text-xs text-[#878593]">
                        {tc.field}: actual <span className="font-mono text-white">{tc.actual}</span> {tc.operator} threshold <span className="font-mono text-white">{tc.threshold}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Violations */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold">Violations ({policy.violations.length})</h2>
            </div>
            {policy.violations.length === 0 ? (
              <div className="p-8 text-center text-[#56545E] text-sm">
                No violations recorded for this policy
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Evaluation</th>
                    <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Severity</th>
                    <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Triggered</th>
                    <th className="text-left px-6 py-3 text-[0.7rem] font-semibold text-[#56545E] uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.violations.map((v) => (
                    <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-3 text-sm font-mono text-[#7C5CFC]">
                        {v.evaluation_id.slice(0, 16)}...
                      </td>
                      <td className="px-6 py-3">
                        <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-[#56545E]">
                        {v.details?.triggered_conditions?.length || 0} condition(s)
                      </td>
                      <td className="px-6 py-3 text-sm text-[#56545E] whitespace-nowrap">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
