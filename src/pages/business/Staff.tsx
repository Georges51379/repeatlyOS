import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, UserCog, Users, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Skeletons';
import FormField, { fieldInputClass } from '../../components/FormField';
import type { StaffMember } from '../../types/domain';

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function Staff() {
  const { business } = useCurrentBusiness();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase.from('staff_members').select('*').eq('business_id', business.id).order('full_name');
    setStaff((data ?? []) as StaffMember[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => s.full_name.toLowerCase().includes(q) || (s.role_title ?? '').toLowerCase().includes(q));
  }, [staff, search]);

  const stats = useMemo(() => ({ total: staff.length, active: staff.filter((s) => s.active).length }), [staff]);

  if (!business) return null;

  const addStaff = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error: insertError } = await supabase.from('staff_members').insert({
      business_id: business.id,
      full_name: name.trim(),
      phone: phone.trim() || null,
      role_title: roleTitle.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName('');
    setPhone('');
    setRoleTitle('');
    setError(null);
    setShowAdd(false);
    setToast({ message: 'Staff member added.', type: 'success' });
    load();
  };

  const toggleActive = async (member: StaffMember) => {
    await supabase.from('staff_members').update({ active: !member.active }).eq('id', member.id);
    load();
  };

  const removeStaff = async (id: string) => {
    const { error: deleteError } = await supabase.from('staff_members').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (deleteError) {
      setToast({ message: deleteError.message, type: 'error' });
      return;
    }
    setToast({ message: 'Staff member removed.', type: 'success' });
    load();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Staff"
        subtitle="Real staff records that bookings and tasks can be assigned to — enables overlap-safe scheduling per staff member."
        actionLabel="Add staff member"
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      {staff.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm">
          <StatCard title="Total staff" value={stats.total} icon={Users} accent="blue" />
          <StatCard title="Active" value={stats.active} icon={UserCheck} accent="emerald" />
        </div>
      )}

      {staff.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or role…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={3} cols={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {staff.length === 0 ? (
                    <EmptyState type="staff" onCreate={() => setShowAdd(true)} />
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
                      <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-400 text-xs font-semibold flex items-center justify-center shrink-0">
                        {initials(s.full_name) || <UserCog className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-white">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.role_title ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)} className="focus-ring rounded">
                      <StatusBadge status={s.active ? 'active' : 'archived'} label={s.active ? 'Active' : 'Inactive'} dot />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => setConfirmDeleteId(s.id)} className="text-slate-500 hover:text-red-400 p-1 focus-ring rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add staff member" onClose={() => { setShowAdd(false); setError(null); }} size="sm" icon={<UserCog className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-4">
            <FormField label="Full name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Karim Saab"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Phone" helper="Optional.">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+961 70 123 456"
                className={fieldInputClass}
              />
            </FormField>
            <FormField label="Role" helper="What they do — shown next to their name.">
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Barber, Cashier, Manager"
                className={fieldInputClass}
              />
            </FormField>
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setShowAdd(false); setError(null); }} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={addStaff} disabled={saving || !name.trim()} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal title="Remove staff member" onClose={() => setConfirmDeleteId(null)} size="sm">
          <p className="text-slate-400 text-sm mb-4">Existing bookings/tasks already assigned to them keep their record; this only removes them from your team list.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={() => removeStaff(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Remove
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
