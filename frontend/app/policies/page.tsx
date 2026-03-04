'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import PolicyCard from '../../components/policies/PolicyCard';

interface PolicyItem {
  id: string;
  name: string;
  description: string | null;
  version: number;
  eu_risk_category: string | null;
  rules: any;
  is_active: boolean;
  violation_count: number;
  created_at: string;
  updated_at: string | null;
}

export default function PoliciesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchPolicies();
  }, [user, authLoading]);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const res = await api.get('/policies');
      setPolicies(res.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const activeCount = policies.filter((p) => p.is_active).length;
  const totalViolations = policies.reduce((sum, p) => sum + p.violation_count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Policy Engine</h1>
          <p className="text-[#56545E] mt-1 text-sm">
            {policies.length} policies &middot; {activeCount} active &middot; {totalViolations} violations
          </p>
        </div>
        <Link
          href="/policies/create"
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          + New Policy
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
        <div className="glass-card rounded-xl p-5 text-center">
          <p className="text-3xl font-bold">{policies.length}</p>
          <p className="text-xs text-[#56545E] mt-1">Total Policies</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-[#30A46C]">{activeCount}</p>
          <p className="text-xs text-[#56545E] mt-1">Active</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <p className={`text-3xl font-bold ${totalViolations > 0 ? 'text-[#E5484D]' : 'text-[#56545E]'}`}>
            {totalViolations}
          </p>
          <p className="text-xs text-[#56545E] mt-1">Violations</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#7C5CFC] opacity-20 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="text-[#56545E] text-lg">No policies configured</p>
          <p className="text-[#56545E] text-sm mt-2">Create your first policy or start from an EU AI Act template</p>
          <Link href="/policies/create" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-block mt-6">
            Create Policy
          </Link>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {policies.map((p) => (
            <PolicyCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
