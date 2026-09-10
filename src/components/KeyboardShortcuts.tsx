import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Open command palette / search' },
  { keys: ['?'], desc: 'Show this shortcuts panel' },
  { keys: ['Esc'], desc: 'Close any modal or panel' },
  { keys: ['G', 'then', 'O'], desc: 'Go to Overview' },
  { keys: ['G', 'then', 'B'], desc: 'Go to Bookings' },
  { keys: ['G', 'then', 'C'], desc: 'Go to Customers' },
  { keys: ['G', 'then', 'P'], desc: 'Go to Payments' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard size={15} className="text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Keyboard Shortcuts</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-1">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 text-xs">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => k === 'then' ? (
                  <span key={ki} className="text-slate-600 text-xs">then</span>
                ) : (
                  <kbd key={ki} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-300 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-xs">Press <kbd className="bg-slate-800 border border-slate-700 rounded px-1 text-slate-400">?</kbd> anytime to toggle</p>
        </div>
      </div>
    </div>
  );
}
