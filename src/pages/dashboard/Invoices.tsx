import { useState } from 'react';
import { FileText, Download, DollarSign, Clock, AlertCircle, Search } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import Toast from '../../components/Toast';
import InvoiceModal from '../../components/InvoiceModal';
import { useDemo } from '../../context/DemoContext';
import { invoices as baseInvoices } from '../../data/extraData';

export default function InvoicesPage() {
  const { business } = useDemo();
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [openInvoice, setOpenInvoice] = useState<typeof baseInvoices[0] | null>(null);

  // Build invoices from current business context
  const invoices = business.customers.slice(0, 6).map((c, i) => ({
    id: `INV-2024-00${i + 1}`,
    customer: c.name,
    items: [{ name: c.plan !== '—' ? c.plan : business.services[0]?.name || 'Service', qty: 1, price: c.plan !== '—' ? business.subscription.price : business.services[0]?.price || 20 }],
    total: c.plan !== '—' ? business.subscription.price : business.services[0]?.price || 20,
    status: c.balance < 0 ? (i % 2 === 0 ? 'Overdue' : 'Partial') : i % 4 === 2 ? 'Pending' : 'Paid',
    date: `2024-06-0${i + 1}`,
    dueDate: `2024-06-${i + 7}`,
    method: ['Whish', 'Cash', 'Bank Transfer', 'OMT', 'Card Later', 'Whish'][i],
  }));

  const filtered = invoices.filter(inv => {
    const ms = search === '' || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || inv.status === filter;
    return ms && mf;
  });

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((a, i) => a + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').length;
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((a, i) => a + i.total, 0);

  const methodColor: Record<string, string> = {
    Whish: 'text-purple-400', Cash: 'text-emerald-400',
    'Bank Transfer': 'text-blue-400', OMT: 'text-amber-400', 'Card Later': 'text-slate-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Invoices</h2>
          <p className="text-slate-500 text-sm">{invoices.length} invoices · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setToast('Demo export generated. No backend connected.')} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors">
            <Download size={12} /> Export All
          </button>
          <button onClick={() => setToast('New invoice created. Demo only.')} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors font-medium">
            <FileText size={12} /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Collected" value={`$${totalPaid}`} icon={DollarSign} accent="emerald" />
        <StatCard title="Pending" value={totalPending} icon={Clock} accent="amber" />
        <StatCard title="Overdue Amount" value={`$${totalOverdue}`} icon={AlertCircle} accent="red" />
        <StatCard title="Total Invoices" value={invoices.length} icon={FileText} accent="blue" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or ID..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5">
          {['All', 'Paid', 'Pending', 'Partial', 'Overdue'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-800">
                {['Invoice', 'Customer', 'Items', 'Amount', 'Method', 'Issue Date', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => setOpenInvoice(inv)}>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 text-xs font-mono font-medium">{inv.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{inv.customer[0]}</div>
                      <span className="text-slate-200 text-sm font-medium">{inv.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{inv.items[0].name}</td>
                  <td className="px-4 py-3 text-white font-bold text-sm">${inv.total}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${methodColor[inv.method] || 'text-slate-400'}`}>{inv.method}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{inv.date}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{inv.dueDate}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setOpenInvoice(inv); }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-14 text-center">
                  <p className="text-4xl mb-2">🧾</p>
                  <p className="text-slate-500 text-sm">No invoices match your filter</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openInvoice && (
        <InvoiceModal invoice={openInvoice} onClose={() => setOpenInvoice(null)} onToast={setToast} businessName={business.name} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
