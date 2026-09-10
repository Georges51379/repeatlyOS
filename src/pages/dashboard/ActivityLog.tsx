import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

const typeColors: Record<string, string> = {
  booking:      'bg-blue-500/15 text-blue-400 border-blue-500/25',
  payment:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  subscription: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  package:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  reminder:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
  task:         'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const typeLabels: Record<string, string> = {
  booking: 'Booking', payment: 'Payment', subscription: 'Subscription',
  package: 'Package', reminder: 'Reminder', task: 'Task',
};

const dotColors: Record<string, string> = {
  booking: 'bg-blue-500', payment: 'bg-emerald-500', subscription: 'bg-cyan-500',
  package: 'bg-purple-500', reminder: 'bg-amber-500', task: 'bg-slate-500',
};

export default function ActivityLogPage() {
  const { business } = useDemo();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Generate rich activity log from business data
  const generateLog = () => {
    const log: { id: number; time: string; date: string; type: string; icon: string; text: string; sub: string }[] = [];
    let id = 1;

    business.bookings.forEach((b) => {
      log.push({ id: id++, time: b.time, date: 'Today', type: 'booking', icon: b.status === 'Completed' ? '✅' : b.status === 'Confirmed' ? '📅' : '⏳', text: `${b.status === 'Completed' ? 'Completed' : b.status === 'Confirmed' ? 'Confirmed booking'  : 'New booking'} — ${b.customer}`, sub: `${b.service} · ${b.date} ${b.time} · ${b.staff}` });
    });

    business.payments.filter(p => p.status === 'Paid').forEach((p) => {
      log.push({ id: id++, time: '10:05', date: 'Today', type: 'payment', icon: '💵', text: `Payment received — ${p.customer}`, sub: `$${p.amount} via ${p.method} · ${p.ref}` });
    });

    business.payments.filter(p => p.status === 'Overdue').forEach((p) => {
      log.push({ id: id++, time: '08:00', date: 'Yesterday', type: 'payment', icon: '⚠️', text: `Payment overdue — ${p.customer}`, sub: `$${p.amount} · ${p.method} · Since ${p.date}` });
    });

    business.customers.filter(c => c.status === 'Expiring Soon').forEach((c) => {
      log.push({ id: id++, time: '10:22', date: 'Today', type: 'reminder', icon: '💬', text: `Reminder sent to ${c.name}`, sub: `${c.plan} · Expiring soon` });
    });

    business.tasks.filter(t => t.column === 'completed').forEach((t) => {
      log.push({ id: id++, time: t.time, date: 'Today', type: 'task', icon: '✔️', text: `Task completed — ${t.customer}`, sub: `${t.service} · ${t.staff}` });
    });

    business.tasks.filter(t => t.column === 'issue').forEach((t) => {
      log.push({ id: id++, time: t.time, date: 'Today', type: 'task', icon: '🚨', text: `Issue reported — ${t.customer}`, sub: `${t.service} · ${t.staff} · ${t.notes}` });
    });

    // Add some "yesterday" entries
    business.customers.slice(0, 3).forEach((c) => {
      log.push({ id: id++, time: '16:30', date: 'Yesterday', type: 'subscription', icon: '🔄', text: `Subscription active — ${c.name}`, sub: `${c.plan} · Auto-renewed` });
    });

    business.customers.slice(0, 2).forEach((c) => {
      log.push({ id: id++, time: '14:00', date: '2 days ago', type: 'booking', icon: '📅', text: `Booking confirmed — ${c.name}`, sub: `${business.services[0]?.name} · ${business.staff[0]}` });
    });

    return log.sort((a, b) => {
      const order = ['Today', 'Yesterday', '2 days ago'];
      return order.indexOf(a.date) - order.indexOf(b.date);
    });
  };

  const allLog = generateLog();
  const types = ['All', ...Array.from(new Set(allLog.map(l => typeLabels[l.type])))];

  const filtered = allLog.filter(l => {
    const matchSearch = search === '' || l.text.toLowerCase().includes(search.toLowerCase()) || l.sub.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || typeLabels[l.type] === typeFilter;
    return matchSearch && matchType;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const dateOrder = ['Today', 'Yesterday', '2 days ago'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Activity Log</h2>
          <p className="text-slate-500 text-sm">{allLog.length} events · {business.name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5">
          <Filter size={11} /> Live — auto-updated
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {dateOrder.filter(d => grouped[d]?.length).map(date => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{date}</span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">{grouped[date].length} events</span>
            </div>
            <div className="space-y-2">
              {grouped[date].map(item => (
                <div key={item.id} className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors">
                  <div className="relative mt-0.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColors[item.type]}`} />
                  </div>
                  <div className="text-xl w-6 text-center shrink-0 -mt-0.5">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium">{item.text}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColors[item.type]}`}>{typeLabels[item.type]}</span>
                    <span className="text-slate-600 text-xs font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400 font-medium">No activity found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
