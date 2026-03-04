'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth';
import api, { setApiKey } from '../lib/api';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('apiKey') || '' : ''
  );
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      if (apiKeyInput) {
        localStorage.setItem('apiKey', apiKeyInput);
        setApiKey(apiKeyInput);
      }
      const res = await api.post('/evaluate', {
        prompt,
        model_output: output,
        context: context ? [context] : [],
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      {!user && (
        <div className="text-center mb-20 pt-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#191A1F] border border-white/[0.06] text-xs font-medium text-[#878593] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C]" />
            EU AI Act Compliant
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.1] text-[#EDEDEF]">
            Guard your AI
            <br />
            <span className="gradient-text">with confidence</span>
          </h1>
          <p className="text-base text-[#878593] max-w-xl mx-auto mb-8 leading-relaxed">
            Production-grade observability for LLM outputs. Detect hallucinations,
            safety violations, and confidence issues in real time.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
              Start Free
            </Link>
            <Link href="/login" className="btn-ghost px-6 py-2.5 rounded-lg text-sm font-semibold">
              Sign In
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {['Hallucination Detection', 'Safety Classification', 'Confidence Scoring', 'Audit Trail', 'Policy Engine'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-md bg-[#191A1F] border border-white/[0.06] text-xs text-[#878593]">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Eval form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#7C5CFC] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Evaluate LLM Output</h2>
              <p className="text-xs text-[#56545E]">Paste output to analyze for risks</p>
            </div>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5">API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg input-dark text-sm"
                placeholder="sk_..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5">Prompt</label>
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg input-dark text-sm resize-none"
                placeholder="What was the original prompt?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5">Model Output</label>
              <textarea
                required
                rows={4}
                value={output}
                onChange={e => setOutput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg input-dark text-sm resize-none"
                placeholder="Paste the LLM response here"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878593] mb-1.5">Context <span className="text-[#56545E]">(optional)</span></label>
              <textarea
                rows={2}
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg input-dark text-sm resize-none"
                placeholder="Source documents or RAG context"
              />
            </div>
            {error && (
              <div className="bg-[#E5484D]/10 border border-[#E5484D]/20 text-[#E5484D] px-3 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </span>
              ) : 'Run Evaluation'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div className="space-y-4 animate-slide-up">
              <div className={`rounded-xl p-5 border ${
                result.overall_risk === 'critical' ? 'bg-[#E5484D]/8 border-[#E5484D]/15' :
                result.overall_risk === 'high' ? 'bg-[#FF8B3E]/8 border-[#FF8B3E]/15' :
                result.overall_risk === 'medium' ? 'bg-[#FFB224]/8 border-[#FFB224]/15' :
                'bg-[#30A46C]/8 border-[#30A46C]/15'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xl font-bold capitalize ${
                    result.overall_risk === 'critical' ? 'text-[#E5484D]' :
                    result.overall_risk === 'high' ? 'text-[#FF8B3E]' :
                    result.overall_risk === 'medium' ? 'text-[#FFB224]' :
                    'text-[#30A46C]'
                  }`}>
                    {result.overall_risk} Risk
                  </span>
                  <span className={`badge badge-${result.recommended_action} capitalize`}>
                    {result.recommended_action}
                  </span>
                </div>
                <p className="text-sm text-[#878593]">{result.summary}</p>
                <p className="text-xs text-[#56545E] mt-1.5">{result.processing_time_ms.toFixed(0)}ms</p>
              </div>

              <div className="grid grid-cols-3 gap-3 stagger-children">
                <div className="glass-card rounded-lg p-4 text-center">
                  <p className="text-xl font-bold text-[#FF8B3E]">{(result.hallucination.score * 100).toFixed(0)}%</p>
                  <p className="text-[11px] text-[#56545E] mt-1">Hallucination</p>
                  <div className="mt-2 w-full h-1 rounded-full bg-white/[0.04]">
                    <div className="h-1 rounded-full bg-[#FF8B3E] transition-all" style={{ width: `${result.hallucination.score * 100}%` }} />
                  </div>
                </div>
                <div className="glass-card rounded-lg p-4 text-center">
                  <p className="text-xl font-bold text-[#30A46C]">{(result.safety.score * 100).toFixed(0)}%</p>
                  <p className="text-[11px] text-[#56545E] mt-1">Safety</p>
                  <div className="mt-2 w-full h-1 rounded-full bg-white/[0.04]">
                    <div className="h-1 rounded-full bg-[#30A46C] transition-all" style={{ width: `${result.safety.score * 100}%` }} />
                  </div>
                </div>
                <div className="glass-card rounded-lg p-4 text-center">
                  <p className="text-xl font-bold text-[#36B5CA]">{(result.confidence.score * 100).toFixed(0)}%</p>
                  <p className="text-[11px] text-[#56545E] mt-1">Confidence</p>
                  <div className="mt-2 w-full h-1 rounded-full bg-white/[0.04]">
                    <div className="h-1 rounded-full bg-[#36B5CA] transition-all" style={{ width: `${result.confidence.score * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-lg p-4">
                <details>
                  <summary className="text-sm font-medium text-[#878593] cursor-pointer hover:text-[#EDEDEF] transition-colors">
                    View Full Response
                  </summary>
                  <pre className="mt-3 bg-white/[0.02] p-3 rounded-lg text-xs overflow-auto max-h-80 text-[#878593] border border-white/[0.06]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <p className="text-[#56545E] text-sm">Run an evaluation to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
