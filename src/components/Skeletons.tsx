export function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-24 bg-slate-800 rounded" />
          <div className="h-7 w-16 bg-slate-800 rounded" />
          <div className="h-2 w-20 bg-slate-800 rounded" />
        </div>
        <div className="w-9 h-9 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/50 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-800 rounded" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b border-slate-800/50 animate-pulse">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3 bg-slate-800 rounded" style={{ width: `${40 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-slate-300 font-semibold text-sm">{title}</p>
      <p className="text-slate-500 text-xs mt-1 max-w-xs">{sub}</p>
    </div>
  );
}
