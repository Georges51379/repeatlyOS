import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, AlertTriangle, XCircle, Bell, Download } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import { useDemo } from '../../context/DemoContext';

export default function SubscriptionsPage() {
  const { business } = useDemo();

  const buildSubs = () => business.customers.map((c, i) => ({
    id: i + 1,
    customer: c.name,
    plan: business.subscription.name,
    renewal: `2024-0${6 + (i % 2)}-${15 + i * 3 > 30 ? 30 : 15 + i * 3}`,
    amount: business.subscription.price,
    paymentStatus: c.balance < 0 ? 'Unpaid' : i % 4 === 2 ? 'Pending' : 'Paid',
    status: c.status === 'Expiring Soon' ? 'Expiring Soon' : c.status === 'Active' ? 'Active' : 'Cancelled',
    reminder: i % 3 === 0 ? 'Sent' : i % 3 === 1 ? 'Pending' : 'Not Sent',
  }));

  const [subs, setSubs] = useState(buildSubs);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<ReturnType<typeof buildSubs>[0] | null>(null);

  useEffect(() => { setSubs(buildSubs()); }, [business.key]);

  const active = subs.filter(s => s.status === 'Active').length;
  const mrr = subs.filter(s => s.status === 'Active').reduce((a, s) => a + s.amount, 0);
  const renewalsDue = subs.filter(s => s.status === 'Expiring Soon').length;
  const unpaid = subs.filter(s => s.paymentStatus === 'Unpaid').length;

  const sendReminder = (sub: typeof subs[0]) => {
    setModal(null);
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, reminder: 'Sent' } : s));
    setToast('WhatsApp reminder prepared. Demo only — no API connected.');
  };

  const pauseSub = (id: number) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s));
    setToast('Subscription status updated. Demo only.');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Subscriptions</h2>
          <p className="text-slate-500 text-sm">Recurring plans & renewal tracking · {business.name}</p>
        </div>
        <button onClick={() => setToast('Demo export generated. No backend connected.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
          <Download size={12} /> Export
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Active Plans" value={active} icon={RefreshCw} accent="blue" />
        <StatCard title="Monthly Recurring" value={`$${mrr.toLocaleString()}`} icon={DollarSign} accent="emerald" />
        <StatCard title="Renewals Due" value={renewalsDue} icon={AlertTriangle} accent="amber" />
        <StatCard title="Failed / Unpaid" value={unpaid} icon={XCircle} accent="red" />
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-800">
                {['Customer','Plan','Renewal','Amount','Payment','Status','Reminder','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{s.customer[0]}</div>
                      <span className="text-slate-200 text-sm font-medium">{s.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{s.plan}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{s.renewal}</td>
                  <td className="px-4 py-3 text-slate-200 text-sm font-medium">${s.amount}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.paymentStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.reminder} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setModal(s)} className="flex items-center gap-1 text-xs bg-green-600/10 hover:bg-green-600/20 border border-green-600/25 text-green-400 px-2 py-1 rounded-lg transition-colors">
                        <Bell size={10} /> Remind
                      </button>
                      <button onClick={() => pauseSub(s.id)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg transition-colors">
                        {s.status === 'Active' ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="Prepare WhatsApp Reminder" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">To: <strong className="text-slate-200">{modal.customer}</strong></p>
              <p className="text-slate-200 text-sm leading-relaxed">
                Hello {modal.customer.split(' ')[0]}, your <strong>{modal.plan}</strong> subscription renews on <strong>{modal.renewal}</strong>. The amount due is <strong>${modal.amount}</strong>. Please confirm your payment to continue enjoying our services. Thank you — {business.name}.
              </p>
            </div>
            <p className="text-xs text-slate-500 text-center">Demo only — no WhatsApp API connected</p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => sendReminder(modal)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">Mark Sent</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
