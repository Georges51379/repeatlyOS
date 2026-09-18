import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, CalendarClock, CalendarCheck, Clock3, CheckCircle2 } from 'lucide-react';
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
import FormField, { fieldInputClass } from '../../components/FormField';
import type { Booking, BookingStatus, Customer, Service, StaffMember } from '../../types/domain';

interface FormState {
  customer_id: string;
  service_id: string;
  staff_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  customer_id: '',
  service_id: '',
  staff_id: '',
  scheduled_date: '',
  start_time: '',
  end_time: '',
  notes: '',
};

export default function Bookings() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'bookings.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: bookingRows }, { data: serviceRows }, { data: customerRows }, { data: staffRows }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('business_id', business.id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('customers').select('*').eq('business_id', business.id),
      supabase.from('staff_members').select('*').eq('business_id', business.id).eq('active', true).order('full_name'),
    ]);
    setBookings((bookingRows ?? []) as Booking[]);
    setServices((serviceRows ?? []) as Service[]);
    setCustomers((customerRows ?? []) as Customer[]);
    setStaffMembers((staffRows ?? []) as StaffMember[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const serviceName = useCallback((id: string | null) => services.find((s) => s.id === id)?.name ?? '—', [services]);
  const customerName = useCallback((id: string | null) => customers.find((c) => c.id === id)?.full_name ?? '—', [customers]);
  const staffName = useCallback(
    (b: Booking) => staffMembers.find((s) => s.id === b.staff_id)?.full_name ?? b.staff ?? '—',
    [staffMembers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) => customerName(b.customer_id).toLowerCase().includes(q) || serviceName(b.service_id).toLowerCase().includes(q),
    );
  }, [bookings, search, customerName, serviceName]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = bookings.filter((b) => b.scheduled_date === today).length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    return { today: todayCount, pending, completed };
  }, [bookings]);

  if (!business) return null;

  const handleAdd = async () => {
    if (!form.service_id || !form.scheduled_date || !form.start_time || !form.end_time) {
      setError('Service, date, start and end time are required.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('bookings').insert({
      business_id: business.id,
      customer_id: form.customer_id || null,
      service_id: form.service_id,
      staff_id: form.staff_id || null,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      // The GiST exclusion constraint (migration 20260914000002) surfaces
      // as a Postgres unique-violation-shaped error when a staff member is
      // already booked for an overlapping slot — worth a clearer message
      // than the raw constraint name.
      setError(
        insertError.message.includes('bookings_no_staff_overlap')
          ? 'That staff member already has a booking overlapping this time slot.'
          : insertError.message,
      );
      return;
    }
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setToast({ message: 'Booking created.', type: 'success' });
    await load();
  };

  const setStatus = async (id: string, status: BookingStatus) => {
    const { error: updateError } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (updateError) {
      setToast({ message: updateError.message, type: 'error' });
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (deleteError) {
      setToast({ message: deleteError.message, type: 'error' });
      return;
    }
    setToast({ message: 'Booking deleted.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Bookings"
        subtitle={business.name}
        actionLabel={canManage ? 'New booking' : undefined}
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      {bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <StatCard title="Today" value={stats.today} icon={CalendarCheck} accent="blue" />
          <StatCard title="Pending" value={stats.pending} icon={Clock3} accent="amber" />
          <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} accent="emerald" />
        </div>
      )}

      {bookings.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or service…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Date / Time</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={canManage ? 6 : 5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  {bookings.length === 0 ? (
                    <EmptyState type="bookings" onCreate={canManage ? () => setShowAdd(true) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3 text-white">
                    {b.scheduled_date} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{serviceName(b.service_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{customerName(b.customer_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{staffName(b)}</td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <select
                        value={b.status}
                        onChange={(e) => setStatus(b.id, e.target.value as BookingStatus)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {(['pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={b.status} />
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setConfirmDeleteId(b.id)} className="text-slate-500 hover:text-red-400 p-1 focus-ring rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="New booking" onClose={() => { setShowAdd(false); setError(null); }} icon={<CalendarClock className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-4">
            <FormField label="Service" required>
              <select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Customer" helper="Optional.">
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Staff"
              helper={staffMembers.length === 0 ? 'Add staff members on the Staff page to assign bookings to them.' : 'Optional.'}
            >
              <select
                value={form.staff_id}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">No staff assigned</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.role_title ? ` (${s.role_title})` : ''}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Date" required>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className={fieldInputClass}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start time" required>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="End time" required>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className={fieldInputClass}
                />
              </FormField>
            </div>
            <FormField label="Notes" helper="Optional.">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything staff should know"
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
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal title="Delete booking" onClose={() => setConfirmDeleteId(null)} size="sm">
          <p className="text-slate-400 text-sm mb-4">This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={() => remove(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
