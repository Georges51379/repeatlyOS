import { useEffect, useState } from 'react';
import { Plus, Trash2, UserCog } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import type { StaffMember } from '../../types/domain';

export default function Staff() {
  const { business } = useCurrentBusiness();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!business) return;
    const { data } = await supabase
      .from('staff_members')
      .select('*')
      .eq('business_id', business.id)
      .order('full_name');
    setStaff((data ?? []) as StaffMember[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const addStaff = async () => {
    if (!business || !name.trim()) return;
    const { error: insertError } = await supabase.from('staff_members').insert({
      business_id: business.id,
      full_name: name.trim(),
      phone: phone.trim() || null,
      role_title: roleTitle.trim() || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName('');
    setPhone('');
    setRoleTitle('');
    setError(null);
    load();
  };

  const toggleActive = async (member: StaffMember) => {
    await supabase.from('staff_members').update({ active: !member.active }).eq('id', member.id);
    load();
  };

  const removeStaff = async (member: StaffMember) => {
    await supabase.from('staff_members').delete().eq('id', member.id);
    load();
  };

  if (!business || loading) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-white font-semibold text-lg mb-1">Staff</h1>
      <p className="text-slate-500 text-sm mb-6">
        Real staff records that bookings and tasks can be assigned to — enables overlap-safe scheduling per
        staff member instead of a free-text name.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium text-sm mb-3">Add staff member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name *"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role (e.g. Barber)"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          onClick={addStaff}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-3">Team</h2>
        {staff.length === 0 ? (
          <p className="text-slate-500 text-sm">No staff added yet.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCog className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.role_title ?? '—'}{s.phone ? ` · ${s.phone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400">
                    <input type="checkbox" checked={s.active} onChange={() => toggleActive(s)} className="accent-blue-500" />
                    Active
                  </label>
                  <button onClick={() => removeStaff(s)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
