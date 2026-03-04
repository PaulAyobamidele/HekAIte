'use client';

interface TimelineEvent {
  id: string;
  event_type: string;
  span_id: string;
  parent_span_id: string | null;
  evaluator_scores: Record<string, number> | null;
  risk_decision: { risk_level: string; action: string } | null;
  latency_ms: number | null;
  extra_data: Record<string, any> | null;
  created_at: string;
}

interface TimelineChartProps {
  events: TimelineEvent[];
}

const EVENT_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  evaluation_start: { bg: 'bg-[#7C5CFC]/10', border: 'border-[#7C5CFC]/15', dot: 'bg-[#7C5CFC]' },
  evaluation_complete: { bg: 'bg-[#30A46C]/10', border: 'border-[#30A46C]/15', dot: 'bg-[#30A46C]' },
  policy_check: { bg: 'bg-[#7C5CFC]/8', border: 'border-[#7C5CFC]/15', dot: 'bg-purple-500' },
  policy_violation: { bg: 'bg-[#E5484D]/10', border: 'border-[#E5484D]/15', dot: 'bg-red-500' },
};

const DEFAULT_COLOR = { bg: 'bg-white/[0.03]', border: 'border-white/5', dot: 'bg-[#56545E]' };

export default function TimelineChart({ events }: TimelineChartProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#7C5CFC]/20 via-[#7C5CFC]/15 to-transparent" />

      <div className="space-y-4">
        {events.map((event) => {
          const colors = EVENT_COLORS[event.event_type] || DEFAULT_COLOR;
          const isChild = !!event.parent_span_id;

          return (
            <div
              key={event.id}
              className={`relative flex items-start gap-4 ${isChild ? 'ml-8' : ''}`}
            >
              {/* Dot */}
              <div className={`relative z-10 w-5 h-5 mt-1 rounded-full ${colors.dot} ring-4 ring-[#111113] flex items-center justify-center`}>
                <div className="w-2 h-2 rounded-full bg-white/50" />
              </div>

              {/* Card */}
              <div className={`flex-1 p-4 rounded-xl border ${colors.bg} ${colors.border} transition-all hover:border-white/10`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[#56545E]">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[#56545E]">
                  <span className="font-mono">span: {event.span_id.slice(0, 8)}</span>
                  {event.latency_ms && (
                    <span className="font-medium text-[#878593]">{event.latency_ms.toFixed(0)}ms</span>
                  )}
                </div>

                {event.evaluator_scores && (
                  <div className="mt-2 flex gap-4 text-xs">
                    <span>Hallucination: <strong className="text-[#FF8B3E]">{(event.evaluator_scores.hallucination * 100).toFixed(0)}%</strong></span>
                    <span>Safety: <strong className="text-[#30A46C]">{(event.evaluator_scores.safety * 100).toFixed(0)}%</strong></span>
                    <span>Confidence: <strong className="text-[#36B5CA]">{(event.evaluator_scores.confidence * 100).toFixed(0)}%</strong></span>
                  </div>
                )}

                {event.risk_decision && (
                  <div className="mt-2 flex gap-2">
                    <span className={`badge badge-${event.risk_decision.risk_level}`}>
                      {event.risk_decision.risk_level}
                    </span>
                    <span className={`badge badge-${event.risk_decision.action}`}>
                      {event.risk_decision.action}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
