'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import RuleBuilder from '../../../components/policies/RuleBuilder';

interface Template {
  name: string;
  description: string;
  eu_risk_category: string;
  rules: any;
}

export default function CreatePolicyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [euRiskCategory, setEuRiskCategory] = useState('');
  const [conditions, setConditions] = useState<any[]>([
    { field: 'hallucination_score', operator: 'gt', value: 0.5 },
  ]);
  const [logic, setLogic] = useState('any');
  const [action, setAction] = useState('flag');
  const [severity, setSeverity] = useState('medium');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchTemplates();
  }, [user, authLoading]);

  async function fetchTemplates() {
    try {
      const res = await api.get('/policies/templates');
      setTemplates(res.data.templates);
    } catch (e) {
      console.error(e);
    }
  }

  function applyTemplate(t: Template) {
    setName(t.name);
    setDescription(t.description);
    setEuRiskCategory(t.eu_risk_category);
    setConditions(t.rules.conditions);
    setLogic(t.rules.logic);
    setAction(t.rules.action);
    setSeverity(t.rules.severity);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || conditions.length === 0) {
      setError('Name and at least one condition are required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.post('/policies', {
        name,
        description: description || null,
        eu_risk_category: euRiskCategory || null,
        rules: { conditions, logic, action, severity },
      });
      router.push('/policies');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <Link href="/policies" className="text-sm text-[#7C5CFC] hover:text-[#6E4AE8] transition-colors mb-3 inline-block">
          &larr; Back to Policies
        </Link>
        <h1 className="text-2xl font-bold">Create Policy</h1>
        <p className="text-[#56545E] mt-1 text-sm">Define rules to automatically check every evaluation</p>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#878593] mb-3 uppercase tracking-wider">EU AI Act Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-left glass-card rounded-xl p-4 hover:border-[#7C5CFC]/20 transition-all"
              >
                <p className="text-sm font-medium mb-1">{t.name}</p>
                <p className="text-xs text-[#56545E] line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Policy Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl input-dark text-sm"
                placeholder="e.g. Safety Threshold Policy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl input-dark text-sm resize-none"
                placeholder="What does this policy enforce?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">EU Risk Category</label>
              <select
                value={euRiskCategory}
                onChange={(e) => setEuRiskCategory(e.target.value)}
                className="px-4 py-3 rounded-xl input-dark text-sm cursor-pointer"
              >
                <option value="" className="bg-dark-800">None</option>
                <option value="unacceptable" className="bg-dark-800">Unacceptable</option>
                <option value="high" className="bg-dark-800">High</option>
                <option value="limited" className="bg-dark-800">Limited</option>
                <option value="minimal" className="bg-dark-800">Minimal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Rules</h2>
          <RuleBuilder
            conditions={conditions}
            logic={logic}
            action={action}
            severity={severity}
            onChange={({ conditions: c, logic: l, action: a, severity: s }) => {
              setConditions(c);
              setLogic(l);
              setAction(a);
              setSeverity(s);
            }}
          />
        </div>

        {error && (
          <div className="bg-[#E5484D]/10 border border-[#E5484D]/15 text-[#E5484D] px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold"
          >
            {saving ? 'Creating...' : 'Create Policy'}
          </button>
          <Link href="/policies" className="btn-ghost px-6 py-3 rounded-xl text-sm font-semibold">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
