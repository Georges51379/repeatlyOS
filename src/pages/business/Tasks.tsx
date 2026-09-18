import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Clock, AlertOctagon, CheckCircle2, AlertCircle, X, KanbanSquare, CalendarClock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import FormField, { fieldInputClass } from '../../components/FormField';
import type { BoardColumn, Task } from '../../types/domain';

const COLUMNS: { key: BoardColumn; label: string; icon: typeof Clock; dot: string; accent: string }[] = [
  { key: 'todo', label: 'To Do', icon: Clock, dot: 'bg-slate-500', accent: 'border-t-slate-500' },
  { key: 'in_progress', label: 'In Progress', icon: AlertOctagon, dot: 'bg-blue-400', accent: 'border-t-blue-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, dot: 'bg-emerald-400', accent: 'border-t-emerald-500' },
  { key: 'issue', label: 'Issue', icon: AlertCircle, dot: 'bg-red-400', accent: 'border-t-red-500' },
];

export default function Tasks() {
  const { business } = useCurrentBusiness();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const stats = useMemo(() => ({
    open: tasks.filter((t) => t.board_column === 'todo' || t.board_column === 'in_progress').length,
    completed: tasks.filter((t) => t.board_column === 'completed').length,
    issues: tasks.filter((t) => t.board_column === 'issue').length,
  }), [tasks]);

  if (!business) return null;

  const addTask = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('tasks').insert({
      business_id: business.id,
      title: title.trim(),
      assigned_to: assignedTo.trim() || null,
      due_at: dueAt || null,
      notes: notes.trim() || null,
      board_column: 'todo',
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setTitle('');
    setAssignedTo('');
    setDueAt('');
    setNotes('');
    setError(null);
    setToast({ message: 'Task added.', type: 'success' });
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
      <PageHeader
        title="Tasks"
        subtitle={business.name}
        actionLabel="Add task"
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      {tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <StatCard title="Open" value={stats.open} icon={KanbanSquare} accent="blue" />
          <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Issues" value={stats.issues} icon={AlertCircle} accent="red" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`bg-slate-900 border border-slate-800 border-t-2 ${col.accent} rounded-xl p-3`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <col.icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">{col.label}</span>
                <span className="text-xs text-slate-600">
                  ({tasks.filter((t) => t.board_column === col.key).length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.board_column === col.key)
                  .map((t) => {
                    const overdue = t.due_at && new Date(t.due_at) < new Date() && t.board_column !== 'completed';
                    return (
                      <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 card-hover">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white text-sm font-medium">{t.title}</p>
                          <button onClick={() => removeTask(t.id)} className="text-slate-600 hover:text-red-400 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {t.assigned_to && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> {t.assigned_to}
                          </p>
                        )}
                        {t.notes && <p className="text-xs text-slate-600 mt-1">{t.notes}</p>}
                        {t.due_at && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-600'}`}>
                            <CalendarClock className="w-3 h-3" /> {new Date(t.due_at).toLocaleDateString()}
                            {overdue ? ' · overdue' : ''}
                          </p>
                        )}
                        <select
                          value={t.board_column}
                          onChange={(e) => moveTask(t.id, e.target.value as BoardColumn)}
                          className="mt-2 w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                              Move to: {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                {tasks.filter((t) => t.board_column === col.key).length === 0 && (
                  <p className="text-xs text-slate-700 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add task" onClose={() => { setShowAdd(false); setError(null); }} size="sm" icon={<KanbanSquare className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-4">
            <FormField label="Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Restock shelves"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Assigned to" helper="Optional — a staff name or team.">
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Karim"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Due date" helper="Optional.">
              <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={fieldInputClass} />
            </FormField>
            <FormField label="Notes" helper="Optional.">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra detail"
                rows={2}
                className={fieldInputClass}
              />
            </FormField>
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { setShowAdd(false); setError(null); }}
              className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addTask}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
