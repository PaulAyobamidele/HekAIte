'use client';

const RISK_STYLES: Record<string, string> = {
  unacceptable: 'bg-[#E5484D]/12 text-[#E5484D] border-[#E5484D]/15',
  high: 'bg-[#FF8B3E]/12 text-[#FF8B3E] border-[#FF8B3E]/15',
  limited: 'bg-yellow-500/15 text-[#FFB224] border-[#FFB224]/15',
  minimal: 'bg-[#30A46C]/15 text-[#30A46C] border-[#30A46C]/15',
};

export default function EURiskBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const style = RISK_STYLES[category] || 'bg-white/5 text-[#878593] border-white/10';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider rounded-lg border ${style}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      EU: {category}
    </span>
  );
}
