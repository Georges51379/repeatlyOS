import { useState } from 'react';
import { Clock, MessageCircle, Check, X, Plus, ArrowUp, ArrowDown, Users, Bell } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import StatCard from '../../components/StatCard';
import { useDemo } from '../../context/DemoContext';

type WaitEntry = { id: number; customer: string; phone: string; service: string; preferredDate: string; preferredTime: string; addedAt: string; position: number; notified: boolean; status: 'Waiting' | 'Offered' | 'Confirmed' | 'Declined' };

export default function WaitlistPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customer: '', phone: '', service: '', preferredDate: '', preferredTime: '' });

  const seedList = (): WaitEntry[] => business.customers.slice(0, 5).map((c, i) => ({
    id: i + 1, customer: c.name, phone: c.phone,
    service: business.services[i % business.services.length]?.name || 'Service',
    preferredDate: `2024-06-${String(12 + i).padStart(2, '0')}`,
    preferredTime: ['09:00', '10:00', '11:00', '14:00', '16:00'][i],
    addedAt: `Jun ${10 - i}, 09:${String(i * 7).padStart(2, '0')}`,
    position: i + 1,
    notified: i === 1,
    status: i === 1 ? 'Offered' : i === 3 ? 'Confirmed' : 'Waiting' as WaitEntry['status'],
  }));

  const [waitlist, setWaitlist] = useState<WaitEntry[]>(seedList);

  const notifyNext = () => {
    const next = waitlist.find(w => w.status === 'Waiting');
    if (!next) { setToast('No one waiting to notify.'); return; }
    setWaitlist(prev => prev.map(w => w.id === next.id ? { ...w, status: 'Offered', notified: true } : w));
    const phone = next.phone.replace(/[^0-9]/g, '');
    const msg = `Hi ${next.customer.split(' ')[0]}! A slot just opened up for ${next.service} on ${next.preferredDate} at ${next.preferredTime}. Reply YES to confirm! — ${business.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setToast(`Slot offered to ${next.customer} via WhatsApp.`);
  };

  const confirm = (id: number) => {
    setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'Confirmed' } : w));
    setToast('Booking confirmed from waitlist.');
  };

  const decline = (id: number) => {
    setWaitlist(prev => prev.filter(w => w.id !== id));
    setToast('Entry removed. Next person will be offered the slot.');
  };

  const move = (id: number, dir: 'up' | 'down') => {
    setWaitlist(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx === -1) return prev;
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((w, i) => ({ ...w, position: i + 1 }));
    });
  };

  const addToWaitlist = () => {
    if (!form.customer || !form.service) { setToast('Customer name and service are required.'); return; }
    const newEntry: WaitEntry = {
      id: waitlist.length + 10, customer: form.customer, phone: form.phone || '+961 70 000 000',
      service: form.service, preferredDate: form.preferredDate || '2024-06-20',
      preferredTime: form.preferredTime || '10:00', addedAt: 'Now',
      position: waitlist.length + 1, notified: false, status: 'Waiting',
    };
    setWaitlist(prev => [...prev, newEntry]);
    setShowAdd(false);
    setForm({ customer: '', phone: '', service: '', preferredDate: '', preferredTime: '' });
    setToast(`${form.customer} added to waitlist at position ${waitlist.length + 1}.`);
  };

  const waiting   = waitlist.filter(w => w.status === 'Waiting').length;
  const offered   = waitlist.filter(w => w.status === 'Offered').length;
  const confirmed = waitlist.filter(w => w.status === 'Confirmed').length;

  const statusStyle: Record<WaitEntry['status'], string> = {
    'Waiting':   'bg-slate-700/50 text-slate-400 border border-slate-600',
    'Offered':   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'Confirmed': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'Declined':  'bg-red-500/15 text-red-400 border border-red-500/30',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Clock size={18} className="text-blue-400" /> Waiting List
          </h2>
          <p className="text-slate-500 text-sm">Manage slot waitlist — notify customers when space opens · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {waiting > 0 && (
            <button onClick={notifyNext} className="flex items-center gap-1.5 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-medium px-3 py-2 rounded-lg transition-colors">
              <Bell size={12} /> Notify Next
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Add to Waitlist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Waiting" value={waitlist.length} icon={Users} accent="blue" />
        <StatCard title="Active Wait" value={waiting} icon={Clock} accent="amber" />
        <StatCard title="Slot Offered" value={offered} icon={Bell} accent="purple" />
        <StatCard title="Confirmed" value={confirmed} icon={Check} accent="emerald" />
      </div>

      {/* How it works */}
      <div className="bg-blue-600/8 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
        <div className="text-2xl shrink-0">⚡</div>
        <div>
          <p className="text-blue-400 font-semibold text-sm">How the Waiting List works</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            When a booking cancels, click <strong className="text-white">Notify Next</strong> — a WhatsApp message goes to the first person in the queue offering them the slot. They confirm, you convert a cancellation into revenue.
          </p>
        </div>
      </div>

      {/* Waitlist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Waitlist Queue</h3>
          <p className="text-slate-500 text-xs">{waitlist.length} entries</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {waitlist.map((w, idx) => (
            <div key={w.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors ${w.status === 'Offered' ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : w.status === 'Confirmed' ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'}`}>
              {/* Position + reorder */}
              <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                <button onClick={() => move(w.id, 'up')} disabled={idx === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 transition-colors">
                  <ArrowUp size={11} />
                </button>
                <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${w.position === 1 ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {w.position}
                </span>
                <button onClick={() => move(w.id, 'down')} disabled={idx === waitlist.length - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 transition-colors">
                  <ArrowDown size={11} />
                </button>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                {w.customer[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{w.customer}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[w.status]}`}>{w.status}</span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {w.service} · {w.preferredDate} at {w.preferredTime} · Joined: {w.addedAt}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {w.status === 'Waiting' && (
                  <button
                    onClick={() => {
                      const phone = w.phone.replace(/[^0-9]/g, '');
                      const msg = `Hi ${w.customer.split(' ')[0]}! A slot just opened for ${w.service} on ${w.preferredDate} at ${w.preferredTime}. Reply YES to confirm! — ${business.name}`;
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, status: 'Offered', notified: true } : x));
                    }}
                    className="flex items-center gap-1 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <MessageCircle size={11} /> Offer Slot
                  </button>
                )}
                {w.status === 'Offered' && (
                  <>
                    <button onClick={() => confirm(w.id)} className="flex items-center gap-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                      <Check size={11} /> Confirm
                    </button>
                    <button onClick={() => decline(w.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg border border-slate-700 hover:border-red-500/30 transition-colors">
                      <X size={13} />
                    </button>
                  </>
                )}
                {w.status === 'Confirmed' && (
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-1"><Check size={12} /> Booked</span>
                )}
                {w.status !== 'Confirmed' && (
                  <button onClick={() => decline(w.id)} className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {waitlist.length === 0 && (
            <div className="text-center py-14">
              <Clock size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Waitlist is empty</p>
              <p className="text-slate-600 text-xs mt-1">Add customers when slots are fully booked</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="Add to Waitlist" onClose={() => setShowAdd(false)} icon={<Clock size={15} className="text-blue-400" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Customer Name *</label>
                <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Full name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+961 70 ..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Service *</label>
                <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select...</option>
                  {business.services.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Preferred Date</label>
                <input type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Preferred Time</label>
                <select value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Any</option>
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addToWaitlist} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Add to Waitlist</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
