'use client';

import { useState } from 'react';

interface Condition {
  field: string;
  operator: string;
  value: string | number;
}

interface RuleBuilderProps {
  conditions: Condition[];
  logic: string;
  action: string;
  severity: string;
  onChange: (rules: { conditions: Condition[]; logic: string; action: string; severity: string }) => void;
}

const FIELDS = [
  { value: 'hallucination_score', label: 'Hallucination Score' },
  { value: 'safety_score', label: 'Safety Score' },
  { value: 'confidence_score', label: 'Confidence Score' },
  { value: 'overall_risk', label: 'Overall Risk' },
  { value: 'recommended_action', label: 'Recommended Action' },
];

const NUMERIC_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
];

const STRING_OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
];

const ACTIONS = ['allow', 'flag', 'review', 'block'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

function isNumericField(field: string) {
  return ['hallucination_score', 'safety_score', 'confidence_score'].includes(field);
}

export default function RuleBuilder({ conditions, logic, action, severity, onChange }: RuleBuilderProps) {
  function update(patch: Partial<{ conditions: Condition[]; logic: string; action: string; severity: string }>) {
    onChange({ conditions, logic, action, severity, ...patch });
  }

  function addCondition() {
    update({ conditions: [...conditions, { field: 'hallucination_score', operator: 'gt', value: 0.5 }] });
  }

  function removeCondition(index: number) {
    update({ conditions: conditions.filter((_, i) => i !== index) });
  }

  function updateCondition(index: number, patch: Partial<Condition>) {
    const updated = conditions.map((c, i) => {
      if (i !== index) return c;
      const merged = { ...c, ...patch };
      if (patch.field) {
        merged.operator = isNumericField(patch.field) ? 'gt' : 'eq';
        merged.value = isNumericField(patch.field) ? 0.5 : '';
      }
      return merged;
    });
    update({ conditions: updated });
  }

  return (
    <div className="space-y-6">
      {/* Logic selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#878593]">Match</span>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {['any', 'all'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => update({ logic: l })}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                logic === l ? 'bg-[#7C5CFC]/20 text-[#7C5CFC]' : 'bg-white/[0.02] text-[#56545E] hover:text-[#878593]'
              }`}
            >
              {l === 'any' ? 'Any' : 'All'}
            </button>
          ))}
        </div>
        <span className="text-sm text-[#56545E]">of the following conditions</span>
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        {conditions.map((cond, index) => {
          const numeric = isNumericField(cond.field);
          const operators = numeric ? NUMERIC_OPERATORS : STRING_OPERATORS;

          return (
            <div key={index} className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <select
                value={cond.field}
                onChange={(e) => updateCondition(index, { field: e.target.value })}
                className="px-3 py-2 rounded-lg input-dark text-sm flex-1 cursor-pointer"
              >
                {FIELDS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-dark-800">{f.label}</option>
                ))}
              </select>

              <select
                value={cond.operator}
                onChange={(e) => updateCondition(index, { operator: e.target.value })}
                className="px-3 py-2 rounded-lg input-dark text-sm w-28 cursor-pointer"
              >
                {operators.map((o) => (
                  <option key={o.value} value={o.value} className="bg-dark-800">{o.label}</option>
                ))}
              </select>

              {numeric ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={cond.value}
                  onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 rounded-lg input-dark text-sm w-24"
                />
              ) : (
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  className="px-3 py-2 rounded-lg input-dark text-sm flex-1"
                  placeholder="value"
                />
              )}

              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="text-[#56545E] hover:text-[#E5484D] transition-colors p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addCondition}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-[#56545E] hover:text-[#878593] hover:border-white/20 transition-colors"
        >
          + Add Condition
        </button>
      </div>

      {/* Action & Severity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Action</label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {ACTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => update({ action: a })}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  action === a ? `badge-${a} border-0` : 'bg-white/[0.02] text-[#56545E] hover:text-[#878593]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#878593] mb-1.5 uppercase tracking-wider">Severity</label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update({ severity: s })}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  severity === s ? `badge-${s} border-0` : 'bg-white/[0.02] text-[#56545E] hover:text-[#878593]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
