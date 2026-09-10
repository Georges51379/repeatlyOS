import { useCallback, useEffect, useState } from 'react';
import { Plus, Clock, AlertOctagon, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import type { BoardColumn, Task } from '../../types/domain';

const COLUMNS: { key: BoardColumn; label: string; icon: typeof Clock; dot: string }[] = [
  { key: 'todo', label: 'To Do', icon: Clock, dot: 'bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', icon: AlertOctagon, dot: 'bg-blue-400' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, dot: 'bg-emerald-400' },
  { key: 'issue', label: 'Issue', icon: AlertCircle, dot: 'bg-red-400' },
];

export default function Tasks() {
  const { business } = useCurrentBusiness();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  if (!business) return null;

  const addTask = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const { error: insertError } = await supabase.from('tasks').insert({
      business_id: business.id,
      title: title.trim(),
      assigned_to: assignedTo.trim() || null,
      notes: notes.trim() || null,
      board_column: 'todo',
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setTitle('');
    setAssignedTo('');
    setNotes('');
    setError(null);
    await load();
  };

  const moveTask = async (id: string, to: BoardColumn) => {
    await supabase.from('tasks').update({ board_column: to }).eq('id', id);
    await load();
  };

  const removeTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Tasks</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add task
        </button>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-medium text-slate-300">{col.label}</span>
                <span className="text-xs text-slate-600">
                  ({tasks.filter((t) => t.board_column === col.key).length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.board_column === col.key)
                  .map((t) => (
                    <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium">{t.title}</p>
                        <button onClick={() => removeTask(t.id)} className="text-slate-600 hover:text-red-400 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {t.assigned_to && <p className="text-xs text-slate-500 mt-1">{t.assigned_to}</p>}
                      {t.notes && <p className="text-xs text-slate-600 mt-1">{t.notes}</p>}
                      <select
                        value={t.board_column}
                        onChange={(e) => moveTask(t.id, e.target.value as BoardColumn)}
                        className="mt-2 w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            Move to: {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                {tasks.filter((t) => t.board_column === col.key).length === 0 && (
                  <p className="text-xs text-slate-700 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">Add task</h2>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title *"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Assigned to"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setError(null);
                }}
                className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
