import { useState } from 'react';
import { ChevronDown, Check, Zap } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { businessList } from '../data/businesses';
import type { BusinessKey } from '../data/businesses';

export default function BusinessSwitcher() {
  const { business, setBusiness } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
      >
        <span>{business.emoji}</span>
        <span className="text-slate-200 font-medium hidden sm:block">{business.name}</span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-64 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={10} className="text-blue-400" /> Demo Business Switcher
              </p>
            </div>
            {businessList.map(b => (
              <button
                key={b.key}
                onClick={() => { setBusiness(b.key as BusinessKey); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-lg w-6 text-center">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{b.name}</p>
                  <p className="text-slate-500 text-xs truncate">{b.category}</p>
                </div>
                {business.key === b.key && <Check size={14} className="text-blue-400 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
