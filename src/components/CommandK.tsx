import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  /** Extra words this command should also match on (page aliases, synonyms) — not shown, just searched. */
  keywords?: string;
  group: string;
  icon?: LucideIcon;
  to?: string;
  onSelect?: () => void;
}

interface Props {
  commands: Command[];
  open: boolean;
  onClose: () => void;
}

/** The real app's Cmd/Ctrl+K palette — Overview/Approvals/Businesses/…
 * for platform admin, Products/Orders/Customers/… for a business, wired up
 * per-layout with whatever pages that role can actually see. Deliberately
 * a separate component from `CommandPalette.tsx`, which is the OLD
 * standalone sales-demo dashboard's own command palette (driven by
 * DemoContext's fake data, routed to /dashboard/* demo pages) — the two
 * are unrelated features that happen to share a UI idea, not one thing,
 * so this one gets its own name instead of overwriting that one. */
export default function CommandK({ commands, open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Command[]>();
    for (const c of filtered) {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group)!.push(c);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const runCommand = (cmd: Command) => {
    onClose();
    if (cmd.to) navigate(cmd.to);
    cmd.onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) runCommand(cmd);
    }
  };

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 animate-modal-in overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page or run a command…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin py-2">
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No matches for "{query}".</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider px-4 pt-2 pb-1">{group}</p>
                {items.map((cmd) => {
                  flatIndex++;
                  const isActive = flatIndex === activeIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                        isActive ? 'bg-blue-600/15 text-blue-300' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> Select
          </span>
        </div>
      </div>
    </div>
  );
}

/** Registers the Cmd/Ctrl+K shortcut and owns open/close state — one line
 * to add to any layout: `const palette = useCommandPaletteState();` then
 * render `<CommandK {...palette} commands={...} />`. */
export function useCommandPaletteState() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, onClose: () => setOpen(false), openPalette: () => setOpen(true) };
}
