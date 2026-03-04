'use client';

import Link from 'next/link';
import EURiskBadge from './EURiskBadge';

interface PolicyCardProps {
  id: string;
  name: string;
  description: string | null;
  version: number;
  eu_risk_category: string | null;
  rules: any;
  is_active: boolean;
  violation_count: number;
  created_at: string;
}

export default function PolicyCard({ id, name, description, version, eu_risk_category, rules, is_active, violation_count, created_at }: PolicyCardProps) {
  const conditionCount = rules?.conditions?.length || 0;
  const action = rules?.action || 'flag';
  const severity = rules?.severity || 'medium';

  return (
    <Link href={`/policies/${id}`} className="block">
      <div className={`glass-card rounded-xl p-6 transition-all hover:border-white/10 hover:scale-[1.01] ${!is_active ? 'opacity-50' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-base font-semibold truncate">{name}</h3>
              {!is_active && (
                <span className="px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider rounded bg-white/5 text-[#56545E]">
                  Disabled
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-[#56545E] line-clamp-2">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className={`badge badge-${severity}`}>{severity}</span>
            <span className={`badge badge-${action}`}>{action}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-[#56545E]">
          <EURiskBadge category={eu_risk_category} />
          <span>v{version}</span>
          <span>{conditionCount} condition{conditionCount !== 1 ? 's' : ''}</span>
          <span className={violation_count > 0 ? 'text-[#E5484D] font-medium' : ''}>
            {violation_count} violation{violation_count !== 1 ? 's' : ''}
          </span>
          <span className="ml-auto">{new Date(created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
