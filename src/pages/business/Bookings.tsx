import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import type { Booking, BookingStatus, Customer, Service } from '../../types/domain';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

interface FormState {
  customer_id: string;
  service_id: string;
  staff: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  customer_id: '',
  service_id: '',
  staff: '',
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
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'bookings.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const [{ data: bookingRows }, { data: serviceRows }, { data: customerRows }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('business_id', business.id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('customers').select('*').eq('business_id', business.id),
    ]);
    setBookings((bookingRows ?? []) as Booking[]);
    setServices((serviceRows ?? []) as Service[]);
    setCustomers((customerRows ?? []) as Customer[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  if (!business) return null;

  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? '—';
  const customerName = (id: string | null) => customers.find((c) => c.id === id)?.full_name ?? '—';

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
      staff: form.staff.trim() || null,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setForm(EMPTY_FORM);
    await load();
  };

  const setStatus = async (id: string, status: BookingStatus) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    await supabase.from('bookings').delete().eq('id', id);
    await load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold text-lg">Bookings</h1>
          <p className="text-slate-500 text-sm">{business.name}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New booking
          </button>
        )}
      </div>

      {loading ? null : bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <CalendarClock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No bookings yet.</p>
          <p className="text-slate-500 text-sm">
            {services.length === 0
              ? 'Add a service first, then create your first booking.'
              : 'Create your first booking.'}
          </p>
        </div>
      ) : (
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
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-white">
                    {b.scheduled_date} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{serviceName(b.service_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{customerName(b.customer_id)}</td>
                  <td className="px-4 py-3 text-slate-400">{b.staff || '—'}</td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <select
                        value={b.status}
                        onChange={(e) => setStatus(b.id, e.target.value as BookingStatus)}
                        className={`text-xs px-2 py-0.5 rounded-full border-0 focus:outline-none ${STATUS_STYLES[b.status]}`}
                      >
                        {(['pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(b.id)} className="text-slate-500 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">New booking</h2>
            <div className="space-y-3">
              <select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select service *</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <input
                value={form.staff}
                onChange={(e) => setForm({ ...form, staff: e.target.value })}
                placeholder="Staff"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
