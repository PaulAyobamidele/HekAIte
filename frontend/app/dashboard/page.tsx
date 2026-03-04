'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import RiskOverTimeChart from '../../components/charts/RiskOverTimeChart';
import DistributionChart from '../../components/charts/DistributionChart';

interface Summary {
  total_evaluations: number;
  today_evaluations: number;
  week_evaluations: number;
  blocked_count: number;
  flagged_count: number;
  avg_hallucination_score: number;
  avg_safety_score: number;
  avg_confidence_score: number;
  avg_processing_time_ms: number;
}

interface Distribution {
  total_evaluations: number;
  risk_distribution: Record<string, number>;
  action_distribution: Record<string, number>;
  hallucination_distribution: Record<string, number>;
  safety_distribution: Record<string, number>;
}

interface RiskOverTime {
  data: Array<{
    date: string;
    total: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    avg_hallucination: number;
    avg_safety: number;
  }>;
}

function StatCard({ label, value, sub, icon, gradient }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="glass-card rounded-xl p-6 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-[#878593] mt-1">{label}</p>
      {sub && <p className="text-xs text-[#56545E] mt-0.5">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-[#878593]">{label}</span>
        <span className="font-semibold">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [riskOverTime, setRiskOverTime] = useState<RiskOverTime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/distribution?days=30'),
        api.get('/analytics/risk-over-time?days=30'),
      ])
        .then(([summaryRes, distRes, riskRes]) => {
          setSummary(summaryRes.data);
          setDistribution(distRes.data);
          setRiskOverTime(riskRes.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="skeleton h-80 rounded-xl" />
            <div className="skeleton h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[#56545E] mt-1 text-sm">Overview of your LLM evaluation metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          label="Total Evaluations"
          value={summary.total_evaluations}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          gradient="bg-[#7C5CFC]"
        />
        <StatCard
          label="Today"
          value={summary.today_evaluations}
          sub={`${summary.week_evaluations} this week`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          gradient="bg-[#3E63DD]"
        />
        <StatCard
          label="Blocked"
          value={summary.blocked_count}
          sub={`${summary.flagged_count} flagged`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          gradient="bg-[#E5484D]"
        />
        <StatCard
          label="Avg Latency"
          value={`${summary.avg_processing_time_ms.toFixed(0)}ms`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
          gradient="bg-[#30A46C]"
        />
      </div>

      {/* Average Scores */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-5">Average Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreBar label="Hallucination" value={summary.avg_hallucination_score} color="bg-[#FF8B3E]" />
          <ScoreBar label="Safety" value={summary.avg_safety_score} color="bg-[#30A46C]" />
          <ScoreBar label="Confidence" value={summary.avg_confidence_score} color="bg-[#36B5CA]" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Over Time</h2>
          {riskOverTime && riskOverTime.data.length > 0 ? (
            <RiskOverTimeChart data={riskOverTime.data} />
          ) : (
            <div className="flex items-center justify-center h-60 text-[#56545E] text-sm">No data yet</div>
          )}
        </div>
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
          {distribution && distribution.total_evaluations > 0 ? (
            <DistributionChart data={distribution.risk_distribution} />
          ) : (
            <div className="flex items-center justify-center h-60 text-[#56545E] text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Hallucination Distribution</h2>
          {distribution && distribution.total_evaluations > 0 ? (
            <DistributionChart data={distribution.hallucination_distribution} color="#FF8B3E" />
          ) : (
            <div className="flex items-center justify-center h-60 text-[#56545E] text-sm">No data yet</div>
          )}
        </div>
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Safety Distribution</h2>
          {distribution && distribution.total_evaluations > 0 ? (
            <DistributionChart data={distribution.safety_distribution} color="#30A46C" />
          ) : (
            <div className="flex items-center justify-center h-60 text-[#56545E] text-sm">No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
