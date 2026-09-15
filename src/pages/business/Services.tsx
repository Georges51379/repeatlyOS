import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Wrench, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Skeletons';
import type { Service } from '../../types/domain';

interface FormState {
  id: string | null;
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
}

const EMPTY_FORM: FormState = { id: null, name: '', description: '', duration_minutes: '30', price: '' };

export default function Services() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'services.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  const stats = useMemo(() => {
    const active = services.filter((s) => s.active).length;
    const avgDuration = services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length) : 0;
    return { total: services.length, active, avgDuration };
  }, [services]);

  if (!business) return null;

  const handleSave = async () => {
    if (!form || !form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: Number(form.duration_minutes) || 30,
      price: form.price.trim() === '' ? null : Number(form.price),
    };

    const isNew = !form.id;
    const { error: saveError } = form.id
      ? await supabase.from('services').update(payload).eq('id', form.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setForm(null);
    setToast({ message: isNew ? 'Service added.' : 'Service updated.', type: 'success' });
    await load();
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('services').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (deleteError) {
      setToast({ message: deleteError.message, type: 'error' });
      return;
    }
    setToast({ message: 'Service removed.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Services"
        subtitle={business.name}
        actionLabel={canManage ? 'Add service' : undefined}
        actionIcon={Plus}
        onAction={() => setForm(EMPTY_FORM)}
      />

      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <StatCard title="Total services" value={stats.total} icon={Wrench} accent="blue" />
          <StatCard title="Active" value={stats.active} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Avg. duration" value={`${stats.avgDuration}m`} icon={Clock} accent="purple" />
        </div>
      )}

      {services.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search services…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={3} cols={canManage ? 5 : 4} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4}>
                  {services.length === 0 ? (
                    <EmptyState type="services" onCreate={canManage ? () => setForm(EMPTY_FORM) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.duration_minutes} min</td>
                  <td className="px-4 py-3 text-slate-400">{s.price != null ? `$${s.price}` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.active ? 'active' : 'archived'} label={s.active ? 'Active' : 'Inactive'} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setForm({
                              id: s.id,
                              name: s.name,
                              description: s.description ?? '',
                              duration_minutes: String(s.duration_minutes),
                              price: s.price != null ? String(s.price) : '',
                            })
                          }
                          className="text-slate-500 hover:text-slate-300 p-1 focus-ring rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(s.id)} className="text-slate-500 hover:text-red-400 p-1 focus-ring rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? 'Edit service' : 'Add service'} onClose={() => { setForm(null); setError(null); }} size="sm" icon={<Wrench className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name *"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                placeholder="Duration (min)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { setForm(null); setError(null); }}
              className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal title="Remove service" onClose={() => setConfirmDeleteId(null)} size="sm">
          <p className="text-slate-400 text-sm mb-4">This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Remove
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
