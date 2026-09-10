// Churn risk score 1-10 calculated from visit recency, payment history, session balance
export interface ChurnScore {
  score: number;      // 1 (safe) → 10 (about to churn)
  label: string;
  color: string;
  bg: string;
  reasons: string[];
}

export function calcChurnScore(customer: {
  lastVisit: string;
  status: string;
  balance: number;
  type: string;
}, sessionBalance?: number): ChurnScore {
  let score = 0;
  const reasons: string[] = [];

  // Days since last visit
  const lastVisitDate = new Date(customer.lastVisit || '2024-01-01');
  const today = new Date('2024-06-11');
  const daysSince = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince > 30) { score += 4; reasons.push(`${daysSince} days since last visit`); }
  else if (daysSince > 14) { score += 2; reasons.push(`${daysSince} days since last visit`); }
  else if (daysSince > 7) { score += 1; }

  // Payment issues
  if (customer.balance < 0) { score += 3; reasons.push(`Unpaid balance: $${Math.abs(customer.balance)}`); }
  if (customer.status === 'Overdue') { score += 2; reasons.push('Account overdue'); }
  if (customer.status === 'Expiring Soon') { score += 2; reasons.push('Subscription expiring soon'); }

  // Low sessions
  if (sessionBalance !== undefined) {
    if (sessionBalance === 0) { score += 3; reasons.push('No sessions remaining'); }
    else if (sessionBalance <= 2) { score += 1; reasons.push(`Only ${sessionBalance} session(s) left`); }
  }

  // Cap at 10
  score = Math.min(10, score);

  const label = score >= 8 ? 'Critical' : score >= 6 ? 'High' : score >= 4 ? 'Medium' : score >= 2 ? 'Low' : 'Safe';
  const color = score >= 8 ? 'text-red-400' : score >= 6 ? 'text-orange-400' : score >= 4 ? 'text-amber-400' : score >= 2 ? 'text-blue-400' : 'text-emerald-400';
  const bg    = score >= 8 ? 'bg-red-500/10 border-red-500/25' : score >= 6 ? 'bg-orange-500/10 border-orange-500/25' : score >= 4 ? 'bg-amber-500/10 border-amber-500/25' : score >= 2 ? 'bg-blue-500/10 border-blue-500/25' : 'bg-emerald-500/10 border-emerald-500/25';

  return { score, label, color, bg, reasons };
}

interface ChurnBadgeProps {
  score: ChurnScore;
  showReasons?: boolean;
}

export default function ChurnBadge({ score, showReasons = false }: ChurnBadgeProps) {
  return (
    <div className={`border rounded-xl p-3 ${score.bg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-slate-400 text-xs font-semibold">Churn Risk</p>
        <div className="flex items-center gap-2">
          {/* Mini score bar */}
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`w-2 h-3 rounded-sm ${i < score.score ? score.color.replace('text-', 'bg-') : 'bg-slate-700'}`} />
            ))}
          </div>
          <span className={`text-xs font-black ${score.color}`}>{score.label}</span>
        </div>
      </div>
      {showReasons && score.reasons.length > 0 && (
        <div className="space-y-0.5 mt-2">
          {score.reasons.map(r => (
            <p key={r} className={`text-xs ${score.color} opacity-80 flex items-center gap-1`}>
              <span>⚠</span> {r}
            </p>
          ))}
        </div>
      )}
      {score.score === 0 && <p className="text-emerald-400 text-xs">✓ Healthy — no risk factors detected</p>}
    </div>
  );
}
