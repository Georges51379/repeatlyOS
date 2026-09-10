import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Copy, Check, Bell, Search, Send, Zap, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';

const TYPES = ['Booking Confirmation','Renewal Reminder','Unpaid Payment','Package Expiry','Follow-up After Service'];
const TYPE_STYLES: Record<string, { color: string; icon: typeof Bell; bg: string }> = {
  'Booking Confirmation': { color: 'text-blue-400', icon: CheckCircle, bg: 'bg-blue-500/10 border-blue-500/25' },
  'Renewal Reminder': { color: 'text-amber-400', icon: Bell, bg: 'bg-amber-500/10 border-amber-500/25' },
  'Unpaid Payment': { color: 'text-red-400', icon: AlertCircle, bg: 'bg-red-500/10 border-red-500/25' },
  'Package Expiry': { color: 'text-orange-400', icon: Clock, bg: 'bg-orange-500/10 border-orange-500/25' },
  'Follow-up After Service': { color: 'text-purple-400', icon: Send, bg: 'bg-purple-500/10 border-purple-500/25' },
};

export default function RemindersPage() {
  const { business } = useDemo();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [active, setActive] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const buildReminders = () => business.customers.map((c, i) => ({
    id: i + 1, customer: c.name, type: TYPES[i % TYPES.length],
    due: `2024-06-${String(12 + i).padStart(2, '0')}`, channel: 'WhatsApp',
    status: c.status === 'Overdue' ? 'Overdue' : i % 3 === 0 ? 'Sent' : i % 3 === 1 ? 'Pending' : 'Scheduled',
    phone: c.phone, priority: c.status === 'Overdue' ? 'high' : i % 4 === 0 ? 'medium' : 'normal',
    message: `Hello ${c.name.split(' ')[0]}, ${TYPES[i % TYPES.length] === 'Renewal Reminder' ? `your ${business.subscription.name} subscription is due for renewal. Amount: $${business.subscription.price}.` : TYPES[i % TYPES.length] === 'Unpaid Payment' ? `your outstanding balance of $${Math.abs(c.balance) || business.subscription.price} is due. Please settle at your earliest convenience.` : TYPES[i % TYPES.length] === 'Package Expiry' ? `your service package is expiring soon. Contact us to renew and keep enjoying uninterrupted service.` : TYPES[i % TYPES.length] === 'Booking Confirmation' ? `your booking has been confirmed. We look forward to seeing you!` : `thank you for your recent visit! We'd love to see you again soon.`} — ${business.name} 🙏`,
  }));

  const [reminders, setReminders] = useState(buildReminders);
  useEffect(() => { setReminders(buildReminders()); }, [business.key]);

  const filtered = useMemo(() => reminders.filter(r => {
    const ms = search === '' || r.customer.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'All' || r.type === typeFilter;
    return ms && mt;
  }), [reminders, search, typeFilter]);

  const stats = { total: reminders.length, pending: reminders.filter(r => r.status === 'Pending').length, sent: reminders.filter(r => r.status === 'Sent').length, overdue: reminders.filter(r => r.status === 'Overdue').length };

  const copy = () => {
    if (!active) return;
    navigator.clipboard.writeText(active.message).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast('Message copied to clipboard!');
  };

  const openWhatsApp = () => {
    if (!active) return;
    const phone = active.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(active.message)}`;
    window.open(url, '_blank');
    markSent(active.id);
  };

  const markSent = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'Sent' } : r));
    setActive(null);
    setToast('Reminder marked as sent.');
  };

  const bulkSend = () => {
    setReminders(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: 'Sent' } : r));
    setToast(`${selectedIds.length} reminders marked as sent.`);
    setSelectedIds([]); setBulkMode(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Reminders</h2>
          <p className="text-slate-500 text-sm">WhatsApp reminder center · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {bulkMode && selectedIds.length > 0 && (
            <button onClick={bulkSend} className="flex items-center gap-1.5 text-xs bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 px-3 py-2 rounded-lg transition-colors">
              <Check size={12} /> Mark {selectedIds.length} Sent
            </button>
          )}
          <button onClick={() => { setBulkMode(v => !v); setSelectedIds([]); }} className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${bulkMode ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            <Zap size={12} /> {bulkMode ? 'Exit Bulk' : 'Bulk Mode'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Sent', value: stats.sent, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-slate-800 rounded-xl p-4 flex items-center gap-3`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <div>
              <p className="text-slate-400 text-sm font-medium">{s.label}</p>
              <p className="text-slate-600 text-xs">reminders</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + type filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer name..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {['All', ...TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{t === 'All' ? 'All Types' : t}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {bulkMode && <th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map(r => r.id) : [])} checked={selectedIds.length === filtered.length && filtered.length > 0} className="rounded border-slate-600 bg-slate-800 text-blue-600" /></th>}
                {['Customer','Type','Due','Channel','Status','Action'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const style = TYPE_STYLES[r.type] || { color: 'text-slate-400', icon: Bell, bg: '' };
                const Icon = style.icon;
                return (
                  <tr key={r.id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${r.priority === 'high' ? 'border-l-2 border-l-red-500/50' : ''} ${selectedIds.includes(r.id) ? 'bg-blue-600/5' : ''}`}>
                    {bulkMode && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => setSelectedIds(s => s.includes(r.id) ? s.filter(x => x !== r.id) : [...s, r.id])} className="rounded border-slate-600 bg-slate-800 text-blue-600" />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{r.customer[0]}</div>
                        <div>
                          <p className="text-slate-200 text-sm font-medium">{r.customer}</p>
                          <p className="text-slate-600 text-xs">{r.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border ${style.bg} ${style.color}`}>
                        <Icon size={10} /> {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{r.due}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                        <MessageCircle size={10} /> {r.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.status !== 'Sent' ? (
                        <button onClick={() => setActive(r)} className="flex items-center gap-1.5 text-xs bg-green-600/15 hover:bg-green-600/25 border border-green-600/25 text-green-400 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                          <MessageCircle size={10} /> Prepare
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs flex items-center gap-1"><Check size={10} /> Sent</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-14 text-center">
                  <Bell size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No reminders found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {active && (
        <Modal title="Prepare WhatsApp Message" onClose={() => setActive(null)} icon={<MessageCircle size={15} className="text-green-400" />}>
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{active.customer}</p>
                <p className="text-slate-500 text-xs">{active.phone}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${TYPE_STYLES[active.type]?.bg} ${TYPE_STYLES[active.type]?.color}`}>{active.type}</span>
            </div>

            {/* WhatsApp preview bubble */}
            <div className="bg-[#0b1c14] border border-[#25D366]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={14} className="text-[#25D366]" />
                <span className="text-xs text-[#25D366] font-semibold">WhatsApp Preview</span>
              </div>
              <div className="bg-[#025144] rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-white text-sm leading-relaxed">{active.message}</p>
                <p className="text-[#25D366]/60 text-xs mt-1.5 text-right">09:00 AM ✓✓</p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-600">Demo only — WhatsApp link will open in a new tab</p>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={copy} className={`flex items-center justify-center gap-2 border font-medium py-2.5 rounded-xl text-sm transition-colors ${copied ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700'}`}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button onClick={openWhatsApp} className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                <MessageCircle size={14} /> Open WhatsApp
              </button>
            </div>
            <button onClick={() => markSent(active.id)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">
              Mark as Sent (without opening)
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
