import { useState } from 'react';
import { Bell, Shield, Download, Pin, Check, X, Plus, Search } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';
import type { Announcement } from '../../context/DemoContext';

export default function EnterprisePage() {
  const { announcements, setAnnouncements, auditLog, currentUser, business } = useDemo();
  const [tab, setTab] = useState<'announce' | 'audit' | 'export'>('announce');
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('All');
  const [form, setForm] = useState({ title: '', body: '', pinned: false });

  const addAnnouncement = () => {
    if (!form.title || !form.body) { setToast('Title and message required.'); return; }
    const newA: Announcement = {
      id: announcements.length + 1, title: form.title, body: form.body,
      author: currentUser.name, createdAt: new Date().toISOString().slice(0,16).replace('T',' '),
      pinned: form.pinned, readBy: [currentUser.name],
    };
    setAnnouncements([newA, ...announcements]);
    setShowAdd(false);
    setForm({ title: '', body: '', pinned: false });
    setToast('Announcement posted to team.');
  };

  const markRead = (id: number) => {
    setAnnouncements(announcements.map((a: Announcement) => a.id === id && !a.readBy.includes(currentUser.name) ? { ...a, readBy: [...a.readBy, currentUser.name] } : a));
  };

  const togglePin = (id: number) => {
    setAnnouncements(announcements.map((a: Announcement) => a.id === id ? { ...a, pinned: !a.pinned } : a));
  };

  const deleteAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter((a: Announcement) => a.id !== id));
    setToast('Announcement removed.');
  };

  const AUDIT_ACTIONS = ['All', 'Created', 'Updated', 'Deleted', 'Exported', 'Viewed', 'Moved'];
  const filteredAudit = auditLog.filter(e => {
    const ms = auditSearch === '' || e.user.toLowerCase().includes(auditSearch.toLowerCase()) || e.detail.toLowerCase().includes(auditSearch.toLowerCase()) || e.entity.toLowerCase().includes(auditSearch.toLowerCase());
    const mf = auditFilter === 'All' || e.action === auditFilter;
    return ms && mf;
  });

  const actionColor: Record<string,string> = {
    Created:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Updated:'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Deleted:'text-red-400 bg-red-500/10 border-red-500/20',
    Exported:'text-purple-400 bg-purple-500/10 border-purple-500/20',
    Viewed:'text-slate-400 bg-slate-500/10 border-slate-700',
    Moved:'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const EXPORT_OPTIONS = [
    { label:'Customer List (CSV)', desc:`${business.customers.length} customers — name, phone, plan, status`, icon:'👥' },
    { label:'Booking History (CSV)', desc:`${business.bookings.length} bookings — all fields`, icon:'📅' },
    { label:'Payment Ledger (CSV)', desc:`${business.payments.length} payments — amounts, methods, dates`, icon:'💵' },
    { label:'Full Data Archive (ZIP)', desc:'All data: customers, bookings, payments, invoices, products', icon:'📦' },
    { label:'Revenue Report (PDF)', desc:'6-month revenue summary, formatted for stakeholders', icon:'📊' },
    { label:'Staff Hours Report (PDF)', desc:'Clock-in/out history, total hours per staff member', icon:'⏱️' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Shield size={18} className="text-blue-400"/> Enterprise Tools</h2>
          <p className="text-slate-500 text-sm">Announcements · Audit Log · Data Export · {business.name}</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
        {[{key:'announce',label:'📢 Announcements'},{key:'audit',label:'🔍 Audit Log'},{key:'export',label:'📤 Data Export'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      {/* ANNOUNCEMENTS */}
      {tab === 'announce' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              <Plus size={14}/> New Announcement
            </button>
          </div>
          {[...announcements].sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(a => {
            const isRead = a.readBy.includes(currentUser.name);
            return (
              <div key={a.id} className={`bg-slate-900 border rounded-2xl p-5 transition-all ${a.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'} ${!isRead ? 'ring-1 ring-blue-500/30' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    {a.pinned && <Pin size={14} className="text-amber-400 shrink-0 mt-0.5"/>}
                    <div>
                      <p className="text-white font-bold text-sm">{a.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{a.author} · {a.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isRead && (
                      <button onClick={() => markRead(a.id)} className="text-xs text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg transition-colors">Mark read</button>
                    )}
                    <button onClick={() => togglePin(a.id)} className={`p-1.5 rounded-lg border transition-colors ${a.pinned ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-slate-600 border-slate-700 hover:text-slate-400'}`}><Pin size={13}/></button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg border border-slate-700 hover:border-red-500/30 transition-colors"><X size={13}/></button>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{a.body}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                  <Check size={11} className="text-emerald-400"/>
                  <span>Read by {a.readBy.length} of {business.staff.length + 1}</span>
                  <div className="flex gap-1 ml-2">
                    {a.readBy.map(name => (
                      <span key={name} className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs" title={name}>{name[0]}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {announcements.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl py-14 text-center">
              <Bell size={32} className="text-slate-700 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No announcements yet</p>
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG */}
      {tab === 'audit' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search by user, entity, action..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"/>
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {AUDIT_ACTIONS.map(a => (
                <button key={a} onClick={() => setAuditFilter(a)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${auditFilter === a ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'}`}>{a}</button>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Shield size={13} className="text-blue-400"/> Audit Trail</h3>
              <p className="text-slate-500 text-xs">{filteredAudit.length} entries · immutable</p>
            </div>
            <div className="divide-y divide-slate-800/50">
              {filteredAudit.map(e => (
                <div key={e.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{e.user[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-slate-200 text-xs font-semibold">{e.user}</span>
                      <span className="text-slate-600 text-xs">({e.role})</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${actionColor[e.action] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>{e.action}</span>
                      <span className="text-slate-500 text-xs">{e.entity}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-snug">{e.detail}</p>
                    <p className="text-slate-600 text-xs mt-0.5 font-mono">{e.timestamp} · {e.ip}</p>
                  </div>
                </div>
              ))}
              {filteredAudit.length === 0 && (
                <div className="py-10 text-center text-slate-600 text-sm">No matching audit entries</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DATA EXPORT */}
      {tab === 'export' && (
        <div className="space-y-3">
          <div className="bg-blue-600/8 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Download size={16} className="text-blue-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-blue-300 font-semibold text-sm">Your data, your property</p>
              <p className="text-slate-400 text-xs mt-1">Export your complete business data at any time. All exports are generated instantly and include all records up to today.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {EXPORT_OPTIONS.map(opt => (
              <div key={opt.label} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center gap-4 transition-colors group">
                <span className="text-3xl shrink-0">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{opt.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{opt.desc}</p>
                </div>
                <button onClick={() => setToast(`${opt.label} — demo export triggered. No backend connected.`)} className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg transition-colors shrink-0">
                  <Download size={12}/> Export
                </button>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
            <Shield size={13} className="text-slate-600 shrink-0 mt-0.5"/>
            <p>All exports are encrypted during download. Data is yours — we never share or sell it. Exports include a timestamp and business name in the filename.</p>
          </div>
        </div>
      )}

      {/* Add announcement modal */}
      {showAdd && (
        <Modal title="New Announcement" onClose={() => setShowAdd(false)} icon={<Bell size={15} className="text-blue-400"/>}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))} placeholder="e.g. New protocol starting Monday" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Message *</label>
              <textarea value={form.body} onChange={e => setForm(f=>({...f, body: e.target.value}))} placeholder="Write your announcement..." rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f=>({...f, pinned: e.target.checked}))} className="rounded border-slate-600 bg-slate-800 text-amber-500"/>
              <span className="text-slate-300 text-sm">📌 Pin to top</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={addAnnouncement} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Post to Team</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')}/>}
    </div>
  );
}
