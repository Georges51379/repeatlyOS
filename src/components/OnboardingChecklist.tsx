import { useState } from 'react';
import { CheckCircle2, Circle, X, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const baseChecklist = [
  { id: 'profile', label: 'Set up business profile', done: true },
  { id: 'services', label: 'Add services & pricing', done: true },
  { id: 'staff', label: 'Add staff members', done: true },
  { id: 'booking', label: 'Receive your first booking', done: true },
  { id: 'payment', label: 'Record your first payment', done: false },
  { id: 'reminder', label: 'Send your first WhatsApp reminder', done: false },
  { id: 'publish', label: 'Publish your public booking page', done: false },
];

export default function OnboardingChecklist() {
  const { business } = useDemo();
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [checklist, setChecklist] = useState(baseChecklist);

  if (dismissed) return null;

  const doneCount = checklist.filter(c => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  const toggle = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  if (pct === 100) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/5 border border-blue-500/20 rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setCollapsed(v => !v)}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Get {business.name} fully set up</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 max-w-[160px] bg-slate-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-slate-400 text-xs">{doneCount}/{checklist.length} done</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setCollapsed(v => !v); }} className="text-slate-500 hover:text-slate-300 p-1">
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDismissed(true); }} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={15} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map(item => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 transition-colors text-left"
            >
              {item.done
                ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                : <Circle size={15} className="text-slate-600 shrink-0" />
              }
              <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
