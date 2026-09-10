import { useState, useMemo } from 'react';
import { Plus, Search, Check, X, Download, ChevronDown, ChevronUp, Calendar, Clock, User, MessageCircle, DollarSign } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { useDemo } from '../../context/DemoContext';

const STATUS_FILTERS = ['All', 'Today', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

export default function BookingsPage() {
  const { business } = useDemo();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState(business.bookings);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [form, setForm] = useState({ customer: '', service: '', date: '', time: '', staff: '', notes: '' });

  const today = '2024-06-11';

  const filtered = useMemo(() => bookings.filter(b => {
    const matchFilter = filter === 'All' ? true : filter === 'Today' ? b.date === today : b.status === filter;
    const matchSearch = search === '' || b.customer.toLowerCase().includes(search.toLowerCase()) || b.service.toLowerCase().includes(search.toLowerCase()) || b.staff.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [bookings, filter, search]);

  const stats = useMemo(() => ({
    today: bookings.filter(b => b.date === today).length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    revenue: bookings.filter(b => b.payment === 'Paid').reduce((a, b) => a + b.amount, 0),
  }), [bookings]);

  const MAX_PER_SLOT = 3; // max concurrent bookings per time slot

  const handleCreate = () => {
    if (!form.customer || !form.service || !form.date || !form.time) { setToast('Please fill all required fields.'); return; }

    // Capacity check
    const slotBookings = bookings.filter(b => b.date === form.date && b.time === form.time && b.status !== 'Cancelled');
    if (slotBookings.length >= MAX_PER_SLOT) {
      setToast(`⚠️ Slot is full (${MAX_PER_SLOT} bookings max). Choose a different time or add to Waiting List.`);
      return;
    }

    const svcPrice = business.services.find(s => s.name === form.service)?.price || 0;
    const newBooking = {
      id: bookings.length + 1, customer: form.customer, service: form.service,
      date: form.date, time: form.time,
      staff: form.staff || business.staff[0],
      status: 'Confirmed', payment: 'Pending', amount: svcPrice
    };
    setBookings([newBooking, ...bookings]);
    setShowModal(false);
    setForm({ customer: '', service: '', date: '', time: '', staff: '', notes: '' });

    // Auto-draft WhatsApp confirmation
    const phone = business.customers.find(c => c.name === form.customer)?.phone || '';
    const msg = `Hello ${form.customer.split(' ')[0]}! ✅ Your booking for ${form.service} on ${form.date} at ${form.time} with ${form.staff || business.staff[0]} is confirmed. See you then! — ${business.name}`;
    const encoded = encodeURIComponent(msg);
    const waPhone = phone.replace(/[^0-9]/g, '');

    setToast(`✅ Booking confirmed for ${form.customer}. Tap to send WhatsApp confirmation.`);
    // Open WA confirmation after a short delay so toast shows first
    if (waPhone) setTimeout(() => window.open(`https://wa.me/${waPhone}?text=${encoded}`, '_blank'), 800);
  };

  const markStatus = (id: number, status: string) => {
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
    setToast(`Booking ${status.toLowerCase()}.`);
  };

  const bulkConfirm = () => {
    setBookings(b => b.map(x => selected.includes(x.id) && x.status === 'Pending' ? { ...x, status: 'Confirmed' } : x));
    setToast(`${selected.length} booking(s) confirmed.`);
    setSelected([]);
  };

  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(b => b.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Bookings</h2>
          <p className="text-slate-500 text-sm">{bookings.length} total · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={bulkConfirm} className="flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg transition-colors">
              <Check size={12} /> Confirm {selected.length} selected
            </button>
          )}
          <button onClick={() => setToast('Export generated. Demo only.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-2 rounded-lg text-sm transition-colors">
            <Plus size={14} /> New Booking
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Today's Bookings" value={stats.today} icon={Calendar} accent="blue" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} accent="amber" />
        <StatCard title="Completed" value={stats.completed} icon={Check} accent="emerald" />
        <StatCard title="Revenue Collected" value={`$${stats.revenue}`} icon={DollarSign} accent="purple" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, service, staff..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" />
                </th>
                {['Customer','Service','Date','Time','Staff','Status','Payment','Amount','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <>
                  <tr
                    key={b.id}
                    className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors cursor-pointer ${selected.includes(b.id) ? 'bg-blue-600/5 border-blue-500/10' : ''}`}
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleSelect(b.id)} className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{b.customer[0]}</div>
                        <span className="text-slate-200 text-sm font-medium">{b.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{b.service}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{b.date}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{b.time}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-400 text-xs"><User size={11} /> {b.staff}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={b.payment} /></td>
                    <td className="px-4 py-3 text-slate-300 text-sm font-medium">${b.amount}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {b.status === 'Pending' && (
                          <button onClick={() => markStatus(b.id, 'Confirmed')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/15 rounded-md transition-colors" title="Confirm"><Check size={13} /></button>
                        )}
                        {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                          <button onClick={() => markStatus(b.id, 'Completed')} className="text-xs text-blue-400 hover:bg-blue-500/15 px-2 py-1 rounded-lg transition-colors font-medium">Done</button>
                        )}
                        {b.status !== 'Cancelled' && (
                          <button onClick={() => markStatus(b.id, 'Cancelled')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Cancel"><X size={12} /></button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {expanded === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>
                  {expanded === b.id && (
                    <tr key={`${b.id}-detail`} className="border-b border-slate-800/40 bg-slate-800/20">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Full Details</p>
                            <p className="text-slate-200 text-sm font-medium">{b.customer}</p>
                            <p className="text-slate-400 text-xs">{b.service} · {b.date} at {b.time}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Staff Assigned</p>
                            <p className="text-slate-200 text-sm">{b.staff}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Payment Amount</p>
                            <p className="text-emerald-400 font-bold text-sm">${b.amount}</p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <button onClick={() => setToast(`WhatsApp opened for ${b.customer}. Demo only.`)} className="flex items-center gap-1.5 bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                              <MessageCircle size={11} /> WhatsApp Customer
                            </button>
                            <button onClick={() => setToast(`Reassign booking. Demo only.`)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                              <User size={11} /> Reassign Staff
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11}>
                  <EmptyState type="bookings" search={search} onClear={() => { setFilter('All'); setSearch(''); }} onCreate={() => setShowModal(true)} createLabel="New Booking" />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-800 flex items-center justify-between">
            <p className="text-slate-600 text-xs">Showing {filtered.length} of {bookings.length} bookings</p>
            {selected.length > 0 && <p className="text-blue-400 text-xs font-medium">{selected.length} selected</p>}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="New Booking" onClose={() => setShowModal(false)} icon={<Calendar size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Customer Name *</label>
                <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="e.g. Rami Haddad" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Service *</label>
                <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select service...</option>
                  {business.services.map(s => <option key={s.name}>{s.name} — ${s.price}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Staff</label>
                <select value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Auto-assign</option>
                  {business.staff.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time *</label>
                <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select time...</option>
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special requests or instructions..." rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Create Booking</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
