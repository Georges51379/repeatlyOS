import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
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
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

    const { error: saveError } = form.id
      ? await supabase.from('services').update(payload).eq('id', form.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setForm(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const { error: deleteError } = await supabase.from('services').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Services</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setForm(EMPTY_FORM)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add service
          </button>
        )}
      </div>

      {loading ? null : services.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <Wrench className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No services yet.</p>
          <p className="text-slate-500 text-sm mb-4">Add a service so customers can book it.</p>
          {canManage && (
            <button
              onClick={() => setForm(EMPTY_FORM)}
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Add your first service
            </button>
          )}
        </div>
      ) : (
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
              {services.map((s) => (
                <tr key={s.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400">{s.duration_minutes} min</td>
                  <td className="px-4 py-3 text-slate-400">{s.price != null ? `$${s.price}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        s.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/40 text-slate-400'
                      }`}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
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
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">{form.id ? 'Edit service' : 'Add service'}</h2>
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
                onClick={() => {
                  setForm(null);
                  setError(null);
                }}
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
          </div>
        </div>
      )}
    </div>
  );
}
